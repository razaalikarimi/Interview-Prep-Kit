'use client';

import React, { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { kitsApi, type Flashcard } from '@/lib/api';
import { AppHeader } from '@/components/ui/AppHeader';
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  RotateCcw,
  Compass,
  Loader2,
} from 'lucide-react';

const CONFIDENCE_LEVELS = [
  { level: 1, label: 'Needs Review', sub: 'Did not know', color: 'hover:border-rose-300 hover:bg-rose-50' },
  { level: 2, label: 'Hard', sub: 'Struggled', color: 'hover:border-amber-300 hover:bg-amber-50' },
  { level: 3, label: 'Medium', sub: 'Partially recalled', color: 'hover:border-yellow-300 hover:bg-yellow-50' },
  { level: 4, label: 'Good', sub: 'Mostly solid', color: 'hover:border-blue-300 hover:bg-blue-50' },
  { level: 5, label: 'Mastered', sub: 'Immediate recall', color: 'hover:border-emerald-300 hover:bg-emerald-50' },
] as const;

export default function PracticePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionConfidence, setSessionConfidence] = useState<number[]>([]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    kitsApi
      .getFlashcardsOrdered(id)
      .then((cards) => {
        setFlashcards(cards);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user, authLoading, id, router]);

  const handleConfidence = useCallback(
    async (confidence: 1 | 2 | 3 | 4 | 5) => {
      const card = flashcards[currentIndex];
      if (!card) return;

      try {
        await kitsApi.recordPractice(id, { flashcardId: card.id, confidence });
      } catch {
        // Continue practice session even if telemetry fails
      }

      setSessionConfidence((prev) => [...prev, confidence]);
      setRevealed(false);
      setCurrentIndex((i) => i + 1);
    },
    [flashcards, currentIndex, id],
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        if (!revealed) {
          e.preventDefault();
          setRevealed(true);
        }
      } else if (revealed && ['1', '2', '3', '4', '5'].includes(e.key)) {
        const conf = parseInt(e.key) as 1 | 2 | 3 | 4 | 5;
        handleConfidence(conf);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [revealed, handleConfidence]);

  const card = flashcards[currentIndex];
  const isFinished = currentIndex >= flashcards.length && flashcards.length > 0;
  const progressPercent = flashcards.length > 0 ? (currentIndex / flashcards.length) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
      </div>
    );
  }

  const avgConfidence =
    sessionConfidence.length > 0
      ? (sessionConfidence.reduce((a, b) => a + b, 0) / sessionConfidence.length).toFixed(1)
      : '0.0';

  const masteredCount = sessionConfidence.filter((c) => c >= 4).length;
  const reviewCount = sessionConfidence.filter((c) => c <= 2).length;

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col text-gray-900">
      <AppHeader />

      {/* Navigation & Telemetry Bar */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link
            href={`/kits/${id}`}
            className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Kit Workspace</span>
          </Link>

          <div className="flex items-center gap-4 text-xs font-mono text-gray-500">
            <span>
              Card {Math.min(currentIndex + 1, flashcards.length)} / {flashcards.length}
            </span>
            <span className="text-gray-300">|</span>
            <span>{sessionConfidence.length} Completed</span>
          </div>
        </div>

        {/* Progress Strip */}
        <div className="h-1 bg-gray-100 overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-200"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Studio Area */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-12 flex flex-col justify-center">
        {isFinished ? (
          /* Session Completed Summary */
          <div className="enterprise-card p-8 text-center animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-200">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-1">Practice Session Completed</h2>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mb-6">
              You reviewed {sessionConfidence.length} flashcards in this session. Spaced repetition telemetry has been updated.
            </p>

            {/* Session Stats */}
            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto mb-8 text-center">
              <div className="p-3 rounded bg-gray-50 border border-gray-200">
                <div className="text-[11px] font-mono text-gray-500 uppercase font-semibold">Avg Score</div>
                <div className="text-xl font-bold text-gray-900 mt-0.5">{avgConfidence} / 5</div>
              </div>
              <div className="p-3 rounded bg-gray-50 border border-gray-200">
                <div className="text-[11px] font-mono text-gray-500 uppercase font-semibold">Mastered (4-5)</div>
                <div className="text-xl font-bold text-emerald-600 mt-0.5">{masteredCount}</div>
              </div>
              <div className="p-3 rounded bg-gray-50 border border-gray-200">
                <div className="text-[11px] font-mono text-gray-500 uppercase font-semibold">Needs Review (1-2)</div>
                <div className="text-xl font-bold text-rose-600 mt-0.5">{reviewCount}</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => {
                  setCurrentIndex(0);
                  setRevealed(false);
                  setSessionConfidence([]);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Practice Deck Again
              </button>

              <Link
                href={`/kits/${id}/radar`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded border border-gray-300 shadow-xs transition-colors"
              >
                <Compass className="w-3.5 h-3.5 text-gray-500" />
                Inspect Weakness Radar
              </Link>

              <Link
                href={`/kits/${id}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
              >
                Return to Kit
              </Link>
            </div>
          </div>
        ) : flashcards.length === 0 ? (
          <div className="enterprise-card p-10 text-center text-xs text-gray-500">
            <p className="mb-4">No flashcards available to practice.</p>
            <Link
              href={`/kits/${id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Kit
            </Link>
          </div>
        ) : (
          /* Active Card View */
          <div className="space-y-6">
            <div className="enterprise-card p-8 min-h-[320px] flex flex-col justify-between border-gray-200 shadow-md">
              <div>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500 font-semibold">
                    Card {currentIndex + 1} of {flashcards.length} · {card.id}
                  </span>

                  {card.requirement_ids && card.requirement_ids.length > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-100 border border-gray-200 text-gray-600">
                      Req: {card.requirement_ids.join(', ')}
                    </span>
                  )}
                </div>

                {/* Prompt */}
                <div className="my-6">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-gray-500 block mb-2 font-semibold">
                    Question
                  </span>
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 leading-relaxed">
                    {card.front}
                  </h2>
                </div>

                {/* Revealed Answer */}
                {revealed ? (
                  <div className="pt-6 border-t border-gray-100 animate-fade-in">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-700 font-semibold block mb-2">
                      Answer / Key Concept
                    </span>
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-sans">
                      {card.back}
                    </p>
                  </div>
                ) : null}
              </div>

              {/* Action Button: Reveal Answer */}
              {!revealed && (
                <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] text-gray-500 hidden sm:inline">
                    Press <kbd className="font-mono bg-gray-100 border border-gray-300 px-1 py-0.5 rounded text-gray-600">Space</kbd> to reveal
                  </span>

                  <button
                    type="button"
                    onClick={() => setRevealed(true)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors shadow-sm ml-auto"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Reveal Answer</span>
                  </button>
                </div>
              )}
            </div>

            {/* Confidence Selector (shown when revealed) */}
            {revealed && (
              <div className="enterprise-card p-5 animate-fade-in">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-gray-700">
                    How confident were you with this concept?
                  </span>
                  <span className="text-[11px] text-gray-500 hidden sm:inline">
                    Press keys <kbd className="font-mono bg-gray-100 border border-gray-300 px-1 py-0.5 rounded text-gray-600">1</kbd> - <kbd className="font-mono bg-gray-100 border border-gray-300 px-1 py-0.5 rounded text-gray-600">5</kbd>
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {CONFIDENCE_LEVELS.map((c) => (
                    <button
                      key={c.level}
                      onClick={() => handleConfidence(c.level as 1 | 2 | 3 | 4 | 5)}
                      className={`p-2.5 rounded bg-white border border-gray-200 text-center transition-all ${c.color} shadow-xs group`}
                    >
                      <div className="text-xs font-mono font-bold text-gray-900">
                        {c.level}
                      </div>
                      <div className="text-[10px] font-medium text-gray-700 truncate mt-0.5">
                        {c.label}
                      </div>
                      <div className="text-[9px] text-gray-500 hidden md:block truncate mt-0.5">
                        {c.sub}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
