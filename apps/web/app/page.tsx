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
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col text-gray-900">
      <AppHeader />

      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-16 text-center max-w-4xl mx-auto">
        {/* Status Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs text-blue-700 font-medium mb-6">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Enterprise Technical Interview Preparation System</span>
        </div>

        {/* Hero Headline */}
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-gray-900 max-w-3xl leading-tight">
          Precision Interview Preparation for Technical Roles
        </h1>

        <p className="mt-4 text-base sm:text-lg text-gray-600 max-w-2xl leading-relaxed">
          Transform any job description and company website into an autonomous, verified preparation kit with role coverage verification, targeted flashcards, and structured study plans.
        </p>

        {/* CTA Group */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
          <Link
            href="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded text-sm shadow-sm transition-colors"
          >
            <span>Start Preparation Free</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded text-sm border border-gray-300 shadow-sm transition-colors"
          >
            Sign In to Existing Account
          </Link>
        </div>

        {/* Enterprise Architecture Features */}
        <div className="mt-16 grid sm:grid-cols-3 gap-4 w-full text-left">
          <div className="enterprise-card p-5">
            <div className="w-8 h-8 rounded bg-blue-50 text-blue-600 flex items-center justify-center mb-3 border border-blue-100">
              <Search className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">Same-Origin Company Research</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Safe recursive crawling extracts mission, engineering architecture, and interview processes from official public sources.
            </p>
          </div>

          <div className="enterprise-card p-5">
            <div className="w-8 h-8 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 border border-emerald-100">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">Deterministic Coverage Checking</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Multi-pass algorithms guarantee that every must-have and nice-to-have qualification has associated practice material.
            </p>
          </div>

          <div className="enterprise-card p-5">
            <div className="w-8 h-8 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 border border-indigo-100">
              <Calendar className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">Study Timeline Planner</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Calculates daily study allocations (20–180 min) prioritizing foundational core skills before advanced domain scenarios.
            </p>
          </div>
        </div>

        {/* Feature Checkpoints */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-500 border-t border-gray-200 pt-8 w-full">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-gray-400" />
            <span>Preserves user-edited questions on regenerate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-gray-400" />
            <span>Spaced repetition with confidence scoring</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-gray-400" />
            <span>Batch evaluation CLI included</span>
          </div>
        </div>
      </main>
    </div>
  );
}
