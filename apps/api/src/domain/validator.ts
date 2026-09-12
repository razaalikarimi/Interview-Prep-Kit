import type { Kit, Requirement, Question, Flashcard } from '@interview-prep/shared';

import { checkCoverage } from './coverage.js';

// ============================================================
// KIT STRUCTURE VALIDATOR
// Cross-references all IDs to ensure internal consistency.
// Run before saving any generated kit.
// ============================================================

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export function validateKitStructure(kit: Kit): ValidationResult {
  const errors: ValidationError[] = [];

  // ---- Top-level required sections ----
  if (!kit.source) errors.push({ field: 'source', message: 'Missing source section' });
  if (!kit.company_brief) errors.push({ field: 'company_brief', message: 'Missing company_brief section' });
  if (!kit.role) errors.push({ field: 'role', message: 'Missing role section' });
  if (!kit.questions) errors.push({ field: 'questions', message: 'Missing questions array' });
  if (!kit.flashcards) errors.push({ field: 'flashcards', message: 'Missing flashcards array' });
  if (!kit.schedule) errors.push({ field: 'schedule', message: 'Missing schedule section' });
  if (!kit.coverage) errors.push({ field: 'coverage', message: 'Missing coverage section' });

  if (errors.length > 0) return { valid: false, errors };

  const requirements: Requirement[] = kit.role.requirements;
  const questions: Question[] = kit.questions;
  const flashcards: Flashcard[] = kit.flashcards;
  const schedule = kit.schedule;
  const coverage = kit.coverage;

  const requirementIds = new Set(requirements.map((r) => r.id));
  const questionIds = new Set(questions.map((q) => q.id));

  // ---- Requirement validation ----
  for (const req of requirements) {
    if (!req.id) errors.push({ field: `requirement`, message: 'Requirement missing id' });
    if (!req.text) errors.push({ field: `requirement.${req.id}`, message: 'Requirement missing text' });
    if (!['technical', 'behavioural', 'domain'].includes(req.kind)) {
      errors.push({ field: `requirement.${req.id}.kind`, message: `Invalid kind: ${req.kind}` });
    }
    if (!['must', 'nice'].includes(req.priority)) {
      errors.push({ field: `requirement.${req.id}.priority`, message: `Invalid priority: ${req.priority}` });
    }
  }

  // ---- Question validation ----
  for (const question of questions) {
    if (!question.id) errors.push({ field: 'question', message: 'Question missing id' });
    if (!question.prompt) errors.push({ field: `question.${question.id}`, message: 'Missing prompt' });
    if (!question.answer_outline) {
      errors.push({ field: `question.${question.id}`, message: 'Missing answer_outline' });
    }
    if (![1, 2, 3].includes(question.difficulty)) {
      errors.push({
        field: `question.${question.id}.difficulty`,
        message: `Invalid difficulty: ${question.difficulty}. Must be 1, 2, or 3`,
      });
    }
    if (!['technical', 'behavioural', 'system-design', 'company-fit'].includes(question.category)) {
      errors.push({ field: `question.${question.id}.category`, message: `Invalid category: ${question.category}` });
    }

    // Every question must have at least one requirement reference
    if (!question.requirement_ids || question.requirement_ids.length === 0) {
      errors.push({
        field: `question.${question.id}.requirement_ids`,
        message: 'Question must reference at least one requirement',
      });
    } else {
      // Validate each referenced requirement exists
      for (const reqId of question.requirement_ids) {
        if (!requirementIds.has(reqId)) {
          errors.push({
            field: `question.${question.id}.requirement_ids`,
            message: `References non-existent requirement: ${reqId}`,
          });
        }
      }
    }
  }

  // ---- Flashcard validation ----
  for (const flashcard of flashcards) {
    if (!flashcard.id) errors.push({ field: 'flashcard', message: 'Flashcard missing id' });
    if (!flashcard.front) errors.push({ field: `flashcard.${flashcard.id}`, message: 'Missing front' });
    if (!flashcard.back) errors.push({ field: `flashcard.${flashcard.id}`, message: 'Missing back' });

    for (const reqId of flashcard.requirement_ids ?? []) {
      if (!requirementIds.has(reqId)) {
        errors.push({
          field: `flashcard.${flashcard.id}.requirement_ids`,
          message: `References non-existent requirement: ${reqId}`,
        });
      }
    }
  }

  // ---- Schedule validation ----
  if (schedule.days.length !== schedule.days_available) {
    errors.push({
      field: 'schedule.days',
      message: `Schedule has ${schedule.days.length} days but days_available is ${schedule.days_available}`,
    });
  }

  for (const day of schedule.days) {
    // Minutes must be integers
    if (!Number.isInteger(day.minutes)) {
      errors.push({
        field: `schedule.day.${day.day}.minutes`,
        message: `minutes must be integer, got: ${day.minutes}`,
      });
    }

    // Question IDs in schedule must exist
    for (const qId of day.question_ids) {
      if (!questionIds.has(qId)) {
        errors.push({
          field: `schedule.day.${day.day}.question_ids`,
          message: `References non-existent question: ${qId}`,
        });
      }
    }
  }

  // ---- Coverage validation ----
  // Re-run the deterministic coverage check and compare
  const actualCoverage = checkCoverage(requirements, questions, coverage.passes);
  const actualUncovered = new Set(actualCoverage.uncovered_requirement_ids);
  const recordedUncovered = new Set(coverage.uncovered_requirement_ids);

  // Check they match
  for (const id of actualUncovered) {
    if (!recordedUncovered.has(id)) {
      errors.push({
        field: 'coverage.uncovered_requirement_ids',
        message: `Coverage mismatch: ${id} is actually uncovered but not recorded`,
      });
    }
  }
  for (const id of recordedUncovered) {
    if (!actualUncovered.has(id)) {
      errors.push({
        field: 'coverage.uncovered_requirement_ids',
        message: `Coverage mismatch: ${id} is recorded as uncovered but actually has coverage`,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
