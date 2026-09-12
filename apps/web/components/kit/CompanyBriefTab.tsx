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
        <div className="p-3 rounded bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-900">Company Intelligence Brief</h2>
            {brief.state?.edited && (
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                Manually Edited
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded border border-gray-300 shadow-xs transition-colors disabled:opacity-50"
              >
                {regenerating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
                )}
                <span>{regenerating ? 'Re-researching...' : 'Re-research'}</span>
              </button>

              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors shadow-xs"
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
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded border border-gray-300 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded transition-colors shadow-xs disabled:opacity-50"
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
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Executive Summary
            </label>
            <textarea
              rows={5}
              value={form.summary}
              onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
              className="w-full p-3 bg-white border border-gray-300 rounded text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors leading-relaxed font-sans"
            />
          </div>

          <div className="enterprise-card p-5">
            <label className="block text-xs font-medium text-gray-700 mb-2">
              What They Do &amp; Business Model
            </label>
            <textarea
              rows={5}
              value={form.what_they_do}
              onChange={(e) => setForm((f) => ({ ...f, what_they_do: e.target.value }))}
              className="w-full p-3 bg-white border border-gray-300 rounded text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors leading-relaxed font-sans"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Executive Summary */}
          <div className="enterprise-card p-5">
            <div className="flex items-center gap-2 pb-2.5 mb-3 border-b border-gray-100">
              <Building2 className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-mono font-semibold text-gray-500 uppercase tracking-wider">
                Executive Summary
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-gray-800 leading-relaxed">
              {brief.summary}
            </p>
          </div>

          {/* What They Do */}
          <div className="enterprise-card p-5">
            <div className="flex items-center gap-2 pb-2.5 mb-3 border-b border-gray-100">
              <Briefcase className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-mono font-semibold text-gray-500 uppercase tracking-wider">
                Products &amp; Core Operations
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-gray-800 leading-relaxed">
              {brief.what_they_do}
            </p>
          </div>

          {/* Research Sources */}
          <div className="enterprise-card p-5">
            <div className="flex items-center gap-2 pb-2.5 mb-3 border-b border-gray-100">
              <Globe className="w-4 h-4 text-gray-500" />
              <h3 className="text-xs font-mono font-semibold text-gray-500 uppercase tracking-wider">
                Verified Research Sources ({brief.sources.length})
              </h3>
            </div>

            {brief.sources.length === 0 ? (
              <p className="text-xs text-gray-500">No external source URLs recorded.</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-2">
                {brief.sources.map((src, idx) => (
                  <a
                    key={idx}
                    href={src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 rounded bg-gray-50 border border-gray-200 text-xs text-gray-700 hover:text-blue-700 hover:border-blue-300 hover:bg-blue-50/50 transition-colors group"
                  >
                    <span className="truncate max-w-[280px] font-mono text-[11px]">{src}</span>
                    <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-blue-600 flex-shrink-0" />
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
              className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 rounded transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmRegenerate}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors shadow-xs"
            >
              Confirm Re-research
            </button>
          </>
        }
      >
        <div className="text-xs text-gray-600 space-y-2 leading-relaxed">
          <p>
            This action triggers a fresh autonomous crawl of the company domain to discover updated product and hiring signals.
          </p>
          <div className="p-3 rounded bg-blue-50 border border-blue-200 text-blue-800">
            <span className="font-semibold text-blue-900">Preservation Guarantee: </span>
            Your question bank, flashcards, and study schedule will remain completely unchanged.
          </div>
        </div>
      </Modal>
    </div>
  );
}
