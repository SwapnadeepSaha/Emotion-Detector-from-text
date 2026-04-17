"""
Emotion Detector from Text — Backend Server
=============================================
Uses a pre-trained DistilRoBERTa model fine-tuned on emotion classification
to detect emotions like joy, anger, sadness, fear, surprise, disgust, and neutral.

Powered by HuggingFace Transformers & Flask.
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from transformers import pipeline
import os
import sys
import time

# Fix Windows console encoding for unicode output
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# ── Flask App Setup ──────────────────────────────────────────────────────────
app = Flask(__name__, static_folder="static")
CORS(app)

# ── Load Emotion Detection Model ────────────────────────────────────────────
print("\n" + "=" * 60)
print("  [*] Loading Emotion Detection Model...")
print("  Model: j-hartmann/emotion-english-distilroberta-base")
print("=" * 60)

start_time = time.time()

emotion_classifier = pipeline(
    "text-classification",
    model="j-hartmann/emotion-english-distilroberta-base",
    top_k=None,  # Return scores for all emotions
)

load_time = time.time() - start_time
print(f"\n  [OK] Model loaded successfully in {load_time:.1f}s")
print("  Ready to decode emotional gravity!\n")


# ── Routes ───────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    """Serve the main frontend page."""
    return send_from_directory("static", "index.html")


@app.route("/favicon.ico")
def favicon():
    """Serve the favicon."""
    return send_from_directory("static", "favicon.png", mimetype="image/png")


@app.route("/analyze", methods=["POST"])
def analyze():
    """
    Analyze the emotional content of the provided text.
    
    Request JSON: { "text": "your text here" }
    Response JSON: {
        "emotions": { "joy": 0.85, "anger": 0.02, ... },
        "dominant": "joy",
        "confidence": 0.85,
        "text": "your text here"
    }
    """
    data = request.get_json()

    if not data or "text" not in data:
        return jsonify({"error": "Missing 'text' field in request body."}), 400

    text = data["text"].strip()

    if not text:
        return jsonify({"error": "Text cannot be empty."}), 400

    if len(text) > 5000:
        return jsonify({"error": "Text is too long. Maximum 5000 characters."}), 400

    try:
        # Run emotion classification
        results = emotion_classifier(text)

        # Build emotion scores dictionary
        emotions = {}
        for item in results[0]:
            emotions[item["label"]] = round(item["score"], 4)

        # Find dominant emotion
        dominant = max(emotions, key=emotions.get)
        confidence = emotions[dominant]

        return jsonify({
            "emotions": emotions,
            "dominant": dominant,
            "confidence": confidence,
            "text": text,
        })

    except Exception as e:
        return jsonify({"error": f"Analysis failed: {str(e)}"}), 500


@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({"status": "ok", "model": "emotion-english-distilroberta-base"})


# ── Entry Point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"  [*] Starting server on http://localhost:{port}")
    print(f"  [>] Open your browser and navigate to the URL above.\n")
    app.run(debug=True, use_reloader=False, host="0.0.0.0", port=port)
