/**
 * QCVision - Serveur backend
 * ---------------------------------------------------
 * Sert le frontend statique et expose une route /api/analyze
 * qui envoie les images uploadées a l'API OpenAI (modele vision)
 * pour obtenir un verdict de controle qualite (QC).
 */

const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const OpenAI = require("openai");

const app = express();
const PORT = process.env.PORT || 3000;

// La cle API est lue depuis les variables d'environnement (jamais en dur dans le code)
const OPENAI_API_KEY = process.env.QCVISION_OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.warn(
    "[QCVision] ATTENTION: la variable d'environnement QCVISION_OPENAI_API_KEY n'est pas definie."
  );
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Configuration de multer : upload en memoire, max 8 fichiers, 8 Mo par fichier
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 8 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Seuls les fichiers image sont acceptes."));
    }
    cb(null, true);
  },
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Le prompt d'analyse QC, tel que specifie
const QC_PROMPT = `Tu es un expert en controle qualite (QC). Analyse les photos du produit. Verifie la qualite de fabrication, les logos, les coutures, les materiaux, les couleurs, les finitions, les etiquettes, les proportions et les defauts visibles. Donne un verdict parmi :

GL (Green Light) : produit conforme.
RL (Red Light) : produit non conforme.
CHECK : impossible de conclure avec certitude.

Retourne uniquement un objet JSON contenant :
{
"decision": "GL | RL | CHECK",
"score": nombre entre 0 et 100,
"confidence": nombre entre 0 et 100,
"issues": ["liste des problemes detectes"],
"strengths": ["liste des points positifs"],
"summary": "resume en une phrase"
}`;

/**
 * POST /api/analyze
 * Recoit de 1 a 8 images (multipart/form-data, champ "photos")
 * et retourne le verdict JSON genere par le modele vision OpenAI.
 */
app.post("/api/analyze", upload.array("photos", 8), async (req, res) => {
  try {
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "Aucune photo recue." });
    }
    if (files.length > 8) {
      return res.status(400).json({ error: "Maximum 8 photos autorisees." });
    }
    if (!OPENAI_API_KEY) {
      return res.status(500).json({
        error: "Cle API OpenAI non configuree sur le serveur (QCVISION_OPENAI_API_KEY).",
      });
    }

    // Construction du contenu multimodal (texte + images en base64)
    const imageContents = files.map((file) => {
      const base64 = file.buffer.toString("base64");
      return {
        type: "image_url",
        image_url: {
          url: `data:${file.mimetype};base64,${base64}`,
        },
      };
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: QC_PROMPT }, ...imageContents],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
    });

    const raw = completion.choices[0].message.content;
    let result;
    try {
      result = JSON.parse(raw);
    } catch (parseErr) {
      return res.status(502).json({
        error: "Reponse IA invalide (JSON non parsable).",
        raw,
      });
    }

    // Normalisation defensive du resultat
    const normalized = {
      decision: ["GL", "RL", "CHECK"].includes(result.decision)
        ? result.decision
        : "CHECK",
      score: Number.isFinite(result.score) ? Math.max(0, Math.min(100, result.score)) : 0,
      confidence: Number.isFinite(result.confidence)
        ? Math.max(0, Math.min(100, result.confidence))
        : 0,
      issues: Array.isArray(result.issues) ? result.issues : [],
      strengths: Array.isArray(result.strengths) ? result.strengths : [],
      summary: typeof result.summary === "string" ? result.summary : "",
    };

    res.json(normalized);
  } catch (err) {
    console.error("[QCVision] Erreur analyse:", err);
    res.status(500).json({ error: err.message || "Erreur serveur lors de l'analyse." });
  }
});

// Route de sante (utile pour Railway)
app.get("/health", (req, res) => res.json({ status: "ok" }));

// Fallback vers l'index pour toute autre route (SPA simple)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`[QCVision] Serveur demarre sur le port ${PORT}`);
});
