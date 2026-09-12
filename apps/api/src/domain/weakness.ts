import type {
  Requirement,
  Question,
  Flashcard,
  WeaknessRadar,
  WeaknessRadarItem,
} from '@interview-prep/shared';
import { REQUIREMENT_PRIORITY_WEIGHT, RECENCY_DECAY_DAYS } from '@interview-prep/shared';
import type { IPracticeRecord } from '../infrastructure/database/models/practice.model.js';

// ============================================================
// WEAKNESS RADAR — DETERMINISTIC CALCULATIONS
//
// Uses ONLY application data — practice records, confidence
// scores, question coverage. NO LLM involvement.
//
// Algorithm:
// 1. For each requirement, count questions that cover it
// 2. Get all flashcards for that requirement
// 3. Get practice records for those flashcards
// 4. Calculate average confidence
// 5. Calculate recency (days since last practice)
// 6. Compute priority score
// 7. Assign status based on thresholds
// 8. Generate recommended action
// ============================================================

const STATUS_THRESHOLDS = {
  CONFIDENCE_STRONG: 4,     // avg confidence >= 4 = strong
  CONFIDENCE_GOOD: 3,       // avg confidence >= 3 = good
  CONFIDENCE_NEEDS_WORK: 2, // avg confidence >= 2 = needs work
  // < 2 or unpracticed = critical
  MIN_QUESTION_COVERAGE: 1, // at least 1 question = covered
};

function daysSince(date: Date): number {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function getLatestRecord(records: IPracticeRecord[]): IPracticeRecord | null {
  if (records.length === 0) return null;
  return records.reduce((latest, r) =>
    new Date(r.practicedAt) > new Date(latest.practicedAt) ? r : latest,
  );
}

function computeAverageConfidence(records: IPracticeRecord[]): number | null {
  if (records.length === 0) return null;
  // Use latest confidence per flashcard (not average of all attempts)
  const latestByCard = new Map<string, number>();
  for (const r of records) {
    const existing = latestByCard.get(r.flashcardId);
    if (
      existing === undefined ||
      new Date(r.practicedAt) >
        new Date(
          records.find((x) => x.flashcardId === r.flashcardId && x.confidence === existing)
            ?.practicedAt ?? 0,
        )
    ) {
      latestByCard.set(r.flashcardId, r.confidence);
    }
  }
  const values = [...latestByCard.values()];
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function computePriorityScore(
  requirement: Requirement,
  questionCount: number,
  avgConfidence: number | null,
  lastPracticedDaysAgo: number | null,
): number {
  const priorityWeight = REQUIREMENT_PRIORITY_WEIGHT[requirement.priority] ?? 1;

  // Weakness component: inverse of confidence (higher = weaker)
  const weaknessScore = avgConfidence !== null ? 6 - avgConfidence : 6;

  // Recency penalty: not practiced recently = higher priority
  const recencyScore =
    lastPracticedDaysAgo === null
      ? RECENCY_DECAY_DAYS
      : Math.min(lastPracticedDaysAgo, RECENCY_DECAY_DAYS);

  // Coverage penalty: no questions = urgent
  const coverageScore = questionCount === 0 ? 5 : 0;

  return priorityWeight * (weaknessScore + recencyScore * 0.5 + coverageScore);
}

function computeStatus(
  questionCount: number,
  avgConfidence: number | null,
  _lastPracticedDaysAgo: number | null,
): WeaknessRadarItem['status'] {

  if (questionCount < STATUS_THRESHOLDS.MIN_QUESTION_COVERAGE) return 'critical';
  if (avgConfidence === null) return 'unpracticed';
  if (avgConfidence >= STATUS_THRESHOLDS.CONFIDENCE_STRONG) return 'strong';
  if (avgConfidence >= STATUS_THRESHOLDS.CONFIDENCE_GOOD) return 'good';
  if (avgConfidence >= STATUS_THRESHOLDS.CONFIDENCE_NEEDS_WORK) return 'needs-work';
  return 'critical';
}

function computeRecommendedAction(
  requirement: Requirement,
  questionCount: number,
  avgConfidence: number | null,
  lastPracticedDaysAgo: number | null,
  status: WeaknessRadarItem['status'],
): string {
  if (questionCount === 0) {
    return `Add questions covering "${requirement.text}"`;
  }
  if (avgConfidence === null) {
    return `Start practicing flashcards for "${requirement.text}"`;
  }
  if (status === 'critical' || status === 'needs-work') {
    return `Review and practice "${requirement.text}" — confidence is low`;
  }
  if (lastPracticedDaysAgo !== null && lastPracticedDaysAgo > RECENCY_DECAY_DAYS) {
    return `Refresh "${requirement.text}" — not practiced recently`;
  }
  if (status === 'good') {
    return `Keep reviewing "${requirement.text}" to maintain confidence`;
  }
  return `"${requirement.text}" is well-prepared — maintain with occasional review`;
}

export function computeWeaknessRadar(
  requirements: Requirement[],
  questions: Question[],
  flashcards: Flashcard[],
  practiceRecords: IPracticeRecord[],
): WeaknessRadar {
  const items: WeaknessRadarItem[] = [];

  for (const requirement of requirements) {
    // Count questions covering this requirement
    const coveringQuestions = questions.filter((q) =>
      q.requirement_ids.includes(requirement.id),
    );

    // Find flashcards for this requirement
    const reqFlashcards = flashcards.filter((f) =>
      (f.requirement_ids ?? []).includes(requirement.id),
    );

    // Get practice records for these flashcards
    const reqFlashcardIds = new Set(reqFlashcards.map((f) => f.id));
    const reqRecords = practiceRecords.filter((r) => reqFlashcardIds.has(r.flashcardId));

    const avgConfidence = computeAverageConfidence(reqRecords);
    const latestRecord = getLatestRecord(reqRecords);
    const lastPracticedDaysAgo = latestRecord
      ? daysSince(new Date(latestRecord.practicedAt))
      : null;

    const priorityScore = computePriorityScore(
      requirement,
      coveringQuestions.length,
      avgConfidence,
      lastPracticedDaysAgo,
    );

    const status = computeStatus(
      coveringQuestions.length,
      avgConfidence,
      lastPracticedDaysAgo,
    );

    const recommendedAction = computeRecommendedAction(
      requirement,
      coveringQuestions.length,
      avgConfidence,
      lastPracticedDaysAgo,
      status,
    );

    items.push({
      requirementId: requirement.id,
      requirementText: requirement.text,
      kind: requirement.kind,
      priority: requirement.priority,
      questionCount: coveringQuestions.length,
      coveredByQuestions: coveringQuestions.length >= STATUS_THRESHOLDS.MIN_QUESTION_COVERAGE,
      flashcardCount: reqFlashcards.length,
      averageConfidence: avgConfidence,
      lastPracticedAt: latestRecord?.practicedAt.toISOString() ?? null,
      priorityScore,
      status,
      recommendedAction,
    });
  }

  // Sort by priority score (highest = needs most attention)
  items.sort((a, b) => b.priorityScore - a.priorityScore);

  const criticalCount = items.filter((i) => i.status === 'critical').length;
  const strongCount = items.filter((i) => i.status === 'strong').length;

  // Overall readiness: weighted average of confidence across all practiced requirements
  const practicedItems = items.filter((i) => i.averageConfidence !== null);
  const overallReadiness =
    practicedItems.length === 0
      ? 0
      : Math.round(
          (practicedItems.reduce((sum, i) => sum + ((i.averageConfidence ?? 0) / 5) * 100, 0) /
            practicedItems.length +
            (strongCount / Math.max(items.length, 1)) * 20) /
            1.2,
        );

  // Top 3 recommendations
  const recommendations = items
    .filter((i) => i.status !== 'strong')
    .slice(0, 3)
    .map((i) => i.recommendedAction);

  return {
    items,
    overallReadiness: Math.min(100, overallReadiness),
    criticalCount,
    strongCount,
    recommendations,
  };
}

/**
 * Compute weakness-weighted flashcard ordering for practice.
 *
 * Priority score formula (documented):
 *   weakness = (6 - confidence) + requirementPriorityWeight + recencyWeight
 *
 * - confidence: 1–5 scale (lower = weaker = higher priority)
 * - requirementPriorityWeight: must=2, nice=1
 * - recencyWeight: 1 + daysSinceLastPractice/7 (capped at 3)
 *   (not practiced recently = higher weight)
 */
export function computeFlashcardPriority(
  flashcard: Flashcard,
  requirements: Requirement[],
  records: IPracticeRecord[],
): number {
  const flashcardRecords = records.filter((r) => r.flashcardId === flashcard.id);
  const latestRecord = getLatestRecord(flashcardRecords);

  const confidence = latestRecord?.confidence ?? 1; // Unpracticed = assume weakest
  const weaknessScore = 6 - confidence;

  // Get max priority weight from associated requirements
  const reqPriorityWeight = (flashcard.requirement_ids ?? []).reduce((max, reqId) => {
    const req = requirements.find((r) => r.id === reqId);
    const weight = req ? (REQUIREMENT_PRIORITY_WEIGHT[req.priority] ?? 1) : 1;
    return Math.max(max, weight);
  }, 1);

  const daysSinceLastPractice = latestRecord
    ? daysSince(new Date(latestRecord.practicedAt))
    : 14; // Unpracticed = treat as 2 weeks ago

  const recencyWeight = Math.min(3, 1 + daysSinceLastPractice / 7);

  return weaknessScore + reqPriorityWeight + recencyWeight;
}
