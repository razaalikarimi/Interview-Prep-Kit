'use client';

import React, { useState, useMemo } from 'react';
import { kitsApi, type Question, type Requirement } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  Search,
  Pin,
  Edit3,
  Trash2,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Plus,
  Loader2,
  Copy,
  CheckCheck,
} from 'lucide-react';

const CATEGORIES = [
  { key: 'all', label: 'All Categories' },
  { key: 'technical', label: 'Technical' },
  { key: 'behavioural', label: 'Behavioural' },
  { key: 'system-design', label: 'System Design' },
  { key: 'company-fit', label: 'Company Fit' },
] as const;

interface Props {
  kitId: string;
  questions: Question[];
  requirements: Requirement[];
  version: number;
  onUpdate: () => void;
}

export function QuestionsTab({ kitId, questions, requirements, version, onUpdate }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | '1' | '2' | '3'>('all');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Edit State
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editForm, setEditForm] = useState<{
    prompt: string;
    answer_outline: string;
    difficulty: 1 | 2 | 3;
    category: Question['category'];
  }>({
    prompt: '',
    answer_outline: '',
    difficulty: 2,
    category: 'technical',
  });
  const [saving, setSaving] = useState(false);

  // Delete State
  const [deletingQuestion, setDeletingQuestion] = useState<Question | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Regeneration State
  const [regenCategory, setRegenCategory] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  // Add Question State
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [newQuestionForm, setNewQuestionForm] = useState({
    prompt: '',
    answer_outline: '',
    category: 'technical' as Question['category'],
    difficulty: 2 as 1 | 2 | 3,
    requirement_ids: [] as string[],
  });

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Requirement lookup map
  const reqMap = useMemo(() => {
    return new Map(requirements.map((r) => [r.id, r]));
  }, [requirements]);

  // Toggle card expansion
  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Expand all / Collapse all
  const handleExpandAll = () => {
    if (expandedIds.size === filteredQuestions.length) {
      setExpandedIds(new Set());
    } else {
      setExpandedIds(new Set(filteredQuestions.map((q) => q.id)));
    }
  };

  // Filtering
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (selectedCategory !== 'all' && q.category !== selectedCategory) return false;
      if (difficultyFilter !== 'all' && q.difficulty.toString() !== difficultyFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesPrompt = q.prompt.toLowerCase().includes(query);
        const matchesAnswer = q.answer_outline.toLowerCase().includes(query);
        const matchesId = q.id.toLowerCase().includes(query);
        if (!matchesPrompt && !matchesAnswer && !matchesId) return false;
      }
      return true;
    });
  }, [questions, selectedCategory, difficultyFilter, searchQuery]);

  // Copy Answer Outline
  const handleCopyOutline = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Pin Toggle
  const handlePinToggle = async (q: Question) => {
    try {
      await kitsApi.updateQuestion(kitId, q.id, { pinned: !q.state?.pinned });
      onUpdate();
    } catch {
      setError('Failed to update question pin status.');
    }
  };

  // Edit Handlers
  const handleStartEdit = (q: Question) => {
    setEditingQuestion(q);
    setEditForm({
      prompt: q.prompt,
      answer_outline: q.answer_outline,
      difficulty: q.difficulty,
      category: q.category,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingQuestion) return;
    setSaving(true);
    setError('');
    try {
      await kitsApi.updateQuestion(kitId, editingQuestion.id, editForm);
      setEditingQuestion(null);
      onUpdate();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save question edit.');
    } finally {
      setSaving(false);
    }
  };

  // Delete Handler
  const handleConfirmDelete = async () => {
    if (!deletingQuestion) return;
    setDeleting(true);
    try {
      await kitsApi.deleteQuestion(kitId, deletingQuestion.id);
      setDeletingQuestion(null);
      onUpdate();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete question.');
    } finally {
      setDeleting(false);
    }
  };

  // Add Question Handler
  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionForm.prompt.trim()) return;
    setSaving(true);
    setError('');
    try {
      await kitsApi.createQuestion(kitId, {
        prompt: newQuestionForm.prompt,
        answer_outline: newQuestionForm.answer_outline || 'Key answer points pending.',
        category: newQuestionForm.category,
        difficulty: newQuestionForm.difficulty,
        requirement_ids: newQuestionForm.requirement_ids,
      });
      setIsAddingQuestion(false);
      setNewQuestionForm({
        prompt: '',
        answer_outline: '',
        category: 'technical',
        difficulty: 2,
        requirement_ids: [],
      });
      onUpdate();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create question.');
    } finally {
      setSaving(false);
    }
  };

  // Category Regeneration Handler
  const handleConfirmRegenerate = async () => {
    if (!regenCategory) return;
    setRegenerating(true);
    setError('');
    try {
      await kitsApi.regenerate(kitId, {
        section: 'questions',
        category: regenCategory,
        expectedVersion: version,
      });
      setRegenCategory(null);
      onUpdate();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Category regeneration failed.');
    } finally {
      setRegenerating(false);
    }
  };

  const currentCategoryCount = questions.filter(
    (q) => regenCategory === null || q.category === regenCategory,
  ).length;

  return (
    <div className="space-y-4 max-w-5xl animate-fade-in">
      {/* Error Alert */}
      {error && (
        <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Control Bar: Filters & Actions */}
      <div className="flex flex-col gap-3 pb-3 border-b border-slate-800">
        {/* Category Tabs */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            {CATEGORIES.map((cat) => {
              const count =
                cat.key === 'all'
                  ? questions.length
                  : questions.filter((q) => q.category === cat.key).length;
              const isActive = selectedCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className="text-[10px] font-mono opacity-70">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Right Action: Regenerate & Add */}
          <div className="flex items-center gap-2">
            {selectedCategory !== 'all' && (
              <button
                type="button"
                onClick={() => setRegenCategory(selectedCategory)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-300 rounded border border-slate-800 transition-colors"
              >
                <RefreshCw className="w-3 h-3 text-slate-400" />
                <span>Regenerate {selectedCategory}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsAddingQuestion(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white rounded transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Question</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search questions or outline..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1 bg-slate-900 border border-slate-800 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto text-xs text-slate-400">
            <span>Difficulty:</span>
            <div className="flex items-center gap-1">
              {(['all', '1', '2', '3'] as const).map((diff) => (
                <button
                  key={diff}
                  onClick={() => setDifficultyFilter(diff)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono uppercase transition-colors ${
                    difficultyFilter === diff
                      ? 'bg-slate-800 text-white font-semibold border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {diff === 'all' ? 'All' : diff === '1' ? 'Easy' : diff === '2' ? 'Med' : 'Hard'}
                </button>
              ))}
            </div>

            <span className="text-slate-700">|</span>

            <button
              onClick={handleExpandAll}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              {expandedIds.size === filteredQuestions.length ? 'Collapse All' : 'Expand All'}
            </button>
          </div>
        </div>
      </div>

      {/* Question List */}
      {filteredQuestions.length === 0 ? (
        <div className="enterprise-card p-10 text-center text-xs text-slate-400">
          <p className="mb-2 font-medium text-slate-300">No questions found matching the selected filters.</p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setDifficultyFilter('all');
              setSearchQuery('');
            }}
            className="text-blue-400 hover:underline text-[11px]"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredQuestions.map((q) => {
            const isExpanded = expandedIds.has(q.id);
            const isPinned = q.state?.pinned;
            const isEdited = q.state?.edited;

            return (
              <div
                key={q.id}
                className={`enterprise-card transition-colors ${
                  isPinned ? 'border-amber-500/40 bg-amber-500/5' : ''
                }`}
              >
                {/* Collapsed Header Bar */}
                <div className="p-3.5 flex items-start justify-between gap-3">
                  <div
                    onClick={() => toggleExpand(q.id)}
                    className="flex items-start gap-2.5 flex-1 min-w-0 cursor-pointer"
                  >
                    <button
                      type="button"
                      aria-label="Expand question"
                      className="text-slate-500 hover:text-slate-300 mt-0.5"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono text-[10px] text-slate-500 px-1 py-0.2 rounded bg-slate-900 border border-slate-800">
                          {q.id}
                        </span>

                        <Badge variant={q.category}>{q.category}</Badge>

                        <Badge
                          variant={q.difficulty === 1 ? 'easy' : q.difficulty === 2 ? 'medium' : 'hard'}
                        >
                          {q.difficulty === 1 ? 'Easy' : q.difficulty === 2 ? 'Medium' : 'Hard'}
                        </Badge>

                        {isPinned && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                            <Pin className="w-2.5 h-2.5 fill-amber-400" /> Pinned
                          </span>
                        )}

                        {isEdited && (
                          <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.2 rounded border border-blue-500/20">
                            Edited
                          </span>
                        )}
                      </div>

                      <h3 className="text-xs sm:text-sm font-medium text-slate-200 leading-snug">
                        {q.prompt}
                      </h3>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0 pt-0.5">
                    <button
                      type="button"
                      onClick={() => handlePinToggle(q)}
                      title={isPinned ? 'Unpin question' : 'Pin question (protects from regeneration)'}
                      className={`p-1.5 rounded transition-colors ${
                        isPinned
                          ? 'text-amber-400 hover:bg-amber-500/20'
                          : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-amber-400' : ''}`} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStartEdit(q)}
                      title="Edit question"
                      className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeletingQuestion(q)}
                      title="Delete question"
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded Section: Answer Outline & Requirements */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-800/60 bg-slate-900/40 text-xs">
                    <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-800/40">
                      <span className="font-mono text-[11px] text-slate-400 uppercase tracking-wider">
                        Suggested Answer Outline &amp; Talking Points
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyOutline(q.id, q.answer_outline)}
                        className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
                      >
                        {copiedId === q.id ? (
                          <>
                            <CheckCheck className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Outline</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line font-sans mb-3">
                      {q.answer_outline}
                    </p>

                    {/* Linked Competencies */}
                    {q.requirement_ids && q.requirement_ids.length > 0 && (
                      <div className="pt-2 border-t border-slate-800/40 flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] text-slate-500">Evaluates Competencies:</span>
                        {q.requirement_ids.map((reqId) => {
                          const req = reqMap.get(reqId);
                          return (
                            <span
                              key={reqId}
                              title={req?.text}
                              className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300"
                            >
                              {reqId}: {req?.text.slice(0, 30)}...
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Question Modal */}
      <Modal
        isOpen={editingQuestion !== null}
        onClose={() => setEditingQuestion(null)}
        title="Edit Interview Question"
        description="Update question wording, answer outline, category, and difficulty."
        footer={
          <>
            <button
              onClick={() => setEditingQuestion(null)}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={saving}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save Changes</span>
            </button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-300 mb-1">Question Prompt</label>
            <textarea
              rows={3}
              value={editForm.prompt}
              onChange={(e) => setEditForm((f) => ({ ...f, prompt: e.target.value }))}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded text-xs text-white focus:outline-none focus:border-blue-500 font-sans"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Answer Outline &amp; Guidance</label>
            <textarea
              rows={4}
              value={editForm.answer_outline}
              onChange={(e) => setEditForm((f) => ({ ...f, answer_outline: e.target.value }))}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded text-xs text-white focus:outline-none focus:border-blue-500 font-sans leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Category</label>
              <select
                value={editForm.category}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, category: e.target.value as Question['category'] }))
                }
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="technical">Technical</option>
                <option value="behavioural">Behavioural</option>
                <option value="system-design">System Design</option>
                <option value="company-fit">Company Fit</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">Difficulty</label>
              <select
                value={editForm.difficulty}
                onChange={(e) =>
                  setEditForm((f) => ({
                    ...f,
                    difficulty: parseInt(e.target.value) as 1 | 2 | 3,
                  }))
                }
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value={1}>1 - Easy</option>
                <option value={2}>2 - Medium</option>
                <option value={3}>3 - Hard</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deletingQuestion !== null}
        onClose={() => setDeletingQuestion(null)}
        title="Delete Question"
        description="Are you sure you want to delete this question from your kit?"
        footer={
          <>
            <button
              onClick={() => setDeletingQuestion(null)}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Confirm Delete</span>
            </button>
          </>
        }
      >
        <p className="text-xs text-slate-300">
          Question: <span className="font-semibold text-white">"{deletingQuestion?.prompt}"</span>
        </p>
        <p className="text-[11px] text-slate-500 mt-2">
          This question will be removed from all upcoming study schedule days.
        </p>
      </Modal>

      {/* Category Regeneration Modal */}
      <Modal
        isOpen={regenCategory !== null}
        onClose={() => setRegenCategory(null)}
        title={`Regenerate ${regenCategory ? regenCategory.replace(/-/g, ' ') : ''} Questions`}
        description="Synthesize a new set of questions targeted to this category."
        footer={
          <>
            <button
              onClick={() => setRegenCategory(null)}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmRegenerate}
              disabled={regenerating}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {regenerating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Confirm Regeneration</span>
            </button>
          </>
        }
      >
        <div className="text-xs text-slate-300 space-y-3">
          <p>
            This operation will generate fresh questions for the <span className="font-semibold text-white">{regenCategory}</span> category ({currentCategoryCount} current items).
          </p>

          <div className="p-3 rounded bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs">
            <span className="font-semibold text-blue-200">Preservation Guarantee: </span>
            Any questions you have manually edited or pinned will remain completely preserved. Unrelated categories will not be modified.
          </div>
        </div>
      </Modal>

      {/* Add Custom Question Modal */}
      <Modal
        isOpen={isAddingQuestion}
        onClose={() => setIsAddingQuestion(false)}
        title="Add Custom Interview Question"
        description="Add your own practice question to this preparation kit."
        footer={
          <>
            <button
              onClick={() => setIsAddingQuestion(false)}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddQuestion}
              disabled={saving || !newQuestionForm.prompt.trim()}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Add to Question Bank</span>
            </button>
          </>
        }
      >
        <form onSubmit={handleAddQuestion} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-300 mb-1">
              Question Prompt <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. How does React Reconciliation algorithm differ in Concurrent Mode?"
              value={newQuestionForm.prompt}
              onChange={(e) => setNewQuestionForm((f) => ({ ...f, prompt: e.target.value }))}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">
              Answer Outline &amp; Expected Talking Points
            </label>
            <textarea
              rows={3}
              placeholder="Key concepts, algorithms, architectural trade-offs to cover..."
              value={newQuestionForm.answer_outline}
              onChange={(e) => setNewQuestionForm((f) => ({ ...f, answer_outline: e.target.value }))}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded text-xs text-white focus:outline-none focus:border-blue-500 font-sans"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Category</label>
              <select
                value={newQuestionForm.category}
                onChange={(e) =>
                  setNewQuestionForm((f) => ({
                    ...f,
                    category: e.target.value as Question['category'],
                  }))
                }
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="technical">Technical</option>
                <option value="behavioural">Behavioural</option>
                <option value="system-design">System Design</option>
                <option value="company-fit">Company Fit</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">Difficulty</label>
              <select
                value={newQuestionForm.difficulty}
                onChange={(e) =>
                  setNewQuestionForm((f) => ({
                    ...f,
                    difficulty: parseInt(e.target.value) as 1 | 2 | 3,
                  }))
                }
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value={1}>1 - Easy</option>
                <option value={2}>2 - Medium</option>
                <option value={3}>3 - Hard</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
