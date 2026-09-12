import { Schema, model, Document, Types } from 'mongoose';

// ============================================================
// USER MODEL
// ============================================================

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        // Never expose passwordHash
        delete ret['passwordHash'];
        return ret;
      },

    },
  },
);

export const User = model<IUser>('User', userSchema);
