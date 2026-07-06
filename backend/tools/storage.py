"""
Session storage — in-memory cache backed by SQLite.

API is async throughout. Routers use `await storage.get_session(...)` and
`await storage.update_session(...)`. The in-memory dict serves as a fast
read cache; every write is persisted to SQLite so sessions survive restarts.

On the first request for an unknown session_id, we transparently recover
it from SQLite (post-restart recovery).
"""
import logging
import uuid

from models.state import LearningSession, Topic, QuizResult
from tools.database import db_save, db_load, db_delete, init_db

logger = logging.getLogger(__name__)

_store: dict[str, LearningSession] = {}


# ── Serialisation helpers ─────────────────────────────────────────────

def _topic_to_dict(t: Topic) -> dict:
    return {
        "id":                t.id,
        "title":             t.title,
        "description":       t.description,
        "order":             t.order,
        "estimated_minutes": t.estimated_minutes,
        "status":            t.status,
        "mastery":           t.mastery,
    }


def _qr_to_dict(qr: QuizResult) -> dict:
    return {
        "topic_id":     qr.topic_id,
        "score":        qr.score,
        "total":        qr.total,
        "correct":      qr.correct,
        "weak_concepts": qr.weak_concepts,
        "taken_at":     qr.taken_at,
    }


def _session_to_dict(session: LearningSession) -> dict:
    return {
        "id":                  session.id,
        "skill":               session.skill,
        "goal":                session.goal,
        "level":               session.level,
        "curriculum":          [_topic_to_dict(t) for t in session.curriculum],
        "quiz_results":        [_qr_to_dict(qr) for qr in session.quiz_results],
        "mastery":             session.mastery,
        "weak_areas":          session.weak_areas,
        "lesson_history":      session.lesson_history,
        "reflections":         session.reflections,
        "resources":           session.resources,
        "curriculum_versions": session.curriculum_versions,
        "study_time":          session.study_time,
        "created_at":          session.created_at,
    }


def _dict_to_session(data: dict) -> LearningSession:
    topics = [
        Topic(
            id=t["id"],
            title=t["title"],
            description=t["description"],
            order=t["order"],
            estimated_minutes=t.get("estimated_minutes", 20),
            status=t.get("status", "locked"),
            mastery=t.get("mastery", 0.0),
        )
        for t in data.get("curriculum", [])
    ]
    quiz_results = [
        QuizResult(
            topic_id=qr["topic_id"],
            score=qr["score"],
            total=qr["total"],
            correct=qr["correct"],
            weak_concepts=qr.get("weak_concepts", []),
            taken_at=qr.get("taken_at", ""),
        )
        for qr in data.get("quiz_results", [])
    ]
    session = LearningSession(
        id=data["id"],
        skill=data["skill"],
        goal=data["goal"],
        level=data["level"],
        created_at=data.get("created_at", ""),
    )
    session.curriculum          = topics
    session.quiz_results        = quiz_results
    session.mastery             = data.get("mastery", {})
    session.weak_areas          = data.get("weak_areas", [])
    session.lesson_history      = data.get("lesson_history", {})
    session.reflections         = data.get("reflections", {})
    session.resources           = data.get("resources", {})
    session.curriculum_versions = data.get("curriculum_versions", [])
    session.study_time          = data.get("study_time", {})
    return session


# ── Public API ────────────────────────────────────────────────────────

async def init_storage() -> None:
    """Initialize the database. Call once at application startup."""
    await init_db()


def create_session(skill: str, goal: str, level: str) -> LearningSession:
    """
    Create a new in-memory session.

    Callers must call `await update_session(session)` after populating
    the curriculum to persist it to SQLite.
    """
    sid = str(uuid.uuid4())
    session = LearningSession(id=sid, skill=skill, goal=goal, level=level)
    _store[sid] = session
    return session


async def get_session(session_id: str) -> LearningSession | None:
    """
    Return the session from memory, falling back to SQLite on cache miss.

    This transparently recovers sessions after a backend restart.
    """
    if session_id in _store:
        return _store[session_id]

    # Cache miss — try SQLite (post-restart recovery)
    data = await db_load(session_id)
    if data:
        session = _dict_to_session(data)
        _store[session.id] = session
        logger.info("Session %s recovered from SQLite.", session_id)
        return session

    return None


async def update_session(session: LearningSession) -> None:
    """Update the in-memory store and persist to SQLite."""
    _store[session.id] = session
    try:
        await db_save(_session_to_dict(session))
    except Exception as exc:
        logger.warning("Failed to persist session %s: %s", session.id, exc)


async def delete_session(session_id: str) -> None:
    """Remove session from memory and SQLite."""
    _store.pop(session_id, None)
    try:
        await db_delete(session_id)
    except Exception as exc:
        logger.warning("Failed to delete session %s from SQLite: %s", session_id, exc)
