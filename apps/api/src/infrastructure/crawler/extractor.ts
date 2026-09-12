import * as cheerio from 'cheerio';

// ============================================================
// HTML TEXT EXTRACTOR
// Extracts visible text and metadata from raw HTML.
// Removes scripts, styles, nav, footer to reduce noise.
// ============================================================

export interface ExtractedPage {
  title: string;
  metaDescription: string;
  text: string; // Cleaned visible text
  links: ExtractedLink[];
  wordCount: number;
}

export interface ExtractedLink {
  href: string;
  text: string;
  title: string;
}

export function extractPageContent(html: string, baseUrl: string): ExtractedPage {
  const $ = cheerio.load(html);

  // Remove non-content elements
  $('script, style, noscript, iframe, svg, nav, footer, header, aside').remove();
  $('[aria-hidden="true"]').remove();
  $('meta[name="robots"]').remove();

  const title = $('title').text().trim() || $('h1').first().text().trim();
  const metaDescription =
    $('meta[name="description"]').attr('content')?.trim() ??
    $('meta[property="og:description"]').attr('content')?.trim() ??
    '';

  // Extract visible text — join paragraphs, headings, list items
  const textParts: string[] = [];
  $('h1, h2, h3, h4, h5, h6, p, li, td, th, span, div').each((_i, el) => {
    const text = $(el).text().trim();
    if (text.length > 20) {
      // Filter out very short fragments
      textParts.push(text);
    }
  });

  // Deduplicate consecutive identical lines
  const seen = new Set<string>();
  const dedupedParts = textParts.filter((t) => {
    if (seen.has(t)) return false;
    seen.add(t);
    return true;
  });

  const text = dedupedParts.join('\n').replace(/\n{3,}/g, '\n\n').trim();

  // Extract links
  const links: ExtractedLink[] = [];
  const base = new URL(baseUrl);

  $('a[href]').each((_i, el) => {
    const href = $(el).attr('href') ?? '';
    const linkText = $(el).text().trim();
    const linkTitle = $(el).attr('title')?.trim() ?? '';

    if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
    if (href.startsWith('mailto:') || href.startsWith('tel:')) return;

    try {
      // Resolve relative URLs correctly (spec requirement: relative link resolution)
      const resolved = new URL(href, base.toString());
      // Remove fragment
      resolved.hash = '';
      links.push({
        href: resolved.toString(),
        text: linkText,
        title: linkTitle,
      });
    } catch {
      // Invalid URL — skip
    }
  });

  const wordCount = text.split(/\s+/).filter(Boolean).length;

  return { title, metaDescription, text, links, wordCount };
}
