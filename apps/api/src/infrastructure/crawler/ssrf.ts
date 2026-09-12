import dns from 'dns/promises';
import net from 'net';
import { ErrorCodes } from '@interview-prep/shared';

// ============================================================
// SSRF PROTECTION
//
// Two-layer validation:
// 1. URL string validation (protocol, blocklist checks)
// 2. DNS resolution → resolved IP range validation
//
// WHY: String-only checks can be bypassed. Resolving the
// hostname and validating the resulting IP addresses is the
// robust approach. DNS rebinding (where a hostname resolves
// to a private IP after the check) is mitigated by
// re-validating on each redirect hop.
//
// DESIGN: In evaluation mode (NODE_ENV=test or
// SSRF_ALLOW_HOSTS set), specific hosts can be explicitly
// whitelisted. This allows the batch evaluator to use
// localhost test servers without compromising production.
// ============================================================

export class SSRFError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'SSRFError';
  }
}

// Private IPv4 CIDR ranges
const PRIVATE_IPV4_RANGES: Array<{ start: bigint; end: bigint }> = [
  // 10.0.0.0/8
  { start: ipToBigInt('10.0.0.0'), end: ipToBigInt('10.255.255.255') },
  // 172.16.0.0/12
  { start: ipToBigInt('172.16.0.0'), end: ipToBigInt('172.31.255.255') },
  // 192.168.0.0/16
  { start: ipToBigInt('192.168.0.0'), end: ipToBigInt('192.168.255.255') },
  // 127.0.0.0/8 — loopback
  { start: ipToBigInt('127.0.0.0'), end: ipToBigInt('127.255.255.255') },
  // 169.254.0.0/16 — link-local (AWS metadata etc.)
  { start: ipToBigInt('169.254.0.0'), end: ipToBigInt('169.254.255.255') },
  // 0.0.0.0/8
  { start: ipToBigInt('0.0.0.0'), end: ipToBigInt('0.255.255.255') },
  // 100.64.0.0/10 — shared address space
  { start: ipToBigInt('100.64.0.0'), end: ipToBigInt('100.127.255.255') },
];

// Blocked private/special IPv6 addresses/prefixes
const PRIVATE_IPV6_PREFIXES = [
  '::1',           // loopback
  'fc',            // unique local
  'fd',            // unique local
  'fe80',          // link-local
  '::ffff:',       // IPv4-mapped
  '2002:',         // 6to4 (can tunnel private)
  '::',            // unspecified
];

// Cloud metadata endpoints to block
const BLOCKED_HOSTNAMES = [
  '169.254.169.254',  // AWS/GCP/Azure IMDS
  'metadata.google.internal',
  'metadata.gcp.internal',
];

function ipToBigInt(ip: string): bigint {
  const parts = ip.split('.').map(Number);
  return parts.reduce((acc, part) => (acc << 8n) | BigInt(part), 0n);
}

function isPrivateIPv4(ip: string): boolean {
  if (!net.isIPv4(ip)) return false;
  const ipBigInt = ipToBigInt(ip);
  return PRIVATE_IPV4_RANGES.some(
    (range) => ipBigInt >= range.start && ipBigInt <= range.end,
  );
}

function isPrivateIPv6(ip: string): boolean {
  if (!net.isIPv6(ip)) return false;
  const lower = ip.toLowerCase();
  return PRIVATE_IPV6_PREFIXES.some((prefix) => lower.startsWith(prefix) || lower === prefix);
}

function isPrivateIP(ip: string): boolean {
  return isPrivateIPv4(ip) || isPrivateIPv6(ip);
}

/**
 * Get the set of allowed hosts from environment configuration.
 * This allows the batch evaluator to use localhost test servers.
 */
function getAllowedHosts(): Set<string> {
  const envHosts = process.env['SSRF_ALLOW_HOSTS'] ?? '';
  if (!envHosts) return new Set();
  return new Set(
    envHosts
      .split(',')
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean),
  );
}

/**
 * Validate a URL for SSRF safety.
 *
 * @param rawUrl - The URL to validate
 * @param isEvalMode - When true, allowed hosts from SSRF_ALLOW_HOSTS are permitted
 */
export async function validateSSRF(rawUrl: string, isEvalMode = false): Promise<URL> {
  // Step 1: Parse URL
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new SSRFError(ErrorCodes.COMPANY_URL_INVALID, `Invalid URL: ${rawUrl}`);
  }

  // Step 2: Protocol check — only http/https
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new SSRFError(
      ErrorCodes.SSRF_BLOCKED,
      `Unsupported protocol: ${url.protocol}. Only http/https allowed.`,
    );
  }

  const hostname = url.hostname.toLowerCase();

  // Step 3: Blocked hostnames (metadata endpoints)
  if (BLOCKED_HOSTNAMES.includes(hostname)) {
    throw new SSRFError(ErrorCodes.SSRF_BLOCKED, `Blocked hostname: ${hostname}`);
  }

  // Step 4: Check allow-list (for eval/dev mode only)
  const allowedHosts = getAllowedHosts();
  if (isEvalMode && allowedHosts.has(hostname)) {
    return url; // Explicitly allowed for evaluation
  }

  // Step 5: If it's a raw IP address, validate directly
  if (net.isIP(hostname) !== 0) {
    if (isPrivateIP(hostname)) {
      throw new SSRFError(
        ErrorCodes.SSRF_BLOCKED,
        `Private/loopback IP address not allowed: ${hostname}`,
      );
    }
    return url;
  }

  // Step 6: Resolve hostname → validate all resolved IPs
  // This is the key protection against DNS rebinding.
  let addresses: string[];
  try {
    const resolved = await dns.lookup(hostname, { all: true });
    addresses = resolved.map((r) => r.address);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new SSRFError(
      ErrorCodes.COMPANY_UNREACHABLE,
      `Could not resolve hostname ${hostname}: ${message}`,
    );
  }

  if (addresses.length === 0) {
    throw new SSRFError(
      ErrorCodes.COMPANY_UNREACHABLE,
      `Hostname ${hostname} resolved to no addresses`,
    );
  }

  for (const addr of addresses) {
    if (isPrivateIP(addr)) {
      throw new SSRFError(
        ErrorCodes.SSRF_BLOCKED,
        `Hostname ${hostname} resolves to private IP: ${addr}`,
      );
    }
  }

  return url;
}

/**
 * Validate a redirect destination URL.
 * Called for each hop in a redirect chain.
 */
export async function validateRedirect(
  redirectUrl: string,
  isEvalMode = false,
): Promise<URL> {
  // Re-validate each redirect hop independently (prevents DNS rebinding via redirect)
  return validateSSRF(redirectUrl, isEvalMode);
}
