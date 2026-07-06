import logging
from fastapi import APIRouter, HTTPException, Request
from sse_starlette.sse import EventSourceResponse
from models.schemas import LessonRequest
from tools import storage
from tools.gemini_client import generate
from agents.mentor_agent import MentorAgent

logger = logging.getLogger(__name__)
router = APIRouter()


async def _lesson_stream(session_id: str, topic_id: str, request: Request):
    """
    Async generator that streams lesson chunks as SSE events.

    Event types:
      chunk        — a piece of lesson markdown text
      done         — stream finished ([DONE] payload)
      stream_error — something went wrong (user-visible message payload)
    """
    session = await storage.get_session(session_id)
    if not session:
        yield {"event": "stream_error", "data": "Session not found. Please restart."}
        yield {"event": "done", "data": "[DONE]"}
        return

    topic = next((t for t in session.curriculum if t.id == topic_id), None)
    if not topic:
        yield {"event": "stream_error", "data": "Topic not found in curriculum."}
        yield {"event": "done", "data": "[DONE]"}
        return

    context = (
        f"Learner goal: {session.goal}. "
        f"Skill being studied: {session.skill}."
    )
    mentor = MentorAgent()

    try:
        async for chunk in mentor.teach(topic.title, session.level, context):
            if await request.is_disconnected():
                logger.info("Client disconnected during lesson stream for %s", topic_id)
                return
            yield {"event": "chunk", "data": chunk}

    except Exception as exc:
        from openai import AuthenticationError, RateLimitError, APITimeoutError, APIConnectionError

        if isinstance(exc, AuthenticationError):
            msg = "Service configuration error. Please contact support."
        elif isinstance(exc, RateLimitError):
            msg = "The AI service is busy right now. Please wait a moment and retry."
        elif isinstance(exc, APITimeoutError):
            msg = "The lesson is taking too long to generate. Please retry."
        elif isinstance(exc, APIConnectionError):
            msg = "Could not reach the AI service. Check your connection and retry."
        else:
            msg = "Lesson generation failed. Please retry."

        logger.exception("Error during lesson stream for %s: %s", topic_id, exc)
        yield {"event": "stream_error", "data": msg}

    yield {"event": "done", "data": "[DONE]"}


@router.post("/learn", status_code=200)
async def start_lesson(body: LessonRequest):
    session = await storage.get_session(body.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    topic = next((t for t in session.curriculum if t.id == body.topic_id), None)
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    return {
        "session_id": body.session_id,
        "topic_id": body.topic_id,
        "stream_url": f"/learn/stream?session_id={body.session_id}&topic_id={body.topic_id}",
    }


@router.get("/learn/stream")
async def stream_lesson(session_id: str, topic_id: str, request: Request):
    return EventSourceResponse(_lesson_stream(session_id, topic_id, request))


@router.post("/learn/complete")
async def complete_lesson(session_id: str, topic_id: str, study_minutes: int = 0):
    """Record study time for a completed lesson. Called by the frontend on stream done."""
    session = await storage.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    from datetime import datetime, timezone
    session.study_time[topic_id] = study_minutes * 60
    session.lesson_history.setdefault(topic_id, {})
    session.lesson_history[topic_id]["completed_at"]   = datetime.now(timezone.utc).isoformat()
    session.lesson_history[topic_id]["study_minutes"]  = study_minutes
    await storage.update_session(session)
    return {"ok": True}


@router.get("/learn/why")
async def why_this_topic(session_id: str, topic_id: str):
    """Returns a short AI-generated explanation connecting this topic to the learner's goal."""
    session = await storage.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    topic = next((t for t in session.curriculum if t.id == topic_id), None)
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    prompt = (
        f"In 2–3 sentences, explain to a {session.level} learner "
        f"exactly why studying '{topic.title}' is a crucial step toward their goal: "
        f"'{session.goal}'. Be specific and motivating. "
        "Do not open with 'Sure', 'Great', or similar filler words."
    )
    try:
        result = await generate(prompt)
        return {"why": result["text"].strip()}
    except RuntimeError:
        return {
            "why": (
                f"Mastering '{topic.title}' gives you the foundational skills "
                f"needed to achieve your goal: {session.goal}."
            )
        }
    except Exception:
        return {"why": f"This topic is an essential step in your {session.skill} journey."}


@router.post("/next")
async def next_topic(session_id: str):
    session = await storage.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    current_idx = next(
        (i for i, t in enumerate(session.curriculum) if t.status == "active"), None
    )
    if current_idx is None:
        return {"message": "Curriculum complete", "next_topic": None}

    session.curriculum[current_idx].status = "completed"
    next_idx = current_idx + 1
    if next_idx < len(session.curriculum):
        session.curriculum[next_idx].status = "active"
        next_topic_obj = session.curriculum[next_idx]
        await storage.update_session(session)
        return {"next_topic": {"id": next_topic_obj.id, "title": next_topic_obj.title}}

    await storage.update_session(session)
    return {"message": "Curriculum complete", "next_topic": None}
