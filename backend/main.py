import logging
from contextlib import asynccontextmanager
import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import sessions, learning, quiz, explain, reflection, resources, progress

load_dotenv()

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(name)s  %(message)s")


@asynccontextmanager
async def lifespan(app: FastAPI):
    from adk.runner import init_runner
    try:
        init_runner()
        logger.info("ADK Runner ready.")
    except Exception as exc:
        logger.error("ADK Runner init failed: %s", exc)
        # Non-fatal: mock endpoints work without the runner
    yield
    logger.info("MentorMind AI shutting down.")


app = FastAPI(
    title="MentorMind AI",
    description="Multi-agent personalized learning system powered by Google Gemini + ADK",
    version="0.8.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sessions.router,   tags=["sessions"])
app.include_router(learning.router,   tags=["learning"])
app.include_router(quiz.router,       tags=["quiz"])
app.include_router(explain.router,    tags=["quiz"])
app.include_router(reflection.router, tags=["reflection"])
app.include_router(resources.router,  tags=["resources"])
app.include_router(progress.router,   tags=["progress"])


@app.get("/health", tags=["meta"])
async def health():
    return {
        "status": "ok",
        "service": "MentorMind AI",
        "version": "0.4.0",
    }


@app.get("/debug/agents", tags=["meta"])
async def debug_agents():
    try:
        from adk.runner import get_runner
        runner = get_runner()
        return {
            "status": "ok",
            "agents": runner.registered_agents,
            "agent_configs": runner.root.agent_configs,
            "session_count": runner.session_service.session_count,
        }
    except RuntimeError as exc:
        return {
            "status": "degraded",
            "error": str(exc),
            "agents": [],
        }
