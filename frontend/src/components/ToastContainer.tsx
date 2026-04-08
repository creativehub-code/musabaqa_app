'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle, X } from 'lucide-react';

export interface ToastData {
  id: string;
  judgeName: string;
  programName: string;
  language: string;
}

interface ToastProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}

// Language badge colours mirroring the marks page palette
const langColor: Record<string, { bg: string; text: string; dot: string }> = {
  arabic:   { bg: 'bg-green-500/10',  text: 'text-green-300',  dot: 'bg-green-400' },
  english:  { bg: 'bg-blue-500/10',   text: 'text-blue-300',   dot: 'bg-blue-400'  },
  malayalam:{ bg: 'bg-orange-500/10', text: 'text-orange-300', dot: 'bg-orange-400'},
  urdu:     { bg: 'bg-purple-500/10', text: 'text-purple-300', dot: 'bg-purple-400'},
};

function getLangStyle(lang: string) {
  return langColor[lang?.toLowerCase()] ?? { bg: 'bg-gray-700/40', text: 'text-gray-300', dot: 'bg-gray-400' };
}

function Toast({ toast, onDismiss }: { toast: ToastData; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false);
  const lang = getLangStyle(toast.language);

  // Slide-in on mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  // Auto-dismiss after 5 s
  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), 5000);
    return () => clearTimeout(t);
  }, [toast.id, onDismiss]);

  return (
    <div
      className={`
        flex items-start gap-3 w-80 p-4 rounded-2xl shadow-2xl
        bg-[#1E1B2E] border border-[#2D283E]
        backdrop-blur-md
        transition-all duration-500 ease-out
        ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}
      `}
    >
      {/* Icon */}
      <div className="shrink-0 mt-0.5 w-8 h-8 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center">
        <CheckCircle size={16} className="text-green-400" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold uppercase tracking-widest text-green-400 mb-1">
          Mark Submitted
        </p>
        <p className="text-sm text-white font-semibold leading-snug truncate">
          <span className="text-purple-300">Judge {toast.judgeName}</span>
          <span className="text-gray-400 font-normal"> submitted a mark in</span>
        </p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {/* Language badge */}
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border border-white/5 ${lang.bg} ${lang.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${lang.dot}`} />
            {toast.language}
          </span>
          {/* Program name */}
          <span className="text-xs text-gray-300 font-semibold truncate max-w-[10rem]">
            {toast.programName}
          </span>
        </div>
      </div>

      {/* Dismiss */}
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 text-gray-600 hover:text-white transition-colors mt-0.5"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl bg-gray-800 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 animate-[shrink_5s_linear_forwards]"
        />
      </div>
    </div>
  );
}

export default function ToastContainer({ toasts, onDismiss }: ToastProps) {
  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 items-end pointer-events-none">
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto relative">
          <Toast toast={toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}
