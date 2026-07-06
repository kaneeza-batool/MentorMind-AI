"""
Examiner Agent — generates AI-powered quizzes and personalised feedback via Groq.
"""
import json
import logging
import re

logger = logging.getLogger(__name__)

LEVEL_GUIDANCE = {
    "beginner":     "Use simple, concrete scenarios. Avoid jargon. Test basic concepts and definitions.",
    "intermediate": "Include practical application scenarios. Test understanding and ability to apply patterns correctly.",
    "advanced":     "Focus on nuanced decisions, edge cases, performance trade-offs, and best practices.",
}


class ExaminerAgent:
    NAME = "examiner"
    DESCRIPTION = (
        "Creates adaptive multiple-choice quizzes, grades answers, "
        "and explains correct/incorrect choices on demand."
    )

    async def generate_quiz(self, topic: str, level: str = "intermediate") -> list[dict]:
        """
        Generate 5 MCQ questions for `topic` at `level`.
        Returns a list of dicts: {id, question, options, answer (int 0-3), explanation}.
        Raises ValueError on unexpected structure, json.JSONDecodeError on bad JSON.
        """
        from tools.gemini_client import generate

        guidance = LEVEL_GUIDANCE.get(level, LEVEL_GUIDANCE["intermediate"])
        system = (
            "You are an expert educational assessment designer. "
            "You generate multiple-choice quiz questions that test deep understanding, not memorization. "
            "Respond with valid JSON only — no markdown fences, no preamble, just the raw JSON object."
        )
        prompt = (
            f'Create a 5-question multiple-choice quiz about: "{topic}"\n'
            f"Learner level: {level}. {guidance}\n\n"
            "Return ONLY a JSON object with this exact structure:\n"
            "{\n"
            '  "questions": [\n'
            "    {\n"
            '      "id": "q1",\n'
            '      "question": "Question text here?",\n'
            '      "options": ["First option", "Second option", "Third option", "Fourth option"],\n'
            '      "answer": 0,\n'
            '      "explanation": "Why the correct answer is right and the others are wrong."\n'
            "    }\n"
            "  ]\n"
            "}\n\n"
            "Rules:\n"
            "- Exactly 5 questions (ids: q1 through q5)\n"
            "- Exactly 4 options per question — no letter prefixes like 'A.' or 'B.'\n"
            "- 'answer' is the 0-based index of the correct option (0, 1, 2, or 3)\n"
            "- Vary correct answer positions — don't cluster at index 0 or 1\n"
            "- Test application and understanding, not definition memorization\n"
            "- Distractors must be plausible but clearly wrong to a learner who truly understands\n"
            "- Keep all option texts roughly the same length"
        )

        result = await generate(prompt, system)
        raw = result["text"].strip()

        # Strip markdown code fences if the model adds them
        raw = re.sub(r"^```(?:json)?\s*\n?", "", raw, flags=re.MULTILINE)
        raw = re.sub(r"\n?```\s*$", "", raw, flags=re.MULTILINE)
        raw = raw.strip()

        data = json.loads(raw)
        questions = data["questions"]

        if len(questions) != 5:
            raise ValueError(f"Expected 5 questions, got {len(questions)}")
        for q in questions:
            if len(q.get("options", [])) != 4:
                raise ValueError(f"Question {q.get('id')} must have exactly 4 options")
            if q.get("answer") not in (0, 1, 2, 3):
                raise ValueError(f"Question {q.get('id')} answer index must be 0–3")

        return questions

    async def generate_feedback(
        self,
        topic: str,
        level: str,
        score: float,
        correct: int,
        total: int,
        wrong_questions: list[str],
    ) -> str:
        """Return 2–3 sentences of personalised feedback referencing the learner's specific mistakes."""
        from tools.gemini_client import generate

        system = (
            "You are a supportive but direct learning mentor. "
            "Write 2–3 sentences of personalised, actionable feedback. "
            "Be honest and specific. Never open with filler like 'Sure', 'Great', or 'Of course'."
        )
        if wrong_questions:
            wrong_list = "\n".join(f"- {q}" for q in wrong_questions[:3])
            prompt = (
                f"A {level} learner scored {correct}/{total} ({score:.0f}%) on a quiz about '{topic}'.\n"
                f"They answered these questions incorrectly:\n{wrong_list}\n\n"
                "Write 2–3 sentences that acknowledge their score, reference the specific areas they struggled with, "
                "and give one clear action they should take next."
            )
        else:
            prompt = (
                f"A {level} learner scored {correct}/{total} ({score:.0f}%) on a quiz about '{topic}'. "
                "They got every question correct. "
                "Write 2 sentences of enthusiastic, specific praise that references the topic."
            )

        result = await generate(prompt, system)
        return result["text"].strip()
