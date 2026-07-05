"""
Resource Agent — curates high-quality learning resources per topic.

M5: wire Gemini to rank and recommend articles, videos, docs, and repos.
"""


class ResourceAgent:
    NAME = "resource"
    DESCRIPTION = (
        "Recommends curated, high-quality learning resources matched to "
        "the learner's topic, level, and preferred learning style."
    )

    @property
    def config(self) -> dict:
        return {
            "name": self.NAME,
            "description": self.DESCRIPTION,
            "model": "gemini-2.0-flash",
            "status": "registered",
        }

    async def recommend(
        self, topic: str, level: str, learning_style: str = "mixed"
    ) -> list[dict]:
        """Return curated resources for a topic. Implemented in M5."""
        raise NotImplementedError("Gemini function calling — implemented in M5")
