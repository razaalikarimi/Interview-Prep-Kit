import type { Requirement, Question } from '@interview-prep/shared';

// ============================================================
// COVERAGE CHECKER — DETERMINISTIC, PURE CODE, NO LLM
//
// For each MUST requirement, checks if at least one question
// references its ID. The result is a plain code calculation.
//
// Why deterministic?
// The spec explicitly forbids asking the LLM whether coverage
// is complete. Coverage is a simple set operation.
// ============================================================

export interface CoverageResult {
  uncovered_requirement_ids: string[];
  coveredRequirementIds: string[];
  passes: number;
}

/**
 * Determine which MUST requirements have no question coverage.
 * NICE requirements are deliberately excluded from coverage check.
 */
export function checkCoverage(
  requirements: Requirement[],
  questions: Question[],
  passes: number = 1,
): CoverageResult {
  const mustRequirements = requirements.filter((r) => r.priority === 'must');
  const mustIds = mustRequirements.map((r) => r.id);

  // Build set of all requirement IDs referenced by any question
  const coveredIds = new Set<string>();
  for (const question of questions) {
    for (const reqId of question.requirement_ids) {
      coveredIds.add(reqId);
    }
  }

  const uncoveredIds = mustIds.filter((id) => !coveredIds.has(id));
  const coveredMustIds = mustIds.filter((id) => coveredIds.has(id));

  return {
    uncovered_requirement_ids: uncoveredIds,
    coveredRequirementIds: coveredMustIds,
    passes,
  };
}

/**
 * Validate that all requirement IDs referenced by questions actually exist.
 * Returns IDs that are referenced but don't exist.
 */
export function validateQuestionRequirementReferences(
  requirements: Requirement[],
  questions: Question[],
): string[] {
  const validIds = new Set(requirements.map((r) => r.id));
  const invalidRefs: string[] = [];

  for (const question of questions) {
    for (const reqId of question.requirement_ids) {
      if (!validIds.has(reqId)) {
        invalidRefs.push(`${question.id} references unknown requirement: ${reqId}`);
      }
    }
  }

  return invalidRefs;
}

/**
 * Get all questions that reference a specific requirement ID.
 */
export function getQuestionsForRequirement(
  questions: Question[],
  requirementId: string,
): Question[] {
  return questions.filter((q) => q.requirement_ids.includes(requirementId));
}

/**
 * Get all requirements that have no associated questions.
 */
export function getUncoveredRequirements(
  requirements: Requirement[],
  questions: Question[],
): Requirement[] {
  const coveredIds = new Set(questions.flatMap((q) => q.requirement_ids));
  return requirements.filter((r) => !coveredIds.has(r.id));
}
