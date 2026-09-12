'use client';

import React, { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { kitsApi, type KitDetail } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { AppHeader } from '@/components/ui/AppHeader';
import { Badge } from '@/components/ui/Badge';
import { QuestionsTab } from '@/components/kit/QuestionsTab';
import { FlashcardsTab } from '@/components/kit/FlashcardsTab';
import { ScheduleTab } from '@/components/kit/ScheduleTab';
import { CompanyBriefTab } from '@/components/kit/CompanyBriefTab';
import { RequirementsTab } from '@/components/kit/RequirementsTab';
import { CoverageTab } from '@/components/kit/CoverageTab';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Compass,
  Calendar,
  Building2,
  ListChecks,
  HelpCircle,
  CreditCard,
  ShieldCheck,
  LayoutDashboard,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

type Tab =
  | 'overview'
  | 'company'
  | 'requirements'
  | 'questions'
  | 'flashcards'
  | 'schedule'
  | 'coverage';

const TABS: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'company', label: 'Company Brief', icon: Building2 },
  { key: 'requirements', label: 'Role Breakdown', icon: ListChecks },
  { key: 'questions', label: 'Question Bank', icon: HelpCircle },
  { key: 'flashcards', label: 'Flashcards', icon: CreditCard },
  { key: 'schedule', label: 'Study Schedule', icon: Calendar },
  { key: 'coverage', label: 'Coverage Verification', icon: ShieldCheck },
];

export default function KitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [kit, setKit] = useState<KitDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const loadKit = useCallback(async () => {
    try {
      const data = await kitsApi.get(id);
      setKit(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load kit');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    loadKit();
  }, [user, authLoading, router, loadKit]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error || !kit) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex flex-col text-gray-900">
        <AppHeader />
        <main className="flex-1 max-w-md mx-auto flex flex-col items-center justify-center p-6 text-center">
          <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-3 border border-red-200">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h1 className="text-base font-bold text-gray-900 mb-1">Kit Not Available</h1>
          <p className="text-xs text-gray-500 mb-5 leading-relaxed">
            {error || 'The requested preparation kit could not be found or you do not have permission to view it.'}
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-gray-50 text-xs font-medium text-gray-700 rounded border border-gray-300 shadow-xs transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Return to Dashboard
          </Link>
        </main>
      </div>
    );
  }

  const kitData = kit.kit;
  const warnings = kit.progress?.warnings ?? [];

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col text-gray-900">
      <AppHeader />

      {/* Sub-Header / Kit Context Bar */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <Link href="/dashboard" className="hover:text-gray-900 flex items-center gap-1 font-medium">
                  <ArrowLeft className="w-3 h-3" />
                  <span>Dashboard</span>
                </Link>
                <span>/</span>
                <span className="text-gray-900 font-semibold">{kitData?.source?.company ?? 'Kit'}</span>
              </div>

              <div className="flex items-center gap-2.5">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight truncate">
                  {kitData?.source?.company}
                </h1>
                <span className="text-gray-300">·</span>
                <span className="text-xs sm:text-sm text-gray-600 font-medium truncate">
                  {kitData?.role?.title}
                </span>

                {kit.status === 'partial' && (
                  <Badge variant="partial">Partial Research</Badge>
                )}
              </div>
            </div>

            {/* Quick Action CTAs */}
            <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
              <Link
                href={`/kits/${id}/practice`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors shadow-xs"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Practice Studio
              </Link>
              <Link
                href={`/kits/${id}/radar`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded border border-gray-300 shadow-xs transition-colors"
              >
                <Compass className="w-3.5 h-3.5 text-gray-500" />
                Weakness Radar
              </Link>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex gap-1 overflow-x-auto pt-4 mt-2 border-t border-gray-100 scrollbar-none" aria-label="Kit Sections">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t border-b-2 whitespace-nowrap transition-colors ${
                    isActive
                      ? 'border-blue-600 text-blue-700 bg-blue-50/50 font-semibold'
                      : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Tab Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Warnings Banner */}
        {warnings.length > 0 && activeTab === 'overview' && (
          <div className="mb-6 p-4 rounded bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1">
            <div className="flex items-center gap-1.5 font-medium text-amber-900 mb-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Research Notice</span>
            </div>
            {warnings.map((w, i) => (
              <p key={i} className="text-amber-800">
                • {w}
              </p>
            ))}
          </div>
        )}

        {/* Tab Panels */}
        {activeTab === 'overview' && kitData && (
          <KitOverview kit={kit} kitData={kitData} onTabChange={setActiveTab} />
        )}
        {activeTab === 'company' && kitData && (
          <CompanyBriefTab
            kitId={id}
            brief={kitData.company_brief}
            version={kit.version}
            onUpdate={loadKit}
          />
        )}
        {activeTab === 'requirements' && kitData && (
          <RequirementsTab requirements={kitData.role.requirements} />
        )}
        {activeTab === 'questions' && kitData && (
          <QuestionsTab
            kitId={id}
            questions={kitData.questions}
            requirements={kitData.role.requirements}
            version={kit.version}
            onUpdate={loadKit}
          />
        )}
        {activeTab === 'flashcards' && kitData && (
          <FlashcardsTab
            kitId={id}
            flashcards={kitData.flashcards}
            requirements={kitData.role.requirements}
            version={kit.version}
            onUpdate={loadKit}
          />
        )}
        {activeTab === 'schedule' && kitData && (
          <ScheduleTab
            kitId={id}
            schedule={kitData.schedule}
            questions={kitData.questions}
            version={kit.version}
            onUpdate={loadKit}
          />
        )}
        {activeTab === 'coverage' && kitData && (
          <CoverageTab
            coverage={kitData.coverage}
            requirements={kitData.role.requirements}
            questions={kitData.questions}
          />
        )}
      </main>
    </div>
  );
}

function KitOverview({
  kit: _kit,
  kitData,
  onTabChange,
}: {
  kit: KitDetail;
  kitData: NonNullable<KitDetail['kit']>;
  onTabChange: (tab: Tab) => void;
}) {
  const mustReqs = kitData.role.requirements.filter((r) => r.priority === 'must');
  const niceReqs = kitData.role.requirements.filter((r) => r.priority === 'nice');
  const totalMinutes = kitData.schedule.days.reduce((acc, d) => acc + d.minutes, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Executive Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => onTabChange('requirements')}
          className="enterprise-card-interactive p-4"
        >
          <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-1">
            Requirements
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {kitData.role.requirements.length}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">
            {mustReqs.length} must-have · {niceReqs.length} nice-to-have
          </div>
        </div>

        <div
          onClick={() => onTabChange('questions')}
          className="enterprise-card-interactive p-4"
        >
          <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-1">
            Question Bank
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {kitData.questions.length}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">Across 4 distinct categories</div>
        </div>

        <div
          onClick={() => onTabChange('flashcards')}
          className="enterprise-card-interactive p-4"
        >
          <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-1">
            Flashcards
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            {kitData.flashcards.length}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">Spaced repetition review</div>
        </div>

        <div
          onClick={() => onTabChange('schedule')}
          className="enterprise-card-interactive p-4"
        >
          <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-1">
            Study Schedule
          </div>
          <div className="text-2xl font-bold text-indigo-600">
            {kitData.schedule.days_available} Days
          </div>
          <div className="text-[11px] text-gray-500 mt-1">
            {totalMinutes} total preparation minutes
          </div>
        </div>
      </div>

      {/* Two-Column Grid: Research Brief & Priority Competencies */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Company Intelligence */}
        <div className="enterprise-card p-5">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
            <h2 className="text-xs font-mono font-semibold text-gray-500 uppercase tracking-wider">
              Autonomous Company Intelligence
            </h2>
            <button
              onClick={() => onTabChange('company')}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              Full Brief
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <p className="text-xs text-gray-600 leading-relaxed line-clamp-3 mb-3">
            {kitData.company_brief.summary}
          </p>

          <div className="text-xs text-gray-600 line-clamp-2 mb-4">
            <span className="text-gray-900 font-medium">Core Focus: </span>
            {kitData.company_brief.what_they_do}
          </div>

          <div className="pt-3 border-t border-gray-100 text-[11px] text-gray-500 flex items-center justify-between">
            <span>Sources Consulted: {kitData.company_brief.sources.length} domains</span>
            <span>Researched: {new Date(kitData.source.researched_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Right: Must-Have Requirements */}
        <div className="enterprise-card p-5">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
            <h2 className="text-xs font-mono font-semibold text-gray-500 uppercase tracking-wider">
              Core Competencies ({mustReqs.length} Must-Have)
            </h2>
            <button
              onClick={() => onTabChange('requirements')}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              View All
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2">
            {mustReqs.slice(0, 4).map((r) => (
              <div
                key={r.id}
                className="flex items-start gap-2.5 p-2 rounded bg-gray-50 border border-gray-200 text-xs"
              >
                <span className="font-mono text-[10px] text-gray-500 mt-0.5">{r.id}</span>
                <span className="flex-1 text-gray-900 font-medium">{r.text}</span>
                <Badge variant={r.kind}>{r.kind}</Badge>
              </div>
            ))}
          </div>

          {mustReqs.length > 4 && (
            <p className="text-[11px] text-gray-500 mt-3">
              + {mustReqs.length - 4} additional must-have requirements in full breakdown.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
