"""
ADK-compatible InMemorySessionService.

Mirrors the google.adk.sessions.InMemorySessionService interface so this
can be swapped for the real ADK service when google-adk is available.
"""
import uuid
from typing import Optional


class Session:
    def __init__(self, session_id: str, app_name: str, user_id: str):
        self.id = session_id
        self.app_name = app_name
        self.user_id = user_id
        self.state: dict = {}


class InMemorySessionService:
    def __init__(self):
        self._sessions: dict[str, Session] = {}

    def create_session(
        self,
        app_name: str,
        user_id: str,
        session_id: Optional[str] = None,
    ) -> Session:
        sid = session_id or str(uuid.uuid4())
        session = Session(sid, app_name, user_id)
        self._sessions[sid] = session
        return session

    def get_session(
        self, app_name: str, user_id: str, session_id: str
    ) -> Optional[Session]:
        return self._sessions.get(session_id)

    def update_state(self, session_id: str, updates: dict) -> None:
        if session_id in self._sessions:
            self._sessions[session_id].state.update(updates)

    def delete_session(self, session_id: str) -> None:
        self._sessions.pop(session_id, None)

    @property
    def session_count(self) -> int:
        return len(self._sessions)


_service: Optional[InMemorySessionService] = None


def get_session_service() -> InMemorySessionService:
    global _service
    if _service is None:
        _service = InMemorySessionService()
    return _service
