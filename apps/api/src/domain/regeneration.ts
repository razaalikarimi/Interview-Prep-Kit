import type { Question, Flashcard } from '@interview-prep/shared';
import { v4 as uuidv4 } from 'uuid';

// ============================================================
// REGENERATION MERGE
//
// When a section is regenerated, this module ensures:
// 1. Edited entities are preserved
// 2. Pinned entities are preserved
// 3. Only eligible (unedited, unpinned, generated) entities
//    are replaced/regenerated
// 4. IDs are preserved where appropriate
// 5. Only the requested section changes
// 6. Unrelated sections remain exactly as-is
//
// This is the core design requirement: users trust their edits
// to survive regeneration.
// ============================================================

export interface MergeResult<T> {
  merged: T[];
  preservedCount: number;
  regeneratedCount: number;
  addedCount: number;
}

/**
 * Merge newly regenerated questions with existing ones.
 *
 * Rules:
 * - Preserve entities where state.edited = true
 * - Preserve entities where state.pinned = true
 * - Replace eligible (generated, not edited, not pinned) entities
 *   with regenerated ones
 * - Add new entities that weren't previously present
 * - Never silently discard edited/pinned entities
 */
export function mergeQuestions(
  existing: Question[],
  regenerated: Question[],
  category?: string,
): MergeResult<Question> {
  // If category specified, only merge questions in that category
  // Questions in other categories stay untouched
  const inCategory = (q: Question) => !category || q.category === category;

  // Separate existing questions
  const inCategoryQuestions = existing.filter(inCategory);
  const outOfCategoryQuestions = existing.filter((q) => !inCategory(q));

  // From in-category existing: preserve edited/pinned
  const preserved = inCategoryQuestions.filter((q) => q.state?.edited || q.state?.pinned);
  const eligible = inCategoryQuestions.filter((q) => !q.state?.edited && !q.state?.pinned);

  // Take regenerated questions (with generated state)
  const newQuestions: Question[] = regenerated.map((q) => ({
    ...q,
    id: q.id || `q_${uuidv4().substring(0, 8)}`,
    state: {
      origin: 'generated' as const,
      edited: false,
      pinned: false,
      version: 1,
    },
  }));

  // Merge: preserved first (maintain their positions), then new
  const merged = [...outOfCategoryQuestions, ...preserved, ...newQuestions];

  return {
    merged,
    preservedCount: preserved.length,
    regeneratedCount: eligible.length,
    addedCount: newQuestions.length,
  };
}

/**
 * Merge newly regenerated flashcards with existing ones.
 */
export function mergeFlashcards(
  existing: Flashcard[],
  regenerated: Flashcard[],
): MergeResult<Flashcard> {
  // Preserve edited/pinned flashcards
  const preserved = existing.filter((f) => f.state?.edited || f.state?.pinned);
  const eligible = existing.filter((f) => !f.state?.edited && !f.state?.pinned);

  const newFlashcards: Flashcard[] = regenerated.map((f) => ({
    ...f,
    id: f.id || `f_${uuidv4().substring(0, 8)}`,
    state: {
      origin: 'generated' as const,
      edited: false,
      pinned: false,
      version: 1,
    },
  }));

  return {
    merged: [...preserved, ...newFlashcards],
    preservedCount: preserved.length,
    regeneratedCount: eligible.length,
    addedCount: newFlashcards.length,
  };
}

export type QuestionUpdates = {
  [K in keyof Omit<Question, 'id' | 'state'>]?: Omit<Question, 'id' | 'state'>[K] | undefined;
};

export type FlashcardUpdates = {
  [K in keyof Omit<Flashcard, 'id' | 'state'>]?: Omit<Flashcard, 'id' | 'state'>[K] | undefined;
};

/**
 * Apply an edit to a question, marking it as edited.
 * Increments version for optimistic concurrency.
 */
export function applyQuestionEdit(
  question: Question,
  updates: QuestionUpdates,
): Question {
  const cleaned = Object.fromEntries(
    Object.entries(updates).filter(([_, v]) => v !== undefined),
  );
  return {
    ...question,
    ...cleaned,
    state: {
      origin: question.state?.origin ?? 'generated',
      edited: true,
      pinned: question.state?.pinned ?? false,
      version: (question.state?.version ?? 0) + 1,
      editedAt: new Date().toISOString(),
    },
  };
}

/**
 * Apply an edit to a flashcard, marking it as edited.
 */
export function applyFlashcardEdit(
  flashcard: Flashcard,
  updates: FlashcardUpdates,
): Flashcard {
  const cleaned = Object.fromEntries(
    Object.entries(updates).filter(([_, v]) => v !== undefined),
  );
  return {
    ...flashcard,
    ...cleaned,
    state: {
      origin: flashcard.state?.origin ?? 'generated',
      edited: true,
      pinned: flashcard.state?.pinned ?? false,
      version: (flashcard.state?.version ?? 0) + 1,
      editedAt: new Date().toISOString(),
    },
  };
}

/**
 * Pin or unpin a question.
 */
export function setQuestionPinned(question: Question, pinned: boolean): Question {
  return {
    ...question,
    state: {
      origin: question.state?.origin ?? 'generated',
      edited: question.state?.edited ?? false,
      pinned,
      version: question.state?.version ?? 1,
      ...(question.state?.editedAt ? { editedAt: question.state.editedAt } : {}),
    },
  };
}

