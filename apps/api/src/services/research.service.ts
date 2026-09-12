import { z } from 'zod';
import type { ILLMClient } from '../infrastructure/llm/client.js';
import {
  COMPANY_RESEARCH_SYSTEM,
  wrapUntrustedContent,
  wrapTrustedData,
} from '../infrastructure/llm/prompts.js';
import type { CompanyBrief } from '@interview-prep/shared';
import { crawlCompanySite, type CrawlResult } from '../infrastructure/crawler/crawler.js';
import { logger } from '../utils/logger.js';

// ============================================================
// RESEARCH SERVICE
//
// STEP 4: Company website research
// STEP 5: Public interview research
//
// Design:
// - Crawl company website (bounded, safe)
// - Generate company brief from crawled content
// - Separately search for public interview information
// - If no public info found: say so honestly, don't fabricate
// ============================================================

export interface ResearchResult {
  crawlResult: CrawlResult;
  companyBrief: CompanyBrief;
  publicInterviewInsights: string | null;
  warnings: string[];
}

const CompanyBriefLLMSchema = z.object({
  summary: z.string(),
  what_they_do: z.string(),
  sources: z.array(z.string()),
});

export async function researchCompany(
  llm: ILLMClient,
  companyUrl: string,
  companyName: string,
  isEvalMode = false,
): Promise<ResearchResult> {
  const warnings: string[] = [];

  logger.info('Starting company research', { companyUrl, companyName });

  // STEP 4a: Crawl company website
  let crawlResult: CrawlResult;
  try {
    crawlResult = await crawlCompanySite(companyUrl, isEvalMode);
    warnings.push(...crawlResult.warnings);
  } catch (err) {
    logger.warn('Company crawl failed', {
      url: companyUrl,
      error: err instanceof Error ? err.message : String(err),
    });
    // Return minimal research rather than failing
    return {
      crawlResult: {
        homepageUrl: companyUrl,
        pages: [],
        totalPagesFetched: 0,
        warnings: [`Company website unreachable: ${err instanceof Error ? err.message : String(err)}`],
      },
      companyBrief: {
        summary: `Research for ${companyName} was unavailable. The kit was generated from the job description alone.`,
        what_they_do: 'Company website could not be accessed for research.',
        sources: [],
        state: { origin: 'generated', edited: false, pinned: false, version: 1 },
      },
      publicInterviewInsights: null,
      warnings: [`Company website unreachable: ${err instanceof Error ? err.message : String(err)}`],
    };
  }

  // STEP 4b: Generate company brief from crawled content
  const companyBrief = await generateCompanyBrief(
    llm,
    companyName,
    companyUrl,
    crawlResult,
  );

  // STEP 5: Research public interview insights
  // NOTE: In a production system with web search API access, this would
  // search Glassdoor, Blind, Reddit, etc. Without a search API, we note this honestly.
  // We use available crawled content and company engineering blog for hints.
  const publicInterviewInsights = extractPublicInsights(crawlResult, companyName);

  return {
    crawlResult,
    companyBrief,
    publicInterviewInsights,
    warnings,
  };
}

async function generateCompanyBrief(
  llm: ILLMClient,
  companyName: string,
  companyUrl: string,
  crawlResult: CrawlResult,
): Promise<CompanyBrief> {
  const successPages = crawlResult.pages.filter(
    (p) => p.status === 'success' && p.wordCount > 30,
  );

  if (successPages.length === 0) {
    return {
      summary: `No website content could be retrieved for ${companyName}. Research was limited to the job description.`,
      what_they_do: 'Website content was unavailable.',
      sources: [],
      state: { origin: 'generated', edited: false, pinned: false, version: 1 },
    };
  }

  // Build context from crawled pages (wrapped as untrusted)
  const pageContexts = successPages
    .slice(0, 5)
    .map((p) =>
      wrapUntrustedContent(
        `TITLE: ${p.title}\n\n${p.text.slice(0, 2000)}`,
        `${p.sourceType} (${p.url})`,
      ),
    )
    .join('\n\n');

  const prompt = `
${wrapTrustedData(`Company: ${companyName}\nURL: ${companyUrl}`, 'COMPANY INFO')}

${pageContexts}

Based on the retrieved content above, generate a company brief.

Return ONLY valid JSON:
{
  "summary": "2-3 sentence overview of the company",
  "what_they_do": "Clear description of the company's products, services, and market",
  "sources": ["url1", "url2"]
}

RULES:
- Only include facts supported by the retrieved content
- If information is limited, acknowledge it honestly
- Do not fabricate products, services, or company facts
- Sources should be the actual URLs retrieved
`;

  const { parsed, error } = await llm.generateJSON<z.infer<typeof CompanyBriefLLMSchema>>(
    [{ role: 'user', content: prompt }],
    {
      systemPrompt: COMPANY_RESEARCH_SYSTEM,
      jsonMode: true,
      maxTokens: 1024,
      temperature: 0.2,
    },
  );

  if (!parsed || error) {
    logger.warn('Company brief generation failed', { error });
    return {
      summary: `${companyName} — research was retrieved but summary generation failed.`,
      what_they_do: 'See company URL for details.',
      sources: successPages.map((p) => p.url),
      state: { origin: 'generated', edited: false, pinned: false, version: 1 },
    };
  }

  const validated = CompanyBriefLLMSchema.safeParse(parsed);
  const data = validated.success ? validated.data : parsed;

  return {
    summary: data.summary || `${companyName} — limited research available.`,
    what_they_do: data.what_they_do || 'See company website for details.',
    sources: successPages.map((p) => p.url),
    state: { origin: 'generated', edited: false, pinned: false, version: 1 },
  };
}

/**
 * Extract any interview-process hints from crawled content.
 * This is a separate step from website crawling (STEP 5).
 *
 * NOTE: Without a web search API, we look at engineering blogs,
 * careers pages, and handbook pages for interview process hints.
 * This is clearly marked as "from company's own materials"
 * rather than fabricating third-party discussion.
 */
function extractPublicInsights(crawlResult: CrawlResult, companyName: string): string | null {
  const relevantPages = crawlResult.pages.filter(
    (p) =>
      p.status === 'success' &&
      (p.sourceType.includes('engineering') ||
        p.sourceType.includes('careers') ||
        p.sourceType.includes('hiring') ||
        p.text.toLowerCase().includes('interview') ||
        p.text.toLowerCase().includes('hiring process')),
  );

  if (relevantPages.length === 0) {
    return null; // Honestly: no public interview info found
  }

  // Extract interview-relevant sentences from pages
  const insights: string[] = [];
  for (const page of relevantPages.slice(0, 3)) {
    const sentences = page.text
      .split(/[.!?]/)
      .map((s) => s.trim())
      .filter(
        (s) =>
          s.length > 30 &&
          (s.toLowerCase().includes('interview') ||
            s.toLowerCase().includes('hiring') ||
            s.toLowerCase().includes('apply') ||
            s.toLowerCase().includes('process') ||
            s.toLowerCase().includes('candidate')),
      )
      .slice(0, 3);
    insights.push(...sentences);
  }

  if (insights.length === 0) {
    return `No specific interview process information was found in ${companyName}'s public materials. "Public interview-process information was not found."`;
  }

  return `From ${companyName}'s public materials:\n${insights.join('. ')}`;
}
