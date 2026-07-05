"""
ADK Runner — orchestrates agents via session and artifact services.

Mirrors the google.adk.runners.Runner interface. When google-adk becomes
available in the environment, swap this class for the real Runner.
"""
import logging
from typing import Optional

logger = logging.getLogger(__name__)

_runner: Optional["Runner"] = None


class Runner:
    APP_NAME = "mentormind"

    def __init__(self):
        from agents.root_agent import RootAgent
        from adk.session_service import get_session_service
        from adk.artifact_service import get_artifact_service

        self.root = RootAgent()
        self.session_service = get_session_service()
        self.artifact_service = get_artifact_service()

        logger.info(
            "ADK Runner initialized — agents: %s",
            ", ".join(self.root.agent_names),
        )

    @property
    def registered_agents(self) -> list[str]:
        return self.root.agent_names

    @property
    def strategist(self):
        return self.root.strategist

    @property
    def mentor(self):
        return self.root.mentor

    @property
    def examiner(self):
        return self.root.examiner

    @property
    def coach(self):
        return self.root.coach

    @property
    def resource(self):
        return self.root.resource

    @property
    def reflection(self):
        return self.root.reflection


def get_runner() -> Runner:
    global _runner
    if _runner is None:
        raise RuntimeError(
            "ADK Runner has not been initialized. "
            "init_runner() must be called during app startup."
        )
    return _runner


def init_runner() -> None:
    global _runner
    try:
        _runner = Runner()
    except Exception as exc:
        logger.error("Failed to initialize ADK Runner: %s", exc)
        raise
