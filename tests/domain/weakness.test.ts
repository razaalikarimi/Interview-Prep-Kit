import { describe, it, expect } from 'vitest';
import {
  computeWeaknessRadar,
  computeFlashcardPriority,
} from '../../apps/api/src/domain/weakness.js';
import type { Requirement, Question, Flashcard } from '@interview-prep/shared';
import type { IPracticeRecord } from '../../apps/api/src/infrastructure/database/models/practice.model.js';
import { Types } from 'mongoose';

describe('Weakness Radar & Practice Prioritization', () => {
  const reqMust: Requirement = {
    id: 'req-1',
    text: 'Proficiency in TypeScript & Node.js',
    kind: 'technical',
    priority: 'must',
  };

  const reqNice: Requirement = {
    id: 'req-2',
    text: 'Experience with Kubernetes',
    kind: 'technical',
    priority: 'nice',
  };

  const question1: Question = {
    id: 'q-1',
    requirement_ids: ['req-1'],
    category: 'technical',
    prompt: 'Explain TypeScript generics.',
    answer_outline: 'Type variables, constraints, inference',
    difficulty: 2,
  };

  const flashcard1: Flashcard = {
    id: 'f-1',
    requirement_ids: ['req-1'],
    front: 'What are mapped types?',
    back: 'Transform existing types by iterating through keys',
  };

  const flashcard2: Flashcard = {
    id: 'f-2',
    requirement_ids: ['req-2'],
    front: 'What is a Pod?',
    back: 'The smallest deployable unit of computing in Kubernetes',
  };

  it('calculates initial state when no practice records exist', () => {
    const radar = computeWeaknessRadar(
      [reqMust, reqNice],
      [question1],
      [flashcard1, flashcard2],
      [],
    );

    expect(radar.overallReadiness).toBe(0);
    expect(radar.items).toHaveLength(2);

    const mustItem = radar.items.find((i) => i.requirementId === 'req-1');
    expect(mustItem).toBeDefined();
    expect(mustItem?.coveredByQuestions).toBe(true);
    expect(mustItem?.questionCount).toBe(1);
    expect(mustItem?.averageConfidence).toBeNull();
    expect(mustItem?.status).toBe('unpracticed');

    const niceItem = radar.items.find((i) => i.requirementId === 'req-2');

    expect(niceItem).toBeDefined();
    expect(niceItem?.coveredByQuestions).toBe(false);
    expect(niceItem?.questionCount).toBe(0);
    expect(niceItem?.status).toBe('critical'); // Uncovered + unpracticed
  });

  it('updates status and readiness as confidence increases', () => {
    const mockRecord = {
      _id: new Types.ObjectId(),
      userId: new Types.ObjectId(),
      kitId: new Types.ObjectId(),
      flashcardId: 'f-1',
      confidence: 5,
      notes: 'Easy',
      practicedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as IPracticeRecord;

    const radar = computeWeaknessRadar(
      [reqMust],
      [question1],
      [flashcard1],
      [mockRecord],
    );

    expect(radar.items[0]?.averageConfidence).toBe(5);
    expect(radar.items[0]?.status).toBe('strong');
    expect(radar.strongCount).toBe(1);
    expect(radar.overallReadiness).toBeGreaterThan(0);
  });

  it('prioritizes unpracticed flashcards over confident ones', () => {
    const confidentRecord = {
      _id: new Types.ObjectId(),
      userId: new Types.ObjectId(),
      kitId: new Types.ObjectId(),
      flashcardId: 'f-1',
      confidence: 5,
      practicedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as IPracticeRecord;

    const priorityF1 = computeFlashcardPriority(
      flashcard1,
      [reqMust],
      [confidentRecord],
    );

    // Unpracticed flashcard
    const priorityF2 = computeFlashcardPriority(
      flashcard2,
      [reqNice],
      [],
    );

    // F2 (unpracticed, weak) must have higher priority score than F1 (practiced with confidence 5)
    expect(priorityF2).toBeGreaterThan(priorityF1);
  });
});
