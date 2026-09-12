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
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB]">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
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
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col text-gray-900">
      <AppHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Workspace Title & Primary CTA */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <span>Workspace</span>
              <span>/</span>
              <span className="text-gray-900 font-medium">Interview Kits</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              Interview Preparation Kits
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Manage your company-specific interview preparation kits, questions, and schedules.
            </p>
          </div>

          <Link
            href="/kits/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium rounded transition-colors shadow-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Create Interview Kit
          </Link>
        </div>

        {/* Executive Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
          <div className="enterprise-card p-4">
            <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-1">
              Total Kits
            </div>
            <div className="text-2xl font-bold text-gray-900">{kits.length}</div>
            <div className="text-[11px] text-gray-500 mt-1">Configured targets</div>
          </div>

          <div className="enterprise-card p-4">
            <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-1">
              Ready to Practice
            </div>
            <div className="text-2xl font-bold text-emerald-600">{readyKits.length}</div>
            <div className="text-[11px] text-gray-500 mt-1">Schedules generated</div>
          </div>

          <div className="enterprise-card p-4">
            <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-1">
              In Progress
            </div>
            <div className="text-2xl font-bold text-blue-600">{inProgressKits.length}</div>
            <div className="text-[11px] text-gray-500 mt-1">Active pipelines</div>
          </div>

          <div className="enterprise-card p-4">
            <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-1">
              Preparation Focus
            </div>
            <div className="text-2xl font-bold text-indigo-600">
              {kits.length > 0 ? `${readyKits.length}/${kits.length}` : '—'}
            </div>
            <div className="text-[11px] text-gray-500 mt-1">Completion ratio</div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by company or job role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-300 rounded text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors shadow-sm"
            />
          </div>

          {/* Status filter tabs */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded border border-gray-200 self-start sm:self-auto text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 font-medium rounded transition-colors ${
                statusFilter === 'all'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All ({kits.length})
            </button>
            <button
              onClick={() => setStatusFilter('ready')}
              className={`px-3 py-1 font-medium rounded transition-colors ${
                statusFilter === 'ready'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Ready ({readyKits.length})
            </button>
            <button
              onClick={() => setStatusFilter('running')}
              className={`px-3 py-1 font-medium rounded transition-colors ${
                statusFilter === 'running'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              In Progress ({inProgressKits.length})
            </button>
          </div>
        </div>

        {/* Kits Table/Grid */}
        {kitsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="enterprise-card p-5 animate-pulse flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-40 bg-gray-200 rounded" />
                  <div className="h-3 w-64 bg-gray-100 rounded" />
                </div>
                <div className="h-6 w-20 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : filteredKits.length === 0 ? (
          <div className="enterprise-card p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3 border border-gray-200">
              <FolderArchive className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">
              {searchQuery ? 'No matching kits found' : 'No interview kits created yet'}
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? 'Try refining your search keyword or clearing the status filter.'
                : 'Create your first personalized interview prep kit from a job description to begin targeted preparation.'}
            </p>
            {!searchQuery && (
              <div className="mt-5">
                <Link
                  href="/kits/new"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded shadow-sm transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Interview Kit</span>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredKits.map((kit) => {
              const isRunning = kit.status === 'queued' || kit.status === 'running';
              const targetUrl = isRunning ? `/kits/${kit.id}/progress` : `/kits/${kit.id}`;
              const daysRemaining = kit.daysAvailable;

              return (
                <div
                  key={kit.id}
                  className="enterprise-card-interactive p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                  onClick={() => router.push(targetUrl)}
                >
                  {/* Left: Company & Role */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-sm text-gray-900 tracking-tight group-hover:text-blue-600 transition-colors">
                        {kit.company}
                      </span>
                      <span className="text-gray-300">•</span>
                      <span className="text-xs text-gray-600 font-medium truncate">
                        {kit.role}
                      </span>
                      <Badge variant={STATUS_VARIANTS[kit.status] || 'default'} className="ml-1">
                        {STATUS_LABELS[kit.status] || kit.status}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap mt-2">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>Created {new Date(kit.createdAt).toLocaleDateString()}</span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>{daysRemaining} day study plan</span>
                      </span>
                      {kit.status === 'completed' && (
                        <span className="inline-flex items-center gap-1 text-emerald-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Coverage Verified</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {isRunning ? (
                      <Link
                        href={`/kits/${kit.id}/progress`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium rounded border border-blue-200 transition-colors"
                      >
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>View Progress</span>
                      </Link>
                    ) : (
                      <>
                        <Link
                          href={`/kits/${kit.id}/practice`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-medium rounded border border-gray-200 transition-colors"
                          title="Open Practice Mode"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-gray-500" />
                          <span>Practice</span>
                        </Link>
                        <Link
                          href={`/kits/${kit.id}/radar`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-medium rounded border border-gray-200 transition-colors"
                          title="Open Weakness Radar"
                        >
                          <Compass className="w-3.5 h-3.5 text-gray-500" />
                          <span>Radar</span>
                        </Link>
                        <Link
                          href={`/kits/${kit.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors shadow-xs"
                        >
                          <span>Open Kit</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
