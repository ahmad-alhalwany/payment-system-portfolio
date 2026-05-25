"use client";

import React from "react";
import { X } from "lucide-react";

interface BranchModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}

export default function BranchModal({ open, onClose, title, children, wide }: BranchModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        className={`relative w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl p-6 md:p-8 animate-fadeIn
          ${wide ? "max-w-3xl" : "max-w-md"}`}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute end-4 top-4 p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-white pe-8">{title}</h2>
        {children}
      </div>
    </div>
  );
}
