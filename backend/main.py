import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from tools.storage import init_storage

logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s  %(name)s  %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ──────────────────────────────────────────────────
    try:
        await init_storage()
        logger.info("SQLite storage ready.")
    except Exception as exc:
        logger.error("Storage init failed: %s — continuing with in-memory fallback.", exc)

    try:
        from adk.runner import init_runner
        init_runner()
        logger.info("ADK Runner ready.")
    except Exception as exc:
        logger.warning("ADK Runner init failed (non-fatal): %s", exc)

    yield

    # ── Shutdown ─────────────────────────────────────────────────
    logger.info("MentorMind AI shutting down.")


from routers import sessions, learning, quiz, explain, reflection, resources, progress
from routers import mcp

app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "Multi-agent personalized learning platform. "
        "Six specialized AI agents collaborate to teach, quiz, reflect, and adapt "
        "the curriculum to each learner's mastery level."
    ),
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
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
app.include_router(mcp.router)


@app.get("/health", tags=["meta"])
async def health():
    return {
        "status":  "ok",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }


@app.get("/debug/agents", tags=["meta"])
async def debug_agents():
    try:
        from adk.runner import get_runner
        runner = get_runner()
        return {
            "status":       "ok",
            "agents":       runner.registered_agents,
            "agent_configs": runner.root.agent_configs,
            "session_count": runner.session_service.session_count,
        }
    except RuntimeError as exc:
        from agents.root_agent import RootAgent
        return {
            "status":       "ok",
            "agents":       RootAgent().agent_names,
            "agent_configs": RootAgent().agent_configs,
            "error":        str(exc),
        }
