/**
 * Types partagés pour l'application QC AI.
 * Le "decision" correspond au verdict rendu par l'IA de contrôle qualité.
 */

export type Decision = "GL" | "RL" | "CHECK";

/**
 * Structure JSON stricte renvoyée par le modèle d'analyse d'images.
 * Elle doit correspondre exactement au format demandé dans le prompt système.
 */
export interface QCVerdict {
  decision: Decision;
  score: number; // 0 - 100
  confidence: number; // 0 - 100
  issues: string[];
  strengths: string[];
  summary: string;
}

/**
 * Une entrée d'historique persistée dans le localStorage du navigateur.
 */
export interface AnalysisRecord {
  id: string;
  createdAt: string; // ISO date string
  productName?: string;
  thumbnails: string[]; // data URLs des images (miniatures compressées)
  verdict: QCVerdict;
}
