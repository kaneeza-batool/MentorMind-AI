"""
Resource Agent — generates personalized, categorized learning resources via Groq AI.

Accepts topic, level, goal, quiz weaknesses, and reflection weaknesses.
Returns resources in four categories: Videos, Articles, Practice, Projects.
Results are cached per topic_id to avoid redundant AI calls.
Falls back to deterministic, domain-correct resources on any failure.
"""
import json
import logging
import re

logger = logging.getLogger(__name__)

# In-process cache: { cache_key: list[dict] }
_CACHE: dict[str, list[dict]] = {}


def _fallback_resources(topic: str, level: str) -> list[dict]:
    """Deterministic resources using real, well-known learning platforms."""
    slug = topic.lower().replace(" ", "-").replace("/", "-")
    q    = topic.lower().replace(" ", "+")
    return [
        # ── Videos ─────────────────────────────────────────────────────────
        {
            "title":      f"{topic} Full Course — {level.title()} Edition",
            "url":        f"https://www.youtube.com/results?search_query={q}+{level}+tutorial",
            "type":       "video",
            "source":     "YouTube",
            "why":        f"Comprehensive video walkthrough of {topic} pitched at {level} level. Ideal for visual learners who want to see concepts demonstrated step-by-step.",
            "duration":   "45–90 min",
            "difficulty": level,
            "category":   "video",
        },
        {
            "title":      f"{topic} Explained — Free In-Depth Tutorial",
            "url":        f"https://www.freecodecamp.org/news/search/?query={slug}",
            "type":       "video",
            "source":     "freeCodeCamp",
            "why":        "freeCodeCamp produces consistently high-quality, project-driven tutorials that combine theory with practical exercises.",
            "duration":   "30–60 min",
            "difficulty": "beginner" if level == "beginner" else "intermediate",
            "category":   "video",
        },
        # ── Articles / Docs ─────────────────────────────────────────────────
        {
            "title":      f"{topic} — Official Reference",
            "url":        f"https://devdocs.io/#q={slug}",
            "type":       "docs",
            "source":     "DevDocs",
            "why":        "Aggregates official documentation for hundreds of technologies in one searchable interface. Essential for exact syntax and edge-case behavior.",
            "duration":   None,
            "difficulty": level,
            "category":   "article",
        },
        {
            "title":      f"Understanding {topic}: Practitioner Deep Dive",
            "url":        f"https://dev.to/search?q={slug}",
            "type":       "article",
            "source":     "DEV Community",
            "why":        "Practitioner-written articles with real-world context, code examples, and active discussion threads — great for filling conceptual gaps.",
            "duration":   "10–15 min read",
            "difficulty": "intermediate",
            "category":   "article",
        },
        # ── Practice ────────────────────────────────────────────────────────
        {
            "title":      f"{topic} Exercises with Mentor Feedback",
            "url":        f"https://exercism.org/tracks?q={slug}",
            "type":       "course",
            "source":     "Exercism",
            "why":        "Mentor-reviewed coding exercises with immediate feedback. The fastest path to building genuine muscle memory for this topic.",
            "duration":   "Self-paced",
            "difficulty": level,
            "category":   "practice",
        },
        {
            "title":      f"{topic} Kata Challenges",
            "url":        f"https://www.codewars.com/kata/search/?q={slug}",
            "type":       "course",
            "source":     "Codewars",
            "why":        "Progressively ranked challenges that surface the edge cases and nuances that tutorials rarely cover.",
            "duration":   "Self-paced",
            "difficulty": "intermediate",
            "category":   "practice",
        },
        # ── Project ─────────────────────────────────────────────────────────
        {
            "title":      f"Real-World {topic} Projects on GitHub",
            "url":        f"https://github.com/topics/{slug}",
            "type":       "repo",
            "source":     "GitHub",
            "why":        "Browse open-source codebases using this technology. Reading production-grade code accelerates comprehension beyond any tutorial or exercise.",
            "duration":   "Project-based",
            "difficulty": level,
            "category":   "project",
        },
    ]


class ResourceAgent:
    NAME = "resource"
    DESCRIPTION = (
        "Recommends personalized, categorized learning resources matched to "
        "the learner's topic, level, goal, and identified weaknesses. "
        "Outputs resources across Videos, Articles, Practice, and Projects."
    )

    @property
    def config(self) -> dict:
        return {
            "name":        self.NAME,
            "description": self.DESCRIPTION,
            "model":       "llama-3.3-70b-versatile",
            "status":      "active",
        }

    async def recommend(
        self,
        topic:                 str,
        level:                 str,
        goal:                  str,
        quiz_weaknesses:       list[str] | None = None,
        reflection_weaknesses: list[str] | None = None,
        topic_id:              str | None = None,
    ) -> list[dict]:
        """
        Generate and cache personalized resources for a topic.

        Returns 6-8 resources in four categories.
        Results are cached per topic_id; subsequent calls return instantly.
        Falls back to deterministic resources on AI failure.
        """
        cache_key = topic_id or topic.lower().strip()

        if cache_key in _CACHE:
            logger.info("ResourceAgent cache hit for '%s'", cache_key)
            return _CACHE[cache_key]

        logger.info("ResourceAgent generating resources for '%s' (level=%s)", topic, level)
        result = await self._generate(
            topic=topic,
            level=level,
            goal=goal,
            quiz_weaknesses=quiz_weaknesses or [],
            reflection_weaknesses=reflection_weaknesses or [],
        )
        _CACHE[cache_key] = result
        return result

    async def _generate(
        self,
        topic:                 str,
        level:                 str,
        goal:                  str,
        quiz_weaknesses:       list[str],
        reflection_weaknesses: list[str],
    ) -> list[dict]:
        from tools.gemini_client import generate

        all_weaknesses = list(dict.fromkeys(quiz_weaknesses + reflection_weaknesses))[:5]
        weakness_ctx = (
            f"The learner specifically struggled with: {', '.join(all_weaknesses)}. "
            "Prioritize resources that address these gaps."
            if all_weaknesses
            else "No weak areas detected — learner is performing well."
        )

        system = (
            "You are an expert learning resource curator. "
            "You select the highest-quality free online resources for a specific learner. "
            "Every resource must exist on a real, reputable website. "
            "Respond with valid JSON only — no markdown fences, no preamble."
        )

        prompt = (
            f"Curate exactly 7 personalized learning resources for this learner:\n\n"
            f"Topic: {topic}\n"
            f"Learner Level: {level}\n"
            f"Learning Goal: {goal}\n"
            f"{weakness_ctx}\n\n"
            "Distribution:\n"
            "- 2 videos (YouTube, freeCodeCamp, Coursera, edX)\n"
            "- 2 articles or docs (MDN, official docs, DEV.to, Medium, Hashnode)\n"
            "- 2 practice resources (Exercism, Codewars, LeetCode, HackerRank, Replit)\n"
            "- 1 project / GitHub repo\n\n"
            "Each resource must be a JSON object with exactly these keys:\n"
            '{"title":"...","url":"https://...","type":"video|article|docs|course|repo",'
            '"source":"Platform name","why":"1-2 sentences tailored to this learner",'
            '"duration":"time string or null","difficulty":"beginner|intermediate|advanced",'
            '"category":"video|article|practice|project"}\n\n'
            "Rules:\n"
            f"- Match difficulty to the learner level ({level})\n"
            "- The 'why' must reference the learner's weak areas or goal when relevant\n"
            "- Use REAL websites with real URL patterns\n"
            "- Prefer free resources\n"
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
            for item in data:
                if not all(k in item for k in ("title", "url", "type", "source", "why")):
                    continue
                cleaned.append({
                    "title":      str(item["title"]),
                    "url":        str(item["url"]),
                    "type":       str(item.get("type", "article")),
                    "source":     str(item["source"]),
                    "why":        str(item["why"]),
                    "duration":   item.get("duration"),
                    "difficulty": str(item.get("difficulty", level)),
                    "category":   str(item.get("category", "article")),
                })

            if len(cleaned) < 3:
                raise ValueError(f"Too few valid resources ({len(cleaned)})")

            logger.info("ResourceAgent returned %d resources for '%s'", len(cleaned), topic)
            return cleaned

        except Exception as exc:
            logger.warning(
                "ResourceAgent AI call failed (%s). Using deterministic fallback.", exc
            )
            return _fallback_resources(topic, level)
