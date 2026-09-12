import type { ExtractedLink } from './extractor.js';

// ============================================================
// LINK RANKER
//
// Ranks discovered links to identify most relevant pages.
// NO hard-coded path lists. Instead, signals are used:
//
// 1. Anchor text — does the link label suggest relevant content?
// 2. URL path — does the path contain relevant keywords?
// 3. Page title — does the page title suggest relevance?
// 4. Same-origin — prefer same-origin links
// 5. Path depth — prefer shallower paths (not deep sub-pages)
//
// DESIGN: The ranker returns a sorted list. Callers choose
// how many to crawl. This keeps discovery dynamic.
// ============================================================

interface RankingSignals {
  // Keywords that strongly suggest hiring/career pages
  hiringKeywords: string[];
  // Keywords that suggest company info
  aboutKeywords: string[];
  // Keywords that suggest engineering/culture
  engineeringKeywords: string[];
}

const SIGNALS: RankingSignals = {
  hiringKeywords: [
    'careers',
    'career',
    'jobs',
    'job',
    'hiring',
    'hire',
    'join',
    'work-with-us',
    'work-for-us',
    'join-us',
    'opportunities',
    'openings',
    'vacancies',
    'talent',
    'recruiting',
    'recruitment',
    'apply',
    'positions',
    'roles',
    'team',
    'people',
    'culture',
    'life-at',
    'handbook',
    'interview',
  ],
  aboutKeywords: [
    'about',
    'company',
    'mission',
    'vision',
    'story',
    'who-we-are',
    'what-we-do',
    'values',
    'history',
    'overview',
  ],
  engineeringKeywords: [
    'engineering',
    'tech',
    'technology',
    'blog',
    'engineering-blog',
    'developer',
    'dev',
    'platform',
    'infrastructure',
    'product',
  ],
};

export interface RankedLink {
  url: string;
  score: number;
  category: 'hiring' | 'about' | 'engineering' | 'other';
  anchorText: string;
  isSameOrigin: boolean;
}

function scoreText(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  let score = 0;
  for (const keyword of keywords) {
    if (lower.includes(keyword)) {
      // Exact segment match scores higher than substring
      const segments = lower.split(/[/\-_ ]/);
      if (segments.includes(keyword)) {
        score += 3;
      } else {
        score += 1;
      }
    }
  }
  return score;
}

function getPathDepth(url: string): number {
  try {
    const parsed = new URL(url);
    return parsed.pathname.split('/').filter(Boolean).length;
  } catch {
    return 10;
  }
}

export function rankLinks(
  links: ExtractedLink[],
  baseUrl: string,
  pageTitle = '',
): RankedLink[] {
  const base = new URL(baseUrl);
  const seen = new Set<string>();
  const ranked: RankedLink[] = [];

  for (const link of links) {
    // Deduplicate
    if (seen.has(link.href)) continue;
    seen.add(link.href);

    let url: URL;
    try {
      url = new URL(link.href);
    } catch {
      continue;
    }

    const isSameOrigin = url.origin === base.origin;
    const pathAndQuery = url.pathname + url.search;
    const anchorText = link.text + ' ' + link.title;

    // Score from anchor text
    const hiringFromAnchor = scoreText(anchorText, SIGNALS.hiringKeywords);
    const aboutFromAnchor = scoreText(anchorText, SIGNALS.aboutKeywords);
    const engFromAnchor = scoreText(anchorText, SIGNALS.engineeringKeywords);

    // Score from URL path
    const hiringFromPath = scoreText(pathAndQuery, SIGNALS.hiringKeywords);
    const aboutFromPath = scoreText(pathAndQuery, SIGNALS.aboutKeywords);
    const engFromPath = scoreText(pathAndQuery, SIGNALS.engineeringKeywords);

    // Score from page title (contextual signal)
    const hiringFromTitle = scoreText(pageTitle, SIGNALS.hiringKeywords) * 0.3;

    const hiringScore = hiringFromAnchor * 2 + hiringFromPath * 1.5 + hiringFromTitle;
    const aboutScore = aboutFromAnchor * 2 + aboutFromPath * 1.5;
    const engScore = engFromAnchor * 2 + engFromPath * 1.5;

    const maxScore = Math.max(hiringScore, aboutScore, engScore);

    // Same-origin bonus
    const originBonus = isSameOrigin ? 2 : -5;

    // Depth penalty (prefer shallower pages)
    const depthPenalty = getPathDepth(link.href) * -0.3;

    const totalScore = maxScore + originBonus + depthPenalty;

    let category: RankedLink['category'] = 'other';
    if (hiringScore > 0 && hiringScore >= aboutScore && hiringScore >= engScore) {
      category = 'hiring';
    } else if (aboutScore > 0 && aboutScore >= engScore) {
      category = 'about';
    } else if (engScore > 0) {
      category = 'engineering';
    }

    ranked.push({
      url: link.href,
      score: totalScore,
      category,
      anchorText: link.text,
      isSameOrigin,
    });
  }

  // Sort by score descending
  return ranked.sort((a, b) => b.score - a.score);
}

/**
 * Filter ranked links to same-origin only (default crawler mode)
 */
export function filterSameOrigin(links: RankedLink[], baseUrl: string): RankedLink[] {
  const base = new URL(baseUrl);
  return links.filter((l) => {
    try {
      return new URL(l.url).origin === base.origin;
    } catch {
      return false;
    }
  });
}
