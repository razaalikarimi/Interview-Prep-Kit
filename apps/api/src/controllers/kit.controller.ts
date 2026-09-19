import { Router, type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import {
  CreateKitRequestSchema,
  RegenerateRequestSchema,
  UpdateQuestionSchema,
  CreateQuestionSchema,
  UpdateFlashcardSchema,
  CreateFlashcardSchema,
  UpdateCompanyBriefSchema,
  PracticeRecordSchema,
  ErrorCodes,
  QUESTION_CATEGORIES,
} from '@interview-prep/shared';
import { requireAuth } from '../middleware/auth.middleware.js';
import { KitModel } from '../infrastructure/database/models/kit.model.js';
import { PracticeProgress } from '../infrastructure/database/models/practice.model.js';
import { runGenerationPipeline, createFingerprint } from '../services/generation.service.js';
import {
  mergeQuestions,
  mergeFlashcards,
  applyQuestionEdit,
  applyFlashcardEdit,
  setQuestionPinned,
} from '../domain/regeneration.js';
import {
  generateQuestionsForCategory,
} from '../services/question.service.js';
import { generateFlashcards } from '../services/flashcard.service.js';
import { researchCompany } from '../services/research.service.js';
import { allocateSchedule } from '../domain/schedule.js';
import { checkCoverage } from '../domain/coverage.js';
import { computeWeaknessRadar, computeFlashcardPriority } from '../domain/weakness.js';

import { createLLMClient } from '../infrastructure/llm/gemini.js';
import { validateSSRF } from '../infrastructure/crawler/ssrf.js';
import { logger } from '../utils/logger.js';

// ============================================================
// KIT CONTROLLER — REST API
// Thin controllers, all business logic in services/domain.
// Every kit query scoped by authenticated userId.
// ============================================================

export const kitRouter = Router();

// Rate limit on expensive generation endpoint
const generationRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many generation requests' } },
  keyGenerator: (req) => req.user?.userId ?? req.ip ?? 'unknown',
});

function requireOwnership(kitUserId: string, requestUserId: string): void {
  if (kitUserId !== requestUserId) {
    throw new Error(`${ErrorCodes.FORBIDDEN}: Access denied`);
  }
}

// GET /api/kits
kitRouter.get('/', requireAuth, async (req: Request, res: Response, next) => {
  try {
    const kits = await KitModel.find({ userId: req.user!.userId })
      .sort({ createdAt: -1 })
      .select('generationStatus generationProgress kit.source kit.role.title createdAt updatedAt version');

    const response = kits.map((k) => ({
      id: k._id.toString(),
      company: k.kit?.source?.company ?? 'Unknown',
      role: k.kit?.role?.title ?? k.kit?.source?.role ?? 'Unknown',
      status: k.generationStatus,
      daysAvailable: k.kit?.schedule?.days_available ?? 0,
      createdAt: k.createdAt.toISOString(),
      updatedAt: k.updatedAt.toISOString(),
      progress: k.generationProgress,
      version: k.version,
    }));

    res.json({ success: true, data: response });
  } catch (err) {
    next(err);
  }
});

// POST /api/kits
kitRouter.post('/', requireAuth, generationRateLimit, async (req: Request, res: Response, next) => {
  try {
    const validated = CreateKitRequestSchema.parse(req.body);
    const isEvalMode = process.env['EVAL_MODE'] === 'true';

    // SSRF validation before accepting the URL
    await validateSSRF(validated.companyUrl, isEvalMode);

    const fingerprint = createFingerprint(validated.jobDescription, validated.companyUrl);

    // Check for duplicate (same JD + URL for same user, already completed)
    // Only deduplicate completed kits — allow regeneration of failed ones
    const existingCompleted = await KitModel.findOne({
      userId: req.user!.userId,
      fingerprint,
      generationStatus: 'completed',
    });

    if (existingCompleted) {
      res.json({
        success: true,
        data: {
          kitId: existingCompleted._id.toString(),
          status: existingCompleted.generationStatus,
          message: 'Kit already exists for this job description and company',
          isDuplicate: true,
        },
      });
      return;
    }

    // Check if a kit is already running for this fingerprint
    const existingRunning = await KitModel.findOne({
      userId: req.user!.userId,
      fingerprint,
      generationStatus: { $in: ['queued', 'running'] },
    });

    if (existingRunning) {
      res.status(409).json({
        success: false,
        error: {
          code: ErrorCodes.KIT_ALREADY_RUNNING,
          message: 'A kit with this job description is already being generated',
        },
      });
      return;
    }

    // Create kit record
    const kit = await KitModel.create({
      userId: req.user!.userId,
      fingerprint,
      generationStatus: 'queued',
      generationProgress: {
        status: 'queued',
        percentage: 0,
        completedStages: [],
        warnings: [],
        startedAt: new Date().toISOString(),
      },
      kit: null,
      version: 0,
    });

    const kitId = kit._id.toString();

    // Start pipeline asynchronously (non-blocking)
    setImmediate(() => {
      runGenerationPipeline({
        kitId,
        userId: req.user!.userId,
        jobDescription: validated.jobDescription,
        companyUrl: validated.companyUrl,
        daysAvailable: validated.daysAvailable,
        companyName: validated.companyName,
        role: validated.role,
        location: validated.location,
        isEvalMode,
      }).catch((err) => {
        logger.error('Pipeline error (unhandled)', { kitId, error: err.message });
      });
    });

    res.status(202).json({
      success: true,
      data: { kitId, status: 'queued', message: 'Kit generation started' },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/kits/:id
kitRouter.get('/:id', requireAuth, async (req: Request, res: Response, next) => {
  try {
    const kit = await KitModel.findById(req.params['id']);
    if (!kit) {
      res.status(404).json({ success: false, error: { code: ErrorCodes.KIT_NOT_FOUND, message: 'Kit not found' } });
      return;
    }

    requireOwnership(kit.userId.toString(), req.user!.userId);

    res.json({
      success: true,
      data: {
        id: kit._id.toString(),
        company: kit.kit?.source?.company ?? 'Unknown',
        role: kit.kit?.role?.title ?? 'Unknown',
        status: kit.generationStatus,
        daysAvailable: kit.kit?.schedule?.days_available ?? 0,
        createdAt: kit.createdAt.toISOString(),
        updatedAt: kit.updatedAt.toISOString(),
        progress: kit.generationProgress,
        kit: kit.kit,
        version: kit.version,
      },
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/kits/:id
kitRouter.delete('/:id', requireAuth, async (req: Request, res: Response, next) => {
  try {
    const kit = await KitModel.findById(req.params['id']);
    if (!kit) {
      res.status(404).json({ success: false, error: { code: ErrorCodes.KIT_NOT_FOUND, message: 'Kit not found' } });
      return;
    }
    requireOwnership(kit.userId.toString(), req.user!.userId);
    await kit.deleteOne();
    res.json({ success: true, data: { message: 'Kit deleted' } });
  } catch (err) {
    next(err);
  }
});

// GET /api/kits/:id/progress
kitRouter.get('/:id/progress', requireAuth, async (req: Request, res: Response, next) => {
  try {
    const kit = await KitModel.findById(req.params['id']).select('userId generationStatus generationProgress');
    if (!kit) {
      res.status(404).json({ success: false, error: { code: ErrorCodes.KIT_NOT_FOUND, message: 'Kit not found' } });
      return;
    }
    requireOwnership(kit.userId.toString(), req.user!.userId);
    res.json({ success: true, data: { status: kit.generationStatus, progress: kit.generationProgress } });
  } catch (err) {
    next(err);
  }
});

// POST /api/kits/:id/regenerate
kitRouter.post('/:id/regenerate', requireAuth, generationRateLimit, async (req: Request, res: Response, next) => {
  try {
    const kitDoc = await KitModel.findById(req.params['id']);
    if (!kitDoc) {
      res.status(404).json({ success: false, error: { code: ErrorCodes.KIT_NOT_FOUND, message: 'Kit not found' } });
      return;
    }
    requireOwnership(kitDoc.userId.toString(), req.user!.userId);

    if (!kitDoc.kit) {
      res.status(400).json({ success: false, error: { code: ErrorCodes.KIT_NOT_READY, message: 'Kit generation is still in progress' } });
      return;
    }


    const validated = RegenerateRequestSchema.parse(req.body);

    // Optimistic concurrency check
    if (
      validated.expectedVersion !== undefined &&
      validated.expectedVersion !== kitDoc.version
    ) {
      res.status(409).json({
        success: false,
        error: { code: ErrorCodes.CONCURRENT_UPDATE, message: 'Kit has been modified. Please refresh.' },
      });
      return;
    }

    const llm = createLLMClient();
    const kit = kitDoc.kit;

    if (validated.section === 'company-brief') {
      const isEvalMode = process.env['EVAL_MODE'] === 'true';
      const research = await researchCompany(
        llm,
        kit.source.company_url,
        kit.source.company,
        isEvalMode,
      );

      await KitModel.findByIdAndUpdate(
        kitDoc._id,
        {
          'kit.company_brief': research.companyBrief,
          $inc: { version: 1 },
          updatedAt: new Date(),
        },
        { new: true },
      );
    } else if (validated.section === 'questions') {
      const category = validated.category;
      if (!category || !QUESTION_CATEGORIES.includes(category)) {
        res.status(400).json({
          success: false,
          error: { code: ErrorCodes.INVALID_INPUT, message: 'Category required for question regeneration' },
        });
        return;
      }

      const companyContext = `${kit.company_brief.summary}\n${kit.company_brief.what_they_do}`;
      const newQuestions = await generateQuestionsForCategory(
        llm,
        category,
        kit.role.requirements,
        companyContext,
        null,
        kit.role.title,
        kit.role.seniority,
        (kit.questions?.length ?? 0) + 100,
      );

      const { merged } = mergeQuestions(kit.questions ?? [], newQuestions, category);

      // Re-run coverage and validate
      const coverage = checkCoverage(kit.role.requirements, merged, kit.coverage.passes);

      await KitModel.findByIdAndUpdate(
        kitDoc._id,
        {
          'kit.questions': merged,
          'kit.coverage': { uncovered_requirement_ids: coverage.uncovered_requirement_ids, passes: coverage.passes },
          $inc: { version: 1 },
          updatedAt: new Date(),
        },
        { new: true },
      );
    } else if (validated.section === 'flashcards') {
      const newFlashcards = await generateFlashcards(
        llm,
        kit.role.requirements,
        kit.questions ?? [],
        kit.role.title,
      );
      const { merged } = mergeFlashcards(kit.flashcards ?? [], newFlashcards);
      const numbered = merged.map((f, idx) => ({ ...f, id: `f${idx + 1}` }));

      await KitModel.findByIdAndUpdate(
        kitDoc._id,
        {
          'kit.flashcards': numbered,
          $inc: { version: 1 },
          updatedAt: new Date(),
        },
        { new: true },
      );
    } else if (validated.section === 'schedule') {
      const schedule = allocateSchedule(
        kit.role.requirements,
        kit.questions ?? [],
        kit.schedule.days_available,
      );

      await KitModel.findByIdAndUpdate(
        kitDoc._id,
        {
          'kit.schedule': schedule,
          $inc: { version: 1 },
          updatedAt: new Date(),
        },
        { new: true },
      );
    }

    const updated = await KitModel.findById(kitDoc._id);
    res.json({ success: true, data: { message: 'Section regenerated', kit: updated?.kit, version: updated?.version } });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/kits/:id/company-brief
kitRouter.patch('/:id/company-brief', requireAuth, async (req: Request, res: Response, next) => {
  try {
    const kitDoc = await KitModel.findById(req.params['id']);
    if (!kitDoc) {
      res.status(404).json({ success: false, error: { code: ErrorCodes.KIT_NOT_FOUND, message: 'Kit not found' } });
      return;
    }
    requireOwnership(kitDoc.userId.toString(), req.user!.userId);

    if (!kitDoc.kit) {
      res.status(400).json({ success: false, error: { code: ErrorCodes.KIT_NOT_READY, message: 'Kit generation is still in progress' } });
      return;
    }


    const validated = UpdateCompanyBriefSchema.parse(req.body);
    const updatedBrief = {
      ...kitDoc.kit.company_brief,
      ...validated,
      state: {
        origin: 'generated' as const,
        edited: true,
        pinned: false,
        version: (kitDoc.kit.company_brief?.state?.version ?? 0) + 1,
        editedAt: new Date().toISOString(),
      },
    };

    await KitModel.findByIdAndUpdate(
      kitDoc._id,
      { 'kit.company_brief': updatedBrief, $inc: { version: 1 } },
    );

    res.json({ success: true, data: { company_brief: updatedBrief } });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/kits/:id/questions/:questionId
kitRouter.patch('/:id/questions/:questionId', requireAuth, async (req: Request, res: Response, next) => {
  try {
    const kitDoc = await KitModel.findById(req.params['id']);
    if (!kitDoc) {
      res.status(404).json({ success: false, error: { code: ErrorCodes.KIT_NOT_FOUND, message: 'Kit not found' } });
      return;
    }
    requireOwnership(kitDoc.userId.toString(), req.user!.userId);

    if (!kitDoc.kit) {
      res.status(400).json({ success: false, error: { code: ErrorCodes.KIT_NOT_READY, message: 'Kit generation is still in progress' } });
      return;
    }


    const validated = UpdateQuestionSchema.parse(req.body);
    const questions = kitDoc.kit.questions ?? [];
    const qIndex = questions.findIndex((q) => q.id === req.params['questionId']);

    if (qIndex === -1) {
      res.status(404).json({ success: false, error: { code: ErrorCodes.QUESTION_NOT_FOUND, message: 'Question not found' } });
      return;
    }

    const existingQ = questions[qIndex]!;
    let updatedQ = existingQ;

    if (validated.pinned !== undefined) {
      updatedQ = setQuestionPinned(existingQ, validated.pinned);
    }

    const { pinned: _pinned, order: _order, ...editableFields } = validated;
    const hasEdit = Object.values(editableFields).some((v) => v !== undefined);

    if (hasEdit) {
      updatedQ = applyQuestionEdit(updatedQ, editableFields);
    }

    // Handle reordering
    let updatedQuestions = [...questions];
    updatedQuestions[qIndex] = updatedQ;

    if (validated.order !== undefined) {
      updatedQuestions.splice(qIndex, 1);
      updatedQuestions.splice(validated.order, 0, updatedQ);
    }

    await KitModel.findByIdAndUpdate(
      kitDoc._id,
      { 'kit.questions': updatedQuestions, $inc: { version: 1 } },
    );

    res.json({ success: true, data: { question: updatedQ } });
  } catch (err) {
    next(err);
  }
});

// POST /api/kits/:id/questions
kitRouter.post('/:id/questions', requireAuth, async (req: Request, res: Response, next) => {
  try {
    const kitDoc = await KitModel.findById(req.params['id']);
    if (!kitDoc) {
      res.status(404).json({ success: false, error: { code: ErrorCodes.KIT_NOT_FOUND, message: 'Kit not found' } });
      return;
    }
    requireOwnership(kitDoc.userId.toString(), req.user!.userId);

    if (!kitDoc.kit) {
      res.status(400).json({ success: false, error: { code: ErrorCodes.KIT_NOT_READY, message: 'Kit generation is still in progress' } });
      return;
    }


    const validated = CreateQuestionSchema.parse(req.body);
    const newQuestion = {
      ...validated,
      id: `q_${uuidv4().substring(0, 8)}`,
      state: { origin: 'user-added' as const, edited: false, pinned: false, version: 1 },
    };

    await KitModel.findByIdAndUpdate(
      kitDoc._id,
      { $push: { 'kit.questions': newQuestion }, $inc: { version: 1 } },
    );

    res.status(201).json({ success: true, data: { question: newQuestion } });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/kits/:id/questions/:questionId
kitRouter.delete('/:id/questions/:questionId', requireAuth, async (req: Request, res: Response, next) => {
  try {
    const kitDoc = await KitModel.findById(req.params['id']);
    if (!kitDoc) {
      res.status(404).json({ success: false, error: { code: ErrorCodes.KIT_NOT_FOUND, message: 'Kit not found' } });
      return;
    }
    requireOwnership(kitDoc.userId.toString(), req.user!.userId);

    if (!kitDoc.kit) {
      res.status(400).json({ success: false, error: { code: ErrorCodes.KIT_NOT_READY, message: 'Kit generation is still in progress' } });
      return;
    }


    await KitModel.findByIdAndUpdate(
      kitDoc._id,
      {
        $pull: { 'kit.questions': { id: req.params['questionId'] } },
        $inc: { version: 1 },
      },
    );

    res.json({ success: true, data: { message: 'Question deleted' } });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/kits/:id/flashcards/:flashcardId
kitRouter.patch('/:id/flashcards/:flashcardId', requireAuth, async (req: Request, res: Response, next) => {
  try {
    const kitDoc = await KitModel.findById(req.params['id']);
    if (!kitDoc) {
      res.status(404).json({ success: false, error: { code: ErrorCodes.KIT_NOT_FOUND, message: 'Kit not found' } });
      return;
    }
    requireOwnership(kitDoc.userId.toString(), req.user!.userId);

    if (!kitDoc.kit) {
      res.status(400).json({ success: false, error: { code: ErrorCodes.KIT_NOT_READY, message: 'Kit generation is still in progress' } });
      return;
    }


    const validated = UpdateFlashcardSchema.parse(req.body);
    const flashcards = kitDoc.kit.flashcards ?? [];
    const fIndex = flashcards.findIndex((f) => f.id === req.params['flashcardId']);

    if (fIndex === -1) {
      res.status(404).json({ success: false, error: { code: ErrorCodes.FLASHCARD_NOT_FOUND, message: 'Flashcard not found' } });
      return;
    }

    const existing = flashcards[fIndex]!;
    const { pinned: _pinned, ...editFields } = validated;
    let updated = applyFlashcardEdit(existing, editFields);
    if (validated.pinned !== undefined) {
      updated = {
        ...updated,
        state: { ...updated.state!, pinned: validated.pinned },
      };
    }

    const updatedFlashcards = [...flashcards];
    updatedFlashcards[fIndex] = updated;

    await KitModel.findByIdAndUpdate(
      kitDoc._id,
      { 'kit.flashcards': updatedFlashcards, $inc: { version: 1 } },
    );

    res.json({ success: true, data: { flashcard: updated } });
  } catch (err) {
    next(err);
  }
});

// POST /api/kits/:id/flashcards
kitRouter.post('/:id/flashcards', requireAuth, async (req: Request, res: Response, next) => {
  try {
    const kitDoc = await KitModel.findById(req.params['id']);
    if (!kitDoc) {
      res.status(404).json({ success: false, error: { code: ErrorCodes.KIT_NOT_FOUND, message: 'Kit not found' } });
      return;
    }
    requireOwnership(kitDoc.userId.toString(), req.user!.userId);

    if (!kitDoc.kit) {
      res.status(400).json({ success: false, error: { code: ErrorCodes.KIT_NOT_READY, message: 'Kit generation is still in progress' } });
      return;
    }


    const validated = CreateFlashcardSchema.parse(req.body);
    const newCard = {
      ...validated,
      id: `f_${uuidv4().substring(0, 8)}`,
      state: { origin: 'user-added' as const, edited: false, pinned: false, version: 1 },
    };

    await KitModel.findByIdAndUpdate(
      kitDoc._id,
      { $push: { 'kit.flashcards': newCard }, $inc: { version: 1 } },
    );

    res.status(201).json({ success: true, data: { flashcard: newCard } });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/kits/:id/flashcards/:flashcardId
kitRouter.delete('/:id/flashcards/:flashcardId', requireAuth, async (req: Request, res: Response, next) => {
  try {
    const kitDoc = await KitModel.findById(req.params['id']);
    if (!kitDoc) {
      res.status(404).json({ success: false, error: { code: ErrorCodes.KIT_NOT_FOUND, message: 'Kit not found' } });
      return;
    }
    requireOwnership(kitDoc.userId.toString(), req.user!.userId);

    if (!kitDoc.kit) {
      res.status(400).json({ success: false, error: { code: ErrorCodes.KIT_NOT_READY, message: 'Kit generation is still in progress' } });
      return;
    }


    await KitModel.findByIdAndUpdate(
      kitDoc._id,
      {
        $pull: { 'kit.flashcards': { id: req.params['flashcardId'] } },
        $inc: { version: 1 },
      },
    );

    res.json({ success: true, data: { message: 'Flashcard deleted' } });
  } catch (err) {
    next(err);
  }
});

// POST /api/kits/:id/practice
kitRouter.post('/:id/practice', requireAuth, async (req: Request, res: Response, next) => {
  try {
    const kitDoc = await KitModel.findById(req.params['id']);
    if (!kitDoc) {
      res.status(404).json({ success: false, error: { code: ErrorCodes.KIT_NOT_FOUND, message: 'Kit not found' } });
      return;
    }
    requireOwnership(kitDoc.userId.toString(), req.user!.userId);

    if (!kitDoc.kit) {
      res.status(400).json({ success: false, error: { code: ErrorCodes.KIT_NOT_READY, message: 'Kit generation is still in progress' } });
      return;
    }


    const validated = PracticeRecordSchema.parse(req.body);

    await PracticeProgress.findOneAndUpdate(
      { userId: req.user!.userId, kitId: kitDoc._id },
      {
        $push: {
          records: {
            flashcardId: validated.flashcardId,
            confidence: validated.confidence,
            practicedAt: new Date(),
          },
        },
      },
      { upsert: true, new: true },
    );

    res.json({ success: true, data: { message: 'Practice recorded' } });
  } catch (err) {
    next(err);
  }
});

// GET /api/kits/:id/progress-report
kitRouter.get('/:id/progress-report', requireAuth, async (req: Request, res: Response, next) => {
  try {
    const kitDoc = await KitModel.findById(req.params['id']);
    if (!kitDoc) {
      res.status(404).json({ success: false, error: { code: ErrorCodes.KIT_NOT_FOUND, message: 'Kit not found' } });
      return;
    }
    requireOwnership(kitDoc.userId.toString(), req.user!.userId);

    if (!kitDoc.kit) {
      res.status(400).json({ success: false, error: { code: ErrorCodes.KIT_NOT_READY, message: 'Kit generation is still in progress' } });
      return;
    }


    const practiceDoc = await PracticeProgress.findOne({
      userId: req.user!.userId,
      kitId: kitDoc._id,
    });

    const records = practiceDoc?.records ?? [];
    const flashcards = kitDoc.kit.flashcards ?? [];
    const practicedIds = new Set(records.map((r) => r.flashcardId));
    const totalFlashcards = flashcards.length;
    const practicedFlashcards = flashcards.filter((f) => practicedIds.has(f.id)).length;

    res.json({
      success: true,
      data: {
        totalFlashcards,
        practicedFlashcards,
        practicePercentage: totalFlashcards > 0 ? Math.round((practicedFlashcards / totalFlashcards) * 100) : 0,
        practiceRecordCount: records.length,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/kits/:id/flashcards-ordered
kitRouter.get('/:id/flashcards-ordered', requireAuth, async (req: Request, res: Response, next) => {
  try {
    const kitDoc = await KitModel.findById(req.params['id']).lean();
    if (!kitDoc) {
      res.status(404).json({ success: false, error: { code: ErrorCodes.KIT_NOT_FOUND, message: 'Kit not found' } });
      return;
    }
    requireOwnership(kitDoc.userId.toString(), req.user!.userId);

    if (!kitDoc.kit) {
      res.status(400).json({ success: false, error: { code: ErrorCodes.KIT_NOT_READY, message: 'Kit generation is still in progress' } });
      return;
    }

    const practiceDoc = await PracticeProgress.findOne({
      userId: req.user!.userId,
      kitId: kitDoc._id,
    }).lean();

    const records = practiceDoc?.records ?? [];
    const flashcards = kitDoc.kit.flashcards ?? [];
    const requirements = kitDoc.kit.role.requirements ?? [];

    const orderedFlashcards = flashcards
      .map((f: any) => {
        const cardRecords = records.filter((r) => r.flashcardId === f.id);
        const latestRecord = cardRecords.sort(
          (a, b) => new Date(b.practicedAt).getTime() - new Date(a.practicedAt).getTime(),
        )[0];
        const priorityScore = computeFlashcardPriority(f, requirements, records as any);
        const flashcardObj = typeof f.toObject === 'function' ? f.toObject() : (f._doc ? { ...f._doc, ...f } : f);

        return {
          ...flashcardObj,
          lastConfidence: latestRecord?.confidence,
          lastPracticedAt: latestRecord?.practicedAt ? new Date(latestRecord.practicedAt).toISOString() : undefined,
          practiceCount: cardRecords.length,
          priorityScore,
        };
      })
      .sort((a, b) => b.priorityScore - a.priorityScore);

    res.json({ success: true, data: orderedFlashcards });
  } catch (err) {
    next(err);
  }
});

// GET /api/kits/:id/weakness-radar
kitRouter.get('/:id/weakness-radar', requireAuth, async (req: Request, res: Response, next) => {
  try {
    const kitDoc = await KitModel.findById(req.params['id']);
    if (!kitDoc) {
      res.status(404).json({ success: false, error: { code: ErrorCodes.KIT_NOT_FOUND, message: 'Kit not found' } });
      return;
    }
    requireOwnership(kitDoc.userId.toString(), req.user!.userId);

    if (!kitDoc.kit) {
      res.status(400).json({ success: false, error: { code: ErrorCodes.KIT_NOT_READY, message: 'Kit generation is still in progress' } });
      return;
    }


    const practiceDoc = await PracticeProgress.findOne({
      userId: req.user!.userId,
      kitId: kitDoc._id,
    });

    const radar = computeWeaknessRadar(
      kitDoc.kit.role.requirements ?? [],
      kitDoc.kit.questions ?? [],
      kitDoc.kit.flashcards ?? [],
      practiceDoc?.records ?? [],
    );

    res.json({ success: true, data: radar });
  } catch (err) {
    next(err);
  }
});
