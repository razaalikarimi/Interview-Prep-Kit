import { describe, it, expect } from 'vitest';
import { validateKitStructure } from '../../apps/api/src/domain/validator.js';
import type { Kit } from '@interview-prep/shared';

function makeValidKit(): Kit {
  return {
    source: {
      company: 'Acme Corp',
      company_url: 'https://acme.com',
      role: 'Senior Engineer',
      location: 'Remote',
      jd_chars: 500,
      researched_at: new Date().toISOString(),
      pages_used: [{ url: 'https://acme.com', title: 'Acme' }],
    },
    company_brief: {
      summary: 'Acme builds great things',
      what_they_do: 'Software development',
      sources: ['https://acme.com'],
    },
    role: {
      title: 'Senior Engineer',
      seniority: 'senior',
      responsibilities: ['Build systems'],
      requirements: [
        { id: 'r1', text: 'React expertise', kind: 'technical', priority: 'must' },
        { id: 'r2', text: 'Team leadership', kind: 'behavioural', priority: 'nice' },
      ],
    },
    questions: [
      {
        id: 'q1',
        requirement_ids: ['r1'],
        category: 'technical',
        prompt: 'Tell me about React hooks',
        answer_outline: 'useState, useEffect, custom hooks',
        difficulty: 2,
      },
      {
        id: 'q2',
        requirement_ids: ['r2'],
        category: 'behavioural',
        prompt: 'Describe a time you led a team',
        answer_outline: 'STAR method response',
        difficulty: 2,
      },
    ],
    flashcards: [
      {
        id: 'f1',
        front: 'What is useEffect?',
        back: 'A React hook for side effects',
        requirement_ids: ['r1'],
      },
    ],
    schedule: {
      days_available: 2,
      days: [
        { day: 1, focus: 'Technical deep-dive', question_ids: ['q1'], minutes: 20 },
        { day: 2, focus: 'Behavioural prep', question_ids: ['q2'], minutes: 20 },
      ],
    },
    coverage: {
      uncovered_requirement_ids: [],
      passes: 1,
    },
  };
}

describe('Kit Structure Validator', () => {
  it('passes a valid kit', () => {
    const result = validateKitStructure(makeValidKit());
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('detects missing source section', () => {
    const kit = makeValidKit();
    // @ts-expect-error deliberate test
    delete kit.source;
    const result = validateKitStructure(kit);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.field === 'source')).toBe(true);
  });

  it('detects invalid difficulty value', () => {
    const kit = makeValidKit();
    // @ts-expect-error deliberate test
    kit.questions[0].difficulty = 5;
    const result = validateKitStructure(kit);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.message.includes('difficulty'))).toBe(true);
  });

  it('detects invalid category enum', () => {
    const kit = makeValidKit();
    // @ts-expect-error deliberate test
    kit.questions[0].category = 'invalid-category';
    const result = validateKitStructure(kit);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.message.includes('category'))).toBe(true);
  });

  it('detects invalid requirement reference in questions', () => {
    const kit = makeValidKit();
    kit.questions[0]!.requirement_ids = ['r999']; // non-existent
    const result = validateKitStructure(kit);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.message.includes('r999'))).toBe(true);
  });

  it('detects schedule day count mismatch', () => {
    const kit = makeValidKit();
    kit.schedule.days_available = 5; // but only 2 days in array
    const result = validateKitStructure(kit);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.message.includes('days'))).toBe(true);
  });

  it('detects non-integer minutes', () => {
    const kit = makeValidKit();
    kit.schedule.days[0]!.minutes = 20.5;
    const result = validateKitStructure(kit);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.message.includes('integer'))).toBe(true);
  });

  it('detects invalid question ID in schedule', () => {
    const kit = makeValidKit();
    kit.schedule.days[0]!.question_ids = ['q999']; // non-existent
    const result = validateKitStructure(kit);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.message.includes('q999'))).toBe(true);
  });

  it('detects coverage mismatch (recorded says covered but actually not)', () => {
    const kit = makeValidKit();
    // Remove the question covering r1, but coverage says r1 IS covered
    kit.questions = [kit.questions[1]!]; // only q2 remains (covers r2/behavioural)
    kit.coverage.uncovered_requirement_ids = []; // claimed: all covered
    const result = validateKitStructure(kit);
    // r1 (must) is not covered by any question, but coverage claims it is
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.message.includes('Coverage mismatch'))).toBe(true);
  });
});
