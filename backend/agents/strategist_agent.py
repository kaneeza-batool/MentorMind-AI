"""
Strategist Agent — builds and adapts the personalized learning curriculum.

M5: wire Gemini function calling to produce structured curriculum JSON.
"""


class StrategistAgent:
    NAME = "strategist"
    DESCRIPTION = (
        "Creates a structured learning curriculum tailored to user goals "
        "and adapts it based on Coach mastery signals."
    )

    @property
    def config(self) -> dict:
        return {
            "name": self.NAME,
            "description": self.DESCRIPTION,
            "model": "gemini-2.0-flash",
            "status": "registered",
        }

    async def plan(
        self,
        skill: str,
        goal: str,
        level: str,
        coach_signals: dict | None = None,
    ) -> dict:
        """Generate a curriculum for the given skill and goal. Implemented in M5."""
        raise NotImplementedError("Gemini function calling — implemented in M5")
