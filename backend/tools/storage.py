"""
In-process session store — dict-backed, keyed by session_id.

Not a database. Survives the request lifecycle; resets on server restart.
For production, swap with Redis or a real DB.
"""
import uuid
from models.state import LearningSession

_store: dict[str, LearningSession] = {}


def create_session(skill: str, goal: str, level: str) -> LearningSession:
    sid = str(uuid.uuid4())
    session = LearningSession(id=sid, skill=skill, goal=goal, level=level)
    _store[sid] = session
    return session


def get_session(session_id: str) -> LearningSession | None:
    return _store.get(session_id)


def update_session(session: LearningSession) -> None:
    _store[session.id] = session


def delete_session(session_id: str) -> None:
    _store.pop(session_id, None)
