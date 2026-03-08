# Vision Tutor - Architecture

```mermaid
flowchart LR
    subgraph Browser["Browser (React + Web Audio)"]
        Mic["🎤 Microphone\n16kHz PCM"]
        Screen["🖥️ Screen Share\n1fps JPEG"]
        Camera["📷 Camera\n1fps JPEG"]
        Upload["📁 Image Upload\nJPEG"]
        Speaker["🔊 Speaker\n24kHz PCM"]
        UI["💬 Transcript\n+ Controls"]
    end

    subgraph CloudRun["Cloud Run (Python)"]
        FastAPI["FastAPI\nWebSocket Server"]
        ADK["Google ADK\nRunner.run_live()"]
        subgraph Tools["Agent Tools"]
            GS["google_search\n(grounding)"]
            MS["math_solver\n(sympy)"]
            CE["concept_explainer"]
            QG["quiz_generator"]
        end
    end

    subgraph Google["Google Cloud"]
        Gemini["Gemini 2.5 Flash\nNative Audio\n(Live API)"]
    end

    Mic -->|"binary PCM"| FastAPI
    Screen -->|"base64 JPEG"| FastAPI
    Camera -->|"base64 JPEG"| FastAPI
    Upload -->|"base64 JPEG"| FastAPI
    FastAPI <-->|"ADK LiveRequestQueue"| ADK
    ADK <-->|"bidiGenerateContent"| Gemini
    ADK --- Tools
    FastAPI -->|"binary PCM"| Speaker
    FastAPI -->|"JSON transcript"| UI
```

## Data Flow

### Audio Pipeline
```
Mic → getUserMedia(16kHz) → AudioWorklet(Float32→Int16) → WebSocket(binary) → ADK.send_realtime(Blob) → Gemini
Gemini → ADK events → WebSocket(binary) → AudioWorklet(Int16→Float32, ring buffer) → AudioContext(24kHz) → Speaker
```

### Vision Pipeline
```
Screen/Camera → canvas(1fps) → toDataURL(JPEG, 0.7) → base64 → WebSocket(JSON) → base64.decode → ADK.send_realtime(Blob) → Gemini
Image Upload → FileReader → base64 → WebSocket(JSON) → same path
```

### WebSocket Protocol
| Direction | Format | Content |
|-----------|--------|---------|
| Client → Server | Binary | Raw PCM audio (16kHz, Int16, mono) |
| Client → Server | JSON | `{type: "video_frame", data: "<base64>"}` |
| Client → Server | JSON | `{type: "text_input", text: "..."}` |
| Server → Client | Binary | Raw PCM audio (24kHz, Int16, mono) |
| Server → Client | JSON | `{type: "transcript", role, text}` |
| Server → Client | JSON | `{type: "status", status: "turn_complete\|interrupted"}` |
