"""
Coach Agent — tracks mastery and decides when to trigger re-planning.

M6: wire mastery computation and weak-area detection from quiz history.
"""


class CoachAgent:
    NAME = "coach"
    DESCRIPTION = (
        "Tracks per-topic mastery, identifies weak areas, and signals "
        "the Strategist to adapt the curriculum when performance warrants it."
    )

    @property
    def config(self) -> dict:
        return {
            "name": self.NAME,
            "description": self.DESCRIPTION,
            "model": "gemini-2.0-flash",
            "status": "registered",
        }

    async def analyze(self, session_id: str, quiz_result: dict) -> dict:
        """Analyze quiz results and compute mastery delta. Implemented in M6."""
        raise NotImplementedError("Implemented in M6")
