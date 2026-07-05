"""
ADK-compatible InMemoryArtifactService.

Stores lesson markdown and quiz JSON per session turn.
Mirrors the google.adk.artifacts.InMemoryArtifactService interface.
"""
from typing import Optional


class Artifact:
    def __init__(self, content: str, mime_type: str = "text/markdown"):
        self.content = content
        self.mime_type = mime_type


class InMemoryArtifactService:
    def __init__(self):
        self._store: dict[str, dict[str, Artifact]] = {}

    def save_artifact(
        self,
        session_id: str,
        name: str,
        content: str,
        mime_type: str = "text/markdown",
    ) -> None:
        if session_id not in self._store:
            self._store[session_id] = {}
        self._store[session_id][name] = Artifact(content, mime_type)

    def load_artifact(self, session_id: str, name: str) -> Optional[str]:
        artifact = self._store.get(session_id, {}).get(name)
        return artifact.content if artifact else None

    def list_artifacts(self, session_id: str) -> list[str]:
        return list(self._store.get(session_id, {}).keys())

    def delete_artifact(self, session_id: str, name: str) -> None:
        self._store.get(session_id, {}).pop(name, None)


_service: Optional[InMemoryArtifactService] = None


def get_artifact_service() -> InMemoryArtifactService:
    global _service
    if _service is None:
        _service = InMemoryArtifactService()
    return _service
