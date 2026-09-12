import mongoose, { Schema, model, Document, Types, Model } from 'mongoose';
import type {
  Kit,
  GenerationProgress,
  KitStatus,
} from '@interview-prep/shared';


// ============================================================
// KIT MODEL
// Stores the full kit document plus generation metadata.
// The `kit` field matches the exact spec structure.
// ============================================================

export interface IKit extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  fingerprint: string; // hash(normalizedJD + normalizedUrl) for dedup
  generationStatus: KitStatus;
  generationProgress: GenerationProgress;
  kit: Kit | null; // null while generating
  version: number; // optimistic concurrency control
  createdAt: Date;
  updatedAt: Date;
}

// Subdocument schemas (mirrors shared Zod schemas)
const entityStateSchema = new Schema(
  {
    origin: { type: String, enum: ['generated', 'user-added'], default: 'generated' },
    edited: { type: Boolean, default: false },
    pinned: { type: Boolean, default: false },
    version: { type: Number, default: 1 },
    editedAt: { type: String },
  },
  { _id: false },
);

const requirementSchema = new Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    kind: { type: String, enum: ['technical', 'behavioural', 'domain'], required: true },
    priority: { type: String, enum: ['must', 'nice'], required: true },
    state: entityStateSchema,
  },
  { _id: false },
);

const questionSchema = new Schema(
  {
    id: { type: String, required: true },
    requirement_ids: [{ type: String }],
    category: {
      type: String,
      enum: ['technical', 'behavioural', 'system-design', 'company-fit'],
      required: true,
    },
    prompt: { type: String, required: true },
    answer_outline: { type: String, required: true },
    difficulty: { type: Number, enum: [1, 2, 3], required: true },
    state: entityStateSchema,
  },
  { _id: false },
);

const flashcardSchema = new Schema(
  {
    id: { type: String, required: true },
    front: { type: String, required: true },
    back: { type: String, required: true },
    requirement_ids: [{ type: String }],
    state: entityStateSchema,
  },
  { _id: false },
);

const scheduleDaySchema = new Schema(
  {
    day: { type: Number, required: true },
    focus: { type: String, required: true },
    question_ids: [{ type: String }],
    minutes: { type: Number, required: true },
  },
  { _id: false },
);

const kitDataSchema = new Schema(
  {
    source: {
      company: String,
      company_url: String,
      role: String,
      location: String,
      jd_chars: Number,
      researched_at: String,
      pages_used: [{ url: String, title: String, relevanceScore: Number }],
    },
    company_brief: {
      summary: String,
      what_they_do: String,
      sources: [String],
      state: entityStateSchema,
    },
    role: {
      title: String,
      seniority: String,
      responsibilities: [String],
      requirements: [requirementSchema],
    },
    questions: [questionSchema],
    flashcards: [flashcardSchema],
    schedule: {
      days_available: Number,
      days: [scheduleDaySchema],
    },
    coverage: {
      uncovered_requirement_ids: [String],
      passes: Number,
    },
  },
  { _id: false },
);

const generationProgressSchema = new Schema(
  {
    status: {
      type: String,
      enum: ['queued', 'running', 'completed', 'partial', 'failed'],
    },
    stage: { type: String },
    stageIndex: { type: Number },
    totalStages: { type: Number },
    percentage: { type: Number },
    completedStages: [{ type: String }],
    warnings: [{ type: String }],
    error: { type: String },
    startedAt: { type: String },
    updatedAt: { type: String },
  },
  { _id: false },
);

const kitSchema = new Schema<IKit>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    fingerprint: { type: String, required: true, index: true },
    generationStatus: {
      type: String,
      enum: ['queued', 'running', 'completed', 'partial', 'failed'],
      default: 'queued',
    },
    generationProgress: { type: generationProgressSchema, default: {} },
    kit: { type: kitDataSchema, default: null },
    version: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  },
);

// Compound index for user + fingerprint dedup
kitSchema.index({ userId: 1, fingerprint: 1 });
kitSchema.index({ userId: 1, createdAt: -1 });

export const KitModel: Model<IKit> =
  (mongoose.models['Kit'] as Model<IKit>) || model<IKit>('Kit', kitSchema);
