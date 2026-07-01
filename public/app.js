/**
 * QCVision — logique frontend
 * - Sélection / drag&drop de 1 à 8 photos
 * - Prévisualisation
 * - Appel API /api/analyze avec barre de progression
 * - Affichage du verdict
 * - Historique local (localStorage) + suppression
 * - Export PDF du résultat
 */

const MAX_FILES = 8;
const HISTORY_KEY = "qcvision_history";

let selectedFiles = [];
let lastResult = null;

// ---------- Éléments DOM ----------
const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("fileInput");
const browseBtn = document.getElementById("browseBtn");
const previewGrid = document.getElementById("previewGrid");
const fileCount = document.getElementById("fileCount");
const analyzeBtn = document.getElementById("analyzeBtn");
const progressWrap = document.getElementById("progressWrap");
const progressFill = document.getElementById("progressFill");
const progressLabel = document.getElementById("progressLabel");
const resultSection = document.getElementById("resultSection");
const verdictBadge = document.getElementById("verdictBadge");
const scoreValue = document.getElementById("scoreValue");
const confidenceValue = document.getElementById("confidenceValue");
const summaryText = document.getElementById("summaryText");
const strengthsList = document.getElementById("strengthsList");
const issuesList = document.getElementById("issuesList");
const downloadPdfBtn = document.getElementById("downloadPdfBtn");
const newAnalysisBtn = document.getElementById("newAnalysisBtn");
const historyToggle = document.getElementById("historyToggle");
const historyPanel = document.getElementById("historyPanel");
const closeHistory = document.getElementById("closeHistory");
const historyList = document.getElementById("historyList");
const overlay = document.getElementById("overlay");

// ---------- Upload : clic / drag&drop ----------
browseBtn.addEventListener("click", () => fileInput.click());
dropzone.addEventListener("click", (e) => {
  if (e.target === browseBtn) return;
  fileInput.click();
});

fileInput.addEventListener("change", (e) => addFiles(Array.from(e.target.files)));

["dragenter", "dragover"].forEach((evt) =>
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropzone.classList.add("dragover");
  })
);
["dragleave", "drop"].forEach((evt) =>
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropzone.classList.remove("dragover");
  })
);
dropzone.addEventListener("drop", (e) => {
  const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
  addFiles(files);
});

function addFiles(files) {
  for (const file of files) {
    if (selectedFiles.length >= MAX_FILES) break;
    selectedFiles.push(file);
  }
  renderPreviews();
}

function renderPreviews() {
  previewGrid.innerHTML = "";
  selectedFiles.forEach((file, index) => {
    const url = URL.createObjectURL(file);
    const item = document.createElement("div");
    item.className = "preview-item";
    item.innerHTML = `
      <img src="${url}" alt="preview" />
      <button class="preview-remove" title="Retirer">✕</button>
    `;
    item.querySelector(".preview-remove").addEventListener("click", () => {
      selectedFiles.splice(index, 1);
      renderPreviews();
    });
    previewGrid.appendChild(item);
  });

  fileCount.textContent = selectedFiles.length
    ? `${selectedFiles.length}/${MAX_FILES} photo(s) sélectionnée(s)`
    : "";
  analyzeBtn.disabled = selectedFiles.length === 0;
}

// ---------- Analyse ----------
analyzeBtn.addEventListener("click", runAnalysis);

async function runAnalysis() {
  if (selectedFiles.length === 0) return;

  resultSection.classList.add("hidden");
  progressWrap.classList.remove("hidden");
  analyzeBtn.disabled = true;
  setProgress(8, "Préparation des images…");

  const formData = new FormData();
  selectedFiles.forEach((file) => formData.append("photos", file));

  // Animation de progression simulée pendant l'attente réseau
  let fakeProgress = 8;
  const interval = setInterval(() => {
    fakeProgress = Math.min(fakeProgress + Math.random() * 8, 90);
    setProgress(fakeProgress, "Analyse IA en cours…");
  }, 400);

  try {
    const res = await fetch("/api/analyze", { method: "POST", body: formData });
    clearInterval(interval);

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Erreur lors de l'analyse.");
    }

    setProgress(100, "Analyse terminée !");
    setTimeout(() => {
      progressWrap.classList.add("hidden");
      displayResult(data);
      saveToHistory(data);
    }, 500);
  } catch (err) {
    clearInterval(interval);
    progressWrap.classList.add("hidden");
    analyzeBtn.disabled = false;
    alert("Erreur : " + err.message);
  }
}

function setProgress(percent, label) {
  progressFill.style.width = percent + "%";
  progressLabel.textContent = label;
}

function displayResult(data) {
  lastResult = data;
  resultSection.classList.remove("hidden");
  analyzeBtn.disabled = false;

  verdictBadge.textContent = data.decision;
  verdictBadge.className = "verdict-badge " + data.decision;

  scoreValue.textContent = data.score + " / 100";
  confidenceValue.textContent = data.confidence + " %";
  summaryText.textContent = data.summary || "—";

  strengthsList.innerHTML = "";
  (data.strengths || []).forEach((s) => {
    const li = document.createElement("li");
    li.textContent = s;
    strengthsList.appendChild(li);
  });

  issuesList.innerHTML = "";
  (data.issues || []).forEach((s) => {
    const li = document.createElement("li");
    li.textContent = s;
    issuesList.appendChild(li);
  });

  resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

newAnalysisBtn.addEventListener("click", () => {
  selectedFiles = [];
  renderPreviews();
  resultSection.classList.add("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// ---------- Historique (localStorage) ----------
function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch {
    return [];
  }
}

function saveToHistory(data) {
  const history = getHistory();
  history.unshift({
    ...data,
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    date: new Date().toISOString(),
  });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
  renderHistory();
}

function renderHistory() {
  const history = getHistory();
  historyList.innerHTML = "";

  if (history.length === 0) {
    historyList.innerHTML = '<p class="empty-history">Aucune analyse enregistrée.</p>';
    return;
  }

  history.forEach((item) => {
    const el = document.createElement("div");
    el.className = "history-item";
    const dateStr = new Date(item.date).toLocaleString("fr-FR");
    el.innerHTML = `
      <div class="history-item-top">
        <span class="history-badge ${item.decision}">${item.decision}</span>
        <span class="history-date">${dateStr}</span>
      </div>
      <p class="history-summary">${escapeHtml(item.summary || "")}</p>
      <div class="history-actions">
        <button class="btn-secondary view-btn">Voir</button>
        <button class="btn-ghost delete-btn">Supprimer</button>
      </div>
    `;
    el.querySelector(".view-btn").addEventListener("click", () => {
      displayResult(item);
      toggleHistory(false);
    });
    el.querySelector(".delete-btn").addEventListener("click", () => {
      deleteFromHistory(item.id);
    });
    historyList.appendChild(el);
  });
}

function deleteFromHistory(id) {
  const history = getHistory().filter((h) => h.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  renderHistory();
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

historyToggle.addEventListener("click", () => toggleHistory(true));
closeHistory.addEventListener("click", () => toggleHistory(false));
overlay.addEventListener("click", () => toggleHistory(false));

function toggleHistory(open) {
  historyPanel.classList.toggle("open", open);
  overlay.classList.toggle("hidden", !open);
}

// ---------- Export PDF ----------
downloadPdfBtn.addEventListener("click", () => {
  if (!lastResult) return;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const decisionLabel = { GL: "GREEN LIGHT (Conforme)", RL: "RED LIGHT (Non conforme)", CHECK: "CHECK (À vérifier)" };

  doc.setFontSize(20);
  doc.text("QCVision — Rapport de contrôle qualité", 14, 20);

  doc.setFontSize(14);
  doc.text(`Verdict : ${decisionLabel[lastResult.decision] || lastResult.decision}`, 14, 34);
  doc.text(`Score : ${lastResult.score}/100`, 14, 42);
  doc.text(`Confiance : ${lastResult.confidence}%`, 14, 50);

  doc.setFontSize(12);
  doc.text("Résumé :", 14, 62);
  doc.setFontSize(11);
  const summaryLines = doc.splitTextToSize(lastResult.summary || "-", 180);
  doc.text(summaryLines, 14, 70);

  let y = 70 + summaryLines.length * 6 + 8;

  doc.setFontSize(12);
  doc.text("Points positifs :", 14, y);
  y += 7;
  doc.setFontSize(11);
  (lastResult.strengths || []).forEach((s) => {
    const lines = doc.splitTextToSize("• " + s, 180);
    doc.text(lines, 16, y);
    y += lines.length * 6;
  });

  y += 6;
  doc.setFontSize(12);
  doc.text("Défauts détectés :", 14, y);
  y += 7;
  doc.setFontSize(11);
  (lastResult.issues || []).forEach((s) => {
    const lines = doc.splitTextToSize("• " + s, 180);
    doc.text(lines, 16, y);
    y += lines.length * 6;
  });

  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text(`Généré le ${new Date().toLocaleString("fr-FR")} par QCVision`, 14, 285);

  doc.save(`qcvision-rapport-${Date.now()}.pdf`);
});

// ---------- Initialisation ----------
renderHistory();
