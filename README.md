# Vision Tutor - AI Learning Assistant

> Talk to an AI tutor using voice while sharing your screen, camera, or uploading images. Get real-time help with homework, code, math, or any subject.

Built for the [Gemini Live Agent Challenge](https://ai.google.dev/competition/live-agents) hackathon.

## Features

- **Real-time Voice**: Natural bidirectional voice conversation powered by Gemini Live API native audio
- **Screen Sharing**: Share your screen to show digital textbooks, code editors, or any content
- **Camera Input**: Point your camera at physical homework or whiteboards
- **Image Upload**: Drop in screenshots, photos of problems, or diagrams
- **Socratic Tutoring**: Guides you to discover answers instead of just telling you
- **Math Solver**: Step-by-step equation solving with SymPy verification
- **Quiz Mode**: Auto-generated quiz questions from visual context
- **Google Search Grounding**: Factual accuracy backed by real-time search

## Architecture

```
Browser (React + Web Audio API)        Cloud Run (Python)              Google
┌──────────────────┐    WebSocket    ┌──────────────────┐           ┌─────────┐
│ Mic (PCM 16kHz)  │───────────────→│                   │           │         │
│ Screen Share     │───────────────→│ FastAPI            │           │ Gemini  │
│ Camera (1fps)    │───────────────→│   ↕ ADK Runner     │──────────→│ Live API│
│ Image Upload     │───────────────→│   ↕ Tools          │←──────────│ (audio) │
│ Speaker (24kHz)  │←───────────────│                   │           │         │
│ Transcript       │←───────────────│                   │           │         │
└──────────────────┘                └──────────────────┘           └─────────┘
                                        ↕ google_search (grounding)
                                        ↕ math_solver (sympy)
                                        ↕ concept_explainer
                                        ↕ quiz_generator
```

## Quick Start

### Prerequisites

- Python 3.12+
- Node.js 20+
- [Gemini API Key](https://aistudio.google.com/apikey)

### 1. Clone and setup

```bash
git clone https://github.com/anthropic-hackathon/GeminiLiveAgentChallenge.git
cd GeminiLiveAgentChallenge
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env and add your GOOGLE_API_KEY

python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 4. Open browser

Navigate to `http://localhost:5173` and click **Start Session**.

- Click the **microphone** button and start talking
- Click **Share Screen** to show digital content (textbooks, code, PDFs)
- Click **Camera** to show physical materials
- Click the **image** button to upload a screenshot or photo

## Deploy to Cloud Run

```bash
export GOOGLE_API_KEY=your-key-here
chmod +x deploy/deploy-cloud-run.sh
./deploy/deploy-cloud-run.sh
```

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Web Audio API (AudioWorklet)
- **Backend**: Python 3.12, FastAPI, Google ADK (Agent Development Kit), SymPy
- **AI Model**: Gemini 2.5 Flash Native Audio (bidirectional streaming)
- **Deploy**: Docker multi-stage build, Google Cloud Run (WebSocket support)

## Tools

| Tool | Purpose |
|------|---------|
| `google_search` | Ground answers in real-time facts |
| `math_solver` | Step-by-step math solving with SymPy |
| `concept_explainer` | Structured explanations at 3 difficulty levels |
| `quiz_generator` | Generate quiz questions from visual context |

## Audio Pipeline

```
Mic → AudioContext(16kHz) → AudioWorklet(Float32→Int16) → WebSocket → Gemini
Gemini → WebSocket → AudioWorklet(Int16→Float32, ring buffer) → AudioContext(24kHz) → Speaker
```

## License

MIT
