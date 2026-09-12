import { safeFetch, FetchError } from './fetcher.js';
import { isAllowedByCrawl } from './robots.js';
import { extractPageContent, type ExtractedPage } from './extractor.js';
import { rankLinks, filterSameOrigin, type RankedLink } from './ranker.js';
import { logger } from '../../utils/logger.js';

// ============================================================
// MULTI-PAGE CRAWLER
//
// Safety requirements (all implemented):
// - robots.txt respect
// - same-origin crawling by default
// - configurable max pages
// - configurable response size (in fetcher)
// - request timeout (in fetcher)
// - concurrency limit
// - rate limiting between requests
// - retry with exponential backoff + jitter
// - Retry-After header support
// - abort failed requests safely
// - content-type validation (in fetcher)
// - avoid binary files
// - URL deduplication
// - URL normalization (remove fragment)
// - avoid infinite loops (visited set)
// ============================================================

const MAX_PAGES = Number(process.env['CRAWLER_MAX_PAGES'] ?? 15);
const RATE_LIMIT_MS = Number(process.env['CRAWLER_RATE_LIMIT_MS'] ?? 500);
const CONCURRENCY = Number(process.env['CRAWLER_CONCURRENCY'] ?? 2);
const MAX_RETRIES = 3;

export interface CrawledPage {
  url: string;
  title: string;
  metaDescription: string;
  text: string;
  wordCount: number;
  links: RankedLink[];
  sourceType: string;
  retrievedAt: string;
  status: 'success' | 'failed' | 'robots-denied' | 'timeout' | 'skipped';
  failureReason?: string | undefined;
  relevanceScore?: number | undefined;
}

export interface CrawlResult {
  homepageUrl: string;
  pages: CrawledPage[];
  hiringPage?: CrawledPage | undefined;
  aboutPage?: CrawledPage | undefined;
  totalPagesFetched: number;
  warnings: string[];
}


function normalizeUrl(href: string): string {
  try {
    const u = new URL(href);
    u.hash = ''; // Remove fragments
    return u.toString();
  } catch {
    return href;
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  isEvalMode: boolean,
  retries = MAX_RETRIES,
): Promise<{ page: ExtractedPage; finalUrl: string } | null> {
  let lastError: unknown;
  let backoff = 1000;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await safeFetch(url, isEvalMode);
      const page = extractPageContent(result.text, result.url);
      return { page, finalUrl: result.url };
    } catch (err) {
      lastError = err;

      if (err instanceof FetchError) {
        // Non-retriable errors
        if (
          err.code === 'SSRF_BLOCKED' ||
          err.code === 'REDIRECT_UNSAFE' ||
          err.code === 'CONTENT_TYPE_UNSUPPORTED' ||
          err.code === 'COMPANY_URL_INVALID'
        ) {
          throw err; // Don't retry these
        }
      }

      if (attempt < retries) {
        // Exponential backoff with jitter
        const jitter = Math.random() * 500;
        const waitMs = backoff + jitter;
        logger.debug(`Fetch attempt ${attempt} failed, retrying in ${waitMs.toFixed(0)}ms`, {
          url,
          error: err instanceof Error ? err.message : String(err),
        });
        await sleep(waitMs);
        backoff = Math.min(backoff * 2, 30_000); // cap at 30s
      }
    }
  }

  logger.warn('All fetch attempts failed', {
    url,
    error: lastError instanceof Error ? lastError.message : String(lastError),
  });
  return null;
}

/**
 * Crawl a company website starting from the homepage.
 * Returns structured pages including hiring/about pages if found.
 */
export async function crawlCompanySite(
  startUrl: string,
  isEvalMode = false,
): Promise<CrawlResult> {
  const warnings: string[] = [];
  const visited = new Set<string>();
  const pages: CrawledPage[] = [];
  const normalized = normalizeUrl(startUrl);

  // Fetch homepage first
  logger.info('Starting company crawl', { url: normalized });

  const homepageResult = await fetchWithRetry(normalized, isEvalMode);
  if (!homepageResult) {
    throw new FetchError(
      'COMPANY_UNREACHABLE',
      `Could not fetch company homepage: ${normalized}`,
    );
  }

  visited.add(normalizeUrl(homepageResult.finalUrl));

  const homepagePage: CrawledPage = {
    url: homepageResult.finalUrl,
    title: homepageResult.page.title,
    metaDescription: homepageResult.page.metaDescription,
    text: homepageResult.page.text,
    wordCount: homepageResult.page.wordCount,
    links: [],
    sourceType: 'company-homepage',
    retrievedAt: new Date().toISOString(),
    status: 'success',
    relevanceScore: 10,
  };

  // Rank links discovered on homepage
  const rankedLinks = filterSameOrigin(
    rankLinks(homepageResult.page.links, normalized, homepageResult.page.title),
    normalized,
  );

  homepagePage.links = rankedLinks;
  pages.push(homepagePage);

  // Queue: start with top-ranked links from homepage
  const queue: Array<{ url: string; score: number; category: string }> = rankedLinks
    .filter((l) => l.score > 0) // Only ranked links
    .slice(0, MAX_PAGES * 2) // Bounded queue
    .map((l) => ({ url: l.url, score: l.score, category: l.category }));

  // Process queue with concurrency control
  let pagesFetched = 1; // homepage counted
  let queueIndex = 0;

  while (queueIndex < queue.length && pagesFetched < MAX_PAGES) {
    // Process CONCURRENCY links at a time
    const batch = queue.slice(queueIndex, queueIndex + CONCURRENCY);
    queueIndex += CONCURRENCY;

    const batchResults = await Promise.allSettled(
      batch.map(async (item) => {
        const normalizedItemUrl = normalizeUrl(item.url);
        if (visited.has(normalizedItemUrl)) return null;
        visited.add(normalizedItemUrl);

        // Rate limiting
        await sleep(RATE_LIMIT_MS);

        // Check robots.txt
        const allowed = await isAllowedByCrawl(normalizedItemUrl, normalized, isEvalMode);
        if (!allowed) {
          logger.debug('Blocked by robots.txt', { url: normalizedItemUrl });
          const robotsDenied: CrawledPage = {
            url: normalizedItemUrl,
            title: '',
            metaDescription: '',
            text: '',
            wordCount: 0,
            links: [],
            sourceType: item.category,
            retrievedAt: new Date().toISOString(),
            status: 'robots-denied',
            failureReason: 'Blocked by robots.txt',
          };
          return { page: robotsDenied, newLinks: [] };
        }

        const result = await fetchWithRetry(normalizedItemUrl, isEvalMode);
        if (!result) {
          return {
            page: {
              url: normalizedItemUrl,
              title: '',
              metaDescription: '',
              text: '',
              wordCount: 0,
              links: [],
              sourceType: item.category,
              retrievedAt: new Date().toISOString(),
              status: 'failed' as const,
              failureReason: 'Failed after retries',
            } satisfies CrawledPage,
            newLinks: [] as RankedLink[],
          };
        }

        // Determine source type from category/title
        const sourceType = inferSourceType(item.category, result.page.title, normalizedItemUrl);

        const newRankedLinks = filterSameOrigin(
          rankLinks(result.page.links, normalized, result.page.title),
          normalized,
        );

        const crawledPage: CrawledPage = {
          url: result.finalUrl,
          title: result.page.title,
          metaDescription: result.page.metaDescription,
          text: result.page.text,
          wordCount: result.page.wordCount,
          links: newRankedLinks,
          sourceType,
          retrievedAt: new Date().toISOString(),
          status: 'success',
          relevanceScore: item.score,
        };

        return { page: crawledPage, newLinks: newRankedLinks };
      }),
    );

    for (const result of batchResults) {
      if (result.status === 'fulfilled' && result.value) {
        const { page, newLinks } = result.value;
        pages.push(page);
        pagesFetched++;

        // Add newly discovered links to queue (if not visited)
        for (const link of newLinks) {
          const normLink = normalizeUrl(link.url);
          if (!visited.has(normLink) && link.score > 0) {
            queue.push({ url: link.url, score: link.score, category: link.category });
          }
        }
      } else if (result.status === 'rejected') {
        logger.warn('Batch item failed', {
          error:
            result.reason instanceof Error ? result.reason.message : String(result.reason),
        });
        warnings.push(`Failed to fetch a page: ${result.reason}`);
      }
    }
  }

  // Identify hiring and about pages
  const successPages = pages.filter((p) => p.status === 'success' && p.wordCount > 50);

  const hiringPage = successPages.find((p) =>
    ['company-hiring', 'company-careers'].includes(p.sourceType),
  );
  const aboutPage = successPages.find((p) => p.sourceType === 'company-about');

  logger.info('Crawl complete', {
    url: normalized,
    totalPages: pages.length,
    successPages: successPages.length,
    hasHiringPage: !!hiringPage,
    hasAboutPage: !!aboutPage,
  });

  return {
    homepageUrl: normalized,
    pages,
    hiringPage,
    aboutPage,
    totalPagesFetched: pagesFetched,
    warnings,
  };
}

function inferSourceType(category: string, title: string, url: string): string {
  const lowerTitle = title.toLowerCase();
  const lowerUrl = url.toLowerCase();

  if (
    lowerTitle.includes('career') ||
    lowerUrl.includes('career') ||
    lowerTitle.includes('jobs') ||
    lowerUrl.includes('/jobs') ||
    lowerTitle.includes('hiring') ||
    lowerUrl.includes('/hiring') ||
    lowerTitle.includes('join us') ||
    lowerTitle.includes('work with')
  ) {
    return 'company-careers';
  }

  if (
    lowerTitle.includes('about') ||
    lowerUrl.includes('/about') ||
    lowerTitle.includes('who we are') ||
    lowerTitle.includes('our story')
  ) {
    return 'company-about';
  }

  if (
    lowerTitle.includes('engineering') ||
    lowerUrl.includes('/engineering') ||
    lowerTitle.includes('tech blog') ||
    lowerUrl.includes('/blog') ||
    lowerTitle.includes('developer')
  ) {
    return 'company-engineering';
  }

  return `company-${category}`;
}
