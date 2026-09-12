import { describe, it, expect } from 'vitest';
import {
  BatchInputSchema,
  BatchOutputSchema,
  type BatchOutput,
  type Kit,
} from '@interview-prep/shared';

describe('Batch Evaluator Schema & Data Contract', () => {
  it('validates a correct batch input array', () => {
    const rawInput = [
      {
        id: 'case-1',
        jd: 'Senior Backend Engineer with Node.js and MongoDB experience.',
        company_url: 'https://example.com',
        days: 14,
      },
      {
        id: 'case-2',
        jd: 'Frontend Developer with React expertise.',
        company_url: 'http://localhost:8099/acme/',
        days: 7,
      },
    ];

    const result = BatchInputSchema.safeParse(rawInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(2);
      expect(result.data[0]?.id).toBe('case-1');
    }
  });

  it('rejects invalid batch inputs (missing fields, negative days)', () => {
    const invalidInputs = [
      {
        id: 'bad-1',
        company_url: 'https://example.com',
        days: 14,
        // missing jd
      },
      {
        id: 'bad-2',
        jd: 'Job description',
        company_url: 'https://example.com',
        days: -5, // invalid days
      },
    ];

    const result = BatchInputSchema.safeParse(invalidInputs);
    expect(result.success).toBe(false);
  });

  it('validates a complete BatchOutput with both success and failure cases', () => {
    const mockKit: Kit = {
      source: {
        company: 'Example',
        company_url: 'https://example.com',
        role: 'Engineer',
        location: 'Remote',
        jd_chars: 120,
        researched_at: new Date().toISOString(),
        pages_used: [{ url: 'https://example.com', title: 'Example' }],
      },
      company_brief: {
        summary: 'A tech firm',
        what_they_do: 'Software',
        sources: ['https://example.com'],
      },
      role: {
        title: 'Engineer',
        seniority: 'mid',
        responsibilities: ['Write code'],
        requirements: [{ id: 'r1', text: 'Node.js', kind: 'technical', priority: 'must' }],
      },
      questions: [
        {
          id: 'q1',
          requirement_ids: ['r1'],
          category: 'technical',
          prompt: 'Node event loop?',
          answer_outline: 'Phases',
          difficulty: 2,
        },
      ],
      flashcards: [
        { id: 'f1', requirement_ids: ['r1'], front: 'Event Loop', back: 'Single threaded execution model' },
      ],
      schedule: {
        days_available: 1,
        days: [
          {
            day: 1,
            focus: 'Node.js deep-dive',
            question_ids: ['q1'],
            minutes: 20,
          },
        ],
      },

      coverage: {
        uncovered_requirement_ids: [],
        passes: 1,
      },
    };

    const output: BatchOutput = {
      version: '1.0',
      generated_at: new Date().toISOString(),
      kits: [
        {
          id: 'case-1',
          status: 'ok',
          kit: mockKit,
          error: null,
        },
        {
          id: 'case-2',
          status: 'failed',
          kit: null,
          error: {
            code: 'COMPANY_UNREACHABLE',
            message: 'Failed to fetch company homepage within timeout',
          },
        },
      ],
    };

    const parsed = BatchOutputSchema.safeParse(output);
    expect(parsed.success).toBe(true);
  });
});
