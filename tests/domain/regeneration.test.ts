import { describe, it, expect } from 'vitest';
import {
  mergeQuestions,
  mergeFlashcards,
  applyQuestionEdit,
  setQuestionPinned,
} from '../../apps/api/src/domain/regeneration.js';
import type { Question, Flashcard } from '@interview-prep/shared';

function makeQ(
  id: string,
  category: Question['category'] = 'technical',
  state?: Partial<Question['state']>,
): Question {
  return {
    id,
    requirement_ids: ['r1'],
    category,
    prompt: `Q ${id}`,
    answer_outline: `A ${id}`,
    difficulty: 2,
    state: {
      origin: 'generated',
      edited: false,
      pinned: false,
      version: 1,
      ...state,
    },
  };
}

function makeF(id: string, state?: Partial<Flashcard['state']>): Flashcard {
  return {
    id,
    front: `F ${id}`,
    back: `B ${id}`,
    requirement_ids: ['r1'],
    state: {
      origin: 'generated',
      edited: false,
      pinned: false,
      version: 1,
      ...state,
    },
  };
}

describe('Regeneration Merge', () => {
  it('edited question survives category regeneration', () => {
    const existing = [
      makeQ('q1', 'technical', { edited: true }), // edited
      makeQ('q2', 'technical'),                   // not edited
      makeQ('q3', 'behavioural'),                 // different category
    ];
    const regenerated = [makeQ('q_new1', 'technical'), makeQ('q_new2', 'technical')];

    const { merged, preservedCount } = mergeQuestions(existing, regenerated, 'technical');

    // q1 (edited) MUST survive
    const survivedIds = merged.map(q => q.id);
    expect(survivedIds).toContain('q1');
    expect(preservedCount).toBe(1);
  });

  it('pinned question survives regeneration', () => {
    const existing = [
      makeQ('q1', 'technical', { pinned: true }),
      makeQ('q2', 'technical'),
    ];
    const regenerated = [makeQ('q_new', 'technical')];

    const { merged, preservedCount } = mergeQuestions(existing, regenerated, 'technical');

    expect(merged.map(q => q.id)).toContain('q1');
    expect(preservedCount).toBe(1);
  });

  it('unrelated category remains completely unchanged', () => {
    const behavioural = makeQ('q_b1', 'behavioural');
    const existing = [makeQ('q1', 'technical'), behavioural];
    const regenerated = [makeQ('q_new', 'technical')];

    const { merged } = mergeQuestions(existing, regenerated, 'technical');

    // Behavioural question must survive unchanged
    const foundBehavioural = merged.find(q => q.id === 'q_b1');
    expect(foundBehavioural).toBeDefined();
    expect(foundBehavioural?.category).toBe('behavioural');
  });

  it('edited flashcard survives flashcard regeneration', () => {
    const existing = [
      makeF('f1', { edited: true }),
      makeF('f2'),
    ];
    const regenerated = [makeF('f_new')];

    const { merged, preservedCount } = mergeFlashcards(existing, regenerated);

    expect(merged.map(f => f.id)).toContain('f1');
    expect(preservedCount).toBe(1);
  });

  it('applying an edit marks the question as edited', () => {
    const question = makeQ('q1');
    expect(question.state?.edited).toBe(false);

    const edited = applyQuestionEdit(question, { prompt: 'Updated prompt' });

    expect(edited.state?.edited).toBe(true);
    expect(edited.prompt).toBe('Updated prompt');
    expect(edited.state?.version).toBeGreaterThan(question.state?.version ?? 0);
  });

  it('setting pinned does not change edited status', () => {
    const question = makeQ('q1', 'technical', { edited: true });
    const pinned = setQuestionPinned(question, true);

    expect(pinned.state?.pinned).toBe(true);
    expect(pinned.state?.edited).toBe(true); // Still edited
  });

  it('regenerated section replaces non-edited non-pinned questions', () => {
    const existing = [makeQ('q1', 'technical'), makeQ('q2', 'technical')]; // both eligible
    const regenerated = [makeQ('q_new1', 'technical'), makeQ('q_new2', 'technical')];

    const { merged } = mergeQuestions(existing, regenerated, 'technical');

    // Old eligible questions should be replaced
    expect(merged.map(q => q.id)).not.toContain('q1');
    expect(merged.map(q => q.id)).not.toContain('q2');
    expect(merged.map(q => q.id)).toContain('q_new1');
    expect(merged.map(q => q.id)).toContain('q_new2');
  });
});
