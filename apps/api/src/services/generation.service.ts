import { createHash } from 'crypto';
import type { Kit, GenerationProgress, KitStatus } from '@interview-prep/shared';
import {
  QUESTION_CATEGORIES,
  MAX_COVERAGE_PASSES,
} from '@interview-prep/shared';
import { createLLMClient } from '../infrastructure/llm/gemini.js';
import { extractRequirements } from './requirement.service.js';
import { researchCompany } from './research.service.js';
import {
  generateQuestionsForCategory,
  generateGapQuestions,
} from './question.service.js';
import { generateFlashcards } from './flashcard.service.js';
import { checkCoverage } from '../domain/coverage.js';
import { allocateSchedule } from '../domain/schedule.js';
import { validateKitStructure } from '../domain/validator.js';
import { KitModel } from '../infrastructure/database/models/kit.model.js';
import { logger } from '../utils/logger.js';


// ============================================================
// GENERATION PIPELINE ORCHESTRATOR
//
// Implements the full multi-step pipeline:
//
// QUEUED
//   → validating
//   → extracting_requirements
//   → researching_company
//   → finding_hiring_process
//   → researching_public_interviews
//   → generating_questions (per category)
//   → generating_flashcards
//   → checking_coverage
//   → closing_coverage_gaps (up to MAX_PASSES)
//   → allocating_schedule (DETERMINISTIC)
//   → validating_kit
//   → saving
//   → completed
//
// On failure at any stage: FAILED (with error recorded)
// On partial research: PARTIAL (generation continues)
// ============================================================

export interface GenerationInput {
  kitId: string;
  userId: string;
  jobDescription: string;
  companyUrl: string;
  daysAvailable: number;
  companyName?: string | undefined;
  role?: string | undefined;
  location?: string | undefined;
  isEvalMode?: boolean | undefined;
}


const STAGE_WEIGHTS: Record<string, number> = {
  validating: 2,
  extracting_requirements: 8,
  researching_company: 15,
  finding_hiring_process: 10,
  researching_public_interviews: 5,
  generating_questions: 25,
  generating_flashcards: 10,
  checking_coverage: 5,
  closing_coverage_gaps: 8,
  allocating_schedule: 4,
  validating_kit: 3,
  saving: 2,
  completed: 3,
};

const TOTAL_WEIGHT = Object.values(STAGE_WEIGHTS).reduce((a, b) => a + b, 0);

async function updateProgress(
  kitId: string,
  stage: string,
  completedStages: string[],
  warnings: string[],
  error?: string,
): Promise<void> {
  const completedWeight = completedStages.reduce(
    (sum, s) => sum + (STAGE_WEIGHTS[s] ?? 1),
    0,
  );
  const percentage = Math.round((completedWeight / TOTAL_WEIGHT) * 100);

  const progress: GenerationProgress = {
    status: error ? 'failed' : 'running',
    stage: stage as GenerationProgress['stage'],
    percentage,
    completedStages: completedStages as GenerationProgress['completedStages'],
    warnings,
    error,
    updatedAt: new Date().toISOString(),
  };

  await KitModel.findByIdAndUpdate(kitId, {
    'generationProgress.stage': stage,
    'generationProgress.percentage': percentage,
    'generationProgress.completedStages': completedStages,
    'generationProgress.warnings': warnings,
    'generationProgress.error': error,
    'generationProgress.updatedAt': new Date().toISOString(),
    'generationProgress.status': progress.status,
    generationStatus: error ? 'failed' : 'running',
  });
}

/**
 * Create a normalized fingerprint for deduplication.
 * hash(normalizedJD + normalizedUrl)
 */
export function createFingerprint(jobDescription: string, companyUrl: string): string {
  const normalizedJD = jobDescription.toLowerCase().replace(/\s+/g, ' ').trim();
  const normalizedUrl = companyUrl.toLowerCase().trim().replace(/\/$/, '');
  return createHash('sha256')
    .update(`${normalizedJD}:${normalizedUrl}`)
    .digest('hex')
    .slice(0, 32);
}

/**
 * Run the full generation pipeline for a kit.
 * This function is called asynchronously after the kit record is created.
 */
export async function runGenerationPipeline(input: GenerationInput): Promise<void> {
  const { kitId, userId, jobDescription, companyUrl, daysAvailable, isEvalMode } = input;
  const completedStages: string[] = [];
  const warnings: string[] = [];
  const llm = createLLMClient();

  logger.info('Generation pipeline started', { kitId, userId });

  try {
    // STAGE 1: Validate input
    await updateProgress(kitId, 'validating', completedStages, warnings);
    if (jobDescription.trim().length < 10) {
      throw new Error('Job description is too short');
    }
    completedStages.push('validating');

    // STAGE 2: Extract requirements from JD
    await updateProgress(kitId, 'extracting_requirements', completedStages, warnings);
    const extraction = await extractRequirements(llm, jobDescription);
    const { requirements, role: roleInfo } = extraction;
    completedStages.push('extracting_requirements');

    logger.info('Requirements extracted', { count: requirements.length });

    // STAGE 3: Research company website
    await updateProgress(kitId, 'researching_company', completedStages, warnings);
    const research = await researchCompany(
      llm,
      companyUrl,
      input.companyName ?? 'the company',
      isEvalMode,
    );
    warnings.push(...research.warnings);
    completedStages.push('researching_company');

    // STAGE 4: Finding hiring process (embedded in research)
    await updateProgress(kitId, 'finding_hiring_process', completedStages, warnings);
    const hiringInfo = research.crawlResult.hiringPage?.text ?? null;
    if (!hiringInfo) {
      warnings.push('No hiring/careers page found on company website.');
    }
    completedStages.push('finding_hiring_process');

    // STAGE 5: Public interview research
    await updateProgress(kitId, 'researching_public_interviews', completedStages, warnings);
    const publicInsights = research.publicInterviewInsights;
    if (!publicInsights) {
      warnings.push('Public interview-process information was not found.');
    }
    completedStages.push('researching_public_interviews');

    // Build company context for question generation
    const companyContext = [
      research.companyBrief.summary,
      research.companyBrief.what_they_do,
      hiringInfo?.slice(0, 1000) ?? '',
    ]
      .filter(Boolean)
      .join('\n\n');

    // STAGE 6: Generate questions by category
    await updateProgress(kitId, 'generating_questions', completedStages, warnings);
    let questions = [];
    let questionIdCounter = 1;

    for (const category of QUESTION_CATEGORIES) {
      const categoryQuestions = await generateQuestionsForCategory(
        llm,
        category,
        requirements,
        companyContext,
        publicInsights,
        roleInfo.title,
        roleInfo.seniority,
        questionIdCounter,
      );
      // Re-number IDs sequentially
      const numbered = categoryQuestions.map((q, idx) => ({
        ...q,
        id: `q${questionIdCounter + idx}`,
      }));
      questions.push(...numbered);
      questionIdCounter += categoryQuestions.length;
    }
    completedStages.push('generating_questions');

    // STAGE 7: Generate flashcards
    await updateProgress(kitId, 'generating_flashcards', completedStages, warnings);
    let flashcards = await generateFlashcards(llm, requirements, questions, roleInfo.title);
    // Re-number flashcard IDs
    flashcards = flashcards.map((f, idx) => ({ ...f, id: `f${idx + 1}` }));
    completedStages.push('generating_flashcards');

    // STAGE 8: Coverage check (DETERMINISTIC)
    await updateProgress(kitId, 'checking_coverage', completedStages, warnings);
    let coverageResult = checkCoverage(requirements, questions, 1);
    completedStages.push('checking_coverage');

    // STAGE 9: Close coverage gaps (up to MAX_PASSES)
    if (coverageResult.uncovered_requirement_ids.length > 0) {
      await updateProgress(kitId, 'closing_coverage_gaps', completedStages, warnings);

      let pass = 1;
      while (
        coverageResult.uncovered_requirement_ids.length > 0 &&
        pass < MAX_COVERAGE_PASSES
      ) {
        logger.info('Coverage gap detected, generating additional questions', {
          uncovered: coverageResult.uncovered_requirement_ids,
          pass,
        });

        const uncoveredReqs = requirements.filter((r) =>
          coverageResult.uncovered_requirement_ids.includes(r.id),
        );

        const gapQuestions = await generateGapQuestions(
          llm,
          uncoveredReqs,
          requirements,
          companyContext,
          roleInfo.title,
          roleInfo.seniority,
          questionIdCounter,
        );

        const numberedGapQuestions = gapQuestions.map((q, idx) => ({
          ...q,
          id: `q${questionIdCounter + idx}`,
        }));
        questions.push(...numberedGapQuestions);
        questionIdCounter += gapQuestions.length;

        pass++;
        coverageResult = checkCoverage(requirements, questions, pass);
      }

      if (coverageResult.uncovered_requirement_ids.length > 0) {
        warnings.push(
          `Some requirements remain uncovered after ${MAX_COVERAGE_PASSES} passes: ${coverageResult.uncovered_requirement_ids.join(', ')}`,
        );
      }
    }
    completedStages.push('closing_coverage_gaps');

    // STAGE 10: Allocate schedule (DETERMINISTIC)
    await updateProgress(kitId, 'allocating_schedule', completedStages, warnings);
    const schedule = allocateSchedule(requirements, questions, daysAvailable);
    completedStages.push('allocating_schedule');

    // Build the final kit
    const successPages = research.crawlResult.pages.filter(
      (p) => p.status === 'success',
    );

    const kit: Kit = {
      source: {
        company: input.companyName ?? extractDomainName(companyUrl),
        company_url: companyUrl,
        role: roleInfo.title,
        location: input.location ?? roleInfo.location,
        jd_chars: jobDescription.length,
        researched_at: new Date().toISOString(),
        pages_used: successPages.map((p) => ({
          url: p.url,
          title: p.title,
          relevanceScore: p.relevanceScore,
        })),
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

    // STAGE 11: Validate kit
    await updateProgress(kitId, 'validating_kit', completedStages, warnings);
    const validationResult = validateKitStructure(kit);
    if (!validationResult.valid) {
      const errorMessages = validationResult.errors.map((e) => `${e.field}: ${e.message}`);
      logger.warn('Kit validation found issues', { errors: errorMessages });
      warnings.push(...errorMessages.map((e) => `Validation warning: ${e}`));
    }
    completedStages.push('validating_kit');

    // STAGE 12: Save
    await updateProgress(kitId, 'saving', completedStages, warnings);
    const finalStatus: KitStatus =
      warnings.length > 0 && !validationResult.valid
        ? 'partial'
        : 'completed';

    await KitModel.findByIdAndUpdate(kitId, {
      kit,
      generationStatus: finalStatus,
      'generationProgress.status': finalStatus,
      'generationProgress.stage': 'completed',
      'generationProgress.percentage': 100,
      'generationProgress.completedStages': [...completedStages, 'saving', 'completed'],
      'generationProgress.warnings': warnings,
      'generationProgress.updatedAt': new Date().toISOString(),
      $inc: { version: 1 },
    });

    logger.info('Generation pipeline completed', {
      kitId,
      status: finalStatus,
      questionCount: questions.length,
      flashcardCount: flashcards.length,
      warningCount: warnings.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('Generation pipeline failed', { kitId, error: message });

    await KitModel.findByIdAndUpdate(kitId, {
      generationStatus: 'failed',
      'generationProgress.status': 'failed',
      'generationProgress.error': message,
      'generationProgress.updatedAt': new Date().toISOString(),
    });
  }
}

function extractDomainName(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
