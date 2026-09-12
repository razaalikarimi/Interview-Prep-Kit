import { validateSSRF, validateRedirect, SSRFError } from './ssrf.js';
import { ErrorCodes } from '@interview-prep/shared';
import { logger } from '../../utils/logger.js';

// ============================================================
// SAFE HTTP FETCHER
//
// All remote content is treated as untrusted data.
// Safety measures:
// - SSRF validation before every fetch
// - Redirect validation on every hop
// - Content-type allowlist (HTML/text only)
// - Response size limit
// - Request timeout
// - Content-type check
// ============================================================

const FETCH_TIMEOUT_MS = Number(process.env['CRAWLER_TIMEOUT_MS'] ?? 10_000);
const MAX_RESPONSE_BYTES = Number(
  process.env['CRAWLER_MAX_RESPONSE_BYTES'] ?? 2 * 1024 * 1024,
); // 2MB default
const MAX_REDIRECTS = 5;

const ALLOWED_CONTENT_TYPES = [
  'text/html',
  'text/plain',
  'application/xhtml+xml',
];

export interface FetchResult {
  url: string; // Final URL after redirects
  status: number;
  contentType: string;
  text: string;
  sizeBytes: number;
}

export class FetchError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'FetchError';
  }
}

function isAllowedContentType(contentType: string): boolean {
  return ALLOWED_CONTENT_TYPES.some((allowed) => contentType.includes(allowed));
}

/**
 * Safely fetch a URL with SSRF protection, size limits, timeout,
 * and content-type validation.
 *
 * All fetched content is returned as raw text — it is the caller's
 * responsibility to wrap it as untrusted data before passing to LLM.
 */
export async function safeFetch(
  rawUrl: string,
  isEvalMode = false,
): Promise<FetchResult> {
  const isEval =
    isEvalMode ||
    process.env['NODE_ENV'] === 'test' ||
    process.env['EVAL_MODE'] === 'true';

  // Validate and resolve the URL before fetching
  let validatedUrl: URL;
  try {
    validatedUrl = await validateSSRF(rawUrl, isEval);
  } catch (err) {
    if (err instanceof SSRFError) {
      throw new FetchError(err.code, err.message, err);
    }
    throw err;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let response: Response;
  let currentUrl = validatedUrl.toString();
  let redirectCount = 0;

  try {
    response = await fetch(currentUrl, {
      headers: {
        'User-Agent': 'InterviewPrepBot/1.0 (research purposes)',
        Accept: 'text/html,text/plain,application/xhtml+xml',
      },
      signal: controller.signal,
      redirect: 'manual', // Handle redirects manually to validate each hop
    });

    // Handle redirects with SSRF re-validation on each hop
    while (
      [301, 302, 303, 307, 308].includes(response.status) &&
      redirectCount < MAX_REDIRECTS
    ) {
      const location = response.headers.get('location');
      if (!location) break;

      const redirectUrl = new URL(location, currentUrl).toString();

      try {
        await validateRedirect(redirectUrl, isEval);
      } catch (err) {
        if (err instanceof SSRFError) {
          throw new FetchError(ErrorCodes.REDIRECT_UNSAFE, err.message, err);
        }
        throw err;
      }

      redirectCount++;
      currentUrl = redirectUrl;

      response = await fetch(currentUrl, {
        headers: {
          'User-Agent': 'InterviewPrepBot/1.0 (research purposes)',
          Accept: 'text/html,text/plain,application/xhtml+xml',
        },
        signal: controller.signal,
        redirect: 'manual',
      });
    }
  } catch (err: unknown) {
    clearTimeout(timeout);
    if (err instanceof FetchError) throw err;
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('aborted') || message.includes('timeout')) {
      throw new FetchError(ErrorCodes.COMPANY_TIMEOUT, `Request timed out: ${rawUrl}`);
    }
    throw new FetchError(
      ErrorCodes.COMPANY_UNREACHABLE,
      `Failed to fetch ${rawUrl}: ${message}`,
      err,
    );
  } finally {
    clearTimeout(timeout);
  }

  // Content-type validation
  const contentType = response.headers.get('content-type') ?? '';
  if (!isAllowedContentType(contentType)) {
    throw new FetchError(
      ErrorCodes.CONTENT_TYPE_UNSUPPORTED,
      `Unsupported content-type: ${contentType} for ${currentUrl}`,
    );
  }

  // Size limit — read with limit
  const buffer: Buffer[] = [];
  let totalBytes = 0;

  const responseBuffer = await response.buffer();
  totalBytes = responseBuffer.length;

  if (totalBytes > MAX_RESPONSE_BYTES) {
    logger.warn('Response truncated due to size limit', {
      url: currentUrl,
      sizeBytes: totalBytes,
      limitBytes: MAX_RESPONSE_BYTES,
    });
    // Truncate rather than reject — still useful for crawler
    const text = responseBuffer.slice(0, MAX_RESPONSE_BYTES).toString('utf-8');
    return {
      url: currentUrl,
      status: response.status,
      contentType,
      text,
      sizeBytes: totalBytes,
    };
  }

  void buffer; // unused (kept for clarity)

  return {
    url: currentUrl,
    status: response.status,
    contentType,
    text: responseBuffer.toString('utf-8'),
    sizeBytes: totalBytes,
  };
}
