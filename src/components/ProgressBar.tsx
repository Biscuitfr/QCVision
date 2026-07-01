"use client";

import { Loader2 } from "lucide-react";

interface ProgressBarProps {
  progress: number; // 0 - 100
  label?: string;
}

/**
 * Barre de progression animée affichée pendant l'analyse IA.
 */
export default function ProgressBar({ progress, label }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, progress));

  return (
    <div className="animate-fade-in-up w-full rounded-2xl border border-border-subtle bg-surface p-5">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-accent-soft" />
        <span>{label ?? "Analyse en cours..."}</span>
        <span className="ml-auto tabular-nums text-muted">{Math.round(clamped)}%</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-border-subtle/70">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent to-accent-soft transition-[width] duration-300 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
