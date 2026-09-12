'use client';

import React, { useState } from 'react';
import { kitsApi } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import {
  Building2,
  ExternalLink,
  Edit3,
  RefreshCw,
  Check,
  X,
  AlertCircle,
  Loader2,
  Globe,
  Briefcase,
} from 'lucide-react';

interface Brief {
  summary: string;
  what_they_do: string;
  sources: string[];
  state?: { edited?: boolean; version?: number };
}

interface Props {
  kitId: string;
  brief: Brief;
  version: number;
  onUpdate: () => void;
}

export function CompanyBriefTab({ kitId, brief, version, onUpdate }: Props) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    summary: brief.summary,
    what_they_do: brief.what_they_do,
  });
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setSaving(true);
    try {
      await kitsApi.updateCompanyBrief(kitId, form);
      setEditing(false);
      onUpdate();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save company brief edits');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setForm({ summary: brief.summary, what_they_do: brief.what_they_do });
    setEditing(false);
  };

  const handleConfirmRegenerate = async () => {
    setShowRegenModal(false);
    setRegenerating(true);
    setError('');
    try {
      await kitsApi.regenerate(kitId, {
        section: 'company-brief',
        expectedVersion: version,
      });
      onUpdate();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Company brief re-research failed');
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      {/* Error Alert */}
      {error && (
        <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-white">Company Intelligence Brief</h2>
            {brief.state?.edited && (
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-blue-600/10 text-blue-400 border border-blue-500/20">
                Manually Edited
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Synthesized from autonomous website crawling, product announcements, and hiring pages.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {!editing ? (
            <>
              <button
                type="button"
                onClick={() => setShowRegenModal(true)}
                disabled={regenerating}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium rounded border border-slate-800 transition-colors disabled:opacity-50"
              >
                {regenerating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>{regenerating ? 'Re-researching...' : 'Re-research'}</span>
              </button>

              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Brief</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={saving}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium rounded border border-slate-800 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Save Changes</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Brief Content Cards */}
      {editing ? (
        <div className="space-y-4">
          <div className="enterprise-card p-5">
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Executive Summary
            </label>
            <textarea
              rows={5}
              value={form.summary}
              onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
              className="w-full p-3 bg-slate-900 border border-slate-800 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors leading-relaxed font-sans"
            />
          </div>

          <div className="enterprise-card p-5">
            <label className="block text-xs font-medium text-slate-300 mb-2">
              What They Do &amp; Business Model
            </label>
            <textarea
              rows={5}
              value={form.what_they_do}
              onChange={(e) => setForm((f) => ({ ...f, what_they_do: e.target.value }))}
              className="w-full p-3 bg-slate-900 border border-slate-800 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors leading-relaxed font-sans"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Executive Summary */}
          <div className="enterprise-card p-5">
            <div className="flex items-center gap-2 pb-2.5 mb-3 border-b border-slate-800/80">
              <Building2 className="w-4 h-4 text-blue-400" />
              <h3 className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">
                Executive Summary
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              {brief.summary}
            </p>
          </div>

          {/* What They Do */}
          <div className="enterprise-card p-5">
            <div className="flex items-center gap-2 pb-2.5 mb-3 border-b border-slate-800/80">
              <Briefcase className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">
                Products &amp; Core Operations
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              {brief.what_they_do}
            </p>
          </div>

          {/* Research Sources */}
          <div className="enterprise-card p-5">
            <div className="flex items-center gap-2 pb-2.5 mb-3 border-b border-slate-800/80">
              <Globe className="w-4 h-4 text-slate-400" />
              <h3 className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">
                Verified Research Sources ({brief.sources.length})
              </h3>
            </div>

            {brief.sources.length === 0 ? (
              <p className="text-xs text-slate-500">No external source URLs recorded.</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-2">
                {brief.sources.map((src, idx) => (
                  <a
                    key={idx}
                    href={src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-blue-400 hover:border-slate-700 transition-colors group"
                  >
                    <span className="truncate max-w-[280px] font-mono text-[11px]">{src}</span>
                    <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-blue-400 flex-shrink-0" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Re-Research Confirmation Modal */}
      <Modal
        isOpen={showRegenModal}
        onClose={() => setShowRegenModal(false)}
        title="Re-research Company Information"
        description="Re-crawl the target company website and refresh the company intelligence brief."
        footer={
          <>
            <button
              onClick={() => setShowRegenModal(false)}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmRegenerate}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded transition-colors"
            >
              Confirm Re-research
            </button>
          </>
        }
      >
        <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
          <p>
            This action triggers a fresh autonomous crawl of the company domain to discover updated product and hiring signals.
          </p>
          <div className="p-3 rounded bg-blue-500/10 border border-blue-500/20 text-blue-300">
            <span className="font-semibold text-blue-200">Preservation Guarantee: </span>
            Your question bank, flashcards, and study schedule will remain completely unchanged.
          </div>
        </div>
      </Modal>
    </div>
  );
}
