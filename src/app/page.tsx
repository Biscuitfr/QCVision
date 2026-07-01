"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Sparkles, AlertCircle, RotateCcw } from "lucide-react";
import Header from "@/components/Header";
import Dropzone from "@/components/Dropzone";
import ImagePreviewGrid, { type PreviewImage } from "@/components/ImagePreviewGrid";
import ProgressBar from "@/components/ProgressBar";
import ResultCard from "@/components/ResultCard";
import HistoryPanel from "@/components/HistoryPanel";
import { fileToOptimizedDataUrl, createThumbnail, MIN_IMAGES } from "@/lib/image";
import { addHistoryRecord, loadHistory, removeHistoryRecord } from "@/lib/history";
import type { AnalysisRecord, QCVerdict } from "@/types/analysis";

type AppStatus = "idle" | "analyzing" | "done" | "error";

export default function Home() {
  const [images, setImages] = useState<PreviewImage[]>([]);
  const [status, setStatus] = useState<AppStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<AnalysisRecord | null>(null);
  // Chargé de façon "lazy" : évite un setState synchrone dans un effet et
  // fonctionne aussi bien en SSR (retourne []) qu'au montage client (lit le localStorage).
  const [history, setHistory] = useState<AnalysisRecord[]>(() => loadHistory());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (progressTimer.current) clearInterval(progressTimer.current);
    };
  }, []);

  const handleFilesSelected = useCallback(async (files: File[]) => {
    try {
      const newImages = await Promise.all(
        files.map(async (file) => ({
          id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`,
          dataUrl: await fileToOptimizedDataUrl(file),
          name: file.name,
        }))
      );
      setImages((prev) => [...prev, ...newImages]);
      setErrorMessage(null);
    } catch (err) {
      setErrorMessage("Une erreur est survenue lors du traitement des images.");
      console.error(err);
    }
  }, []);

  const handleRemoveImage = useCallback((id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  }, []);

  const handleReset = useCallback(() => {
    setImages([]);
    setResult(null);
    setStatus("idle");
    setProgress(0);
    setErrorMessage(null);
  }, []);

  const startFakeProgress = useCallback(() => {
    setProgress(6);
    progressTimer.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) return p;
        // Progression qui ralentit à l'approche de 90% (l'appel réseau finalisera à 100%).
        const increment = p < 50 ? 6 : p < 75 ? 3 : 1;
        return Math.min(90, p + increment);
      });
    }, 350);
  }, []);

  const stopFakeProgress = useCallback(() => {
    if (progressTimer.current) {
      clearInterval(progressTimer.current);
      progressTimer.current = null;
    }
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (images.length < MIN_IMAGES) return;
    setStatus("analyzing");
    setErrorMessage(null);
    setResult(null);
    startFakeProgress();

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: images.map((img) => img.dataUrl) }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Erreur lors de l'analyse.");
      }

      const verdict: QCVerdict = data.verdict;

      const thumbnails = await Promise.all(
        images.map((img) => createThumbnail(img.dataUrl))
      );

      const record: AnalysisRecord = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        thumbnails,
        verdict,
      };

      setProgress(100);
      setTimeout(() => {
        stopFakeProgress();
        setResult(record);
        setStatus("done");
        setHistory(addHistoryRecord(record));
      }, 300);
    } catch (err) {
      stopFakeProgress();
      setProgress(0);
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Erreur inconnue.");
    }
  }, [images, startFakeProgress, stopFakeProgress]);

  const handleRemoveHistory = useCallback((id: string) => {
    setHistory(removeHistoryRecord(id));
  }, []);

  const handleSelectHistory = useCallback((record: AnalysisRecord) => {
    setResult(record);
    setStatus("done");
    // Scroll doux vers le résultat sélectionné.
    setTimeout(() => {
      document.getElementById("result-section")?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }, []);

  const canAnalyze = images.length >= MIN_IMAGES && status !== "analyzing";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-20 sm:px-6">
      <Header />

      <main className="flex flex-col gap-6">
        {/* Zone d'upload */}
        {status !== "done" && (
          <div className="animate-fade-in-up flex flex-col gap-4">
            <Dropzone
              onFilesSelected={handleFilesSelected}
              currentCount={images.length}
              disabled={status === "analyzing"}
            />
            <ImagePreviewGrid
              images={images}
              onRemove={handleRemoveImage}
              disabled={status === "analyzing"}
            />

            {errorMessage && (
              <div className="flex items-center gap-2 rounded-2xl border border-rl/30 bg-rl/10 px-4 py-3 text-sm text-rl animate-fade-in">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {errorMessage}
              </div>
            )}

            {status === "analyzing" && <ProgressBar progress={progress} />}

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={!canAnalyze}
              className="group relative flex items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-accent to-accent-soft px-6 py-4 text-base font-semibold text-white shadow-lg shadow-accent/25 transition-all duration-300 hover:shadow-accent/40 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            >
              <Sparkles className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12" />
              {status === "analyzing" ? "Analyse en cours..." : "Analyser"}
            </button>
          </div>
        )}

        {/* Résultat */}
        {status === "done" && result && (
          <div id="result-section" className="flex flex-col gap-4">
            <ResultCard record={result} />
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center justify-center gap-2 self-center rounded-xl border border-border-subtle px-5 py-2.5 text-sm font-medium text-muted transition-colors hover:border-accent-soft hover:text-accent-soft"
            >
              <RotateCcw className="h-4 w-4" />
              Nouvelle analyse
            </button>
          </div>
        )}

        {/* Historique */}
        <HistoryPanel
          history={history}
          onRemove={handleRemoveHistory}
          onSelect={handleSelectHistory}
        />
      </main>

      <footer className="mt-16 text-center text-xs text-muted/70">
        QC AI — Analyse assistée par intelligence artificielle. Vos images sont traitées
        uniquement pour générer le verdict et ne sont pas stockées côté serveur.
      </footer>
    </div>
  );
}
