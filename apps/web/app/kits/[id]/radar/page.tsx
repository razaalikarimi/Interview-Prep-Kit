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
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col text-gray-900">
      <AppHeader />

      {/* Sub-Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <Link href={`/kits/${id}`} className="hover:text-gray-900 flex items-center gap-1 font-medium">
                <ArrowLeft className="w-3 h-3" />
                <span>Return to Kit</span>
              </Link>
              <span>/</span>
              <span className="text-gray-900 font-semibold">Weakness Radar</span>
            </div>
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">
              Interview Readiness &amp; Weakness Analytics
            </h1>
          </div>

          <Link
            href={`/kits/${id}/practice`}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors shadow-xs"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Practice Flashcards</span>
          </Link>
        </div>
      </div>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        {!radar || radar.items.length === 0 ? (
          <div className="enterprise-card p-12 text-center">
            <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3 border border-gray-200">
              <Compass className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold text-gray-900 mb-1">No Practice Telemetry Available</h2>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mb-5 leading-relaxed">
              The Weakness Radar calculates retention decay and priority scores from active flashcard practice sessions.
            </p>
            <Link
              href={`/kits/${id}/practice`}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors shadow-xs"
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
                  <span className="text-[11px] font-mono uppercase text-gray-500 font-semibold">
                    Composite Readiness
                  </span>
                  <div className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mt-1">
                    {radar.overallReadiness}%
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500 flex items-center justify-between">
                  <span className="text-emerald-700 font-semibold">{radar.strongCount} Strong</span>
                  <span className="text-gray-300">·</span>
                  <span className="text-rose-700 font-semibold">{radar.criticalCount} Critical</span>
                </div>
              </div>

              {/* Recommendations */}
              <div className="enterprise-card p-5 sm:col-span-2">
                <div className="flex items-center gap-2 pb-2 mb-3 border-b border-gray-100">
                  <Target className="w-4 h-4 text-blue-600" />
                  <h2 className="text-xs font-mono font-semibold text-gray-500 uppercase tracking-wider">
                    High-Priority Strategic Recommendations
                  </h2>
                </div>

                {radar.recommendations.length === 0 ? (
                  <p className="text-xs text-gray-500">All competencies meet expected confidence thresholds.</p>
                ) : (
                  <ul className="space-y-2">
                    {radar.recommendations.map((rec, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 p-2.5 rounded bg-gray-50 border border-gray-200 text-xs text-gray-700"
                      >
                        <span className="font-mono text-[10px] text-blue-700 mt-0.5 font-bold">
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
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-xs font-mono font-semibold text-gray-500 uppercase tracking-wider">
                  Competency Retention Matrix ({radar.items.length})
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-[11px] font-mono text-gray-500 uppercase">
                      <th className="p-3 font-semibold">Requirement</th>
                      <th className="p-3 font-semibold">Kind</th>
                      <th className="p-3 font-semibold">Priority</th>
                      <th className="p-3 font-semibold text-center">Coverage</th>
                      <th className="p-3 font-semibold text-center">Avg Score</th>
                      <th className="p-3 font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {radar.items.map((item) => (
                      <tr key={item.requirementId} className="hover:bg-gray-50/70 transition-colors">
                        <td className="p-3 max-w-xs sm:max-w-md">
                          <div className="flex items-start gap-2">
                            <span className="font-mono text-[10px] text-gray-500 mt-0.5">
                              {item.requirementId}
                            </span>
                            <span className="text-gray-900 font-semibold leading-relaxed truncate">
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

                        <td className="p-3 text-center font-mono text-[11px] text-gray-500">
                          {item.questionCount} Qs · {item.flashcardCount} Cards
                        </td>

                        <td className="p-3 text-center font-mono text-[11px]">
                          {item.averageConfidence !== null ? (
                            <span
                              className={
                                item.averageConfidence >= 4
                                  ? 'text-emerald-700 font-semibold'
                                  : item.averageConfidence >= 3
                                  ? 'text-blue-700 font-medium'
                                  : 'text-amber-700 font-medium'
                              }
                            >
                              {item.averageConfidence.toFixed(1)} / 5.0
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
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
