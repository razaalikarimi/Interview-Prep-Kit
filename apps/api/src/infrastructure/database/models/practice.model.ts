import { Schema, model, Document, Types } from 'mongoose';

// ============================================================
// PRACTICE PROGRESS MODEL
// Records flashcard practice sessions per user/kit.
// Used for weakness calculation and weak-first ordering.
// ============================================================

export interface IPracticeRecord {
  flashcardId: string;
  confidence: 1 | 2 | 3 | 4 | 5;
  practicedAt: Date;
}

export interface IPracticeProgress extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  kitId: Types.ObjectId;
  records: IPracticeRecord[];
  createdAt: Date;
  updatedAt: Date;
}

const practiceRecordSchema = new Schema<IPracticeRecord>(
  {
    flashcardId: { type: String, required: true },
    confidence: { type: Number, enum: [1, 2, 3, 4, 5], required: true },
    practicedAt: { type: Date, required: true },
  },
  { _id: false },
);

const practiceProgressSchema = new Schema<IPracticeProgress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    kitId: { type: Schema.Types.ObjectId, ref: 'Kit', required: true },
    records: [practiceRecordSchema],
  },
  { timestamps: true },
);

practiceProgressSchema.index({ userId: 1, kitId: 1 }, { unique: true });

export const PracticeProgress = model<IPracticeProgress>(
  'PracticeProgress',
  practiceProgressSchema,
);
