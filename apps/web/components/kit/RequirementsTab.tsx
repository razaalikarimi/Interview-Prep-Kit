'use client';

import React, { useState } from 'react';
import type { Requirement } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';

interface Props {
  requirements: Requirement[];
}

export function RequirementsTab({ requirements }: Props) {
  const [kindFilter, setKindFilter] = useState<'all' | 'technical' | 'behavioural' | 'domain'>('all');

  const mustReqs = requirements.filter((r) => r.priority === 'must');
  const niceReqs = requirements.filter((r) => r.priority === 'nice');

  const filteredMust = mustReqs.filter(
    (r) => kindFilter === 'all' || r.kind === kindFilter,
  );
  const filteredNice = niceReqs.filter(
    (r) => kindFilter === 'all' || r.kind === kindFilter,
  );

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-base font-bold text-gray-900">Target Role Requirements</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Extracted directly from the submitted job description with strict classification and zero hallucination.
          </p>
        </div>

        {/* Kind Filters */}
        <div className="flex items-center gap-1 self-start sm:self-auto bg-gray-100 p-1 rounded border border-gray-200">
          <button
            onClick={() => setKindFilter('all')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              kindFilter === 'all'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All ({requirements.length})
          </button>
          <button
            onClick={() => setKindFilter('technical')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              kindFilter === 'technical'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Technical
          </button>
          <button
            onClick={() => setKindFilter('behavioural')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              kindFilter === 'behavioural'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Behavioural
          </button>
          <button
            onClick={() => setKindFilter('domain')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              kindFilter === 'domain'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Domain
          </button>
        </div>
      </div>

      {/* Must Have Section */}
      <div className="enterprise-card p-6">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <h3 className="text-xs font-mono font-semibold text-gray-700 uppercase tracking-wider">
              Must Have Competencies ({filteredMust.length})
            </h3>
          </div>
          <span className="text-[11px] text-gray-500">Essential for interview passing score</span>
        </div>

        {filteredMust.length === 0 ? (
          <p className="text-xs text-gray-500 py-2">No must-have requirements in this category.</p>
        ) : (
          <div className="space-y-2.5">
            {filteredMust.map((req) => (
              <div
                key={req.id}
                className="flex items-start justify-between gap-3 p-3 rounded bg-gray-50 border border-gray-200 text-xs"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className="font-mono text-[11px] text-gray-600 px-1.5 py-0.5 rounded bg-white border border-gray-200 mt-0.5 flex-shrink-0 font-medium">
                    {req.id}
                  </span>
                  <span className="text-gray-900 font-medium leading-relaxed">{req.text}</span>
                </div>

                <Badge variant={req.kind} className="flex-shrink-0 capitalize">
                  {req.kind}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Nice to Have Section */}
      <div className="enterprise-card p-6">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gray-400" />
            <h3 className="text-xs font-mono font-semibold text-gray-700 uppercase tracking-wider">
              Nice to Have &amp; Preferred ({filteredNice.length})
            </h3>
          </div>
          <span className="text-[11px] text-gray-500">Differentiating qualifications</span>
        </div>

        {filteredNice.length === 0 ? (
          <p className="text-xs text-gray-500 py-2">No nice-to-have requirements in this category.</p>
        ) : (
          <div className="space-y-2.5">
            {filteredNice.map((req) => (
              <div
                key={req.id}
                className="flex items-start justify-between gap-3 p-3 rounded bg-gray-50 border border-gray-200 text-xs"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className="font-mono text-[11px] text-gray-600 px-1.5 py-0.5 rounded bg-white border border-gray-200 mt-0.5 flex-shrink-0">
                    {req.id}
                  </span>
                  <span className="text-gray-700 leading-relaxed">{req.text}</span>
                </div>

                <Badge variant="nice" className="flex-shrink-0 capitalize">
                  {req.kind}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
