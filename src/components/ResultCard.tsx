"use client";

import { CheckCircle, AlertTriangle, FileDown, MessageSquareText } from "lucide-react";
import VerdictBadge from "./VerdictBadge";
import ScoreGauge from "./ScoreGauge";
import type { AnalysisRecord } from "@/types/analysis";
import { exportAnalysisToPdf } from "@/lib/pdf";

interface ResultCardProps {
  record: AnalysisRecord;
}

/**
 * Carte de résultat complète : badge, scores, résumé, points forts et défauts.
 */
export default function ResultCard({ record }: ResultCardProps) {
  const { verdict } = record;
  const decisionColor =
    verdict.decision === "GL" ? "text-gl" : verdict.decision === "RL" ? "text-rl" : "text-check";

  return (
    <div className="animate-fade-in-up flex flex-col gap-6 rounded-3xl border border-border-subtle bg-surface p-6 sm:p-8">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-stretch sm:justify-between">
        <VerdictBadge decision={verdict.decision} />
        <div className="flex flex-1 items-center justify-center gap-4">
          <ScoreGauge label="Score qualité" value={verdict.score} colorClass={decisionColor} />
          <ScoreGauge label="Confiance IA" value={verdict.confidence} colorClass="text-accent-soft" />
        </div>
      </div>

      {/* Résumé */}
      <div className="flex items-start gap-3 rounded-2xl bg-surface-elevated p-4">
        <MessageSquareText className="mt-0.5 h-5 w-5 shrink-0 text-accent-soft" />
        <p className="text-sm leading-relaxed text-foreground/90 sm:text-base">{verdict.summary}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Points forts */}
        <div className="rounded-2xl border border-gl/20 bg-gl/5 p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gl">
            <CheckCircle className="h-4 w-4" /> Points positifs
          </h3>
          {verdict.strengths.length === 0 ? (
            <p className="text-sm text-muted">Aucun point positif signalé.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {verdict.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground/90">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gl" />
                  {s}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Défauts */}
        <div className="rounded-2xl border border-rl/20 bg-rl/5 p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-rl">
            <AlertTriangle className="h-4 w-4" /> Défauts détectés
          </h3>
          {verdict.issues.length === 0 ? (
            <p className="text-sm text-muted">Aucun défaut détecté.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {verdict.issues.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground/90">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rl" />
                  {s}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => exportAnalysisToPdf(record)}
        className="flex items-center justify-center gap-2 self-start rounded-xl border border-border-subtle bg-surface-elevated px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-accent-soft hover:text-accent-soft"
      >
        <FileDown className="h-4 w-4" />
        Télécharger le rapport PDF
      </button>
    </div>
  );
}
