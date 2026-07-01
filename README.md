# QCVision

Application web de contrôle qualité (QC) de produits par IA vision (OpenAI).

## Fonctionnalités
- Upload de 1 à 8 photos (glisser-déposer ou bouton)
- Prévisualisation avant analyse
- Analyse IA (modèle vision OpenAI `gpt-4o-mini`) avec verdict **GL / RL / CHECK**
- Score, niveau de confiance, points positifs, défauts détectés, résumé
- Historique local (localStorage), suppression d'entrées
- Export du résultat en PDF
- UI sombre, moderne, responsive

## Installation locale

```bash
npm install
cp .env.example .env   # puis renseignez QCVISION_OPENAI_API_KEY
npm start
```

L'application est accessible sur `http://localhost:3000`.

## Variables d'environnement

| Variable                  | Description                                  |
|---------------------------|-----------------------------------------------|
| `QCVISION_OPENAI_API_KEY` | Clé API OpenAI (obligatoire)                  |
| `PORT`                    | Port d'écoute (fourni automatiquement par Railway) |

## Déploiement sur Railway

1. Poussez ce dossier dans un dépôt Git (GitHub/GitLab).
2. Sur [Railway](https://railway.app), créez un nouveau projet → "Deploy from GitHub repo".
3. Railway détecte automatiquement Node.js (via `package.json`) et exécute `npm install` puis `npm start`.
4. Dans l'onglet **Variables** du service Railway, ajoutez :
   - `QCVISION_OPENAI_API_KEY` = votre clé API OpenAI
5. Railway fournit automatiquement la variable `PORT` — le serveur l'utilise déjà (`process.env.PORT`).
6. Une fois déployé, Railway génère une URL publique (`*.up.railway.app`).

## Architecture

```
qcvision/
├── server.js           # Backend Express + intégration OpenAI Vision
├── package.json
├── .env.example
└── public/
    ├── index.html       # Structure de la page
    ├── style.css        # Design sombre / responsive
    └── app.js           # Logique frontend (upload, analyse, historique, PDF)
```

## Sécurité
- La clé API OpenAI n'est jamais exposée au frontend : tous les appels IA passent par le backend (`/api/analyze`).
- Les images sont traitées en mémoire côté serveur et ne sont pas stockées sur disque.
