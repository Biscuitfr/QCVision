import jsPDF from "jspdf";
import type { AnalysisRecord } from "@/types/analysis";

const DECISION_LABELS: Record<string, string> = {
  GL: "GREEN LIGHT - Conforme",
  RL: "RED LIGHT - Non conforme",
  CHECK: "CHECK - Incertain",
};

const DECISION_COLORS: Record<string, [number, number, number]> = {
  GL: [34, 197, 94],
  RL: [239, 68, 68],
  CHECK: [249, 115, 22],
};

/**
 * Génère et télécharge un PDF récapitulant le résultat d'une analyse QC.
 */
export function exportAnalysisToPdf(record: AnalysisRecord) {
  const { verdict } = record;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 48;
  let y = 56;

  // En-tête
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(20, 20, 20);
  doc.text("QC AI — Rapport d'analyse qualité", margin, y);
  y += 22;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(110, 110, 110);
  const dateStr = new Date(record.createdAt).toLocaleString("fr-FR");
  doc.text(`Généré le ${dateStr}`, margin, y);
  y += 28;

  // Badge décision
  const color = DECISION_COLORS[verdict.decision] ?? [107, 114, 128];
  doc.setFillColor(color[0], color[1], color[2]);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 40, 8, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(DECISION_LABELS[verdict.decision] ?? verdict.decision, margin + 16, y + 26);
  y += 60;

  // Score / confiance
  doc.setTextColor(20, 20, 20);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`Score qualité : ${verdict.score} / 100`, margin, y);
  doc.text(`Confiance : ${verdict.confidence} / 100`, margin + 260, y);
  y += 26;

  // Résumé
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Résumé", margin, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const summaryLines = doc.splitTextToSize(verdict.summary, pageWidth - margin * 2);
  doc.text(summaryLines, margin, y);
  y += summaryLines.length * 14 + 16;

  // Points forts
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(21, 128, 61);
  doc.text("Points positifs", margin, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(20, 20, 20);
  if (verdict.strengths.length === 0) {
    doc.text("Aucun point positif signalé.", margin, y);
    y += 16;
  } else {
    for (const strength of verdict.strengths) {
      const lines = doc.splitTextToSize(`• ${strength}`, pageWidth - margin * 2);
      doc.text(lines, margin, y);
      y += lines.length * 14 + 4;
    }
  }
  y += 12;

  // Défauts
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(185, 28, 28);
  doc.text("Défauts détectés", margin, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(20, 20, 20);
  if (verdict.issues.length === 0) {
    doc.text("Aucun défaut détecté.", margin, y);
    y += 16;
  } else {
    for (const issue of verdict.issues) {
      if (y > 760) {
        doc.addPage();
        y = 56;
      }
      const lines = doc.splitTextToSize(`• ${issue}`, pageWidth - margin * 2);
      doc.text(lines, margin, y);
      y += lines.length * 14 + 4;
    }
  }

  // Pied de page
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text("Généré automatiquement par QC AI — analyse assistée par intelligence artificielle.", margin, 810);

  const filename = `QC-AI-rapport-${record.id.slice(0, 8)}.pdf`;
  doc.save(filename);
}
