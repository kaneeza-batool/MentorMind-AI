"""
Examiner Agent — generates adaptive quizzes and grades submitted answers.

M6: wire Gemini function calling for structured question + answer-key JSON.
"""


class ExaminerAgent:
    NAME = "examiner"
    DESCRIPTION = (
        "Creates adaptive multiple-choice quizzes, grades answers, "
        "and explains correct/incorrect choices on demand."
    )

    @property
    def config(self) -> dict:
        return {
            "name": self.NAME,
            "description": self.DESCRIPTION,
            "model": "gemini-2.0-flash",
            "status": "registered",
        }

    async def generate_quiz(
        self, topic: str, lesson_content: str, difficulty: str = "adaptive"
    ) -> dict:
        """Generate quiz questions for a topic. Implemented in M6."""
        raise NotImplementedError("Gemini function calling — implemented in M6")

    async def grade(self, questions: list, answers: list) -> dict:
        """Grade submitted answers. Implemented in M6."""
        raise NotImplementedError("Implemented in M6")

    async def explain(
        self, question: str, chosen: str, correct: str, topic: str
    ) -> str:
        """Explain a quiz answer ('Why?' feature). Implemented in M6."""
        raise NotImplementedError("Implemented in M6")
