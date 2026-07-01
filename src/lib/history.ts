import type { AnalysisRecord } from "@/types/analysis";

/**
 * Gestion de l'historique des analyses dans le localStorage du navigateur.
 * Aucune donnée n'est envoyée à un serveur : tout reste en local, côté client.
 */
const STORAGE_KEY = "qc-ai-history-v1";
const MAX_HISTORY_ITEMS = 50;

function isBrowser() {
  return typeof window !== "undefined";
}

export function loadHistory(): AnalysisRecord[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as AnalysisRecord[];
  } catch (error) {
    console.error("[QC AI] Erreur lecture historique:", error);
    return [];
  }
}

export function saveHistory(records: AnalysisRecord[]) {
  if (!isBrowser()) return;
  try {
    const trimmed = records.slice(0, MAX_HISTORY_ITEMS);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error("[QC AI] Erreur sauvegarde historique:", error);
  }
}

export function addHistoryRecord(record: AnalysisRecord): AnalysisRecord[] {
  const current = loadHistory();
  const updated = [record, ...current];
  saveHistory(updated);
  return updated;
}

export function removeHistoryRecord(id: string): AnalysisRecord[] {
  const current = loadHistory();
  const updated = current.filter((item) => item.id !== id);
  saveHistory(updated);
  return updated;
}

export function clearHistory(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(STORAGE_KEY);
}
