'use client';

import React, { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { kitsApi, type GenerationProgress } from '@/lib/api';
import { AppHeader } from '@/components/ui/AppHeader';
import {
  CheckCircle2,
  Circle,
  Loader2,
  AlertCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';

const PIPELINE_STAGES = [
  { key: 'validating', label: 'Input validation & SSRF security check' },
  { key: 'extracting_requirements', label: 'Verbatim job requirement extraction' },
  { key: 'researching_company', label: 'Autonomous company website crawl & link ranking' },
  { key: 'finding_hiring_process', label: 'Hiring process & engineering signals analysis' },
  { key: 'researching_public_interviews', label: 'Public interview process evidence synthesis' },
  { key: 'generating_questions', label: 'Category question generation (Technical, Behavioural, System Design, Fit)' },
  { key: 'generating_flashcards', label: 'Knowledge flashcards & answer synthesis' },
  { key: 'checking_coverage', label: 'Deterministic requirement coverage analysis' },
  { key: 'closing_coverage_gaps', label: 'Targeted gap-closing second pass' },
  { key: 'allocating_schedule', label: 'Deterministic timeline & study minute allocation' },
  { key: 'validating_kit', label: 'Appendix A schema contract validation' },
  { key: 'saving', label: 'Persisting kit & state versioning' },
];

export default function KitProgressPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [status, setStatus] = useState<string>('queued');
  const [error, setError] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Elapsed timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Poll progress endpoint
  useEffect(() => {
    let stopped = false;

    const poll = async () => {
      try {
        const data = await kitsApi.getProgress(id);
        if (stopped) return;
        setProgress(data.progress);
        setStatus(data.status);

        if (data.status === 'completed' || data.status === 'partial') {
          setTimeout(() => router.push(`/kits/${id}`), 800);
          return;
        }

        if (data.status === 'failed') {
          setError(data.progress.error ?? 'Generation pipeline encountered an unrecoverable error.');
          return;
        }
      } catch {
        if (!stopped) {
          // Retry on transient network blip
        }
      }
      if (!stopped) setTimeout(poll, 1500);
    };

    poll();
    return () => {
      stopped = true;
    };
  }, [id, router]);

  const completedKeys = new Set(progress?.completedStages ?? []);
  const currentStage = progress?.stage;
  const warnings = progress?.warnings ?? [];
  const percent = Math.min(100, Math.max(5, progress?.percentage ?? 5));

  const formatElapsed = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100">
      <AppHeader />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-12">
        {/* Header Telemetry */}
        <div className="enterprise-card p-6 mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-medium">
                Pipeline Execution
              </span>
              <h1 className="text-lg font-semibold text-white mt-0.5">
                {status === 'completed' || status === 'partial'
                  ? 'Kit Ready — Redirecting to Workspace...'
                  : status === 'failed'
                  ? 'Pipeline Execution Terminated'
                  : 'Preparing Your Interview Preparation Kit'}
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Executing multi-stage deterministic generation pipeline across crawler, LLM synthesizer, and schedule allocator.
              </p>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{formatElapsed(elapsedSeconds)}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono text-slate-400">
              <span className="capitalize text-slate-300">
                {currentStage ? currentStage.replace(/_/g, ' ') : 'Initializing...'}
              </span>
              <span>{percent}%</span>
            </div>
            <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Failure State */}
        {status === 'failed' && (
          <div className="enterprise-card p-5 border-red-500/30 bg-red-500/5 mb-6 text-xs text-red-300">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="font-semibold text-red-200 text-sm">Pipeline Execution Error</h2>
                <p className="mt-1 leading-relaxed">{error}</p>
                <div className="mt-4 flex items-center gap-3">
                  <Link
                    href="/kits/new"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-200 font-medium rounded border border-red-500/30 transition-colors"
                  >
                    Reconfigure Parameters
                  </Link>
                  <Link
                    href="/dashboard"
                    className="text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    Back to Dashboard
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Warnings Stream */}
        {warnings.length > 0 && (
          <div className="enterprise-card p-4 border-amber-500/20 bg-amber-500/5 mb-6 text-xs text-amber-300 space-y-1">
            <div className="flex items-center gap-1.5 font-medium text-amber-200 mb-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Pipeline Notice</span>
            </div>
            {warnings.map((w, i) => (
              <p key={i} className="text-slate-300">
                • {w}
              </p>
            ))}
          </div>
        )}

        {/* Process Checklist */}
        <div className="enterprise-card p-6">
          <h2 className="text-xs font-mono font-medium text-slate-500 uppercase tracking-wider mb-4 pb-2 border-b border-slate-800">
            Stage Verification Log
          </h2>

          <div className="space-y-3">
            {PIPELINE_STAGES.map((stage) => {
              const isCompleted = completedKeys.has(stage.key);
              const isCurrent = currentStage === stage.key && status === 'running';

              return (
                <div
                  key={stage.key}
                  className={`flex items-center gap-3 text-xs transition-colors ${
                    isCompleted
                      ? 'text-slate-200'
                      : isCurrent
                      ? 'text-blue-400 font-medium'
                      : 'text-slate-600'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-700" />
                    )}
                  </div>
                  <span className="flex-1">{stage.label}</span>
                  {isCompleted && (
                    <span className="text-[11px] font-mono text-slate-500">Verified</span>
                  )}
                  {isCurrent && (
                    <span className="text-[11px] font-mono text-blue-400">Processing</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
