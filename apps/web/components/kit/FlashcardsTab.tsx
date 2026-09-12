'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { kitsApi, type Flashcard, type Requirement } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import {
  BookOpen,
  Pin,
  Edit3,
  Trash2,
  RefreshCw,
  Plus,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface Props {
  kitId: string;
  flashcards: Flashcard[];
  requirements?: Requirement[];
  version: number;
  onUpdate: () => void;
}

export function FlashcardsTab({ kitId, flashcards, requirements: _requirements, version, onUpdate }: Props) {
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [editForm, setEditForm] = useState<{ front: string; back: string }>({ front: '', back: '' });
  const [deletingCard, setDeletingCard] = useState<Flashcard | null>(null);
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardForm, setNewCardForm] = useState({ front: '', back: '', requirement_ids: [] as string[] });

  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState('');

  // Start Edit
  const handleStartEdit = (f: Flashcard) => {
    setEditingCard(f);
    setEditForm({ front: f.front, back: f.back });
  };

  // Save Edit
  const handleSaveEdit = async () => {
    if (!editingCard) return;
    setSaving(true);
    setError('');
    try {
      await kitsApi.updateFlashcard(kitId, editingCard.id, editForm);
      setEditingCard(null);
      onUpdate();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update flashcard');
    } finally {
      setSaving(false);
    }
  };

  // Toggle Pin
  const handlePinToggle = async (f: Flashcard) => {
    try {
      await kitsApi.updateFlashcard(kitId, f.id, { pinned: !f.state?.pinned });
      onUpdate();
    } catch {
      setError('Failed to update pin state');
    }
  };

  // Delete Card
  const handleConfirmDelete = async () => {
    if (!deletingCard) return;
    setSaving(true);
    try {
      await kitsApi.deleteFlashcard(kitId, deletingCard.id);
      setDeletingCard(null);
      onUpdate();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete flashcard');
    } finally {
      setSaving(false);
    }
  };

  // Add Card
  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardForm.front.trim() || !newCardForm.back.trim()) return;
    setSaving(true);
    setError('');
    try {
      await kitsApi.createFlashcard(kitId, {
        front: newCardForm.front,
        back: newCardForm.back,
        requirement_ids: newCardForm.requirement_ids,
      });
      setIsAddingCard(false);
      setNewCardForm({ front: '', back: '', requirement_ids: [] });
      onUpdate();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create flashcard');
    } finally {
      setSaving(false);
    }
  };

  // Regenerate Flashcards
  const handleConfirmRegenerate = async () => {
    setShowRegenModal(false);
    setRegenerating(true);
    setError('');
    try {
      await kitsApi.regenerate(kitId, { section: 'flashcards', expectedVersion: version });
      onUpdate();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Flashcard regeneration failed');
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl animate-fade-in">
      {/* Error Alert */}
      {error && (
        <div className="p-3 rounded bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-900">Interview Flashcards</h2>
            <span className="text-xs text-gray-500">({flashcards.length} cards)</span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Rapid recall flashcards mapped directly to required core competencies.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
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
            <span>{regenerating ? 'Regenerating...' : 'Regenerate Flashcards'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddingCard(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded border border-gray-300 shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Card</span>
          </button>

          <Link
            href={`/kits/${kitId}/practice`}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors shadow-xs"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Practice Now</span>
          </Link>
        </div>
      </div>

      {/* Flashcard Grid */}
      {flashcards.length === 0 ? (
        <div className="enterprise-card p-10 text-center text-xs text-gray-500">
          <p className="mb-3 font-medium text-gray-700">No flashcards available in this kit.</p>
          <button
            onClick={() => setIsAddingCard(true)}
            className="text-blue-600 hover:underline text-xs font-medium"
          >
            Create your first flashcard
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3.5">
          {flashcards.map((card) => {
            const isPinned = card.state?.pinned;
            const isEdited = card.state?.edited;

            return (
              <div
                key={card.id}
                className={`enterprise-card p-4 flex flex-col justify-between transition-colors ${
                  isPinned ? 'border-amber-300 bg-amber-50/20' : ''
                }`}
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-gray-600 px-1.5 py-0.2 rounded bg-gray-100 border border-gray-200">
                        {card.id}
                      </span>

                      {isPinned && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 font-medium">
                          <Pin className="w-2.5 h-2.5 fill-amber-600 text-amber-600" /> Pinned
                        </span>
                      )}

                      {isEdited && (
                        <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 font-medium">
                          Edited
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handlePinToggle(card)}
                        title={isPinned ? 'Unpin' : 'Pin (preserves during regeneration)'}
                        className={`p-1 rounded transition-colors ${
                          isPinned
                            ? 'text-amber-600 hover:bg-amber-100'
                            : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <Pin className={`w-3 h-3 ${isPinned ? 'fill-amber-600' : ''}`} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStartEdit(card)}
                        title="Edit flashcard"
                        className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeletingCard(card)}
                        title="Delete flashcard"
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Card Front (Question) */}
                  <div className="mb-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500 block mb-1 font-semibold">
                      Question / Concept
                    </span>
                    <h3 className="text-xs sm:text-sm font-semibold text-gray-900 leading-snug">
                      {card.front}
                    </h3>
                  </div>

                  {/* Card Back (Explanation) */}
                  <div className="pt-2.5 border-t border-gray-100">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500 block mb-1 font-semibold">
                      Answer / Key Concept
                    </span>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      {card.back}
                    </p>
                  </div>
                </div>

                {/* Linked Requirements */}
                {card.requirement_ids && card.requirement_ids.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-gray-100 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-gray-500 font-mono">Linked:</span>
                    {card.requirement_ids.map((rId) => (
                      <span
                        key={rId}
                        className="text-[10px] font-mono px-1 rounded bg-gray-100 text-gray-600 border border-gray-200"
                      >
                        {rId}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Flashcard Modal */}
      <Modal
        isOpen={editingCard !== null}
        onClose={() => setEditingCard(null)}
        title="Edit Flashcard"
        description="Update question and answer content for this card."
        footer={
          <>
            <button
              onClick={() => setEditingCard(null)}
              className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 rounded transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={saving}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save Flashcard</span>
            </button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-gray-700 mb-1">Front (Prompt)</label>
            <textarea
              rows={2}
              value={editForm.front}
              onChange={(e) => setEditForm((f) => ({ ...f, front: e.target.value }))}
              className="w-full p-2.5 bg-white border border-gray-300 rounded text-xs text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-sans"
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">Back (Explanation)</label>
            <textarea
              rows={4}
              value={editForm.back}
              onChange={(e) => setEditForm((f) => ({ ...f, back: e.target.value }))}
              className="w-full p-2.5 bg-white border border-gray-300 rounded text-xs text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-sans leading-relaxed"
            />
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deletingCard !== null}
        onClose={() => setDeletingCard(null)}
        title="Delete Flashcard"
        description="Are you sure you want to delete this card from the practice deck?"
        footer={
          <>
            <button
              onClick={() => setDeletingCard(null)}
              className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 rounded transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={saving}
              className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded transition-colors shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Confirm Delete</span>
            </button>
          </>
        }
      >
        <p className="text-xs text-gray-700">
          Card: <span className="font-semibold text-gray-900">"{deletingCard?.front}"</span>
        </p>
      </Modal>

      {/* Regenerate Confirmation Modal */}
      <Modal
        isOpen={showRegenModal}
        onClose={() => setShowRegenModal(false)}
        title="Regenerate Flashcards Deck"
        description="Generate a new set of flashcards based on the extracted job requirements."
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
              disabled={regenerating}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {regenerating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Confirm Regeneration</span>
            </button>
          </>
        }
      >
        <div className="text-xs text-gray-700 space-y-3">
          <p>
            This action will synthesize a fresh deck of flashcards covering your must-have technical competencies.
          </p>
          <div className="p-3 rounded bg-blue-50 border border-blue-200 text-blue-800">
            <span className="font-semibold text-blue-900">Preservation Guarantee: </span>
            Any flashcards you have edited or pinned will remain completely preserved.
          </div>
        </div>
      </Modal>

      {/* Add Flashcard Modal */}
      <Modal
        isOpen={isAddingCard}
        onClose={() => setIsAddingCard(false)}
        title="Create Flashcard"
        description="Add a custom concept or question to your study deck."
        footer={
          <>
            <button
              onClick={() => setIsAddingCard(false)}
              className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 rounded transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleAddCard}
              disabled={saving || !newCardForm.front.trim() || !newCardForm.back.trim()}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Add Flashcard</span>
            </button>
          </>
        }
      >
        <form onSubmit={handleAddCard} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Front (Prompt / Question) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. What is the difference between Optimistic Concurrency and Pessimistic Locking?"
              value={newCardForm.front}
              onChange={(e) => setNewCardForm((f) => ({ ...f, front: e.target.value }))}
              className="w-full p-2.5 bg-white border border-gray-300 rounded text-xs text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Back (Core Answer / Definition) <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              placeholder="Concise explanation and core technical trade-offs..."
              value={newCardForm.back}
              onChange={(e) => setNewCardForm((f) => ({ ...f, back: e.target.value }))}
              className="w-full p-2.5 bg-white border border-gray-300 rounded text-xs text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-sans"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
