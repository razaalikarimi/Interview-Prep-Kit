import { z } from 'zod';
import type { ILLMClient } from '../infrastructure/llm/client.js';
import {
  REQUIREMENT_EXTRACTION_SYSTEM,
  wrapTrustedData,
} from '../infrastructure/llm/prompts.js';
import type { Requirement } from '@interview-prep/shared';
import {
  RequirementKindSchema,
  RequirementPrioritySchema,
  ErrorCodes,
} from '@interview-prep/shared';
import { logger } from '../utils/logger.js';

// ============================================================
// REQUIREMENT EXTRACTOR SERVICE
//
// STEP 3 of the pipeline.
// Extracts structured requirements from job description text.
// Uses LLM but validates output strictly with Zod.
// ============================================================

const LLMRequirementSchema = z.object({
  requirements: z.array(
    z.object({
      id: z.string().min(1),
      text: z.string().min(1),
      kind: RequirementKindSchema,
      priority: RequirementPrioritySchema,
    }),
  ),
  role: z.object({
    title: z.string(),
    seniority: z.string(),
    responsibilities: z.array(z.string()),
    location: z.string().optional().default(''),
  }),
});

type LLMRequirementOutput = z.infer<typeof LLMRequirementSchema>;

export interface ExtractionResult {
  requirements: Requirement[];
  role: {
    title: string;
    seniority: string;
    responsibilities: string[];
    location: string;
  };
}

const EXTRACTION_PROMPT = (jd: string): string => `
${wrapTrustedData(jd, 'JOB DESCRIPTION')}

Extract all requirements from this job description. Return ONLY valid JSON matching this exact structure:

{
  "requirements": [
    {
      "id": "r1",
      "text": "Exact or paraphrased requirement text",
      "kind": "technical" | "behavioural" | "domain",
      "priority": "must" | "nice"
    }
  ],
  "role": {
    "title": "Job title from the JD",
    "seniority": "senior/mid/junior/lead/principal/etc inferred from JD",
    "responsibilities": ["Key responsibility 1", "..."],
    "location": "Location if mentioned, empty string if not"
  }
}

CLASSIFICATION GUIDE:
- "must" → required, essential, minimum X years, must have, expected
- "nice" → preferred, bonus, plus, advantageous, nice to have, experience with X is a plus
- "technical" → programming languages, frameworks, tools, systems, infrastructure
- "behavioural" → communication, leadership, teamwork, mentoring, collaboration
- "domain" → industry knowledge, domain expertise, business understanding

IMPORTANT:
- Extract ONLY requirements actually stated in the JD
- Do NOT invent requirements
- If the JD is short, a short list is correct and expected
- IDs must be r1, r2, r3, ... in order
- Do not include the location in the requirements array
`;

export async function extractRequirements(
  llm: ILLMClient,
  jobDescription: string,
): Promise<ExtractionResult> {
  logger.info('Extracting requirements from JD', { jdChars: jobDescription.length });

  const { parsed, raw, error } = await llm.generateJSON<LLMRequirementOutput>(
    [{ role: 'user', content: EXTRACTION_PROMPT(jobDescription) }],
    {
      systemPrompt: REQUIREMENT_EXTRACTION_SYSTEM,
      jsonMode: true,
      maxTokens: 4096,
      temperature: 0.1, // Low temperature for consistent extraction
    },
  );

  if (!parsed || error) {
    logger.warn('LLM extraction parse failed, attempting repair', { error });

    // Attempt repair: try parsing embedded JSON
    const repairedParsed = attemptJSONRepair<LLMRequirementOutput>(raw);
    if (!repairedParsed) {
      throw new Error(
        `${ErrorCodes.LLM_INVALID_OUTPUT}: Could not parse requirement extraction output`,
      );
    }
    return validateAndNormalize(repairedParsed);
  }

  // Validate with Zod
  const validated = LLMRequirementSchema.safeParse(parsed);
  if (!validated.success) {
    logger.warn('Requirement extraction Zod validation failed', {
      errors: validated.error.errors,
    });

    // Try repair
    const repairedParsed = attemptJSONRepair<LLMRequirementOutput>(raw);
    if (repairedParsed) {
      const revalidated = LLMRequirementSchema.safeParse(repairedParsed);
      if (revalidated.success) return validateAndNormalize(revalidated.data);
    }

    throw new Error(`${ErrorCodes.LLM_INVALID_OUTPUT}: Invalid requirement extraction structure`);
  }

  return validateAndNormalize(validated.data);
}

function validateAndNormalize(data: LLMRequirementOutput): ExtractionResult {
  // Ensure IDs are stable and in format r1, r2, ...
  const requirements: Requirement[] = data.requirements.map((r, idx) => ({
    id: r.id.startsWith('r') ? r.id : `r${idx + 1}`,
    text: r.text.trim(),
    kind: r.kind,
    priority: r.priority,
    state: {
      origin: 'generated' as const,
      edited: false,
      pinned: false,
      version: 1,
    },
  }));

  logger.info('Requirements extracted', {
    total: requirements.length,
    must: requirements.filter((r) => r.priority === 'must').length,
    nice: requirements.filter((r) => r.priority === 'nice').length,
    technical: requirements.filter((r) => r.kind === 'technical').length,
    behavioural: requirements.filter((r) => r.kind === 'behavioural').length,
    domain: requirements.filter((r) => r.kind === 'domain').length,
  });

  return {
    requirements,
    role: {
      title: data.role.title || 'Software Engineer',
      seniority: data.role.seniority || 'mid',
      responsibilities: data.role.responsibilities || [],
      location: data.role.location ?? '',
    },
  };
}

function attemptJSONRepair<T>(raw: string): T | null {
  try {
    // Find JSON object boundaries
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start === -1 || end === -1) return null;
    return JSON.parse(raw.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}
