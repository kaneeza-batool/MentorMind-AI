"""
Mentor Agent — generates rich, streaming lesson content for each topic.
"""
import os
from typing import AsyncIterator

# Tone and depth guidance injected into the system prompt per learner level.
_LEVEL_GUIDANCE = {
    "beginner": (
        "Use simple, friendly language. Avoid unexplained jargon. Lead with an analogy "
        "before introducing technical terms. Keep code examples short (≤15 lines) and "
        "annotate every non-obvious line. Focus on the 'why' before the 'how'."
    ),
    "intermediate": (
        "Assume familiarity with programming basics. Use precise technical language. "
        "Include realistic, working code examples (15–30 lines). Cover common patterns, "
        "gotchas, and idiomatic usage."
    ),
    "advanced": (
        "Assume a strong programming background. Go deep on nuance, edge cases, and "
        "performance trade-offs. Show production-quality code. Discuss alternative "
        "approaches and when to choose each."
    ),
}

_LESSON_STRUCTURE = """\
# {topic}

## Learning Objective
## Explanation
## Real-world Example
## Code Example
## Common Mistakes
## Key Takeaways
## Mini Challenge
## Suggested Next Step"""


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
            "model": os.getenv("GEMINI_MODEL", "gemini-2.0-flash"),
            "status": "active",
        }

    async def teach(
        self, topic: str, level: str, context: str = ""
    ) -> AsyncIterator[str]:
        """Stream a structured markdown lesson. Raises RuntimeError if no API key."""
        from tools.gemini_client import stream as gemini_stream

        prompt = self._build_prompt(topic, level, context)
        system = self._system_prompt(level)
        async for chunk in gemini_stream(prompt, system):
            yield chunk

    # ── Private helpers ──────────────────────────────────────────────

    def _system_prompt(self, level: str) -> str:
        guidance = _LEVEL_GUIDANCE.get(level.lower(), _LEVEL_GUIDANCE["intermediate"])
        return (
            "You are MentorMind's Mentor Agent — an expert educator who writes "
            "structured, deeply engaging learning content in Markdown. "
            f"You are teaching a {level}-level learner. {guidance} "
            "Always respond with well-formed Markdown: use headers, bullet points, "
            "bold terms, and fenced code blocks where appropriate. "
            "Never open with filler phrases like 'Sure!' or 'Here is your lesson'. "
            "Begin directly with the lesson content."
        )

    def _build_prompt(self, topic: str, level: str, context: str) -> str:
        context_section = f"\n\nLearner context: {context}" if context else ""
        return f"""Generate a comprehensive, high-quality lesson on: **{topic}**

Learner level: {level}{context_section}

Use EXACTLY this Markdown structure, in this order — do not skip any section:

# {topic}

## Learning Objective
One crisp sentence: what the learner will be able to do after completing this lesson.

## Explanation
A thorough conceptual explanation. For beginners, open with a concrete analogy before \
introducing technical terms. For intermediate/advanced, lead with the technical substance \
and build in depth.

## Real-world Example
A specific, practical scenario showing where this concept is applied. Connect it directly \
to the learner's goal.

## Code Example
(Include whenever the topic has a programmatic dimension. Omit only for purely \
non-technical concepts.)
A working, readable code snippet. Annotate every non-obvious line for beginners; \
show idiomatic production patterns for advanced learners.

## Common Mistakes
3–5 specific, named mistakes or misconceptions. For each: state the mistake clearly, \
explain why it is wrong, and describe the correct approach.

## Key Takeaways
5–7 bullet points. Each bullet should be a standalone, memorable insight — not a \
restatement of a section heading.

## Mini Challenge
A practical exercise completable in 5–15 minutes. Describe what to build or do, \
and define what "done" looks like so the learner can self-assess.

## Suggested Next Step
One specific, actionable recommendation — a concept to explore, a project to attempt, \
or a resource to consult — that advances the learner toward their goal.

Write the complete lesson now. Be thorough, accurate, and pedagogically excellent."""
