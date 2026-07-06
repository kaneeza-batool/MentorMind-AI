"""
Reflection Agent — generates personalized post-quiz reflections via Groq.
"""
import json
import logging
import re

logger = logging.getLogger(__name__)

_LEVEL_TONE = {
    "beginner":     "Speak simply and encouragingly. Avoid technical jargon. Focus on building confidence.",
    "intermediate": "Be direct and specific. Reference practical application. Encourage mastery.",
    "advanced":     "Be concise and precise. Focus on nuanced gaps. Challenge them to go deeper.",
}


def _deterministic_fallback(score: float, weak_concepts: list, topic: str) -> dict:
    """Rule-based reflection returned when the AI call fails."""
    if score >= 80:
        return {
            "summary": (
                f"You've demonstrated a solid command of {topic}, scoring {score:.0f}%. "
                "Your understanding of the core concepts is strong and consistent. "
                "This performance reflects genuine comprehension, not just familiarity."
            ),
            "strengths": ["Strong conceptual understanding", "Consistent accuracy", "Ready to advance"],
            "weaknesses": [],
            "recommendation": "Move on to the next topic and continue building on this foundation.",
            "confidence": min(92, int(score * 0.95)),
        }
    elif score >= 60:
        return {
            "summary": (
                f"Good progress on {topic} — you scored {score:.0f}%. "
                "You've grasped the key patterns, but a few areas need more attention before you'll feel truly solid. "
                "The gap between knowing and applying is closing."
            ),
            "strengths": ["Foundational understanding in place", "Grasping core patterns"],
            "weaknesses": (
                weak_concepts[:3] if weak_concepts
                else ["Applying concepts to new scenarios", "Edge case handling"]
            ),
            "recommendation": "Review the weak areas identified below, then advance when you feel confident.",
            "confidence": max(45, int(score * 0.82)),
        }
    else:
        return {
            "summary": (
                f"You scored {score:.0f}% on {topic}. This topic has some tricky parts — "
                "and that's a normal part of the learning process. "
                "The effort you're putting in will pay off; a focused review will make the difference."
            ),
            "strengths": ["Persistence and effort", "Willingness to tackle challenging material"],
            "weaknesses": (
                weak_concepts[:3] if weak_concepts
                else ["Core concept application", "Best practice identification"]
            ),
            "recommendation": "Re-read the lesson carefully, focusing on the weak areas, then retake the quiz.",
            "confidence": max(40, int(score * 0.72)),
        }


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
            "model": "llama-3.3-70b-versatile",
            "status": "active",
        }

    async def reflect(
        self,
        goal: str,
        level: str,
        topic: str,
        score: float,
        correct: int,
        total: int,
        weak_concepts: list,
        previous_topics: list,
        adapted_context: str = "",
    ) -> dict:
        """
        Generate a personalized reflection from quiz results.

        Returns a dict: {summary, strengths, weaknesses, recommendation, confidence}.
        Falls back to a deterministic output if the AI call fails so the learner is never blocked.
        """
        from tools.gemini_client import generate

        tone = _LEVEL_TONE.get(level, _LEVEL_TONE["intermediate"])
        prev_ctx = (
            f"They have previously completed: {', '.join(previous_topics)}."
            if previous_topics else "This is their first completed topic."
        )
        weak_str = (
            f"They struggled with: {', '.join(weak_concepts[:5])}."
            if weak_concepts else "No significant weak areas detected."
        )
        conf_min = max(40, int(score * 0.75))
        conf_max = min(95, int(score * 0.98) + 5)

        system = (
            "You are an empathetic, insightful AI learning coach. "
            "You analyze a learner's quiz performance and generate a personalized, narrative reflection. "
            "Your tone is supportive, specific, and constructive — never generic or formulaic. "
            "Never simply restate the score number. Focus on learning patterns, insight, and growth. "
            f"{tone} "
            "Respond with valid JSON only — no markdown fences, no preamble, no explanation."
        )

        adapt_note = f"\nCurriculum context: {adapted_context}" if adapted_context else ""

        prompt = (
            f"Generate a personalized learning reflection for this learner:\n\n"
            f"Learning Goal: {goal}\n"
            f"Level: {level}\n"
            f"Current Topic: {topic}\n"
            f"Quiz Score: {correct}/{total} ({score:.0f}%)\n"
            f"{weak_str}\n"
            f"{prev_ctx}{adapt_note}\n\n"
            "Return ONLY a JSON object with this exact structure:\n"
            "{\n"
            '  "summary": "2-3 sentences. Personalized, references the specific topic and performance context. Never just restates the score.",\n'
            '  "strengths": ["Specific strength 1", "Specific strength 2", "Specific strength 3"],\n'
            '  "weaknesses": ["Specific gap 1", "Specific gap 2"],\n'
            '  "recommendation": "One clear, actionable next step tailored to this learner and their goal.",\n'
            f'  "confidence": {(conf_min + conf_max) // 2}\n'
            "}\n\n"
            "Rules:\n"
            "- summary: 2-3 sentences, references the specific topic, personalized to score and weak areas\n"
            "- strengths: 2-4 items, concrete and specific to what was demonstrated\n"
            f"- weaknesses: 0-3 items (empty array if score >= 80 and no weak areas); name specific concepts\n"
            "- recommendation: concrete, actionable, references the learner's stated goal\n"
            f"- confidence: integer between {conf_min} and {conf_max}, reflecting demonstrated mastery\n"
            "- Do not include the words 'JSON', 'quiz', or 'assessment' in the summary field"
        )

        try:
            result = await generate(prompt, system)
            raw = result["text"].strip()

            raw = re.sub(r"^```(?:json)?\s*\n?", "", raw, flags=re.MULTILINE)
            raw = re.sub(r"\n?```\s*$", "", raw, flags=re.MULTILINE)
            raw = raw.strip()

            data = json.loads(raw)

            required = {"summary", "strengths", "weaknesses", "recommendation", "confidence"}
            if not required.issubset(data.keys()):
                raise ValueError(f"Missing fields in AI response: {required - data.keys()}")

            data["strengths"]  = list(data.get("strengths", []))[:4]
            data["weaknesses"] = list(data.get("weaknesses", []))[:3]
            data["confidence"] = max(40, min(95, int(data.get("confidence", 70))))

            return data

        except Exception as exc:
            logger.warning("ReflectionAgent AI call failed (%s). Using deterministic fallback.", exc)
            return _deterministic_fallback(score, weak_concepts, topic)
