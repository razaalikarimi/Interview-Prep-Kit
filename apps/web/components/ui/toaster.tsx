'use client';

import React, { useState, useEffect } from 'react';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'destructive';
}

type Listener = (toasts: ToastMessage[]) => void;

let listeners: Listener[] = [];
let memoryToasts: ToastMessage[] = [];

function emitChange() {
  listeners.forEach((listener) => listener([...memoryToasts]));
}

export function toast({
  title,
  description,
  variant = 'default',
}: {
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'destructive';
}) {
  const id = Math.random().toString(36).substring(2, 9);
  const newToast: ToastMessage = { id, title, description, variant };
  memoryToasts = [...memoryToasts, newToast];
  emitChange();

  setTimeout(() => {
    memoryToasts = memoryToasts.filter((t) => t.id !== id);
    emitChange();
  }, 4000);
}

export function Toaster() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    listeners.push(setToasts);
    return () => {
      listeners = listeners.filter((l) => l !== setToasts);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="assertive"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none"
    >
      {toasts.map((t) => {
        let borderClass = 'border-slate-800 bg-slate-900/90 text-slate-100';
        if (t.variant === 'success') {
          borderClass = 'border-emerald-500/30 bg-emerald-950/90 text-emerald-100';
        } else if (t.variant === 'destructive') {
          borderClass = 'border-rose-500/30 bg-rose-950/90 text-rose-100';
        }

        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex flex-col p-4 rounded-xl border backdrop-blur-md shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${borderClass}`}
          >
            <div className="flex items-center justify-between font-semibold text-sm">
              <span>{t.title}</span>
              <button
                type="button"
                onClick={() => {
                  memoryToasts = memoryToasts.filter((item) => item.id !== t.id);
                  emitChange();
                }}
                className="ml-4 text-xs opacity-60 hover:opacity-100 transition-opacity"
              >
                ✕
              </button>
            </div>
            {t.description && (
              <p className="mt-1 text-xs opacity-80 leading-relaxed">{t.description}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
