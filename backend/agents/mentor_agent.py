"""
Mentor Agent — generates rich, streaming lesson content for each topic.

M5: wire Gemini streaming text so the frontend receives chunks via SSE.
"""
from typing import AsyncIterator


class MentorAgent:
    NAME = "mentor"
    DESCRIPTION = (
        "Generates clear, engaging lesson content streamed chunk-by-chunk "
        "to the learner in real time."
    )

    @property
    def config(self) -> dict:
        return {
            "name": self.NAME,
            "description": self.DESCRIPTION,
            "model": "gemini-2.0-flash",
            "status": "registered",
        }

    async def teach(
        self, topic: str, level: str, context: str = ""
    ) -> AsyncIterator[str]:
        """Stream lesson content for a topic. Implemented in M5."""
        raise NotImplementedError("Gemini streaming — implemented in M5")
        yield  # keep the async generator signature
