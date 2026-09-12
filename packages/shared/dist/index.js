"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  BatchCaseSchema: () => BatchCaseSchema,
  BatchInputSchema: () => BatchInputSchema,
  BatchKitResultSchema: () => BatchKitResultSchema,
  BatchOutputSchema: () => BatchOutputSchema,
  CONFIDENCE_LEVELS: () => CONFIDENCE_LEVELS,
  CRAWLER_CONCURRENCY: () => CRAWLER_CONCURRENCY,
  CRAWLER_MAX_RESPONSE_BYTES: () => CRAWLER_MAX_RESPONSE_BYTES,
  CRAWLER_RATE_LIMIT_MS: () => CRAWLER_RATE_LIMIT_MS,
  CRAWLER_TIMEOUT_MS: () => CRAWLER_TIMEOUT_MS,
  CompanyBriefSchema: () => CompanyBriefSchema,
  ConfidenceSchema: () => ConfidenceSchema,
  CoverageSchema: () => CoverageSchema,
  CreateFlashcardSchema: () => CreateFlashcardSchema,
  CreateKitRequestSchema: () => CreateKitRequestSchema,
  CreateQuestionSchema: () => CreateQuestionSchema,
  DIFFICULTY_LEVELS: () => DIFFICULTY_LEVELS,
  DifficultySchema: () => DifficultySchema,
  ENTITY_ORIGINS: () => ENTITY_ORIGINS,
  EntityOriginSchema: () => EntityOriginSchema,
  EntityStateSchema: () => EntityStateSchema,
  ErrorCodes: () => ErrorCodes,
  FlashcardSchema: () => FlashcardSchema,
  GENERATION_STAGES: () => GENERATION_STAGES,
  GenerationProgressSchema: () => GenerationProgressSchema,
  GenerationStageSchema: () => GenerationStageSchema,
  KIT_STATUSES: () => KIT_STATUSES,
  KitSchema: () => KitSchema,
  KitSourceSchema: () => KitSourceSchema,
  KitStatusSchema: () => KitStatusSchema,
  LLM_MAX_RETRIES: () => LLM_MAX_RETRIES,
  LoginRequestSchema: () => LoginRequestSchema,
  MAX_COVERAGE_PASSES: () => MAX_COVERAGE_PASSES,
  MAX_CRAWLER_PAGES: () => MAX_CRAWLER_PAGES,
  MAX_LLM_CONCURRENCY: () => MAX_LLM_CONCURRENCY,
  MAX_MINUTES_PER_DAY: () => MAX_MINUTES_PER_DAY,
  MINUTES_PER_QUESTION: () => MINUTES_PER_QUESTION,
  MIN_MINUTES_PER_DAY: () => MIN_MINUTES_PER_DAY,
  PracticeRecordSchema: () => PracticeRecordSchema,
  QUESTION_CATEGORIES: () => QUESTION_CATEGORIES,
  QuestionCategorySchema: () => QuestionCategorySchema,
  QuestionSchema: () => QuestionSchema,
  RECENCY_DECAY_DAYS: () => RECENCY_DECAY_DAYS,
  REGENERATABLE_SECTIONS: () => REGENERATABLE_SECTIONS,
  REQUIREMENT_KINDS: () => REQUIREMENT_KINDS,
  REQUIREMENT_PRIORITIES: () => REQUIREMENT_PRIORITIES,
  REQUIREMENT_PRIORITY_WEIGHT: () => REQUIREMENT_PRIORITY_WEIGHT,
  RegeneratableSectionSchema: () => RegeneratableSectionSchema,
  RegenerateRequestSchema: () => RegenerateRequestSchema,
  RegisterRequestSchema: () => RegisterRequestSchema,
  RequirementKindSchema: () => RequirementKindSchema,
  RequirementPrioritySchema: () => RequirementPrioritySchema,
  RequirementSchema: () => RequirementSchema,
  RoleSchema: () => RoleSchema,
  ScheduleDaySchema: () => ScheduleDaySchema,
  ScheduleSchema: () => ScheduleSchema,
  SourcePageSchema: () => SourcePageSchema,
  UpdateCompanyBriefSchema: () => UpdateCompanyBriefSchema,
  UpdateFlashcardSchema: () => UpdateFlashcardSchema,
  UpdateQuestionSchema: () => UpdateQuestionSchema
});
module.exports = __toCommonJS(index_exports);

// src/schemas/kit.schema.ts
var import_zod = require("zod");

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
var RequirementKindSchema = import_zod.z.enum(REQUIREMENT_KINDS);
var RequirementPrioritySchema = import_zod.z.enum(REQUIREMENT_PRIORITIES);
var QuestionCategorySchema = import_zod.z.enum(QUESTION_CATEGORIES);
var DifficultySchema = import_zod.z.union([import_zod.z.literal(1), import_zod.z.literal(2), import_zod.z.literal(3)]);
var ConfidenceSchema = import_zod.z.union([
  import_zod.z.literal(1),
  import_zod.z.literal(2),
  import_zod.z.literal(3),
  import_zod.z.literal(4),
  import_zod.z.literal(5)
]);
var KitStatusSchema = import_zod.z.enum(KIT_STATUSES);
var GenerationStageSchema = import_zod.z.enum(GENERATION_STAGES);
var EntityOriginSchema = import_zod.z.enum(ENTITY_ORIGINS);
var RegeneratableSectionSchema = import_zod.z.enum(REGENERATABLE_SECTIONS);
var EntityStateSchema = import_zod.z.object({
  origin: EntityOriginSchema,
  edited: import_zod.z.boolean(),
  pinned: import_zod.z.boolean(),
  version: import_zod.z.number().int().nonnegative(),
  editedAt: import_zod.z.string().datetime().optional()
});
var RequirementSchema = import_zod.z.object({
  id: import_zod.z.string().min(1),
  text: import_zod.z.string().min(1),
  kind: RequirementKindSchema,
  priority: RequirementPrioritySchema,
  state: EntityStateSchema.optional()
});
var QuestionSchema = import_zod.z.object({
  id: import_zod.z.string().min(1),
  requirement_ids: import_zod.z.array(import_zod.z.string().min(1)).min(1),
  category: QuestionCategorySchema,
  prompt: import_zod.z.string().min(1),
  answer_outline: import_zod.z.string().min(1),
  difficulty: DifficultySchema,
  state: EntityStateSchema.optional()
});
var FlashcardSchema = import_zod.z.object({
  id: import_zod.z.string().min(1),
  front: import_zod.z.string().min(1),
  back: import_zod.z.string().min(1),
  requirement_ids: import_zod.z.array(import_zod.z.string().min(1)).min(1),
  state: EntityStateSchema.optional()
});
var ScheduleDaySchema = import_zod.z.object({
  day: import_zod.z.number().int().positive(),
  focus: import_zod.z.string(),
  question_ids: import_zod.z.array(import_zod.z.string()),
  minutes: import_zod.z.number().int().nonnegative()
});
var ScheduleSchema = import_zod.z.object({
  days_available: import_zod.z.number().int().positive(),
  days: import_zod.z.array(ScheduleDaySchema)
});
var CoverageSchema = import_zod.z.object({
  uncovered_requirement_ids: import_zod.z.array(import_zod.z.string()),
  passes: import_zod.z.number().int().nonnegative()
});
var SourcePageSchema = import_zod.z.object({
  url: import_zod.z.string().url(),
  title: import_zod.z.string().optional(),
  relevanceScore: import_zod.z.number().optional()
});
var KitSourceSchema = import_zod.z.object({
  company: import_zod.z.string(),
  company_url: import_zod.z.string(),
  role: import_zod.z.string(),
  location: import_zod.z.string(),
  jd_chars: import_zod.z.number().int().nonnegative(),
  researched_at: import_zod.z.string(),
  pages_used: import_zod.z.array(SourcePageSchema)
});
var CompanyBriefSchema = import_zod.z.object({
  summary: import_zod.z.string(),
  what_they_do: import_zod.z.string(),
  sources: import_zod.z.array(import_zod.z.string()),
  state: EntityStateSchema.optional()
});
var RoleSchema = import_zod.z.object({
  title: import_zod.z.string(),
  seniority: import_zod.z.string(),
  responsibilities: import_zod.z.array(import_zod.z.string()),
  requirements: import_zod.z.array(RequirementSchema)
});
var KitSchema = import_zod.z.object({
  source: KitSourceSchema,
  company_brief: CompanyBriefSchema,
  role: RoleSchema,
  questions: import_zod.z.array(QuestionSchema),
  flashcards: import_zod.z.array(FlashcardSchema),
  schedule: ScheduleSchema,
  coverage: CoverageSchema
});
var GenerationProgressSchema = import_zod.z.object({
  status: KitStatusSchema,
  stage: GenerationStageSchema.optional(),
  stageIndex: import_zod.z.number().int().nonnegative().optional(),
  totalStages: import_zod.z.number().int().positive().optional(),
  percentage: import_zod.z.number().min(0).max(100).optional(),
  completedStages: import_zod.z.array(GenerationStageSchema).optional(),
  warnings: import_zod.z.array(import_zod.z.string()).optional(),
  error: import_zod.z.string().optional(),
  startedAt: import_zod.z.string().datetime().optional(),
  updatedAt: import_zod.z.string().datetime().optional()
});
var CreateKitRequestSchema = import_zod.z.object({
  jobDescription: import_zod.z.string().min(10, "Job description must be at least 10 characters"),
  companyUrl: import_zod.z.string().url("Must be a valid URL"),
  daysAvailable: import_zod.z.number().int().min(1).max(365),
  companyName: import_zod.z.string().optional(),
  role: import_zod.z.string().optional(),
  location: import_zod.z.string().optional()
});
var RegenerateRequestSchema = import_zod.z.object({
  section: RegeneratableSectionSchema,
  category: QuestionCategorySchema.optional(),
  expectedVersion: import_zod.z.number().int().nonnegative().optional()
});
var UpdateQuestionSchema = import_zod.z.object({
  prompt: import_zod.z.string().min(1).optional(),
  answer_outline: import_zod.z.string().min(1).optional(),
  difficulty: DifficultySchema.optional(),
  category: QuestionCategorySchema.optional(),
  requirement_ids: import_zod.z.array(import_zod.z.string().min(1)).min(1).optional(),
  pinned: import_zod.z.boolean().optional(),
  order: import_zod.z.number().int().nonnegative().optional()
});
var CreateQuestionSchema = import_zod.z.object({
  requirement_ids: import_zod.z.array(import_zod.z.string().min(1)).min(1),
  category: QuestionCategorySchema,
  prompt: import_zod.z.string().min(1),
  answer_outline: import_zod.z.string().min(1),
  difficulty: DifficultySchema
});
var UpdateFlashcardSchema = import_zod.z.object({
  front: import_zod.z.string().min(1).optional(),
  back: import_zod.z.string().min(1).optional(),
  requirement_ids: import_zod.z.array(import_zod.z.string().min(1)).min(1).optional(),
  pinned: import_zod.z.boolean().optional()
});
var CreateFlashcardSchema = import_zod.z.object({
  front: import_zod.z.string().min(1),
  back: import_zod.z.string().min(1),
  requirement_ids: import_zod.z.array(import_zod.z.string().min(1)).min(1)
});
var UpdateCompanyBriefSchema = import_zod.z.object({
  summary: import_zod.z.string().min(1).optional(),
  what_they_do: import_zod.z.string().min(1).optional()
});
var PracticeRecordSchema = import_zod.z.object({
  flashcardId: import_zod.z.string().min(1),
  confidence: ConfidenceSchema
});
var RegisterRequestSchema = import_zod.z.object({
  email: import_zod.z.string().email(),
  password: import_zod.z.string().min(8, "Password must be at least 8 characters"),
  name: import_zod.z.string().min(1).max(100)
});
var LoginRequestSchema = import_zod.z.object({
  email: import_zod.z.string().email(),
  password: import_zod.z.string().min(1)
});
var BatchCaseSchema = import_zod.z.object({
  id: import_zod.z.string().min(1),
  jd: import_zod.z.string().min(1),
  company_url: import_zod.z.string().min(1),
  // Allow non-standard URLs in eval mode
  days: import_zod.z.number().int().min(1).max(365)
});
var BatchInputSchema = import_zod.z.array(BatchCaseSchema);
var BatchKitResultSchema = import_zod.z.object({
  id: import_zod.z.string(),
  status: import_zod.z.enum(["ok", "failed"]),
  kit: KitSchema.nullable(),
  error: import_zod.z.object({
    code: import_zod.z.string(),
    message: import_zod.z.string()
  }).nullable()
});
var BatchOutputSchema = import_zod.z.object({
  version: import_zod.z.literal("1.0"),
  generated_at: import_zod.z.string().datetime(),
  kits: import_zod.z.array(BatchKitResultSchema)
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
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
});
