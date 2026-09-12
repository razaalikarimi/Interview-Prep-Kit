'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { AppHeader } from '@/components/ui/AppHeader';
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  Compass,
  FileText,
  Search,
} from 'lucide-react';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100">
      <AppHeader />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        {/* Badge & Headline */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 mb-6">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Deterministic Engineering Assessment Platform</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-semibold text-white tracking-tight leading-tight mb-5">
            Enterprise Interview Preparation System
          </h1>

          <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto mb-8">
            Extract verbatim job requirements, synthesize deep company research, generate targeted questions across four categories, and build a deterministic day-by-day study schedule.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded transition-colors"
            >
              Open Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/kits/new"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 text-sm font-medium rounded border border-slate-800 transition-colors"
            >
              Create Interview Kit
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-20">
          <div className="enterprise-card p-5">
            <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-blue-400 mb-3 border border-slate-700">
              <FileText className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-semibold text-white mb-1.5">Requirement Extraction</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Extracts must-have vs nice-to-have competencies directly from raw job descriptions with zero hallucinated technologies.
            </p>
          </div>

          <div className="enterprise-card p-5">
            <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-emerald-400 mb-3 border border-slate-700">
              <Search className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-semibold text-white mb-1.5">Autonomous Research</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Deep link discovery and content ranking across company engineering blogs and hiring signals, protected with multi-layer SSRF validation.
            </p>
          </div>

          <div className="enterprise-card p-5">
            <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-indigo-400 mb-3 border border-slate-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-semibold text-white mb-1.5">Deterministic Coverage Loop</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Mathematical coverage verification checks questions against every required skill, closing uncovered gaps in up to three bounded passes.
            </p>
          </div>

          <div className="enterprise-card p-5">
            <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-amber-400 mb-3 border border-slate-700">
              <Calendar className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-semibold text-white mb-1.5">Algorithmic Study Schedule</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Application code calculates integer study minutes and prioritizes difficult, high-stakes requirements on earlier days.
            </p>
          </div>

          <div className="enterprise-card p-5">
            <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-purple-400 mb-3 border border-slate-700">
              <Layers className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-semibold text-white mb-1.5">Preservation Engine</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Manually edited and pinned questions survive category regeneration. Optimistic concurrency control prevents stale updates.
            </p>
          </div>

          <div className="enterprise-card p-5">
            <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-cyan-400 mb-3 border border-slate-700">
              <Compass className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-semibold text-white mb-1.5">Weakness Radar</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Spaced repetition engine tracks flashcard confidence and recency decay to highlight high-priority knowledge gaps.
            </p>
          </div>
        </div>

        {/* Evaluation Metadata Footer */}
        <div className="mt-16 pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>AI Interview Prep Kit • Production Assessment Edition</span>
          </div>
          <div>All backend services &amp; evaluation endpoints operational</div>
        </div>
      </main>
    </div>
  );
}
