// src/schemas/kit.schema.ts
import { z } from "zod";

// src/constants/index.ts
var REQUIREMENT_KINDS = ["technical", "behavioural", "domain"];
var REQUIREMENT_PRIORITIES = ["must", "nice"];
var QUESTION_CATEGORIES = [
  "technical",
  "behavioural",
  "system-design",
  "company-fit"
];
var DIFFICULTY_LEVELS = [1, 2, 3];
var CONFIDENCE_LEVELS = [1, 2, 3, 4, 5];
var KIT_STATUSES = [
  "queued",
  "running",
  "completed",
  "partial",
  "failed"
];
var GENERATION_STAGES = [
  "validating",
  "extracting_requirements",
  "researching_company",
  "finding_hiring_process",
  "researching_public_interviews",
  "generating_questions",
  "generating_flashcards",
  "checking_coverage",
  "closing_coverage_gaps",
  "allocating_schedule",
  "validating_kit",
  "saving",
  "completed"
];
var ENTITY_ORIGINS = ["generated", "user-added"];
var REGENERATABLE_SECTIONS = [
  "company-brief",
  "questions",
  "flashcards",
  "schedule"
];
var MAX_COVERAGE_PASSES = 3;
var MAX_CRAWLER_PAGES = 15;
var CRAWLER_TIMEOUT_MS = 1e4;
var CRAWLER_MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
var CRAWLER_CONCURRENCY = 2;
var CRAWLER_RATE_LIMIT_MS = 500;
var MAX_LLM_CONCURRENCY = 2;
var LLM_MAX_RETRIES = 3;
var MINUTES_PER_QUESTION = 20;
var MAX_MINUTES_PER_DAY = 180;
var MIN_MINUTES_PER_DAY = 20;
var REQUIREMENT_PRIORITY_WEIGHT = { must: 2, nice: 1 };
var RECENCY_DECAY_DAYS = 7;

// src/schemas/kit.schema.ts
var RequirementKindSchema = z.enum(REQUIREMENT_KINDS);
var RequirementPrioritySchema = z.enum(REQUIREMENT_PRIORITIES);
var QuestionCategorySchema = z.enum(QUESTION_CATEGORIES);
var DifficultySchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);
var ConfidenceSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5)
]);
var KitStatusSchema = z.enum(KIT_STATUSES);
var GenerationStageSchema = z.enum(GENERATION_STAGES);
var EntityOriginSchema = z.enum(ENTITY_ORIGINS);
var RegeneratableSectionSchema = z.enum(REGENERATABLE_SECTIONS);
var EntityStateSchema = z.object({
  origin: EntityOriginSchema,
  edited: z.boolean(),
  pinned: z.boolean(),
  version: z.number().int().nonnegative(),
  editedAt: z.string().datetime().optional()
});
var RequirementSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  kind: RequirementKindSchema,
  priority: RequirementPrioritySchema,
  state: EntityStateSchema.optional()
});
var QuestionSchema = z.object({
  id: z.string().min(1),
  requirement_ids: z.array(z.string().min(1)).min(1),
  category: QuestionCategorySchema,
  prompt: z.string().min(1),
  answer_outline: z.string().min(1),
  difficulty: DifficultySchema,
  state: EntityStateSchema.optional()
});
var FlashcardSchema = z.object({
  id: z.string().min(1),
  front: z.string().min(1),
  back: z.string().min(1),
  requirement_ids: z.array(z.string().min(1)).min(1),
  state: EntityStateSchema.optional()
});
var ScheduleDaySchema = z.object({
  day: z.number().int().positive(),
  focus: z.string(),
  question_ids: z.array(z.string()),
  minutes: z.number().int().nonnegative()
});
var ScheduleSchema = z.object({
  days_available: z.number().int().positive(),
  days: z.array(ScheduleDaySchema)
});
var CoverageSchema = z.object({
  uncovered_requirement_ids: z.array(z.string()),
  passes: z.number().int().nonnegative()
});
var SourcePageSchema = z.object({
  url: z.string().url(),
  title: z.string().optional(),
  relevanceScore: z.number().optional()
});
var KitSourceSchema = z.object({
  company: z.string(),
  company_url: z.string(),
  role: z.string(),
  location: z.string(),
  jd_chars: z.number().int().nonnegative(),
  researched_at: z.string(),
  pages_used: z.array(SourcePageSchema)
});
var CompanyBriefSchema = z.object({
  summary: z.string(),
  what_they_do: z.string(),
  sources: z.array(z.string()),
  state: EntityStateSchema.optional()
});
var RoleSchema = z.object({
  title: z.string(),
  seniority: z.string(),
  responsibilities: z.array(z.string()),
  requirements: z.array(RequirementSchema)
});
var KitSchema = z.object({
  source: KitSourceSchema,
  company_brief: CompanyBriefSchema,
  role: RoleSchema,
  questions: z.array(QuestionSchema),
  flashcards: z.array(FlashcardSchema),
  schedule: ScheduleSchema,
  coverage: CoverageSchema
});
var GenerationProgressSchema = z.object({
  status: KitStatusSchema,
  stage: GenerationStageSchema.optional(),
  stageIndex: z.number().int().nonnegative().optional(),
  totalStages: z.number().int().positive().optional(),
  percentage: z.number().min(0).max(100).optional(),
  completedStages: z.array(GenerationStageSchema).optional(),
  warnings: z.array(z.string()).optional(),
  error: z.string().optional(),
  startedAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional()
});
var CreateKitRequestSchema = z.object({
  jobDescription: z.string().min(10, "Job description must be at least 10 characters"),
  companyUrl: z.string().url("Must be a valid URL"),
  daysAvailable: z.number().int().min(1).max(365),
  companyName: z.string().optional(),
  role: z.string().optional(),
  location: z.string().optional()
});
var RegenerateRequestSchema = z.object({
  section: RegeneratableSectionSchema,
  category: QuestionCategorySchema.optional(),
  expectedVersion: z.number().int().nonnegative().optional()
});
var UpdateQuestionSchema = z.object({
  prompt: z.string().min(1).optional(),
  answer_outline: z.string().min(1).optional(),
  difficulty: DifficultySchema.optional(),
  category: QuestionCategorySchema.optional(),
  requirement_ids: z.array(z.string().min(1)).min(1).optional(),
  pinned: z.boolean().optional(),
  order: z.number().int().nonnegative().optional()
});
var CreateQuestionSchema = z.object({
  requirement_ids: z.array(z.string().min(1)).min(1),
  category: QuestionCategorySchema,
  prompt: z.string().min(1),
  answer_outline: z.string().min(1),
  difficulty: DifficultySchema
});
var UpdateFlashcardSchema = z.object({
  front: z.string().min(1).optional(),
  back: z.string().min(1).optional(),
  requirement_ids: z.array(z.string().min(1)).min(1).optional(),
  pinned: z.boolean().optional()
});
var CreateFlashcardSchema = z.object({
  front: z.string().min(1),
  back: z.string().min(1),
  requirement_ids: z.array(z.string().min(1)).min(1)
});
var UpdateCompanyBriefSchema = z.object({
  summary: z.string().min(1).optional(),
  what_they_do: z.string().min(1).optional()
});
var PracticeRecordSchema = z.object({
  flashcardId: z.string().min(1),
  confidence: ConfidenceSchema
});
var RegisterRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1).max(100)
});
var LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});
var BatchCaseSchema = z.object({
  id: z.string().min(1),
  jd: z.string().min(1),
  company_url: z.string().min(1),
  // Allow non-standard URLs in eval mode
  days: z.number().int().min(1).max(365)
});
var BatchInputSchema = z.array(BatchCaseSchema);
var BatchKitResultSchema = z.object({
  id: z.string(),
  status: z.enum(["ok", "failed"]),
  kit: KitSchema.nullable(),
  error: z.object({
    code: z.string(),
    message: z.string()
  }).nullable()
});
var BatchOutputSchema = z.object({
  version: z.literal("1.0"),
  generated_at: z.string().datetime(),
  kits: z.array(BatchKitResultSchema)
});

// src/errors/codes.ts
var ErrorCodes = {
  // Input validation
  INVALID_INPUT: "INVALID_INPUT",
  INVALID_URL: "INVALID_URL",
  // Auth
  UNAUTHENTICATED: "UNAUTHENTICATED",
  FORBIDDEN: "FORBIDDEN",
  USER_EXISTS: "USER_EXISTS",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  // Kit
  KIT_NOT_FOUND: "KIT_NOT_FOUND",
  KIT_NOT_READY: "KIT_NOT_READY",
  KIT_ALREADY_RUNNING: "KIT_ALREADY_RUNNING",
  KIT_VALIDATION_FAILED: "KIT_VALIDATION_FAILED",
  GENERATION_FAILED: "GENERATION_FAILED",
  CONCURRENT_UPDATE: "CONCURRENT_UPDATE",
  // Company / crawling
  COMPANY_URL_INVALID: "COMPANY_URL_INVALID",
  COMPANY_UNREACHABLE: "COMPANY_UNREACHABLE",
  COMPANY_TIMEOUT: "COMPANY_TIMEOUT",
  ROBOTS_DENIED: "ROBOTS_DENIED",
  CONTENT_TYPE_UNSUPPORTED: "CONTENT_TYPE_UNSUPPORTED",
  SSRF_BLOCKED: "SSRF_BLOCKED",
  REDIRECT_UNSAFE: "REDIRECT_UNSAFE",
  // LLM
  LLM_RATE_LIMITED: "LLM_RATE_LIMITED",
  LLM_INVALID_OUTPUT: "LLM_INVALID_OUTPUT",
  LLM_PROVIDER_ERROR: "LLM_PROVIDER_ERROR",
  // Question / flashcard
  QUESTION_NOT_FOUND: "QUESTION_NOT_FOUND",
  FLASHCARD_NOT_FOUND: "FLASHCARD_NOT_FOUND",
  // Generic
  INTERNAL_ERROR: "INTERNAL_ERROR",
  NOT_FOUND: "NOT_FOUND",
  RATE_LIMITED: "RATE_LIMITED"
};
export {
  BatchCaseSchema,
  BatchInputSchema,
  BatchKitResultSchema,
  BatchOutputSchema,
  CONFIDENCE_LEVELS,
  CRAWLER_CONCURRENCY,
  CRAWLER_MAX_RESPONSE_BYTES,
  CRAWLER_RATE_LIMIT_MS,
  CRAWLER_TIMEOUT_MS,
  CompanyBriefSchema,
  ConfidenceSchema,
  CoverageSchema,
  CreateFlashcardSchema,
  CreateKitRequestSchema,
  CreateQuestionSchema,
  DIFFICULTY_LEVELS,
  DifficultySchema,
  ENTITY_ORIGINS,
  EntityOriginSchema,
  EntityStateSchema,
  ErrorCodes,
  FlashcardSchema,
  GENERATION_STAGES,
  GenerationProgressSchema,
  GenerationStageSchema,
  KIT_STATUSES,
  KitSchema,
  KitSourceSchema,
  KitStatusSchema,
  LLM_MAX_RETRIES,
  LoginRequestSchema,
  MAX_COVERAGE_PASSES,
  MAX_CRAWLER_PAGES,
  MAX_LLM_CONCURRENCY,
  MAX_MINUTES_PER_DAY,
  MINUTES_PER_QUESTION,
  MIN_MINUTES_PER_DAY,
  PracticeRecordSchema,
  QUESTION_CATEGORIES,
  QuestionCategorySchema,
  QuestionSchema,
  RECENCY_DECAY_DAYS,
  REGENERATABLE_SECTIONS,
  REQUIREMENT_KINDS,
  REQUIREMENT_PRIORITIES,
  REQUIREMENT_PRIORITY_WEIGHT,
  RegeneratableSectionSchema,
  RegenerateRequestSchema,
  RegisterRequestSchema,
  RequirementKindSchema,
  RequirementPrioritySchema,
  RequirementSchema,
  RoleSchema,
  ScheduleDaySchema,
  ScheduleSchema,
  SourcePageSchema,
  UpdateCompanyBriefSchema,
  UpdateFlashcardSchema,
  UpdateQuestionSchema
};
