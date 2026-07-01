import OpenAI from "openai";

/**
 * Client OpenAI côté serveur uniquement.
 * La clé API ne doit jamais être exposée au navigateur : elle est lue depuis
 * une variable d'environnement côté serveur (voir .env.example).
 */
let client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "OPENAI_API_KEY manquante. Ajoutez-la dans les variables d'environnement (.env.local ou Vercel)."
      );
    }
    client = new OpenAI({ apiKey });
  }
  return client;
}

/**
 * Modèle utilisé pour l'analyse d'images. Configurable via variable
 * d'environnement pour pouvoir basculer facilement (ex: gpt-4o, gpt-4o-mini, gpt-4.1).
 */
export const QC_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
