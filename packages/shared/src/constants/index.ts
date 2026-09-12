// ============================================================
// SHARED CONSTANTS
// ============================================================

export const REQUIREMENT_KINDS = ['technical', 'behavioural', 'domain'] as const;
export const REQUIREMENT_PRIORITIES = ['must', 'nice'] as const;

export const QUESTION_CATEGORIES = [
  'technical',
  'behavioural',
  'system-design',
  'company-fit',
] as const;

export const DIFFICULTY_LEVELS = [1, 2, 3] as const;

export const CONFIDENCE_LEVELS = [1, 2, 3, 4, 5] as const;

export const KIT_STATUSES = [
  'queued',
  'running',
  'completed',
  'partial',
  'failed',
] as const;

export const GENERATION_STAGES = [
  'validating',
  'extracting_requirements',
  'researching_company',
  'finding_hiring_process',
  'researching_public_interviews',
  'generating_questions',
  'generating_flashcards',
  'checking_coverage',
  'closing_coverage_gaps',
  'allocating_schedule',
  'validating_kit',
  'saving',
  'completed',
] as const;

export const ENTITY_ORIGINS = ['generated', 'user-added'] as const;

export const REGENERATABLE_SECTIONS = [
  'company-brief',
  'questions',
  'flashcards',
  'schedule',
] as const;

// Pipeline limits
export const MAX_COVERAGE_PASSES = 3;
export const MAX_CRAWLER_PAGES = 15;
export const CRAWLER_TIMEOUT_MS = 10_000;
export const CRAWLER_MAX_RESPONSE_BYTES = 2 * 1024 * 1024; // 2MB
export const CRAWLER_CONCURRENCY = 2;
export const CRAWLER_RATE_LIMIT_MS = 500;
export const MAX_LLM_CONCURRENCY = 2;
export const LLM_MAX_RETRIES = 3;

// Schedule
export const MINUTES_PER_QUESTION = 20;
export const MAX_MINUTES_PER_DAY = 180;
export const MIN_MINUTES_PER_DAY = 20;

export const REQUIREMENT_PRIORITY_WEIGHT = { must: 2, nice: 1 } as const;
export const RECENCY_DECAY_DAYS = 7;

export type RequirementKind = (typeof REQUIREMENT_KINDS)[number];
export type RequirementPriority = (typeof REQUIREMENT_PRIORITIES)[number];
export type QuestionCategory = (typeof QUESTION_CATEGORIES)[number];
export type KitStatus = (typeof KIT_STATUSES)[number];
export type GenerationStage = (typeof GENERATION_STAGES)[number];
export type EntityOrigin = (typeof ENTITY_ORIGINS)[number];
export type RegeneratableSection = (typeof REGENERATABLE_SECTIONS)[number];

