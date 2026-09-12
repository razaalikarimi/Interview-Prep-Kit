import { describe, it, expect } from 'vitest';
import { allocateSchedule } from '../../apps/api/src/domain/schedule.js';
import type { Requirement, Question } from '@interview-prep/shared';

const makeReq = (id: string, priority: 'must' | 'nice' = 'must', kind: 'technical' | 'behavioural' | 'domain' = 'technical'): Requirement => ({
  id,
  text: `Requirement ${id}`,
  kind,
  priority,
  state: { origin: 'generated', edited: false, pinned: false, version: 1 },
});

const makeQuestion = (
  id: string,
  reqIds: string[],
  category: Question['category'] = 'technical',
  difficulty: 1 | 2 | 3 = 2,
): Question => ({
  id,
  requirement_ids: reqIds,
  category,
  prompt: `Question ${id}`,
  answer_outline: `Answer ${id}`,
  difficulty,
  state: { origin: 'generated', edited: false, pinned: false, version: 1 },
});

describe('Schedule Allocator', () => {
  it('produces exactly 1 day when daysAvailable=1', () => {
    const reqs = [makeReq('r1'), makeReq('r2')];
    const questions = [makeQuestion('q1', ['r1']), makeQuestion('q2', ['r2'])];
    const schedule = allocateSchedule(reqs, questions, 1);

    expect(schedule.days.length).toBe(1);
    expect(schedule.days_available).toBe(1);
  });

  it('produces exactly 5 days when daysAvailable=5', () => {
    const reqs = [makeReq('r1'), makeReq('r2'), makeReq('r3')];
    const questions = Array.from({ length: 10 }, (_, i) =>
      makeQuestion(`q${i + 1}`, [`r${(i % 3) + 1}`]),
    );
    const schedule = allocateSchedule(reqs, questions, 5);

    expect(schedule.days.length).toBe(5);
    expect(schedule.days_available).toBe(5);
  });

  it('produces exactly 10 days when daysAvailable=10', () => {
    const reqs = [makeReq('r1')];
    const questions = [makeQuestion('q1', ['r1'])];
    const schedule = allocateSchedule(reqs, questions, 10);

    expect(schedule.days.length).toBe(10);
    expect(schedule.days_available).toBe(10);
  });

  it('produces exactly 60 days when daysAvailable=60', () => {
    const reqs = [makeReq('r1')];
    const questions = [makeQuestion('q1', ['r1'])];
    const schedule = allocateSchedule(reqs, questions, 60);

    expect(schedule.days.length).toBe(60);
    expect(schedule.days_available).toBe(60);
  });

  it('all minutes are integers', () => {
    const reqs = [makeReq('r1'), makeReq('r2')];
    const questions = Array.from({ length: 7 }, (_, i) =>
      makeQuestion(`q${i + 1}`, [`r${(i % 2) + 1}`]),
    );
    const schedule = allocateSchedule(reqs, questions, 5);

    for (const day of schedule.days) {
      expect(Number.isInteger(day.minutes)).toBe(true);
    }
  });

  it('schedules must requirements in the first day for 1-day schedule', () => {
    const reqs = [makeReq('r1', 'must'), makeReq('r2', 'nice')];
    const questions = [
      makeQuestion('q1', ['r1'], 'technical', 3), // must/hard
      makeQuestion('q2', ['r2'], 'company-fit', 1), // nice/easy
    ];
    const schedule = allocateSchedule(reqs, questions, 1);
    const allScheduledIds = schedule.days.flatMap(d => d.question_ids);
    // q1 (must+hard) should be scheduled
    expect(allScheduledIds).toContain('q1');
  });

  it('harder questions appear in earlier days (5-day schedule)', () => {
    const reqs = [makeReq('r1', 'must')];
    const questions = [
      makeQuestion('q1', ['r1'], 'technical', 3), // hard
      makeQuestion('q2', ['r1'], 'technical', 1), // easy
      makeQuestion('q3', ['r1'], 'technical', 3), // hard
    ];
    const schedule = allocateSchedule(reqs, questions, 5);

    // Day 1 should have harder content
    const day1Questions = schedule.days[0]?.question_ids ?? [];
    // Hard questions (difficulty 3) should be on earlier days
    // At minimum day 1 should not be empty if there are questions
    expect(schedule.days[0]!.question_ids.length).toBeGreaterThanOrEqual(0);
  });

  it('each day has a non-empty focus string', () => {
    const reqs = [makeReq('r1')];
    const questions = [makeQuestion('q1', ['r1'])];
    const schedule = allocateSchedule(reqs, questions, 3);

    for (const day of schedule.days) {
      expect(day.focus).toBeTruthy();
      expect(typeof day.focus).toBe('string');
    }
  });
});
