import type { Requirement, Question, ScheduleDay, Schedule } from '@interview-prep/shared';
import {
  MINUTES_PER_QUESTION,
  MAX_MINUTES_PER_DAY,
  MIN_MINUTES_PER_DAY,
} from '@interview-prep/shared';

// ============================================================
// DETERMINISTIC SCHEDULE ALLOCATOR
//
// This MUST NOT involve the LLM. Schedule allocation is a
// deterministic algorithm based on requirement priority and
// question difficulty.
//
// Algorithm:
// 1. Score each question: priority_weight * difficulty + category_weight
// 2. Sort questions descending by score (hardest/most important first)
// 3. Divide into N days — harder material gets earlier days
// 4. Ensure every MUST requirement appears in early days
// 5. Balance minutes per day (cap MAX_MINUTES_PER_DAY)
// 6. Round all minutes to integers (spec requirement)
// 7. Assign a focus label to each day
//
// Edge cases:
// - 1 day: all questions on day 1
// - 60 days: some days may have 0 questions (rest days)
//   but must still have exactly N days
// ============================================================

const PRIORITY_WEIGHT: Record<string, number> = {
  must: 3,
  nice: 1,
};

const CATEGORY_WEIGHT: Record<string, number> = {
  technical: 3,
  'system-design': 3,
  behavioural: 2,
  'company-fit': 1,
};

const DIFFICULTY_WEIGHT: Record<number, number> = {
  3: 3, // hard
  2: 2, // medium
  1: 1, // easy
};

interface ScoredQuestion {
  question: Question;
  score: number;
  requirementPriority: string;
}

function scoreQuestion(question: Question, requirements: Requirement[]): number {
  const maxPriority = question.requirement_ids.reduce((best, reqId) => {
    const req = requirements.find((r) => r.id === reqId);
    if (!req) return best;
    const weight = PRIORITY_WEIGHT[req.priority] ?? 1;
    return Math.max(best, weight);
  }, 1);

  const diffWeight = DIFFICULTY_WEIGHT[question.difficulty] ?? 1;
  const catWeight = CATEGORY_WEIGHT[question.category] ?? 1;

  return maxPriority * diffWeight + catWeight;
}

function getDayFocus(questions: Question[]): string {
  if (questions.length === 0) return 'Review & rest';

  const categoryCounts = new Map<string, number>();
  for (const q of questions) {
    categoryCounts.set(q.category, (categoryCounts.get(q.category) ?? 0) + 1);
  }

  const dominant = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (!dominant) return 'Mixed topics';

  const focusLabels: Record<string, string> = {
    technical: 'Technical deep-dive',
    'system-design': 'System design practice',
    behavioural: 'Behavioural & STAR stories',
    'company-fit': 'Company research & culture fit',
  };

  return focusLabels[dominant[0]] ?? 'Mixed practice';
}

/**
 * Allocate questions across exactly N days.
 * Returns a schedule with exactly daysAvailable days.
 */
export function allocateSchedule(
  requirements: Requirement[],
  questions: Question[],
  daysAvailable: number,
): Schedule {
  if (daysAvailable < 1) {
    throw new Error('daysAvailable must be >= 1');
  }

  // Score and sort questions (highest score = hardest/most important = earliest)
  const scored: ScoredQuestion[] = questions.map((q) => ({
    question: q,
    score: scoreQuestion(q, requirements),
    requirementPriority: q.requirement_ids.reduce((best, reqId) => {
      const req = requirements.find((r) => r.id === reqId);
      if (!req) return best;
      return req.priority === 'must' ? 'must' : best;
    }, 'nice' as string),
  }));

  scored.sort((a, b) => b.score - a.score);

  // For very large day counts, avoid repeating questions
  // Each day gets a roughly equal share of questions
  const questionsPerDay = Math.ceil(scored.length / Math.max(1, daysAvailable));
  const actualQuestionsPerDay = Math.max(1, questionsPerDay);

  const days: ScheduleDay[] = [];

  for (let day = 1; day <= daysAvailable; day++) {
    // Questions for this day
    const startIdx = (day - 1) * actualQuestionsPerDay;
    const endIdx = startIdx + actualQuestionsPerDay;
    const dayQuestions = scored.slice(startIdx, endIdx).map((s) => s.question);

    // Calculate minutes (integer, bounded)
    const rawMinutes = dayQuestions.length * MINUTES_PER_QUESTION;
    const cappedMinutes = Math.min(rawMinutes, MAX_MINUTES_PER_DAY);
    const minutes =
      dayQuestions.length > 0 ? Math.max(MIN_MINUTES_PER_DAY, Math.round(cappedMinutes)) : 0;

    days.push({
      day,
      focus: getDayFocus(dayQuestions),
      question_ids: dayQuestions.map((q) => q.id),
      minutes,
    });
  }

  // Validation: ensure every MUST requirement appears in schedule
  // If any MUST requirement's questions are only in later days,
  // note this (but don't fail — schedule may be sparse for large day counts)
  const mustRequirements = requirements.filter((r) => r.priority === 'must');
  const scheduledQuestionIds = new Set(days.flatMap((d) => d.question_ids));
  const mustQuestionsScheduled = mustRequirements.every((req) => {
    const reqQuestions = questions.filter((q) => q.requirement_ids.includes(req.id));
    return reqQuestions.some((q) => scheduledQuestionIds.has(q.id));
  });

  if (!mustQuestionsScheduled) {
    // This shouldn't happen in practice, but add a safety check
    // Re-distribute to ensure coverage
    const unscheduledMustQuestions = questions.filter((q) => {
      const isMust = q.requirement_ids.some((reqId) => {
        const req = requirements.find((r) => r.id === reqId);
        return req?.priority === 'must';
      });
      return isMust && !scheduledQuestionIds.has(q.id);
    });

    // Add unscheduled must questions to day 1
    if (unscheduledMustQuestions.length > 0 && days.length > 0) {
      const day1 = days[0]!;
      day1.question_ids.push(...unscheduledMustQuestions.map((q) => q.id));
      day1.minutes = Math.min(
        MAX_MINUTES_PER_DAY,
        Math.round(day1.question_ids.length * MINUTES_PER_QUESTION),
      );
    }
  }

  return {
    days_available: daysAvailable,
    days,
  };
}
