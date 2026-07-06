"""
Strategist Agent — generates a personalised learning curriculum via Groq AI.

Replaces the hardcoded 5-topic mock in sessions.py with an AI-planned
path tailored to the learner's skill, goal, level, and available timeline.

Caches per (skill, level) pair to avoid redundant generation on retries.
Falls back to a deterministic curriculum on any AI failure.
"""
import json
import logging
import re

logger = logging.getLogger(__name__)

# In-process cache: { "skill::level" : list[dict] }
_CACHE: dict[str, list[dict]] = {}


def _fallback_curriculum(skill: str, level: str, timeline_weeks: int) -> list[dict]:
    """Deterministic 5-topic curriculum when AI is unavailable."""
    s = skill.strip().title() if skill.strip() else "the Subject"
    pacing = max(20, min(60, timeline_weeks * 4))  # minutes per topic

    return [
        {
            "id":                "t1",
            "title":             f"Foundations of {s}",
            "description":       f"Core concepts, mental models, and your first working {s} program.",
            "order":             1,
            "estimated_minutes": max(20, pacing - 10),
        },
        {
            "id":                "t2",
            "title":             f"Core {s} Patterns",
            "description":       "Fundamental building blocks: data structures, control flow, and functions.",
            "order":             2,
            "estimated_minutes": pacing,
        },
        {
            "id":                "t3",
            "title":             f"Working with Data in {s}",
            "description":       "Collections, I/O, and common data-processing idioms.",
            "order":             3,
            "estimated_minutes": pacing,
        },
        {
            "id":                "t4",
            "title":             f"Advanced {s} Techniques",
            "description":       "OOP, error handling, testing, and design principles.",
            "order":             4,
            "estimated_minutes": pacing + 5,
        },
        {
            "id":                "t5",
            "title":             f"{s} Capstone Project",
            "description":       f"Apply everything by building a real end-to-end {s} project.",
            "order":             5,
            "estimated_minutes": pacing + 10,
        },
    ]


class StrategistAgent:
    NAME = "strategist"
    DESCRIPTION = (
        "Creates a personalised, progressive learning curriculum tailored to "
        "the learner's skill, goal, experience level, and available timeline. "
        "Adapts topic depth and pacing based on Coach mastery signals."
    )

    @property
    def config(self) -> dict:
        return {
            "name":        self.NAME,
            "description": self.DESCRIPTION,
            "model":       "llama-3.3-70b-versatile",
            "status":      "active",
        }

    async def plan(
        self,
        skill:          str,
        goal:           str,
        level:          str,
        timeline_weeks: int = 4,
        coach_signals:  dict | None = None,
    ) -> list[dict]:
        """
        Generate a personalised curriculum for the learner.

        Returns a list of topic dicts, each with:
            id, title, description, order, estimated_minutes

        Results are cached per (skill, level) — repeated calls are instant.
        Falls back to a deterministic curriculum on AI failure.
        """
        cache_key = f"{skill.lower().strip()}::{level}"

        if cache_key in _CACHE:
            logger.info("StrategistAgent cache hit for '%s' (%s)", skill, level)
            return _CACHE[cache_key]

        logger.info("StrategistAgent planning curriculum for '%s' (level=%s, weeks=%d)",
                    skill, level, timeline_weeks)

        topics = await self._generate(skill, goal, level, timeline_weeks, coach_signals or {})
        _CACHE[cache_key] = topics
        return topics

    async def _generate(
        self,
        skill:          str,
        goal:           str,
        level:          str,
        timeline_weeks: int,
        coach_signals:  dict,
    ) -> list[dict]:
        from tools.gemini_client import generate

        # Compute ideal topic count: more weeks = more depth = more topics
        n_topics = 4 if timeline_weeks <= 2 else 5 if timeline_weeks <= 6 else 6
        mins_per_topic = max(20, min(60, (timeline_weeks * 60) // (n_topics * 3)))

        level_guidance = {
            "beginner":     "Start from absolute basics. No assumed prior knowledge.",
            "intermediate": "Skip trivial introductions. Emphasise practical patterns and common pitfalls.",
            "advanced":     "Focus on advanced internals, performance, and production-grade practices.",
        }.get(level, "Calibrate to the learner's stated level.")

        coach_ctx = ""
        if coach_signals.get("weak_areas"):
            coach_ctx = (
                f"The learner has shown weakness in: {', '.join(coach_signals['weak_areas'][:3])}. "
                "Address these gaps within appropriate topics."
            )

        system = (
            "You are an expert learning curriculum designer. "
            "You create focused, progressive learning paths for individual learners. "
            "Each topic must build naturally on the previous one. "
            "Respond with valid JSON only — no markdown fences, no preamble."
        )

        prompt = (
            f"Design a {n_topics}-topic learning curriculum for this learner:\n\n"
            f"Skill to learn: {skill}\n"
            f"Learning goal: {goal}\n"
            f"Experience level: {level}. {level_guidance}\n"
            f"Available time: {timeline_weeks} weeks (~{mins_per_topic} min/topic)\n"
            f"{coach_ctx}\n\n"
            f"Return a JSON array of exactly {n_topics} topic objects. Each object must have:\n"
            '{\n'
            '  "id": "t1",         (sequential: t1, t2, t3, ...)\n'
            '  "title": "Topic title (max 8 words)",\n'
            '  "description": "What this topic covers. Concrete, specific. Max 2 sentences.",\n'
            '  "order": 1,          (1-based integer)\n'
            '  "estimated_minutes": 25  (realistic study time: 15–60)\n'
            '}\n\n'
            "Rules:\n"
            "- Topics must progress from foundational to advanced\n"
            f"- Last topic should be a project or capstone applying all {n_topics} topics\n"
            "- Title should be specific to the skill (not generic like 'Introduction')\n"
            f"- Estimated minutes should total roughly {n_topics * mins_per_topic} min\n"
            "- Return ONLY the JSON array, nothing else"
        )

        try:
            result = await generate(prompt, system)
            raw    = result["text"].strip()

            raw = re.sub(r"^```(?:json)?\s*\n?", "", raw, flags=re.MULTILINE)
            raw = re.sub(r"\n?```\s*$",          "", raw, flags=re.MULTILINE)
            raw = raw.strip()

            data = json.loads(raw)
            if not isinstance(data, list):
                raise ValueError("Expected a JSON array")

            cleaned: list[dict] = []
            for i, item in enumerate(data, start=1):
                if not all(k in item for k in ("title", "description")):
                    continue
                cleaned.append({
                    "id":                item.get("id", f"t{i}"),
                    "title":             str(item["title"])[:80],
                    "description":       str(item["description"])[:300],
                    "order":             int(item.get("order", i)),
                    "estimated_minutes": max(15, min(90, int(item.get("estimated_minutes", mins_per_topic)))),
                })

            if len(cleaned) < 3:
                raise ValueError(f"Too few topics ({len(cleaned)})")

            logger.info("StrategistAgent generated %d topics for '%s'", len(cleaned), skill)
            return cleaned

        except Exception as exc:
            logger.warning(
                "StrategistAgent AI call failed (%s). Using deterministic fallback.", exc
            )
            return _fallback_curriculum(skill, level, timeline_weeks)
