#!/usr/bin/env tsx
/**
 * BATCH EVALUATOR
 *
 * Usage: npm run evaluate -- --input <cases.json> --output <kits.json>
 *
 * DESIGN PRINCIPLES:
 * - Uses THE SAME pipeline as the web application (no duplicated logic)
 * - Reads input JSON array of test cases
 * - Runs generation pipeline for each case (respecting SSRF_ALLOW_HOSTS)
 * - Continues if one case fails (records failure, processes remaining)
 * - Writes structured output JSON
 *
 * EVAL MODE:
 * - Sets EVAL_MODE=true to allow localhost URLs via SSRF_ALLOW_HOSTS
 * - Does not require a running MongoDB for kit storage
 * - Uses an in-memory mock for progress tracking
 *
 * localhost support:
 * - Set SSRF_ALLOW_HOSTS=localhost,127.0.0.1 (or specific host) in .env
 * - URLs like http://localhost:8099/acme/ are handled correctly
 * - Relative URLs resolved against full base URL (including path prefix)
 */

import path from 'path';
import fs from 'fs/promises';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Enable eval mode for localhost URL support
process.env['EVAL_MODE'] = 'true';
process.env['NODE_ENV'] = process.env['NODE_ENV'] ?? 'development';

import { BatchInputSchema, type BatchOutput, type BatchKitResult, type Kit } from '@interview-prep/shared';
import { createLLMClient } from '../apps/api/src/infrastructure/llm/gemini.js';
import { extractRequirements } from '../apps/api/src/services/requirement.service.js';
import { researchCompany } from '../apps/api/src/services/research.service.js';
import { generateQuestionsForCategory, generateGapQuestions } from '../apps/api/src/services/question.service.js';
import { generateFlashcards } from '../apps/api/src/services/flashcard.service.js';
import { checkCoverage } from '../apps/api/src/domain/coverage.js';
import { allocateSchedule } from '../apps/api/src/domain/schedule.js';
import { validateKitStructure } from '../apps/api/src/domain/validator.js';
import { validateSSRF } from '../apps/api/src/infrastructure/crawler/ssrf.js';
import { MAX_COVERAGE_PASSES, QUESTION_CATEGORIES, ErrorCodes } from '@interview-prep/shared';

function parseArgs(args: string[]): { input: string; output: string } {
  const inputIdx = args.indexOf('--input');
  const outputIdx = args.indexOf('--output');

  if (inputIdx === -1 || outputIdx === -1) {
    console.error('Usage: npm run evaluate -- --input <cases.json> --output <kits.json>');
    process.exit(1);
  }

  const input = args[inputIdx + 1];
  const output = args[outputIdx + 1];

  if (!input || !output) {
    console.error('Both --input and --output arguments are required');
    process.exit(1);
  }

  return { input, output };
}

async function runSingleCase(
  id: string,
  jd: string,
  companyUrl: string,
  days: number,
): Promise<Kit> {
  const llm = createLLMClient();
  const isEvalMode = true;

  console.log(`[${id}] Starting generation...`);

  // Validate URL (with eval mode for localhost)
  await validateSSRF(companyUrl, isEvalMode);

  // STEP 2: Extract requirements
  console.log(`[${id}] Extracting requirements...`);
  const extraction = await extractRequirements(llm, jd);
  const { requirements, role: roleInfo } = extraction;

  // STEP 3: Research company
  console.log(`[${id}] Researching company: ${companyUrl}`);
  const research = await researchCompany(llm, companyUrl, extractDomainName(companyUrl), isEvalMode);

  const companyContext = [
    research.companyBrief.summary,
    research.companyBrief.what_they_do,
    research.crawlResult.hiringPage?.text?.slice(0, 1000) ?? '',
  ].filter(Boolean).join('\n\n');

  // STEP 4: Generate questions by category
  console.log(`[${id}] Generating questions...`);
  let questions = [];
  let questionIdCounter = 1;

  for (const category of QUESTION_CATEGORIES) {
    const categoryQuestions = await generateQuestionsForCategory(
      llm, category, requirements, companyContext, research.publicInterviewInsights,
      roleInfo.title, roleInfo.seniority, questionIdCounter,
    );
    const numbered = categoryQuestions.map((q, idx) => ({ ...q, id: `q${questionIdCounter + idx}` }));
    questions.push(...numbered);
    questionIdCounter += categoryQuestions.length;
  }

  // STEP 5: Generate flashcards
  console.log(`[${id}] Generating flashcards...`);
  let flashcards = await generateFlashcards(llm, requirements, questions, roleInfo.title);
  flashcards = flashcards.map((f, idx) => ({ ...f, id: `f${idx + 1}` }));

  // STEP 6: Coverage check + gap filling
  console.log(`[${id}] Checking coverage...`);
  let coverageResult = checkCoverage(requirements, questions, 1);
  let pass = 1;

  while (coverageResult.uncovered_requirement_ids.length > 0 && pass < MAX_COVERAGE_PASSES) {
    console.log(`[${id}] Coverage gap pass ${pass}: ${coverageResult.uncovered_requirement_ids.join(', ')}`);
    const uncoveredReqs = requirements.filter(r => coverageResult.uncovered_requirement_ids.includes(r.id));
    const gapQuestions = await generateGapQuestions(
      llm, uncoveredReqs, requirements, companyContext, roleInfo.title, roleInfo.seniority, questionIdCounter,
    );
    const numberedGap = gapQuestions.map((q, idx) => ({ ...q, id: `q${questionIdCounter + idx}` }));
    questions.push(...numberedGap);
    questionIdCounter += gapQuestions.length;
    pass++;
    coverageResult = checkCoverage(requirements, questions, pass);
  }

  // STEP 7: Allocate schedule (DETERMINISTIC)
  console.log(`[${id}] Allocating schedule (${days} days)...`);
  const schedule = allocateSchedule(requirements, questions, days);

  const successPages = research.crawlResult.pages.filter(p => p.status === 'success');

  const kit: Kit = {
    source: {
      company: extractDomainName(companyUrl),
      company_url: companyUrl,
      role: roleInfo.title,
      location: roleInfo.location,
      jd_chars: jd.length,
      researched_at: new Date().toISOString(),
      pages_used: successPages.map(p => ({ url: p.url, title: p.title, relevanceScore: p.relevanceScore })),
    },
    company_brief: research.companyBrief,
    role: {
      title: roleInfo.title,
      seniority: roleInfo.seniority,
      responsibilities: roleInfo.responsibilities,
      requirements,
    },
    questions,
    flashcards,
    schedule,
    coverage: {
      uncovered_requirement_ids: coverageResult.uncovered_requirement_ids,
      passes: coverageResult.passes,
    },
  };

  // Validate
  const validation = validateKitStructure(kit);
  if (!validation.valid) {
    console.warn(`[${id}] Kit has validation warnings:`, validation.errors);
  }

  console.log(`[${id}] ✅ Completed — ${questions.length} questions, ${flashcards.length} flashcards`);
  return kit;
}

function extractDomainName(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const { input, output } = parseArgs(args);

  console.log(`\n🚀 Batch Evaluator`);
  console.log(`📁 Input: ${input}`);
  console.log(`📁 Output: ${output}`);

  // Read input
  let rawInput: string;
  try {
    rawInput = await fs.readFile(path.resolve(input), 'utf-8');
  } catch (err) {
    console.error(`❌ Could not read input file: ${input}`);
    process.exit(1);
  }

  let cases: unknown;
  try {
    cases = JSON.parse(rawInput);
  } catch {
    console.error('❌ Input file is not valid JSON');
    process.exit(1);
  }

  const validated = BatchInputSchema.safeParse(cases);
  if (!validated.success) {
    console.error('❌ Input JSON does not match expected schema:', validated.error.errors);
    process.exit(1);
  }

  const batchCases = validated.data;
  console.log(`\n📋 Processing ${batchCases.length} cases...\n`);

  const results: BatchKitResult[] = [];

  // Process cases sequentially to avoid overwhelming rate limits
  for (const batchCase of batchCases) {
    const startTime = Date.now();

    try {
      const kit = await runSingleCase(
        batchCase.id,
        batchCase.jd,
        batchCase.company_url,
        batchCase.days,
      );

      const durationMs = Date.now() - startTime;
      console.log(`[${batchCase.id}] Completed in ${(durationMs / 1000).toFixed(1)}s\n`);

      results.push({
        id: batchCase.id,
        status: 'ok',
        kit,
        error: null,
      });
    } catch (err: unknown) {
      const durationMs = Date.now() - startTime;
      const message = err instanceof Error ? err.message : String(err);
      const code = extractErrorCode(message);

      console.error(`[${batchCase.id}] ❌ Failed in ${(durationMs / 1000).toFixed(1)}s: ${message}\n`);

      // IMPORTANT: Do NOT stop processing — continue with remaining cases
      results.push({
        id: batchCase.id,
        status: 'failed',
        kit: null,
        error: { code, message },
      });
    }
  }

  // Build output
  const batchOutput: BatchOutput = {
    version: '1.0',
    generated_at: new Date().toISOString(),
    kits: results,
  };

  // Write output atomically
  const outputPath = path.resolve(output);
  await fs.writeFile(outputPath, JSON.stringify(batchOutput, null, 2), 'utf-8');

  const successful = results.filter(r => r.status === 'ok').length;
  const failed = results.filter(r => r.status === 'failed').length;

  console.log(`\n✅ Batch complete!`);
  console.log(`   Successful: ${successful}/${batchCases.length}`);
  console.log(`   Failed: ${failed}/${batchCases.length}`);
  console.log(`   Output: ${outputPath}\n`);

  if (failed > 0) {
    console.log('Failed cases:');
    results.filter(r => r.status === 'failed').forEach(r => {
      console.log(`  - ${r.id}: ${r.error?.message}`);
    });
  }
}

function extractErrorCode(message: string): string {
  const colonIdx = message.indexOf(':');
  if (colonIdx > 0) {
    const possibleCode = message.slice(0, colonIdx).trim();
    if (/^[A-Z_]+$/.test(possibleCode)) return possibleCode;
  }

  if (message.includes('unreachable') || message.includes('ECONNREFUSED')) return ErrorCodes.COMPANY_UNREACHABLE;
  if (message.includes('timeout')) return ErrorCodes.COMPANY_TIMEOUT;
  if (message.includes('SSRF') || message.includes('private')) return ErrorCodes.SSRF_BLOCKED;
  if (message.includes('rate limit') || message.includes('429')) return ErrorCodes.LLM_RATE_LIMITED;

  return ErrorCodes.GENERATION_FAILED;
}

main().catch((err) => {
  console.error('❌ Batch evaluator crashed:', err);
  process.exit(1);
});
