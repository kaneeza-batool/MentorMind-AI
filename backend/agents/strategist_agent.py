"""
Strategist Agent — generates and adapts a personalised learning curriculum.

Two public methods:
  plan()           — initial curriculum generation for a new session
  adapt_remaining() — regenerates only the locked (not-yet-started) topics
                     when CoachAgent signals the learner needs adaptation
"""
import json
import logging
import re

logger = logging.getLogger(__name__)

# In-process cache: { "skill::level" : list[dict] }
_CACHE: dict[str, list[dict]] = {}


def _fallback_curriculum(skill: str, level: str, timeline_weeks: int) -> list[dict]:
    """Deterministic 5-topic curriculum when AI is unavailable."""
    s     = skill.strip().title() if skill.strip() else "the Subject"
    pacing = max(20, min(60, timeline_weeks * 4))

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
        "Adapts remaining topics when CoachAgent signals low mastery."
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

        Returns a list of topic dicts: id, title, description, order, estimated_minutes.
        Cached per (skill, level). Falls back deterministically on AI failure.
        """
        cache_key = f"{skill.lower().strip()}::{level}"

        if cache_key in _CACHE:
            logger.info("StrategistAgent cache hit for '%s' (%s)", skill, level)
            return _CACHE[cache_key]

        logger.info(
            "StrategistAgent planning curriculum for '%s' (level=%s, weeks=%d)",
            skill, level, timeline_weeks,
        )

        topics = await self._generate(skill, goal, level, timeline_weeks, coach_signals or {})
        _CACHE[cache_key] = topics
        return topics

    async def adapt_remaining(
        self,
        session,          # LearningSession — avoids circular import
        weak_areas: list[str],
    ) -> bool:
        """
        Regenerate only the locked (not-yet-started) topics using weak-area signals.

        Completed and active topics are never modified. Topic IDs are preserved so
        frontend state stays consistent. Returns True if adaptation was applied.

        The curriculum_versions list on the session is updated with a snapshot
        before the change; the caller is responsible for persisting the session.
        """
        from datetime import datetime, timezone

        locked = [t for t in session.curriculum if t.status == "locked"]
        if not locked:
            logger.info("StrategistAgent.adapt_remaining: no locked topics — skipping")
            return False

        n_remaining = len(locked)
        coach_signals = {"weak_areas": weak_areas[:5]}

        logger.info(
            "StrategistAgent adapting %d remaining topics for '%s' (weak: %s)",
            n_remaining, session.skill, weak_areas[:3],
        )

        try:
            new_topics = await self._generate(
                skill=session.skill,
                goal=session.goal,
                level=session.level,
                timeline_weeks=max(2, n_remaining),
                coach_signals=coach_signals,
            )
        except Exception as exc:
            logger.warning("StrategistAgent adaptation generation failed: %s", exc)
            return False

        # Trim or extend to exactly n_remaining topics
        new_topics = new_topics[:n_remaining]
        if not new_topics:
            return False

        # Snapshot curriculum state before modifying
        snapshot = [
            {"id": t.id, "title": t.title, "status": t.status}
            for t in session.curriculum
        ]
        version_count = len(session.curriculum_versions) + 1
        session.curriculum_versions.append({
            "version":   version_count,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "reason":    f"low_mastery — weak areas: {', '.join(weak_areas[:3])}",
            "snapshot":  snapshot,
        })

        # Patch locked topics in-place (IDs preserved)
        for i, raw in enumerate(new_topics):
            if i >= len(locked):
                break
            locked[i].title             = raw["title"]
            locked[i].description       = raw["description"]
            locked[i].estimated_minutes = raw.get("estimated_minutes", 25)

        logger.info(
            "StrategistAgent adaptation v%d applied — %d topics updated",
            version_count, len(new_topics),
        )
        return True

    async def _generate(
        self,
        skill:          str,
        goal:           str,
        level:          str,
        timeline_weeks: int,
        coach_signals:  dict,
    ) -> list[dict]:
        from tools.gemini_client import generate

        n_topics       = 4 if timeline_weeks <= 2 else 5 if timeline_weeks <= 6 else 6
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
