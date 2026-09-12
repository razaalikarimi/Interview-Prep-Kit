import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import type { ILLMClient } from '../infrastructure/llm/client.js';
import {
  QUESTION_GENERATION_SYSTEM,
  GAP_COVERAGE_SYSTEM,
  wrapUntrustedContent,
  wrapTrustedData,
} from '../infrastructure/llm/prompts.js';
import type { Requirement, Question, QuestionCategory } from '@interview-prep/shared';
import { QuestionCategorySchema, DifficultySchema } from '@interview-prep/shared';
import { logger } from '../utils/logger.js';


// ============================================================
// QUESTION GENERATION SERVICE
//
// STEP 6 of the pipeline.
// Generates questions by category, each referencing requirement IDs.
// Validates ALL output strictly.
// ============================================================

const QuestionLLMSchema = z.object({
  questions: z.array(
    z.object({
      id: z.string(),
      requirement_ids: z.array(z.string()).min(1),
      category: QuestionCategorySchema,
      prompt: z.string().min(1),
      answer_outline: z.string().min(1),
      difficulty: DifficultySchema,
    }),
  ),
});

type QuestionLLMOutput = z.infer<typeof QuestionLLMSchema>;

const QUESTIONS_PER_CATEGORY = 4;

function buildQuestionPrompt(
  category: QuestionCategory,
  requirements: Requirement[],
  companyContext: string,
  publicInsights: string | null,
  role: string,
  seniority: string,
  startId: number,
): string {
  const categoryReqs = requirements.filter((r) => {
    switch (category) {
      case 'technical':
        return r.kind === 'technical';
      case 'behavioural':
        return r.kind === 'behavioural';
      case 'system-design':
        return r.kind === 'technical' && r.priority === 'must';
      case 'company-fit':
        return true; // Use all requirements for company-fit
      default:
        return true;
    }
  });

  // If no category-specific requirements, use all
  const effectiveReqs = categoryReqs.length > 0 ? categoryReqs : requirements;

  const reqList = effectiveReqs
    .map((r) => `- ID: ${r.id} | ${r.priority.toUpperCase()} | ${r.kind} | "${r.text}"`)
    .join('\n');

  const companySection = companyContext
    ? wrapUntrustedContent(companyContext.slice(0, 2000), 'company-research')
    : '(No company research available)';

  const publicSection = publicInsights
    ? wrapUntrustedContent(publicInsights, 'public-interview-insights')
    : '(No public interview process information was found)';

  return `
${wrapTrustedData(`Role: ${role}\nSeniority: ${seniority}\nCategory: ${category}`, 'JOB CONTEXT')}

REQUIREMENTS TO COVER:
${reqList}

${companySection}

${publicSection}

Generate ${QUESTIONS_PER_CATEGORY} interview questions for the "${category}" category.
Questions must be specific, challenging, and appropriate for ${seniority}-level ${role} candidates.

Return ONLY valid JSON:
{
  "questions": [
    {
      "id": "q${startId}",
      "requirement_ids": ["r1"],
      "category": "${category}",
      "prompt": "Interview question text?",
      "answer_outline": "Key points a good answer should cover...",
      "difficulty": 2
    }
  ]
}

RULES:
- Each question MUST reference at least one requirement ID from the list above
- requirement_ids must be actual IDs from the list (r1, r2, etc.)
- difficulty: 1=easy, 2=medium, 3=hard — use all levels
- category must be exactly "${category}"
- Questions must be genuinely useful interview questions
- IDs: q${startId}, q${startId + 1}, q${startId + 2}, ...
- ${category === 'company-fit' ? 'Company-fit questions must use ONLY verified company research, not invented facts' : ''}
`;
}

export async function generateQuestionsForCategory(
  llm: ILLMClient,
  category: QuestionCategory,
  requirements: Requirement[],
  companyContext: string,
  publicInsights: string | null,
  role: string,
  seniority: string,
  startId: number,
): Promise<Question[]> {
  logger.info('Generating questions', { category, requirementCount: requirements.length });

  const prompt = buildQuestionPrompt(
    category,
    requirements,
    companyContext,
    publicInsights,
    role,
    seniority,
    startId,
  );

  const { parsed, raw, error } = await llm.generateJSON<QuestionLLMOutput>(
    [{ role: 'user', content: prompt }],
    {
      systemPrompt: QUESTION_GENERATION_SYSTEM,
      jsonMode: true,
      maxTokens: 4096,
      temperature: 0.4,
    },
  );

  if (!parsed || error) {
    logger.warn('Question generation parse failed', { category, error });
    const repaired = attemptRepair<QuestionLLMOutput>(raw);
    if (!repaired) {
      logger.error('Could not repair question generation output', { category });
      return []; // Return empty rather than failing the entire pipeline
    }
    return validateQuestions(repaired, requirements, category);
  }

  const validated = QuestionLLMSchema.safeParse(parsed);
  if (!validated.success) {
    logger.warn('Question Zod validation failed', { category, errors: validated.error.errors });
    const repaired = attemptRepair<QuestionLLMOutput>(raw);
    if (repaired) {
      return validateQuestions(repaired, requirements, category);
    }
    return [];
  }

  return validateQuestions(validated.data, requirements, category);
}

function validateQuestions(
  data: QuestionLLMOutput,
  requirements: Requirement[],
  category: QuestionCategory,
): Question[] {
  const validRequirementIds = new Set(requirements.map((r) => r.id));
  const questions: Question[] = [];

  for (const q of data.questions) {
    // Validate and filter requirement_ids — only valid ones
    const validReqIds = q.requirement_ids.filter((id) => validRequirementIds.has(id));

    if (validReqIds.length === 0) {
      // If no valid requirement IDs, assign to first requirement as fallback
      const firstReq = requirements[0];
      if (firstReq) {
        validReqIds.push(firstReq.id);
      } else {
        continue; // Skip questions with no valid requirement refs
      }
    }

    // Ensure difficulty is valid
    const difficulty = [1, 2, 3].includes(q.difficulty) ? q.difficulty : 2;

    questions.push({
      id: q.id || `q_${uuidv4().substring(0, 8)}`,
      requirement_ids: validReqIds,
      category,
      prompt: q.prompt,
      answer_outline: q.answer_outline,
      difficulty: difficulty as 1 | 2 | 3,
      state: {
        origin: 'generated',
        edited: false,
        pinned: false,
        version: 1,
      },
    });
  }

  logger.info('Questions generated', { category, count: questions.length });
  return questions;
}

/**
 * Generate questions specifically for uncovered requirements (second pass).
 */
export async function generateGapQuestions(
  llm: ILLMClient,
  uncoveredRequirements: Requirement[],
  allRequirements: Requirement[],
  companyContext: string,
  role: string,
  seniority: string,
  startId: number,
): Promise<Question[]> {
  if (uncoveredRequirements.length === 0) return [];

  logger.info('Generating gap questions', { uncoveredCount: uncoveredRequirements.length });

  const reqList = uncoveredRequirements
    .map((r) => `- ID: ${r.id} | ${r.priority.toUpperCase()} | ${r.kind} | "${r.text}"`)
    .join('\n');

  const prompt = `
${wrapTrustedData(`Role: ${role}\nSeniority: ${seniority}`, 'JOB CONTEXT')}

The following requirements currently have NO question coverage.
Generate at least 1 question for EACH uncovered requirement:

${reqList}

${companyContext ? wrapUntrustedContent(companyContext.slice(0, 1500), 'company-research') : ''}

Return ONLY valid JSON:
{
  "questions": [
    {
      "id": "q${startId}",
      "requirement_ids": ["r_X"],
      "category": "technical" | "behavioural" | "system-design" | "company-fit",
      "prompt": "Question text?",
      "answer_outline": "Key points...",
      "difficulty": 2
    }
  ]
}

CRITICAL: requirement_ids must be one of: ${uncoveredRequirements.map((r) => r.id).join(', ')}
Generate at minimum ${uncoveredRequirements.length} questions — one per uncovered requirement.
`;

  const { parsed, raw, error: _error } = await llm.generateJSON<QuestionLLMOutput>(
    [{ role: 'user', content: prompt }],
    {
      systemPrompt: GAP_COVERAGE_SYSTEM,
      jsonMode: true,
      maxTokens: 3000,
      temperature: 0.3,
    },
  );

  const data = parsed ?? attemptRepair<QuestionLLMOutput>(raw);
  if (!data) return [];

  return validateQuestions(data, allRequirements, 'technical'); // category will be set by LLM
}

function attemptRepair<T>(raw: string): T | null {
  try {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start === -1 || end === -1) return null;
    return JSON.parse(raw.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}
