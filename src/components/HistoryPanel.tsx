"use client";

import { History, Trash2, FileDown, ChevronDown } from "lucide-react";
import { useState } from "react";
import type { AnalysisRecord } from "@/types/analysis";
import { exportAnalysisToPdf } from "@/lib/pdf";

interface HistoryPanelProps {
  history: AnalysisRecord[];
  onRemove: (id: string) => void;
  onSelect?: (record: AnalysisRecord) => void;
}

const DECISION_STYLES: Record<string, string> = {
  GL: "bg-gl/15 text-gl border-gl/40",
  RL: "bg-rl/15 text-rl border-rl/40",
  CHECK: "bg-check/15 text-check border-check/40",
};

/**
 * Panneau listant l'historique des analyses sauvegardées localement.
 * Permet de supprimer une entrée ou de re-télécharger son PDF.
 */
export default function HistoryPanel({ history, onRemove, onSelect }: HistoryPanelProps) {
  const [open, setOpen] = useState(true);

  return (
    <section className="animate-fade-in-up flex flex-col gap-4 rounded-3xl border border-border-subtle bg-surface p-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between gap-2 text-left"
      >
        <span className="flex items-center gap-2 text-lg font-semibold">
          <History className="h-5 w-5 text-accent-soft" />
          Historique des analyses
          <span className="rounded-full bg-surface-elevated px-2 py-0.5 text-xs text-muted">
            {history.length}
          </span>
        </span>
        <ChevronDown
          className={`h-5 w-5 text-muted transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="flex flex-col gap-3">
          {history.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">
              Aucune analyse pour le moment. Vos résultats apparaîtront ici.
            </p>
          ) : (
            history.map((record, index) => (
              <div
                key={record.id}
                className="animate-fade-in-up group flex items-center gap-3 rounded-2xl border border-border-subtle bg-surface-elevated p-3 transition-colors hover:border-accent-soft/50"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <button
                  type="button"
                  onClick={() => onSelect?.(record)}
                  className="flex flex-1 items-center gap-3 text-left"
                >
                  <div className="flex -space-x-3">
                    {record.thumbnails.slice(0, 3).map((thumb, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={i}
                        src={thumb}
                        alt=""
                        className="h-10 w-10 rounded-lg border-2 border-surface-elevated object-cover"
                      />
                    ))}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-md border px-1.5 py-0.5 text-[11px] font-bold ${
                          DECISION_STYLES[record.verdict.decision]
                        }`}
                      >
                        {record.verdict.decision}
                      </span>
                      <span className="text-xs text-muted">
                        {new Date(record.createdAt).toLocaleString("fr-FR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm text-foreground/80">
                      {record.verdict.summary}
                    </p>
                  </div>
                </button>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    aria-label="Télécharger le PDF"
                    onClick={() => exportAnalysisToPdf(record)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-accent/15 hover:text-accent-soft"
                  >
                    <FileDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Supprimer de l'historique"
                    onClick={() => onRemove(record.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-rl/15 hover:text-rl"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
}
