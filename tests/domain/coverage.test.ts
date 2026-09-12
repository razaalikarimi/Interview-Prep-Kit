import { describe, it, expect } from 'vitest';
import {
  checkCoverage,
  validateQuestionRequirementReferences,
  getQuestionsForRequirement,
  getUncoveredRequirements,
} from '../../apps/api/src/domain/coverage.js';
import type { Requirement, Question } from '@interview-prep/shared';

const makeReq = (id: string, priority: 'must' | 'nice' = 'must'): Requirement => ({
  id,
  text: `Req ${id}`,
  kind: 'technical',
  priority,
  state: { origin: 'generated', edited: false, pinned: false, version: 1 },
});

const makeQ = (id: string, reqIds: string[]): Question => ({
  id,
  requirement_ids: reqIds,
  category: 'technical',
  prompt: `Q ${id}`,
  answer_outline: `A ${id}`,
  difficulty: 2,
  state: { origin: 'generated', edited: false, pinned: false, version: 1 },
});

describe('Coverage Checker', () => {
  it('returns empty uncovered when all must requirements are covered', () => {
    const reqs = [makeReq('r1'), makeReq('r2')];
    const questions = [makeQ('q1', ['r1']), makeQ('q2', ['r2'])];
    const result = checkCoverage(reqs, questions);
    expect(result.uncovered_requirement_ids).toEqual([]);
  });

  it('detects one uncovered must requirement', () => {
    const reqs = [makeReq('r1'), makeReq('r2'), makeReq('r3')];
    const questions = [makeQ('q1', ['r1']), makeQ('q2', ['r2'])];
    const result = checkCoverage(reqs, questions);
    expect(result.uncovered_requirement_ids).toContain('r3');
    expect(result.uncovered_requirement_ids).not.toContain('r1');
    expect(result.uncovered_requirement_ids).not.toContain('r2');
  });

  it('detects multiple uncovered must requirements', () => {
    const reqs = [makeReq('r1'), makeReq('r2'), makeReq('r3')];
    const questions = [makeQ('q1', ['r1'])];
    const result = checkCoverage(reqs, questions);
    expect(result.uncovered_requirement_ids).toContain('r2');
    expect(result.uncovered_requirement_ids).toContain('r3');
    expect(result.uncovered_requirement_ids).toHaveLength(2);
  });

  it('nice requirements are NOT counted as uncovered (must-only check)', () => {
    const reqs = [makeReq('r1', 'must'), makeReq('r2', 'nice')];
    const questions = [makeQ('q1', ['r1'])]; // r2 (nice) not covered
    const result = checkCoverage(reqs, questions);
    // r2 is 'nice' so should NOT appear in uncovered_requirement_ids
    expect(result.uncovered_requirement_ids).not.toContain('r2');
    expect(result.uncovered_requirement_ids).toHaveLength(0);
  });

  it('passes tracking is correct', () => {
    const reqs = [makeReq('r1')];
    const questions = [makeQ('q1', ['r1'])];
    const result = checkCoverage(reqs, questions, 3);
    expect(result.passes).toBe(3);
  });

  it('validateQuestionRequirementReferences detects invalid requirement references', () => {
    const reqs = [makeReq('r1'), makeReq('r2')];
    const questions = [
      makeQ('q1', ['r1', 'r999']), // r999 doesn't exist
      makeQ('q2', ['r2']),
    ];
    const invalid = validateQuestionRequirementReferences(reqs, questions);
    expect(invalid.length).toBeGreaterThan(0);
    expect(invalid[0]).toContain('r999');
  });

  it('getQuestionsForRequirement returns only matching questions', () => {
    const questions = [makeQ('q1', ['r1']), makeQ('q2', ['r2']), makeQ('q3', ['r1', 'r2'])];
    const r1Questions = getQuestionsForRequirement(questions, 'r1');
    expect(r1Questions.map(q => q.id)).toContain('q1');
    expect(r1Questions.map(q => q.id)).toContain('q3');
    expect(r1Questions.map(q => q.id)).not.toContain('q2');
  });

  it('getUncoveredRequirements returns requirements with no questions', () => {
    const reqs = [makeReq('r1'), makeReq('r2'), makeReq('r3')];
    const questions = [makeQ('q1', ['r1'])];
    const uncovered = getUncoveredRequirements(reqs, questions);
    expect(uncovered.map(r => r.id)).toContain('r2');
    expect(uncovered.map(r => r.id)).toContain('r3');
    expect(uncovered.map(r => r.id)).not.toContain('r1');
  });

  it('handles empty questions array', () => {
    const reqs = [makeReq('r1'), makeReq('r2')];
    const result = checkCoverage(reqs, []);
    expect(result.uncovered_requirement_ids).toContain('r1');
    expect(result.uncovered_requirement_ids).toContain('r2');
  });

  it('handles empty requirements array', () => {
    const questions = [makeQ('q1', ['r1'])];
    const result = checkCoverage([], questions);
    expect(result.uncovered_requirement_ids).toHaveLength(0);
  });
});
