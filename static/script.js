/* ═══════════════════════════════════════════════════════════════════════════
   EMOTION DETECTOR — Client-Side Logic
   Handles user interaction, API communication, result rendering,
   particle animations, and analysis history.
   ═══════════════════════════════════════════════════════════════════════════ */

// ── Emotion Metadata ────────────────────────────────────────────────────────
const EMOTION_META = {
    joy:      { emoji: "😊", color: "#fbbf24", glow: "rgba(251, 191, 36, 0.35)" },
    anger:    { emoji: "😠", color: "#f43f5e", glow: "rgba(244, 63, 94, 0.35)" },
    sadness:  { emoji: "😢", color: "#3b82f6", glow: "rgba(59, 130, 246, 0.35)" },
    fear:     { emoji: "😨", color: "#a855f7", glow: "rgba(168, 85, 247, 0.35)" },
    surprise: { emoji: "😮", color: "#f97316", glow: "rgba(249, 115, 22, 0.35)" },
    disgust:  { emoji: "🤢", color: "#10b981", glow: "rgba(16, 185, 129, 0.35)" },
    neutral:  { emoji: "😐", color: "#6b7280", glow: "rgba(107, 114, 128, 0.35)" },
};

// ── DOM Elements ────────────────────────────────────────────────────────────
const textInput       = document.getElementById("text-input");
const charCount       = document.getElementById("char-count");
const analyzeBtn      = document.getElementById("analyze-btn");
const clearBtn        = document.getElementById("clear-btn");
const resultsSection  = document.getElementById("results-section");
const dominantEmoji   = document.getElementById("dominant-emoji");
const dominantName    = document.getElementById("dominant-name");
const dominantScore   = document.getElementById("dominant-score");
const emojiBgGlow     = document.getElementById("emoji-bg-glow");
const scoreRingFill   = document.getElementById("score-ring-fill");
const emotionBars     = document.getElementById("emotion-bars");
const analyzedTextEl  = document.getElementById("analyzed-text-content");
const newAnalysisBtn  = document.getElementById("new-analysis-btn");
const historySection  = document.getElementById("history-section");
const historyGrid     = document.getElementById("history-grid");
const clearHistoryBtn = document.getElementById("clear-history-btn");

// ── State ───────────────────────────────────────────────────────────────────
let analysisHistory = JSON.parse(localStorage.getItem("emotionHistory") || "[]");
let isLoading = false;


// ══════════════════════════════════════════════════════════════════════════════
// PARTICLES BACKGROUND
// ══════════════════════════════════════════════════════════════════════════════

(function initParticles() {
    const canvas = document.getElementById("particles-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let particles = [];
    let animId;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function createParticles() {
        particles = [];
        const count = Math.min(Math.floor((canvas.width * canvas.height) / 18000), 60);
        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                r: Math.random() * 1.5 + 0.5,
                dx: (Math.random() - 0.5) * 0.3,
                dy: (Math.random() - 0.5) * 0.3,
                alpha: Math.random() * 0.3 + 0.05,
            });
        }
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach((p) => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(124, 92, 255, ${p.alpha})`;
            ctx.fill();

            p.x += p.dx;
            p.y += p.dy;

            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;
        });
        animId = requestAnimationFrame(draw);
    }

    resize();
    createParticles();
    draw();

    window.addEventListener("resize", () => {
        resize();
        createParticles();
    });
})();


// ══════════════════════════════════════════════════════════════════════════════
// EVENT LISTENERS
// ══════════════════════════════════════════════════════════════════════════════

// Character count
textInput.addEventListener("input", () => {
    const len = textInput.value.length;
    charCount.textContent = `${len.toLocaleString()} / 5,000`;
    charCount.style.color = len > 4500 ? "#f43f5e" : "";
});

// Analyze button
analyzeBtn.addEventListener("click", handleAnalyze);

// Keyboard shortcut: Ctrl+Enter
textInput.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleAnalyze();
    }
});

// Clear button
clearBtn.addEventListener("click", () => {
    textInput.value = "";
    charCount.textContent = "0 / 5,000";
    textInput.focus();
});

// New analysis button
newAnalysisBtn.addEventListener("click", () => {
    resultsSection.classList.remove("visible");
    textInput.value = "";
    charCount.textContent = "0 / 5,000";
    textInput.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
});

// Example chips
document.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
        const text = chip.getAttribute("data-text");
        textInput.value = text;
        const len = text.length;
        charCount.textContent = `${len.toLocaleString()} / 5,000`;
        textInput.focus();

        // Auto-analyze
        setTimeout(() => handleAnalyze(), 200);
    });
});

// Clear history
clearHistoryBtn.addEventListener("click", () => {
    analysisHistory = [];
    localStorage.removeItem("emotionHistory");
    historySection.classList.remove("visible");
    historyGrid.innerHTML = "";
});


// ══════════════════════════════════════════════════════════════════════════════
// ANALYSIS HANDLER
// ══════════════════════════════════════════════════════════════════════════════

async function handleAnalyze() {
    const text = textInput.value.trim();

    if (!text) {
        showToast("Please enter some text to analyze.");
        textInput.focus();
        return;
    }

    if (isLoading) return;
    isLoading = true;

    // Set loading state
    analyzeBtn.classList.add("loading");
    analyzeBtn.disabled = true;

    try {
        const response = await fetch("/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Analysis failed.");
        }

        renderResults(data);
        addToHistory(data);

    } catch (error) {
        console.error("Analysis error:", error);
        showToast(error.message || "Failed to connect to the server. Make sure it's running.");
    } finally {
        isLoading = false;
        analyzeBtn.classList.remove("loading");
        analyzeBtn.disabled = false;
    }
}


// ══════════════════════════════════════════════════════════════════════════════
// RENDER RESULTS
// ══════════════════════════════════════════════════════════════════════════════

function renderResults(data) {
    const { emotions, dominant, confidence, text } = data;
    const meta = EMOTION_META[dominant] || EMOTION_META.neutral;

    // ── Dominant Emotion ──
    dominantEmoji.textContent = meta.emoji;
    dominantEmoji.style.animation = "none";
    dominantEmoji.offsetHeight; // force reflow
    dominantEmoji.style.animation = "bounceIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both";

    dominantName.textContent = dominant;
    dominantName.style.color = meta.color;

    emojiBgGlow.style.background = meta.color;

    // Dominant emotion background tint
    const dominantEl = document.getElementById("dominant-emotion");
    dominantEl.style.setProperty("--dom-color", meta.color);
    dominantEl.style.background = `linear-gradient(135deg, ${meta.glow.replace("0.35", "0.06")}, transparent)`;

    // ── Score Ring ──
    const percent = Math.round(confidence * 100);
    dominantScore.textContent = `${percent}%`;
    dominantScore.style.color = meta.color;

    const circumference = 2 * Math.PI * 42; // r=42
    const offset = circumference * (1 - confidence);
    scoreRingFill.style.stroke = meta.color;
    scoreRingFill.style.strokeDasharray = circumference;
    scoreRingFill.style.strokeDashoffset = circumference;

    // Animate ring after a tiny delay
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            scoreRingFill.style.strokeDashoffset = offset;
        });
    });

    // ── Emotion Bars ──
    emotionBars.innerHTML = "";

    // Sort emotions by score descending
    const sorted = Object.entries(emotions).sort((a, b) => b[1] - a[1]);

    sorted.forEach(([emotion, score]) => {
        const m = EMOTION_META[emotion] || EMOTION_META.neutral;
        const pct = (score * 100).toFixed(1);

        const row = document.createElement("div");
        row.className = "emotion-bar-row";
        row.innerHTML = `
            <div class="emotion-label">
                <span class="emotion-label-emoji">${m.emoji}</span>
                <span>${emotion}</span>
            </div>
            <div class="bar-track">
                <div class="bar-fill" style="background: linear-gradient(90deg, ${m.color}, ${m.color}CC); width: 0%;"></div>
            </div>
            <span class="emotion-percent">${pct}%</span>
        `;

        emotionBars.appendChild(row);

        // Animate bar width
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const fill = row.querySelector(".bar-fill");
                fill.style.width = `${Math.max(score * 100, 1)}%`;
            });
        });
    });

    // ── Analyzed Text ──
    analyzedTextEl.textContent = `"${text}"`;

    // ── Show Results ──
    resultsSection.classList.add("visible");

    // Scroll to results smoothly
    setTimeout(() => {
        resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
}


// ══════════════════════════════════════════════════════════════════════════════
// HISTORY
// ══════════════════════════════════════════════════════════════════════════════

function addToHistory(data) {
    const entry = {
        text: data.text,
        dominant: data.dominant,
        confidence: data.confidence,
        timestamp: Date.now(),
    };

    // Prevent duplicate consecutive entries
    if (
        analysisHistory.length > 0 &&
        analysisHistory[0].text === entry.text
    ) {
        return;
    }

    analysisHistory.unshift(entry);
    if (analysisHistory.length > 20) analysisHistory.pop();

    localStorage.setItem("emotionHistory", JSON.stringify(analysisHistory));
    renderHistory();
}

function renderHistory() {
    if (analysisHistory.length === 0) {
        historySection.classList.remove("visible");
        return;
    }

    historySection.classList.add("visible");
    historyGrid.innerHTML = "";

    analysisHistory.forEach((entry, i) => {
        const meta = EMOTION_META[entry.dominant] || EMOTION_META.neutral;
        const pct = Math.round(entry.confidence * 100);

        const item = document.createElement("div");
        item.className = "history-item";
        item.style.animationDelay = `${i * 0.04}s`;
        item.innerHTML = `
            <span class="history-emoji">${meta.emoji}</span>
            <div class="history-info">
                <div class="history-text">${escapeHtml(entry.text)}</div>
                <span class="history-emotion" style="color: ${meta.color}">${entry.dominant}</span>
            </div>
            <span class="history-score">${pct}%</span>
        `;

        // Click to re-analyze
        item.addEventListener("click", () => {
            textInput.value = entry.text;
            const len = entry.text.length;
            charCount.textContent = `${len.toLocaleString()} / 5,000`;
            window.scrollTo({ top: 0, behavior: "smooth" });
            setTimeout(() => handleAnalyze(), 400);
        });

        historyGrid.appendChild(item);
    });
}


// ══════════════════════════════════════════════════════════════════════════════
// TOAST NOTIFICATIONS
// ══════════════════════════════════════════════════════════════════════════════

function showToast(message) {
    // Remove existing toast
    const existing = document.querySelector(".error-toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.className = "error-toast";
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("hide");
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}


// ══════════════════════════════════════════════════════════════════════════════
// UTILITIES
// ══════════════════════════════════════════════════════════════════════════════

function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}


// ══════════════════════════════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════════════════════════════

// Render history on page load
renderHistory();
