'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { kitsApi, type WeaknessRadar, type WeaknessRadarItem } from '@/lib/api';
import { AppHeader } from '@/components/ui/AppHeader';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import {
  ArrowLeft,
  BookOpen,
  Compass,
  Loader2,
  Target,
  ArrowRight,
} from 'lucide-react';

const STATUS_VARIANTS: Record<WeaknessRadarItem['status'], BadgeVariant> = {
  strong: 'completed',
  good: 'running',
  'needs-work': 'partial',
  critical: 'failed',
  unpracticed: 'queued',
};

const STATUS_LABELS: Record<WeaknessRadarItem['status'], string> = {
  strong: 'Strong Recall',
  good: 'Good Recall',
  'needs-work': 'Needs Work',
  critical: 'Critical Gap',
  unpracticed: 'Unpracticed',
};

export default function RadarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [radar, setRadar] = useState<WeaknessRadar | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    kitsApi
      .getWeaknessRadar(id)
      .then((data) => {
        setRadar(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user, authLoading, id, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100">
      <AppHeader />

      {/* Sub-Header */}
      <div className="border-b border-slate-800 bg-slate-900/40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <Link href={`/kits/${id}`} className="hover:text-white flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" />
                <span>Return to Kit</span>
              </Link>
              <span>/</span>
              <span className="text-slate-200">Weakness Radar</span>
            </div>
            <h1 className="text-lg font-semibold text-white tracking-tight">
              Interview Readiness &amp; Weakness Analytics
            </h1>
          </div>

          <Link
            href={`/kits/${id}/practice`}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded transition-colors shadow-sm"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Practice Flashcards</span>
          </Link>
        </div>
      </div>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        {!radar || radar.items.length === 0 ? (
          <div className="enterprise-card p-12 text-center">
            <div className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3 border border-slate-700">
              <Compass className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-semibold text-white mb-1">No Practice Telemetry Available</h2>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5 leading-relaxed">
              The Weakness Radar calculates retention decay and priority scores from active flashcard practice sessions.
            </p>
            <Link
              href={`/kits/${id}/practice`}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded transition-colors"
            >
              Start First Practice Session
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            {/* Overall Score & Health Breakdown */}
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="enterprise-card p-5 sm:col-span-1 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-mono uppercase text-slate-500 font-medium">
                    Composite Readiness
                  </span>
                  <div className="text-3xl sm:text-4xl font-semibold text-white tracking-tight mt-1">
                    {radar.overallReadiness}%
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                  <span className="text-emerald-400 font-medium">{radar.strongCount} Strong</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-rose-400 font-medium">{radar.criticalCount} Critical</span>
                </div>
              </div>

              {/* Recommendations */}
              <div className="enterprise-card p-5 sm:col-span-2">
                <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-800">
                  <Target className="w-4 h-4 text-blue-400" />
                  <h2 className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">
                    High-Priority Strategic Recommendations
                  </h2>
                </div>

                {radar.recommendations.length === 0 ? (
                  <p className="text-xs text-slate-400">All competencies meet expected confidence thresholds.</p>
                ) : (
                  <ul className="space-y-2">
                    {radar.recommendations.map((rec, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 p-2 rounded bg-slate-900 border border-slate-800 text-xs text-slate-300"
                      >
                        <span className="font-mono text-[10px] text-blue-400 mt-0.5 font-bold">
                          0{i + 1}.
                        </span>
                        <span className="leading-relaxed flex-1">{rec}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Competency Health Matrix Table */}
            <div className="enterprise-card overflow-hidden">
              <div className="p-4 border-b border-slate-800">
                <h3 className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">
                  Competency Retention Matrix ({radar.items.length})
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/50 text-[11px] font-mono text-slate-400 uppercase">
                      <th className="p-3 font-medium">Requirement</th>
                      <th className="p-3 font-medium">Kind</th>
                      <th className="p-3 font-medium">Priority</th>
                      <th className="p-3 font-medium text-center">Coverage</th>
                      <th className="p-3 font-medium text-center">Avg Score</th>
                      <th className="p-3 font-medium text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {radar.items.map((item) => (
                      <tr key={item.requirementId} className="hover:bg-slate-900/30 transition-colors">
                        <td className="p-3 max-w-xs sm:max-w-md">
                          <div className="flex items-start gap-2">
                            <span className="font-mono text-[10px] text-slate-500 mt-0.5">
                              {item.requirementId}
                            </span>
                            <span className="text-slate-200 font-medium leading-relaxed truncate">
                              {item.requirementText}
                            </span>
                          </div>
                        </td>

                        <td className="p-3">
                          <Badge variant={item.kind as BadgeVariant}>{item.kind}</Badge>
                        </td>

                        <td className="p-3">
                          <Badge variant={item.priority === 'must' ? 'must' : 'nice'}>
                            {item.priority}
                          </Badge>
                        </td>

                        <td className="p-3 text-center font-mono text-[11px] text-slate-400">
                          {item.questionCount} Qs · {item.flashcardCount} Cards
                        </td>

                        <td className="p-3 text-center font-mono text-[11px]">
                          {item.averageConfidence !== null ? (
                            <span
                              className={
                                item.averageConfidence >= 4
                                  ? 'text-emerald-400 font-semibold'
                                  : item.averageConfidence >= 3
                                  ? 'text-blue-400'
                                  : 'text-amber-400'
                              }
                            >
                              {item.averageConfidence.toFixed(1)} / 5.0
                            </span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>

                        <td className="p-3 text-right">
                          <Badge variant={STATUS_VARIANTS[item.status] ?? 'default'}>
                            {STATUS_LABELS[item.status] ?? item.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
