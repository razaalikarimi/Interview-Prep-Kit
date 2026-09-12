'use client';

import React, { useState } from 'react';
import { kitsApi, type Question } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  Clock,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Loader2,
  AlertCircle,
  Coffee,
} from 'lucide-react';

interface ScheduleDay {
  day: number;
  focus: string;
  question_ids: string[];
  minutes: number;
}

interface Schedule {
  days_available: number;
  days: ScheduleDay[];
}

interface Props {
  kitId: string;
  schedule: Schedule;
  questions: Question[];
  version: number;
  onUpdate: () => void;
}

export function ScheduleTab({ kitId, schedule, questions, version, onUpdate }: Props) {
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1])); // Day 1 expanded by default
  const [regenerating, setRegenerating] = useState(false);
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [error, setError] = useState('');

  const questionMap = new Map(questions.map((q) => [q.id, q]));
  const totalMinutes = schedule.days.reduce((sum, d) => sum + d.minutes, 0);
  const avgMinutesPerDay =
    schedule.days.length > 0 ? Math.round(totalMinutes / schedule.days.length) : 0;

  const toggleDay = (dayNum: number) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dayNum)) next.delete(dayNum);
      else next.add(dayNum);
      return next;
    });
  };

  const handleConfirmRegenerate = async () => {
    setShowRegenModal(false);
    setRegenerating(true);
    setError('');
    try {
      await kitsApi.regenerate(kitId, { section: 'schedule', expectedVersion: version });
      onUpdate();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Schedule re-allocation failed');
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      {/* Error Alert */}
      {error && (
        <div className="p-3 rounded bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-900">Algorithmic Study Schedule</h2>
            <span className="text-xs text-gray-500 font-mono">
              ({schedule.days_available} Days)
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Deterministic daily workload allocation with higher-difficulty questions frontloaded.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowRegenModal(true)}
          disabled={regenerating}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded border border-gray-300 shadow-xs transition-colors disabled:opacity-50 self-start sm:self-auto"
        >
          {regenerating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
          )}
          <span>{regenerating ? 'Re-allocating...' : 'Re-allocate Schedule'}</span>
        </button>
      </div>

      {/* Telemetry Strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="enterprise-card p-3.5 text-center">
          <div className="text-[10px] font-mono uppercase text-gray-500 font-semibold">Duration</div>
          <div className="text-lg font-bold text-gray-900 mt-0.5">{schedule.days_available} Days</div>
        </div>

        <div className="enterprise-card p-3.5 text-center">
          <div className="text-[10px] font-mono uppercase text-gray-500 font-semibold">Total Commitment</div>
          <div className="text-lg font-bold text-indigo-600 mt-0.5">{totalMinutes} Minutes</div>
        </div>

        <div className="enterprise-card p-3.5 text-center">
          <div className="text-[10px] font-mono uppercase text-gray-500 font-semibold">Daily Average</div>
          <div className="text-lg font-bold text-gray-800 mt-0.5">{avgMinutesPerDay} Min / Day</div>
        </div>
      </div>

      {/* Day by Day Timeline */}
      <div className="space-y-3">
        {schedule.days.map((day) => {
          const isExpanded = expandedDays.has(day.day);
          const dayQuestions = day.question_ids
            .map((id) => questionMap.get(id))
            .filter((q): q is Question => q !== undefined);
          const isRestDay = day.question_ids.length === 0;

          return (
            <div key={day.day} className="enterprise-card overflow-hidden transition-colors">
              {/* Day Header Row */}
              <div
                onClick={() => toggleDay(day.day)}
                className="p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-gray-50/70"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    aria-label="Expand day"
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    )}
                  </button>

                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 flex-shrink-0">
                      DAY {day.day}
                    </span>

                    <span className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                      {day.focus}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {isRestDay ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                      <Coffee className="w-3 h-3 text-gray-400" /> Review Day
                    </span>
                  ) : (
                    <>
                      <span className="text-[11px] font-mono text-gray-500">
                        {day.question_ids.length} question{day.question_ids.length !== 1 ? 's' : ''}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-gray-50 border border-gray-200 text-gray-700 font-medium">
                        <Clock className="w-3 h-3 text-gray-400" /> {day.minutes} min
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Day Questions List */}
              {isExpanded && (
                <div className="px-5 pb-4 pt-1 border-t border-gray-100 bg-gray-50/40 text-xs">
                  {isRestDay ? (
                    <div className="p-4 rounded bg-white border border-gray-200 text-gray-600 leading-relaxed text-center my-2 shadow-xs">
                      <p className="font-semibold text-gray-800 mb-1">Rest &amp; Self-Paced Review Day</p>
                      <p className="text-[11px] text-gray-500 max-w-md mx-auto">
                        All required questions have been covered in previous days. Use this allocated block to review marked flashcards and brush up on lower-confidence concepts.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 mt-2">
                      {dayQuestions.map((q) => (
                        <div
                          key={q.id}
                          className="flex items-start justify-between gap-3 p-2.5 rounded bg-white border border-gray-200 shadow-xs"
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            <span className="font-mono text-[10px] text-gray-500 px-1 py-0.2 rounded bg-gray-50 border border-gray-200 mt-0.5">
                              {q.id}
                            </span>
                            <span className="text-gray-900 font-medium leading-relaxed">
                              {q.prompt}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <Badge variant={q.category}>{q.category}</Badge>
                            <Badge
                              variant={q.difficulty === 1 ? 'easy' : q.difficulty === 2 ? 'medium' : 'hard'}
                            >
                              {q.difficulty === 1 ? 'Easy' : q.difficulty === 2 ? 'Med' : 'Hard'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Schedule Regeneration Confirmation Modal */}
      <Modal
        isOpen={showRegenModal}
        onClose={() => setShowRegenModal(false)}
        title="Re-allocate Study Schedule"
        description="Recalculate daily question distribution and workload across your available preparation window."
        footer={
          <>
            <button
              onClick={() => setShowRegenModal(false)}
              className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 rounded transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmRegenerate}
              disabled={regenerating}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {regenerating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Confirm Re-allocation</span>
            </button>
          </>
        }
      >
        <div className="text-xs text-gray-700 space-y-3">
          <p>
            This action runs the deterministic schedule allocator to re-balance questions, daily focus topics, and preparation minutes across {schedule.days_available} days.
          </p>
          <div className="p-3 rounded bg-blue-50 border border-blue-200 text-blue-800">
            <span className="font-semibold text-blue-900">Preservation Guarantee: </span>
            No questions will be deleted or rewritten. Only their day assignments will be re-optimized.
          </div>
        </div>
      </Modal>
    </div>
  );
}
