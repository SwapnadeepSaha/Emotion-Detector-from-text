# 🧠 Emotion Detector from Text

An AI-powered web application that detects emotions in text using a pre-trained **DistilRoBERTa** model fine-tuned on emotion classification. Built with **Flask** and **HuggingFace Transformers**.

## ✨ Features

- **7 Emotion Detection**: Joy, Anger, Sadness, Fear, Surprise, Disgust, Neutral
- **Real-time Analysis**: Instant emotion classification with confidence scores
- **Beautiful UI**: Glassmorphism design with animated backgrounds and micro-animations
- **Analysis History**: Track past analyses with localStorage persistence
- **Example Chips**: Quick-try buttons for each emotion category
- **Responsive Design**: Works on desktop and mobile

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend | Flask (Python) |
| ML Model | DistilRoBERTa (`j-hartmann/emotion-english-distilroberta-base`) |
| ML Framework | HuggingFace Transformers + PyTorch |
| Frontend | HTML, CSS, JavaScript |
| Design | Glassmorphism, CSS animations, Canvas particles |

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- pip

### Setup

```bash
# 1. Create a virtual environment (recommended)
python -m venv .venv

# 2. Activate it
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run the server
python main.py
```

### Open the app

Navigate to **http://localhost:5000** in your browser.

> **Note**: The first run will download the DistilRoBERTa model (~330MB). Subsequent runs use the cached model.

## 📁 Project Structure

```
Emotion Detector from text/
├── main.py              # Flask backend + ML pipeline
├── requirements.txt     # Python dependencies
├── .gitignore
├── README.md
└── static/
    ├── index.html       # Frontend page
    ├── style.css        # Premium dark-themed styles
    ├── script.js        # Client-side logic + animations
    └── favicon.png      # Browser tab icon
```

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Serve the frontend |
| POST | `/analyze` | Analyze text emotions |
| GET | `/health` | Health check |

### POST `/analyze`

**Request:**
```json
{ "text": "I am so happy today!" }
```

**Response:**
```json
{
  "emotions": { "joy": 0.97, "surprise": 0.01, ... },
  "dominant": "joy",
  "confidence": 0.97,
  "text": "I am so happy today!"
}
```

## 📝 License

This project is for educational purposes.
