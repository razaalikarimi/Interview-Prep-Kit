import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import type { ILLMClient } from '../infrastructure/llm/client.js';
import {
  FLASHCARD_GENERATION_SYSTEM,
  wrapTrustedData,
} from '../infrastructure/llm/prompts.js';
import type { Requirement, Question, Flashcard } from '@interview-prep/shared';
import { logger } from '../utils/logger.js';

// ============================================================
// FLASHCARD GENERATION SERVICE
// ============================================================

const FlashcardLLMSchema = z.object({
  flashcards: z.array(
    z.object({
      id: z.string(),
      front: z.string().min(1),
      back: z.string().min(1),
      requirement_ids: z.array(z.string()).min(1),
    }),
  ),
});

type FlashcardLLMOutput = z.infer<typeof FlashcardLLMSchema>;

const FLASHCARDS_PER_REQUIREMENT = 2;

export async function generateFlashcards(
  llm: ILLMClient,
  requirements: Requirement[],
  questions: Question[],
  role: string,
): Promise<Flashcard[]> {
  logger.info('Generating flashcards', { requirementCount: requirements.length });

  // Group requirements for efficient generation
  // Focus on MUST requirements first
  const mustReqs = requirements.filter((r) => r.priority === 'must');
  const niceReqs = requirements.filter((r) => r.priority === 'nice');
  const orderedReqs = [...mustReqs, ...niceReqs];

  const reqList = orderedReqs
    .map((r) => `- ID: ${r.id} | ${r.priority} | ${r.kind} | "${r.text}"`)
    .join('\n');

  // Include a sample of questions for context
  const questionSample = questions
    .slice(0, 10)
    .map((q) => `[${q.category}] ${q.prompt} → ${q.answer_outline.slice(0, 100)}`)
    .join('\n');

  const prompt = `
${wrapTrustedData(`Role: ${role}`, 'JOB CONTEXT')}

REQUIREMENTS:
${reqList}

SAMPLE QUESTIONS (for context, do not duplicate):
${questionSample}

Generate ${Math.min(orderedReqs.length * FLASHCARDS_PER_REQUIREMENT, 40)} flashcards to help prepare for this role.

Return ONLY valid JSON:
{
  "flashcards": [
    {
      "id": "f1",
      "front": "What is X?",
      "back": "X is... [concise complete answer]",
      "requirement_ids": ["r1"]
    }
  ]
}

RULES:
- Front: specific concept, term, or question (not generic)
- Back: concise but complete answer
- Each flashcard references one or more requirement IDs from the list
- requirement_ids must be actual IDs (r1, r2, etc.)
- Do NOT duplicate the question bank prompts
- Focus on key concepts, patterns, definitions
- IDs: f1, f2, f3, ...
- Generate at least one flashcard per MUST requirement
`;

  const { parsed, raw, error } = await llm.generateJSON<FlashcardLLMOutput>(
    [{ role: 'user', content: prompt }],
    {
      systemPrompt: FLASHCARD_GENERATION_SYSTEM,
      jsonMode: true,
      maxTokens: 4096,
      temperature: 0.3,
    },
  );

  const data = parsed ?? attemptRepair<FlashcardLLMOutput>(raw);
  if (!data || error) {
    logger.warn('Flashcard generation failed', { error });
    return [];
  }

  const validated = FlashcardLLMSchema.safeParse(data);
  const finalData = validated.success ? validated.data : data;

  const validRequirementIds = new Set(requirements.map((r) => r.id));
  const flashcards: Flashcard[] = [];

  for (const f of finalData.flashcards ?? []) {
    const validReqIds = (f.requirement_ids ?? []).filter((id) => validRequirementIds.has(id));
    if (validReqIds.length === 0) {
      const firstReq = requirements[0];
      if (firstReq) validReqIds.push(firstReq.id);
    }

    if (!f.front || !f.back) continue;

    flashcards.push({
      id: f.id || `f_${uuidv4().substring(0, 8)}`,
      front: f.front,
      back: f.back,
      requirement_ids: validReqIds,
      state: {
        origin: 'generated',
        edited: false,
        pinned: false,
        version: 1,
      },
    });
  }

  logger.info('Flashcards generated', { count: flashcards.length });
  return flashcards;
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
