import logging
import os
import uuid

from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from ws_handler import handle_websocket

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Vision Tutor", version="1.0.0")

# CORS for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "vision-tutor"}


@app.get("/api/session")
async def create_session():
    """Create a new session ID."""
    session_id = str(uuid.uuid4())
    return {"session_id": session_id}


@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str, api_key: str | None = None):
    await handle_websocket(websocket, session_id, api_key=api_key)


# Serve frontend static files (in production)
static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/assets", StaticFiles(directory=os.path.join(static_dir, "assets")), name="assets")
    worklets_dir = os.path.join(static_dir, "worklets")
    if os.path.exists(worklets_dir):
        app.mount("/worklets", StaticFiles(directory=worklets_dir), name="worklets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        file_path = os.path.realpath(os.path.join(static_dir, full_path))
        # Prevent path traversal: ensure resolved path is within static_dir
        if file_path.startswith(os.path.realpath(static_dir)) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(static_dir, "index.html"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
