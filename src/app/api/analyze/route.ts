import { NextRequest, NextResponse } from "next/server";
import { getOpenAIClient, QC_MODEL } from "@/lib/openai";
import { QC_SYSTEM_PROMPT } from "@/lib/prompt";
import type { QCVerdict, Decision } from "@/types/analysis";

// Cette route doit toujours s'exécuter côté serveur (jamais mise en cache statique).
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_IMAGES = 8;
const MIN_IMAGES = 1;

interface AnalyzeRequestBody {
  images: string[]; // data URLs (base64) envoyées par le client
}

/**
 * Vérifie et normalise la réponse brute du modèle pour garantir un format
 * exploitable par l'interface, même si le modèle dévie légèrement du schéma demandé.
 */
function sanitizeVerdict(raw: unknown): QCVerdict {
  const obj = (raw ?? {}) as Record<string, unknown>;

  const allowedDecisions: Decision[] = ["GL", "RL", "CHECK"];
  const decision: Decision = allowedDecisions.includes(obj.decision as Decision)
    ? (obj.decision as Decision)
    : "CHECK";

  const clamp = (value: unknown, fallback: number) => {
    const num = typeof value === "number" ? value : Number(value);
    if (Number.isNaN(num)) return fallback;
    return Math.max(0, Math.min(100, Math.round(num)));
  };

  const toStringArray = (value: unknown): string[] => {
    if (!Array.isArray(value)) return [];
    return value.filter((item) => typeof item === "string" && item.trim().length > 0);
  };

  return {
    decision,
    score: clamp(obj.score, 50),
    confidence: clamp(obj.confidence, 50),
    issues: toStringArray(obj.issues),
    strengths: toStringArray(obj.strengths),
    summary:
      typeof obj.summary === "string" && obj.summary.trim().length > 0
        ? obj.summary.trim()
        : "Analyse effectuée, résumé indisponible.",
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AnalyzeRequestBody;
    const images = body?.images;

    if (!Array.isArray(images) || images.length < MIN_IMAGES) {
      return NextResponse.json(
        { error: "Veuillez fournir au moins une image." },
        { status: 400 }
      );
    }

    if (images.length > MAX_IMAGES) {
      return NextResponse.json(
        { error: `Vous ne pouvez pas envoyer plus de ${MAX_IMAGES} images.` },
        { status: 400 }
      );
    }

    // Validation basique du format data URL pour éviter d'envoyer n'importe quoi à l'API.
    const invalid = images.find((img) => typeof img !== "string" || !img.startsWith("data:image/"));
    if (invalid) {
      return NextResponse.json(
        { error: "Format d'image invalide détecté." },
        { status: 400 }
      );
    }

    const openai = getOpenAIClient();

    const imageContent = images.map((dataUrl) => ({
      type: "image_url" as const,
      image_url: { url: dataUrl, detail: "high" as const },
    }));

    const completion = await openai.chat.completions.create({
      model: QC_MODEL,
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 1200,
      messages: [
        {
          role: "system",
          content: QC_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Voici ${images.length} photo(s) du produit à analyser. Réponds uniquement avec l'objet JSON demandé.`,
            },
            ...imageContent,
          ],
        },
      ],
    });

    const rawContent = completion.choices[0]?.message?.content;
    if (!rawContent) {
      return NextResponse.json(
        { error: "Réponse vide de l'IA." },
        { status: 502 }
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      return NextResponse.json(
        { error: "Impossible d'interpréter la réponse de l'IA." },
        { status: 502 }
      );
    }

    const verdict = sanitizeVerdict(parsed);

    return NextResponse.json({ verdict });
  } catch (error) {
    console.error("[QC AI] Erreur lors de l'analyse :", error);
    const message =
      error instanceof Error ? error.message : "Erreur inconnue lors de l'analyse.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
