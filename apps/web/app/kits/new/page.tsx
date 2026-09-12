'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { kitsApi, ApiError } from '@/lib/api';
import { AppHeader } from '@/components/ui/AppHeader';
import {
  ArrowLeft,
  ArrowRight,
  Globe,
  Calendar,
  Sparkles,
  AlertCircle,
  Loader2,
  Building2,
} from 'lucide-react';

export default function NewKitPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    jobDescription: '',
    companyUrl: '',
    companyName: '',
    daysAvailable: 5,
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.jobDescription.trim().length < 20) {
      setError('Job description must contain at least 20 characters.');
      return;
    }

    try {
      const parsedUrl = new URL(form.companyUrl);
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        setError('URL must start with http:// or https://');
        return;
      }
    } catch {
      setError('Please enter a valid company website URL (e.g. https://company.com)');
      return;
    }

    setLoading(true);
    try {
      const result = await kitsApi.create({
        jobDescription: form.jobDescription,
        companyUrl: form.companyUrl,
        daysAvailable: form.daysAvailable,
        companyName: form.companyName || undefined,
      });

      if (result.isDuplicate) {
        router.push(`/kits/${result.kitId}`);
      } else {
        router.push(`/kits/${result.kitId}/progress`);
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to initiate kit generation. Please check your network connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSampleFill = () => {
    setForm({
      companyName: 'Stripe',
      companyUrl: 'https://stripe.com',
      daysAvailable: 5,
      jobDescription: `Senior Full Stack Engineer

We are seeking an experienced Senior Full Stack Engineer to lead payments architecture and build customer-facing financial infrastructure.

Required Qualifications:
- 5+ years building distributed web applications with React and TypeScript
- Production backend experience with Node.js, Express, and REST API design
- Experience designing relational schemas in PostgreSQL and document stores in MongoDB
- Strong knowledge of AWS cloud services (S3, ECS, Lambda, CloudWatch)
- Track record of leading technical architecture and feature delivery end-to-end

Nice to Have:
- Hands-on experience with Next.js App Router and server-side streaming
- Container orchestration using Docker and Kubernetes
- Mentorship and technical coaching of mid-level and junior software engineers

Responsibilities:
- Architect reliable, low-latency transaction processing APIs
- Mentor team members and conduct rigorous peer code reviews`,
    });
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col text-gray-900">
      <AppHeader />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb navigation */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
          <Link href="/dashboard" className="hover:text-gray-900 flex items-center gap-1 font-medium">
            <ArrowLeft className="w-3 h-3" />
            <span>Dashboard</span>
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-semibold">New Interview Kit</span>
        </div>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-gray-200 mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              Create Interview Preparation Kit
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Specify your target job role and company website to configure the autonomous research and question pipeline.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSampleFill}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 text-xs font-medium text-gray-700 rounded border border-gray-300 shadow-xs transition-colors self-start sm:self-auto"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            Fill Sample Senior JD
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5" role="alert">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold text-red-800">Configuration Error: </span>
              {error}
            </div>
          </div>
        )}

        {/* Workflow Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 01: Company Information */}
          <div className="enterprise-card p-6">
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-gray-100">
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                STEP 01
              </span>
              <h2 className="text-sm font-semibold text-gray-900">Target Company Information</h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="companyUrl" className="block text-xs font-medium text-gray-700 mb-1">
                  Company Website URL <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Globe className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="companyUrl"
                    type="url"
                    required
                    placeholder="https://company.com"
                    value={form.companyUrl}
                    onChange={(e) => setForm((f) => ({ ...f, companyUrl: e.target.value }))}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors font-mono"
                  />
                </div>
                <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed">
                  The crawler will perform same-origin inspection of public mission, engineering architecture, and interview processes.
                </p>
              </div>

              <div>
                <label htmlFor="companyName" className="block text-xs font-medium text-gray-700 mb-1">
                  Company Name <span className="text-gray-400 text-[10px] font-normal">(optional override)</span>
                </label>
                <div className="relative">
                  <Building2 className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="companyName"
                    type="text"
                    placeholder="e.g. Stripe, GitHub, Vercel"
                    value={form.companyName}
                    onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
                <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed">
                  If left blank, the company name will be inferred automatically from the website domain and page headers.
                </p>
              </div>
            </div>
          </div>

          {/* Step 02: Job Description */}
          <div className="enterprise-card p-6">
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-gray-100">
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                STEP 02
              </span>
              <h2 className="text-sm font-semibold text-gray-900">Job Description & Role Requirements</h2>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="jobDescription" className="block text-xs font-medium text-gray-700">
                  Full Job Description <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] font-mono text-gray-400">
                  {form.jobDescription.length} characters
                </span>
              </div>
              <textarea
                id="jobDescription"
                required
                rows={10}
                placeholder="Paste the full job specification including requirements, tech stack, and responsibilities..."
                value={form.jobDescription}
                onChange={(e) => setForm((f) => ({ ...f, jobDescription: e.target.value }))}
                className="w-full p-3 bg-white border border-gray-300 rounded text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors font-mono leading-relaxed resize-y"
              />
              <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed">
                Requirements are strictly extracted and categorized into Must-Have vs Nice-to-Have with zero external hallucinations.
              </p>
            </div>
          </div>

          {/* Step 03: Study Plan Horizon */}
          <div className="enterprise-card p-6">
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-gray-100">
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                STEP 03
              </span>
              <h2 className="text-sm font-semibold text-gray-900">Preparation Timeline</h2>
            </div>

            <div className="max-w-xs">
              <label htmlFor="daysAvailable" className="block text-xs font-medium text-gray-700 mb-1">
                Available Preparation Days <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="daysAvailable"
                  type="number"
                  min={1}
                  max={60}
                  required
                  value={form.daysAvailable}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, daysAvailable: Math.max(1, Math.min(60, parseInt(e.target.value) || 1)) }))
                  }
                  className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded text-xs text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors font-mono"
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed">
                Between 1 and 60 days. The deterministic schedule engine will evenly distribute questions into daily time blocks (20–180 min).
              </p>
            </div>
          </div>

          {/* Submission Row */}
          <div className="flex items-center justify-between pt-2">
            <Link
              href="/dashboard"
              className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              Cancel and return to dashboard
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs sm:text-sm font-medium rounded transition-colors shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Initiating Pipeline...</span>
                </>
              ) : (
                <>
                  <span>Generate Interview Kit</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
