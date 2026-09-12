'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { kitsApi, type KitListItem } from '@/lib/api';
import { AppHeader } from '@/components/ui/AppHeader';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import {
  Plus,
  Search,
  Clock,
  Calendar,
  ArrowRight,
  Loader2,
  FolderArchive,
  BookOpen,
  Compass,
} from 'lucide-react';

const STATUS_VARIANTS: Record<string, BadgeVariant> = {
  queued: 'queued',
  running: 'running',
  completed: 'completed',
  partial: 'partial',
  failed: 'failed',
};

const STATUS_LABELS: Record<string, string> = {
  queued: 'Queued',
  running: 'Generating',
  completed: 'Ready',
  partial: 'Partial Research',
  failed: 'Failed',
};

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [kits, setKits] = useState<KitListItem[]>([]);
  const [kitsLoading, setKitsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ready' | 'running'>('all');

  const loadKits = useCallback(async () => {
    try {
      const data = await kitsApi.list();
      setKits(data);
    } catch {
      // Handled by auth redirect
    } finally {
      setKitsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) loadKits();
  }, [user, loadKits]);

  // Poll for active generating kits
  useEffect(() => {
    const hasRunning = kits.some((k) => k.status === 'queued' || k.status === 'running');
    if (!hasRunning) return;
    const interval = setInterval(loadKits, 3000);
    return () => clearInterval(interval);
  }, [kits, loadKits]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const readyKits = kits.filter((k) => k.status === 'completed' || k.status === 'partial');
  const inProgressKits = kits.filter((k) => k.status === 'queued' || k.status === 'running');

  // Filtered kits
  const filteredKits = kits.filter((k) => {
    const matchesSearch =
      k.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.role.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'ready') return k.status === 'completed' || k.status === 'partial';
    if (statusFilter === 'running') return k.status === 'queued' || k.status === 'running';
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100">
      <AppHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Workspace Title & Primary CTA */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <span>Workspace</span>
              <span>/</span>
              <span className="text-slate-200">Interview Kits</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
              Interview Preparation Kits
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Manage your company-specific interview preparation kits, questions, and schedules.
            </p>
          </div>

          <Link
            href="/kits/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-medium rounded transition-colors shadow-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Create Interview Kit
          </Link>
        </div>

        {/* Executive Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
          <div className="enterprise-card p-4">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-medium mb-1">
              Total Kits
            </div>
            <div className="text-2xl font-semibold text-white">{kits.length}</div>
            <div className="text-[11px] text-slate-400 mt-1">Configured targets</div>
          </div>

          <div className="enterprise-card p-4">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-medium mb-1">
              Ready to Practice
            </div>
            <div className="text-2xl font-semibold text-emerald-400">{readyKits.length}</div>
            <div className="text-[11px] text-slate-400 mt-1">Schedules generated</div>
          </div>

          <div className="enterprise-card p-4">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-medium mb-1">
              In Progress
            </div>
            <div className="text-2xl font-semibold text-blue-400">{inProgressKits.length}</div>
            <div className="text-[11px] text-slate-400 mt-1">Active pipelines</div>
          </div>

          <div className="enterprise-card p-4">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-medium mb-1">
              Preparation Focus
            </div>
            <div className="text-2xl font-semibold text-indigo-400">
              {kits.length > 0 ? `${readyKits.length}/${kits.length}` : '—'}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Readiness ratio</div>
          </div>
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search company or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1 self-start sm:self-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                statusFilter === 'all'
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({kits.length})
            </button>
            <button
              onClick={() => setStatusFilter('ready')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                statusFilter === 'ready'
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Ready ({readyKits.length})
            </button>
            <button
              onClick={() => setStatusFilter('running')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                statusFilter === 'running'
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              In Progress ({inProgressKits.length})
            </button>
          </div>
        </div>

        {/* Kit Grid / List */}
        {kitsLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        ) : filteredKits.length === 0 ? (
          <div className="enterprise-card p-12 text-center">
            <div className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3 border border-slate-700">
              <FolderArchive className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-semibold text-white mb-1">
              {searchQuery ? 'No matching interview kits' : 'No interview kits created yet'}
            </h2>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5 leading-relaxed">
              {searchQuery
                ? 'Try adjusting your search query or filter settings.'
                : 'Create your first personalized preparation kit with tailored questions, flashcards, and a day-by-day study schedule.'}
            </p>
            {!searchQuery && (
              <Link
                href="/kits/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Create Interview Kit
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredKits.map((kit) => (
              <KitItemCard key={kit.id} kit={kit} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function KitItemCard({ kit }: { kit: KitListItem }) {
  const isRunning = kit.status === 'queued' || kit.status === 'running';
  const isReady = kit.status === 'completed' || kit.status === 'partial';

  const initials = kit.company
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="enterprise-card p-5 flex flex-col justify-between hover:border-slate-700">
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-slate-200 tracking-wider flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm text-white truncate" title={kit.company}>
                {kit.company}
              </h3>
              <p className="text-xs text-slate-400 truncate" title={kit.role}>
                {kit.role}
              </p>
            </div>
          </div>

          <Badge variant={STATUS_VARIANTS[kit.status] ?? 'default'}>
            {STATUS_LABELS[kit.status] ?? kit.status}
          </Badge>
        </div>

        {/* Progress Display if Running */}
        {isRunning && kit.progress && (
          <div className="my-4 p-3 rounded bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span className="flex items-center gap-1.5 capitalize">
                <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
                {kit.progress.stage?.replace(/_/g, ' ') ?? 'Processing...'}
              </span>
              <span className="font-mono text-[11px] text-slate-300">
                {kit.progress.percentage ?? 0}%
              </span>
            </div>
            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${kit.progress.percentage ?? 0}%` }}
              />
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 py-3 border-t border-slate-800/80 my-3">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>{kit.daysAvailable} Day Schedule</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{new Date(kit.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
        {isReady ? (
          <div className="flex items-center gap-2 w-full">
            <Link
              href={`/kits/${kit.id}`}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded border border-slate-700 transition-colors"
            >
              Open Kit
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href={`/kits/${kit.id}/practice`}
              className="inline-flex items-center justify-center p-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 text-xs font-medium rounded border border-blue-500/20 transition-colors"
              title="Practice Flashcards"
            >
              <BookOpen className="w-4 h-4" />
            </Link>
            <Link
              href={`/kits/${kit.id}/radar`}
              className="inline-flex items-center justify-center p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium rounded border border-slate-700 transition-colors"
              title="Weakness Radar"
            >
              <Compass className="w-4 h-4" />
            </Link>
          </div>
        ) : isRunning ? (
          <Link
            href={`/kits/${kit.id}/progress`}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 text-xs font-medium rounded border border-blue-500/20 transition-colors"
          >
            View Pipeline Progress
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        ) : (
          <span className="text-xs text-slate-500">Pipeline stopped</span>
        )}
      </div>
    </div>
  );
}
