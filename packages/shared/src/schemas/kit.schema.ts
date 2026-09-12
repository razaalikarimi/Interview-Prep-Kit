import { z } from 'zod';
import {
  REQUIREMENT_KINDS,
  REQUIREMENT_PRIORITIES,
  QUESTION_CATEGORIES,
  DIFFICULTY_LEVELS,
  CONFIDENCE_LEVELS,
  KIT_STATUSES,
  GENERATION_STAGES,
  ENTITY_ORIGINS,
  REGENERATABLE_SECTIONS,
} from '../constants/index.js';

// ============================================================
// PRIMITIVE SCHEMAS
// ============================================================

export const RequirementKindSchema = z.enum(REQUIREMENT_KINDS);
export const RequirementPrioritySchema = z.enum(REQUIREMENT_PRIORITIES);
export const QuestionCategorySchema = z.enum(QUESTION_CATEGORIES);
export const DifficultySchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);
export const ConfidenceSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);
export const KitStatusSchema = z.enum(KIT_STATUSES);
export const GenerationStageSchema = z.enum(GENERATION_STAGES);
export const EntityOriginSchema = z.enum(ENTITY_ORIGINS);
export const RegeneratableSectionSchema = z.enum(REGENERATABLE_SECTIONS);

// ============================================================
// ENTITY STATE MODEL
// This is the "edited/pinned/generated" tracking state
// attached to every user-editable entity.
// ============================================================

export const EntityStateSchema = z.object({
  origin: EntityOriginSchema,
  edited: z.boolean(),
  pinned: z.boolean(),
  version: z.number().int().nonnegative(),
  editedAt: z.string().datetime().optional(),
});

export type EntityState = z.infer<typeof EntityStateSchema>;

// ============================================================
// KIT DOMAIN SCHEMAS (matches the exact spec structure)
// ============================================================

export const RequirementSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  kind: RequirementKindSchema,
  priority: RequirementPrioritySchema,
  state: EntityStateSchema.optional(),
});

export type Requirement = z.infer<typeof RequirementSchema>;

export const QuestionSchema = z.object({
  id: z.string().min(1),
  requirement_ids: z.array(z.string().min(1)).min(1),
  category: QuestionCategorySchema,
  prompt: z.string().min(1),
  answer_outline: z.string().min(1),
  difficulty: DifficultySchema,
  state: EntityStateSchema.optional(),
});

export type Question = z.infer<typeof QuestionSchema>;

export const FlashcardSchema = z.object({
  id: z.string().min(1),
  front: z.string().min(1),
  back: z.string().min(1),
  requirement_ids: z.array(z.string().min(1)).min(1),
  state: EntityStateSchema.optional(),
});

export type Flashcard = z.infer<typeof FlashcardSchema>;

export const ScheduleDaySchema = z.object({
  day: z.number().int().positive(),
  focus: z.string(),
  question_ids: z.array(z.string()),
  minutes: z.number().int().nonnegative(),
});

export type ScheduleDay = z.infer<typeof ScheduleDaySchema>;

export const ScheduleSchema = z.object({
  days_available: z.number().int().positive(),
  days: z.array(ScheduleDaySchema),
});

export type Schedule = z.infer<typeof ScheduleSchema>;

export const CoverageSchema = z.object({
  uncovered_requirement_ids: z.array(z.string()),
  passes: z.number().int().nonnegative(),
});

export type Coverage = z.infer<typeof CoverageSchema>;

export const SourcePageSchema = z.object({
  url: z.string().url(),
  title: z.string().optional(),
  relevanceScore: z.number().optional(),
});

export type SourcePage = z.infer<typeof SourcePageSchema>;

export const KitSourceSchema = z.object({
  company: z.string(),
  company_url: z.string(),
  role: z.string(),
  location: z.string(),
  jd_chars: z.number().int().nonnegative(),
  researched_at: z.string(),
  pages_used: z.array(SourcePageSchema),
});

export type KitSource = z.infer<typeof KitSourceSchema>;

export const CompanyBriefSchema = z.object({
  summary: z.string(),
  what_they_do: z.string(),
  sources: z.array(z.string()),
  state: EntityStateSchema.optional(),
});

export type CompanyBrief = z.infer<typeof CompanyBriefSchema>;

export const RoleSchema = z.object({
  title: z.string(),
  seniority: z.string(),
  responsibilities: z.array(z.string()),
  requirements: z.array(RequirementSchema),
});

export type Role = z.infer<typeof RoleSchema>;

// ============================================================
// FULL KIT SCHEMA (exact field names from spec)
// ============================================================

export const KitSchema = z.object({
  source: KitSourceSchema,
  company_brief: CompanyBriefSchema,
  role: RoleSchema,
  questions: z.array(QuestionSchema),
  flashcards: z.array(FlashcardSchema),
  schedule: ScheduleSchema,
  coverage: CoverageSchema,
});

export type Kit = z.infer<typeof KitSchema>;

// ============================================================
// GENERATION PROGRESS
// ============================================================

export const GenerationProgressSchema = z.object({
  status: KitStatusSchema,
  stage: GenerationStageSchema.optional(),
  stageIndex: z.number().int().nonnegative().optional(),
  totalStages: z.number().int().positive().optional(),
  percentage: z.number().min(0).max(100).optional(),
  completedStages: z.array(GenerationStageSchema).optional(),
  warnings: z.array(z.string()).optional(),
  error: z.string().optional(),
  startedAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type GenerationProgress = z.infer<typeof GenerationProgressSchema>;

// ============================================================
// API REQUEST SCHEMAS
// ============================================================

export const CreateKitRequestSchema = z.object({
  jobDescription: z.string().min(10, 'Job description must be at least 10 characters'),
  companyUrl: z.string().url('Must be a valid URL'),
  daysAvailable: z.number().int().min(1).max(365),
  companyName: z.string().optional(),
  role: z.string().optional(),
  location: z.string().optional(),
});

export type CreateKitRequest = z.infer<typeof CreateKitRequestSchema>;

export const RegenerateRequestSchema = z.object({
  section: RegeneratableSectionSchema,
  category: QuestionCategorySchema.optional(),
  expectedVersion: z.number().int().nonnegative().optional(),
});

export type RegenerateRequest = z.infer<typeof RegenerateRequestSchema>;

export const UpdateQuestionSchema = z.object({
  prompt: z.string().min(1).optional(),
  answer_outline: z.string().min(1).optional(),
  difficulty: DifficultySchema.optional(),
  category: QuestionCategorySchema.optional(),
  requirement_ids: z.array(z.string().min(1)).min(1).optional(),
  pinned: z.boolean().optional(),
  order: z.number().int().nonnegative().optional(),
});

export type UpdateQuestion = z.infer<typeof UpdateQuestionSchema>;

export const CreateQuestionSchema = z.object({
  requirement_ids: z.array(z.string().min(1)).min(1),
  category: QuestionCategorySchema,
  prompt: z.string().min(1),
  answer_outline: z.string().min(1),
  difficulty: DifficultySchema,
});

export type CreateQuestion = z.infer<typeof CreateQuestionSchema>;

export const UpdateFlashcardSchema = z.object({
  front: z.string().min(1).optional(),
  back: z.string().min(1).optional(),
  requirement_ids: z.array(z.string().min(1)).min(1).optional(),
  pinned: z.boolean().optional(),
});

export type UpdateFlashcard = z.infer<typeof UpdateFlashcardSchema>;

export const CreateFlashcardSchema = z.object({
  front: z.string().min(1),
  back: z.string().min(1),
  requirement_ids: z.array(z.string().min(1)).min(1),
});

export type CreateFlashcard = z.infer<typeof CreateFlashcardSchema>;

export const UpdateCompanyBriefSchema = z.object({
  summary: z.string().min(1).optional(),
  what_they_do: z.string().min(1).optional(),
});

export type UpdateCompanyBrief = z.infer<typeof UpdateCompanyBriefSchema>;

export const PracticeRecordSchema = z.object({
  flashcardId: z.string().min(1),
  confidence: ConfidenceSchema,
});

export type PracticeRecord = z.infer<typeof PracticeRecordSchema>;

export const RegisterRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1).max(100),
});

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

// ============================================================
// BATCH EVALUATOR SCHEMAS
// ============================================================

export const BatchCaseSchema = z.object({
  id: z.string().min(1),
  jd: z.string().min(1),
  company_url: z.string().min(1), // Allow non-standard URLs in eval mode
  days: z.number().int().min(1).max(365),
});

export type BatchCase = z.infer<typeof BatchCaseSchema>;

export const BatchInputSchema = z.array(BatchCaseSchema);
export type BatchInput = z.infer<typeof BatchInputSchema>;

export const BatchKitResultSchema = z.object({
  id: z.string(),
  status: z.enum(['ok', 'failed']),
  kit: KitSchema.nullable(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
    })
    .nullable(),
});

export type BatchKitResult = z.infer<typeof BatchKitResultSchema>;

export const BatchOutputSchema = z.object({
  version: z.literal('1.0'),
  generated_at: z.string().datetime(),
  kits: z.array(BatchKitResultSchema),
});

export type BatchOutput = z.infer<typeof BatchOutputSchema>;

// ============================================================
// API RESPONSE SHAPES
// ============================================================

export interface ApiResponse<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResult<T> = ApiResponse<T> | ApiError;

export interface UserPublic {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface KitListItem {
  id: string;
  company: string;
  role: string;
  status: string;
  daysAvailable: number;
  createdAt: string;
  updatedAt: string;
  progress?: GenerationProgress;
}

export interface KitDetail extends KitListItem {
  kit: Kit;
  version: number;
}

export interface PracticeSession {
  flashcardId: string;
  confidence: number;
  practicedAt: string;
}

export interface FlashcardWithProgress extends Flashcard {
  lastConfidence?: number;
  lastPracticedAt?: string;
  practiceCount: number;
  priorityScore: number;
}

export interface WeaknessRadarItem {
  requirementId: string;
  requirementText: string;
  kind: string;
  priority: string;
  questionCount: number;
  coveredByQuestions: boolean;
  flashcardCount: number;
  averageConfidence: number | null;
  lastPracticedAt: string | null;
  priorityScore: number;
  status: 'strong' | 'good' | 'needs-work' | 'critical' | 'unpracticed';
  recommendedAction: string;
}

export interface WeaknessRadar {
  items: WeaknessRadarItem[];
  overallReadiness: number; // 0–100
  criticalCount: number;
  strongCount: number;
  recommendations: string[];
}
