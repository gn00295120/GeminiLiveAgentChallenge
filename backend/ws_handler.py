import asyncio
import base64
import json
import logging
import os

from fastapi import WebSocket, WebSocketDisconnect
from google.adk.agents.run_config import RunConfig
from google.adk.runners import Runner, LiveRequestQueue
from google.adk.sessions import InMemorySessionService
from google.genai import types

from tutor_agent.agent import create_agent

logger = logging.getLogger(__name__)

session_service = InMemorySessionService()


async def handle_websocket(websocket: WebSocket, session_id: str, api_key: str | None = None):
    """Handle a WebSocket connection for a tutoring session."""
    await websocket.accept()
    logger.info(f"WebSocket connected: session_id={session_id}")

    # Use client-provided API key or fall back to server env
    effective_key = api_key or os.environ.get("GOOGLE_API_KEY", "")
    if not effective_key:
        await websocket.send_json({"type": "error", "message": "No API key provided. Please enter your Gemini API key."})
        await websocket.close()
        return

    # Set the API key for this session (process-wide; acceptable for single-user Cloud Run instances)
    # Note: For multi-tenant deployments, use per-client genai configuration instead
    os.environ["GOOGLE_API_KEY"] = effective_key

    # Create ADK runner with agent
    agent = create_agent()
    runner = Runner(
        agent=agent,
        app_name="vision_tutor",
        session_service=session_service,
        auto_create_session=True,
    )

    live_request_queue = LiveRequestQueue()

    try:
        # Send ready status
        await websocket.send_json({"type": "status", "status": "connected"})

        async def send_to_client():
            """Forward ADK events to the WebSocket client."""
            try:
                live_events = runner.run_live(
                    user_id=f"user_{session_id}",
                    session_id=session_id,
                    live_request_queue=live_request_queue,
                    run_config=RunConfig(
                        response_modalities=["AUDIO"],
                    ),
                )
                async for event in live_events:
                    # Handle audio output
                    if event.content and event.content.parts:
                        for part in event.content.parts:
                            if part.inline_data and part.inline_data.mime_type and "audio" in part.inline_data.mime_type:
                                if part.inline_data.data is not None:
                                    await websocket.send_bytes(part.inline_data.data)
                            elif part.text and not getattr(event, 'output_transcription', None):
                                await websocket.send_json({
                                    "type": "transcript",
                                    "role": "assistant",
                                    "text": part.text,
                                })

                    # Handle transcriptions (speech-to-text)
                    if hasattr(event, 'input_transcription') and event.input_transcription and event.input_transcription.text:
                        await websocket.send_json({
                            "type": "transcript",
                            "role": "user",
                            "text": event.input_transcription.text,
                        })
                    if hasattr(event, 'output_transcription') and event.output_transcription and event.output_transcription.text:
                        await websocket.send_json({
                            "type": "transcript",
                            "role": "assistant",
                            "text": event.output_transcription.text,
                        })

                    # Handle turn complete / interrupted
                    if getattr(event, 'turn_complete', False):
                        await websocket.send_json({
                            "type": "status",
                            "status": "turn_complete",
                        })
                    if getattr(event, 'interrupted', False):
                        await websocket.send_json({
                            "type": "status",
                            "status": "interrupted",
                        })
            except Exception as e:
                logger.error(f"Error in send_to_client: {e}")
                try:
                    await websocket.send_json({
                        "type": "error",
                        "message": str(e),
                    })
                except Exception:
                    pass

        async def receive_from_client():
            """Forward WebSocket messages to ADK."""
            try:
                while True:
                    message = await websocket.receive()

                    if message.get("type") == "websocket.disconnect":
                        break

                    try:
                        # Handle binary audio data
                        if "bytes" in message:
                            audio_data = message["bytes"]
                            live_request_queue.send_realtime(
                                types.Blob(
                                    data=audio_data,
                                    mime_type="audio/pcm;rate=16000",
                                )
                            )

                        # Handle JSON text messages
                        elif "text" in message:
                            data = json.loads(message["text"])

                            if data.get("type") == "video_frame":
                                image_data = base64.b64decode(data["data"])
                                live_request_queue.send_realtime(
                                    types.Blob(
                                        data=image_data,
                                        mime_type="image/jpeg",
                                    )
                                )

                            elif data.get("type") == "text_input":
                                live_request_queue.send_content(
                                    types.Content(
                                        parts=[types.Part(text=data["text"])],
                                        role="user",
                                    )
                                )
                    except Exception as e:
                        logger.warning(f"Malformed message ignored: {e}")

            except WebSocketDisconnect:
                logger.info(f"Client disconnected: session_id={session_id}")
            except Exception as e:
                logger.error(f"Error in receive_from_client: {e}")

        # Run both loops concurrently
        send_task = asyncio.create_task(send_to_client())
        receive_task = asyncio.create_task(receive_from_client())

        # Wait for either to finish (usually receive finishes on disconnect)
        done, pending = await asyncio.wait(
            [send_task, receive_task],
            return_when=asyncio.FIRST_COMPLETED,
        )

        # Cancel the other task
        for task in pending:
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass

    except Exception as e:
        logger.error(f"WebSocket handler error: {e}")
    finally:
        try:
            live_request_queue.close()
        except Exception:
            pass
        try:
            await runner.close()
        except Exception:
            pass
        logger.info(f"Session ended: session_id={session_id}")
