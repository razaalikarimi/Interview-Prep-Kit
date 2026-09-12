'use client';

import React from 'react';
import type { Requirement, Question } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import {
  ShieldCheck,
  Check,
  X,
} from 'lucide-react';

interface Coverage {
  uncovered_requirement_ids: string[];
  passes: number;
}

interface Props {
  coverage: Coverage;
  requirements: Requirement[];
  questions: Question[];
}

export function CoverageTab({ coverage, requirements, questions }: Props) {
  const mustReqs = requirements.filter((r) => r.priority === 'must');
  const uncoveredSet = new Set(coverage.uncovered_requirement_ids);
  const coveredMust = mustReqs.filter((r) => !uncoveredSet.has(r.id));
  const uncoveredMust = mustReqs.filter((r) => uncoveredSet.has(r.id));
  const coveragePercent =
    mustReqs.length > 0 ? Math.round((coveredMust.length / mustReqs.length) * 100) : 100;

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <h2 className="text-base font-semibold text-white">
          Deterministic Coverage Verification
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Mathematical set verification checking that every must-have requirement has matching interview questions.
        </p>
      </div>

      {/* Audit KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="enterprise-card p-4">
          <div className="text-[11px] font-mono text-slate-500 uppercase">Must Coverage</div>
          <div className="text-2xl font-semibold text-emerald-400 mt-1">{coveragePercent}%</div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {coveredMust.length} of {mustReqs.length} covered
          </div>
        </div>

        <div className="enterprise-card p-4">
          <div className="text-[11px] font-mono text-slate-500 uppercase">Coverage Passes</div>
          <div className="text-2xl font-semibold text-white mt-1">{coverage.passes}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Max 3 bounded loops</div>
        </div>

        <div className="enterprise-card p-4">
          <div className="text-[11px] font-mono text-slate-500 uppercase">Covered Must-Haves</div>
          <div className="text-2xl font-semibold text-white mt-1">{coveredMust.length}</div>
          <div className="text-[11px] text-emerald-400 mt-0.5">Verified by questions</div>
        </div>

        <div className="enterprise-card p-4">
          <div className="text-[11px] font-mono text-slate-500 uppercase">Uncovered Gaps</div>
          <div className="text-2xl font-semibold text-slate-200 mt-1">{uncoveredMust.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Remaining unaddressed</div>
        </div>
      </div>

      {/* Algorithm Verification Banner */}
      <div className="enterprise-card p-4 bg-slate-900/60 border-slate-800 text-xs text-slate-400 flex items-start gap-3">
        <ShieldCheck className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold text-slate-200">Algorithmic Guarantee: </span>
          Coverage calculation is deterministic code running set-difference operations (<code className="font-mono text-[11px] text-blue-300">uncovered = mustRequirements \ questionsCoveringMust</code>). The LLM is never trusted to evaluate its own coverage.
        </div>
      </div>

      {/* Detailed Must Requirements List */}
      <div className="enterprise-card p-6">
        <h3 className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider mb-4 pb-2 border-b border-slate-800">
          Must-Have Competency Audit
        </h3>

        <div className="space-y-3">
          {mustReqs.map((req) => {
            const isCovered = !uncoveredSet.has(req.id);
            const coveringQs = questions.filter((q) => q.requirement_ids.includes(req.id));

            return (
              <div
                key={req.id}
                className={`p-3.5 rounded border text-xs transition-colors ${
                  isCovered
                    ? 'bg-slate-900 border-slate-800/90'
                    : 'bg-rose-500/5 border-rose-500/20'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="font-mono text-[10px] text-slate-500 px-1.5 py-0.2 rounded bg-slate-950 border border-slate-800 mt-0.5 flex-shrink-0">
                      {req.id}
                    </span>
                    <span className="text-slate-200 font-medium leading-relaxed">
                      {req.text}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Badge variant={req.kind}>{req.kind}</Badge>
                    {isCovered ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        <Check className="w-3 h-3" /> Covered
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                        <X className="w-3 h-3" /> Gap
                      </span>
                    )}
                  </div>
                </div>

                {isCovered ? (
                  <div className="pt-2 border-t border-slate-800/40 flex items-center gap-2 text-[11px] text-slate-400">
                    <span className="text-slate-500">Evaluated by:</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {coveringQs.map((q) => (
                        <span
                          key={q.id}
                          className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-950 border border-slate-800 text-slate-300"
                        >
                          {q.id} ({q.category})
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-rose-500/20 text-[11px] text-rose-300">
                    No generated questions currently evaluate this must-have requirement.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
