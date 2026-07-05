"""
Reflection Agent — narrates personalized post-quiz feedback.

M7: wire Gemini to produce strength/weakness narrative from quiz history.
"""


class ReflectionAgent:
    NAME = "reflection"
    DESCRIPTION = (
        "Generates a personalized narrative after each quiz: "
        "strengths, weak spots, and an actionable next step."
    )

    @property
    def config(self) -> dict:
        return {
            "name": self.NAME,
            "description": self.DESCRIPTION,
            "model": "gemini-2.0-flash",
            "status": "registered",
        }

    async def reflect(self, session_id: str, quiz_results: dict) -> dict:
        """Generate a reflection narrative from quiz results. Implemented in M7."""
        raise NotImplementedError("Gemini text generation — implemented in M7")
