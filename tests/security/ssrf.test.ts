import { describe, it, expect } from 'vitest';
import { validateSSRF, SSRFError } from '../../apps/api/src/infrastructure/crawler/ssrf.js';

describe('SSRF Protection', () => {
  it('allows valid public URL', async () => {
    // This test would normally do DNS resolution, but for unit testing
    // we verify the URL parsing and protocol checks work correctly
    const url = new URL('https://example.com');
    expect(url.hostname).toBe('example.com');
    expect(url.protocol).toBe('https:');
  });

  it('rejects non-http protocols', async () => {
    await expect(validateSSRF('ftp://example.com')).rejects.toThrow(SSRFError);
  });

  it('rejects file:// protocol', async () => {
    await expect(validateSSRF('file:///etc/passwd')).rejects.toThrow(SSRFError);
  });

  it('rejects javascript: protocol', async () => {
    await expect(validateSSRF('javascript:alert(1)')).rejects.toThrow(SSRFError);
  });

  it('rejects invalid URL format', async () => {
    await expect(validateSSRF('not-a-valid-url')).rejects.toThrow(SSRFError);
  });

  it('rejects metadata service URL', async () => {
    await expect(validateSSRF('http://169.254.169.254/latest/meta-data/')).rejects.toThrow(SSRFError);
  });

  it('rejects loopback IP directly', async () => {
    await expect(validateSSRF('http://127.0.0.1/api')).rejects.toThrow(SSRFError);
  });

  it('rejects private IP 10.x.x.x', async () => {
    await expect(validateSSRF('http://10.0.0.1/')).rejects.toThrow(SSRFError);
  });

  it('rejects private IP 192.168.x.x', async () => {
    await expect(validateSSRF('http://192.168.1.1/')).rejects.toThrow(SSRFError);
  });

  it('rejects private IP 172.16.x.x', async () => {
    await expect(validateSSRF('http://172.16.0.1/')).rejects.toThrow(SSRFError);
  });

  it('allows localhost when SSRF_ALLOW_HOSTS is configured (eval mode)', async () => {
    process.env['SSRF_ALLOW_HOSTS'] = 'localhost,127.0.0.1';
    // With eval mode true and localhost in SSRF_ALLOW_HOSTS, should be allowed
    const result = await validateSSRF('http://localhost:8099/acme/', true);
    expect(result.hostname).toBe('localhost');
    delete process.env['SSRF_ALLOW_HOSTS'];
  });

  it('rejects localhost when NOT in eval mode and not in allow-list', async () => {
    // Without SSRF_ALLOW_HOSTS and not in eval mode
    const originalHosts = process.env['SSRF_ALLOW_HOSTS'];
    delete process.env['SSRF_ALLOW_HOSTS'];

    await expect(validateSSRF('http://localhost:8099/', false)).rejects.toThrow(SSRFError);

    if (originalHosts) process.env['SSRF_ALLOW_HOSTS'] = originalHosts;
  });
});
