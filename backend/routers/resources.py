"""
Resources router — serves AI-curated learning resources per topic.

Includes structural URL validation: resources with malformed or clearly
untrusted URLs are silently filtered before caching. Real HTTP checks
are only performed when VALIDATE_RESOURCE_URLS=true (off by default,
safe for CI).
"""
import asyncio
import logging
import re
from urllib.parse import urlparse

from fastapi import APIRouter, HTTPException
from models.schemas import ResourceSchema, ResourcesResponse
from agents.resource_agent import ResourceAgent
from tools import storage
from config import settings
from routers._validators import validate_session_id

logger = logging.getLogger(__name__)
router = APIRouter()
_agent = ResourceAgent()

# Domains that are known-good and never need HTTP validation
_TRUSTED_DOMAINS: frozenset[str] = frozenset({
    "youtube.com", "youtu.be",
    "github.com", "github.io", "githubusercontent.com",
    "developer.mozilla.org", "mdn.io",
    "freecodecamp.org",
    "exercism.org",
    "codewars.com",
    "leetcode.com",
    "hackerrank.com",
    "coursera.org",
    "edx.org",
    "udemy.com",
    "replit.com",
    "dev.to",
    "medium.com",
    "hashnode.com",
    "hashnode.dev",
    "devdocs.io",
    "docs.python.org",
    "nodejs.org",
    "react.dev",
    "reactjs.org",
    "vuejs.org",
    "angular.io",
    "typescriptlang.org",
    "rust-lang.org",
    "go.dev",
    "kotlinlang.org",
    "swift.org",
    "learn.microsoft.com",
    "docs.microsoft.com",
    "cloud.google.com",
    "aws.amazon.com",
    "docs.aws.amazon.com",
    "docs.docker.com",
    "docker.com",
    "postgresql.org",
    "mongodb.com",
    "redis.io",
    "elastic.co",
    "vercel.com",
    "netlify.com",
    "digitalocean.com",
    "stackoverflow.com",
    "geeksforgeeks.org",
    "w3schools.com",
    "kaggle.com",
    "huggingface.co",
    "pytorch.org",
    "tensorflow.org",
    "scikit-learn.org",
    "numpy.org",
    "pandas.pydata.org",
    "fastapi.tiangolo.com",
    "flask.palletsprojects.com",
    "djangoproject.com",
    "sqlalchemy.org",
    "pydantic.dev",
})


def _is_valid_url(url: str) -> bool:
    """
    Structural URL validation — no HTTP requests.

    Accepts HTTPS URLs with a real domain. Trusted domains are always accepted;
    unknown domains are accepted if they have a plausible structure.
    """
    try:
        parsed = urlparse(url)
        if parsed.scheme != "https":
            return False
        host = parsed.netloc.lower()
        if not host:
            return False
        # Strip port if present
        host = host.split(":")[0]
        # Strip leading www.
        bare = host.removeprefix("www.")
        # Check trusted list (exact match or subdomain)
        for trusted in _TRUSTED_DOMAINS:
            if bare == trusted or bare.endswith(f".{trusted}"):
                return True
        # Unknown domain — accept if structurally valid and has a path
        if not re.match(r"^[a-z0-9]([a-z0-9\-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9\-]*[a-z0-9])?)+$", bare):
            return False
        # Require at least a non-trivial path or query for unknown domains
        return bool(parsed.path and parsed.path != "/")
    except Exception:
        return False


async def _live_check_url(url: str) -> bool:
    """
    Optional live HTTP HEAD check. Only runs when VALIDATE_RESOURCE_URLS=true.
    Returns True on any connection error (benefit of the doubt).
    """
    import httpx
    try:
        async with httpx.AsyncClient(
            timeout=settings.URL_VALIDATE_TIMEOUT,
            follow_redirects=True,
        ) as client:
            r = await client.head(url)
            return r.status_code < 400
    except Exception:
        return True  # Network error ≠ broken URL — don't discard


async def _validate_resources(resources: list[dict]) -> list[dict]:
    """
    Filter resources with invalid URLs.

    1. Structural check (always) — removes malformed / non-HTTPS URLs.
    2. Live HTTP check (opt-in) — removes confirmed 4xx/5xx URLs.

    If fewer than 3 resources survive, the original list is returned to
    guarantee the learner always sees content.
    """
    # Stage 1: structural validation
    structurally_valid = [r for r in resources if _is_valid_url(r.get("url", ""))]

    if not structurally_valid:
        logger.warning("All resources failed structural URL validation — keeping originals")
        return resources

    # Stage 2: optional live check
    if settings.VALIDATE_RESOURCE_URLS:
        checks = await asyncio.gather(
            *[_live_check_url(r["url"]) for r in structurally_valid]
        )
        live_valid = [r for r, ok in zip(structurally_valid, checks) if ok]
        if len(live_valid) >= 3:
            return live_valid
        logger.warning(
            "Too many resources failed live URL check (%d/%d) — using structurally valid set",
            len(structurally_valid) - len(live_valid),
            len(structurally_valid),
        )

    return structurally_valid if len(structurally_valid) >= 3 else resources


@router.get("/resources/{topic}", response_model=ResourcesResponse)
async def get_resources(topic: str, session_id: str):
    """
    Return personalized, validated resources for a topic.

    Resources are generated by the ResourceAgent using the learner's level, goal,
    and weak areas, then validated and cached at both the agent level (in-process)
    and the session level (SQLite-persisted).
    """
    validate_session_id(session_id)
    session = await storage.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    topic_obj = next(
        (t for t in session.curriculum if t.id == topic or t.title.lower() == topic.lower()),
        None,
    )
    topic_id    = topic_obj.id    if topic_obj else topic
    topic_label = topic_obj.title if topic_obj else topic

    # Return session-cached resources if available
    if topic_id in session.resources and session.resources[topic_id]:
        logger.info("Resources session-cache hit for topic '%s'", topic_id)
        raw_list = session.resources[topic_id]
        return ResourcesResponse(
            topic=topic_label,
            resources=[ResourceSchema(**r) for r in raw_list],
        )

    # Collect weak areas from quiz history and reflections
    quiz_weaknesses: list[str] = []
    for qr in session.quiz_results:
        if qr.topic_id == topic_id:
            quiz_weaknesses.extend(qr.weak_concepts)

    reflection_weaknesses: list[str] = []
    if topic_id in session.reflections:
        reflection_weaknesses = session.reflections[topic_id].get("weaknesses", [])

    raw_list = await _agent.recommend(
        topic=topic_label,
        level=session.level,
        goal=session.goal,
        quiz_weaknesses=quiz_weaknesses,
        reflection_weaknesses=reflection_weaknesses,
        topic_id=topic_id,
    )

    # Validate URLs before caching
    raw_list = await _validate_resources(raw_list)

    # Persist validated resources in session (SQLite)
    session.resources[topic_id] = raw_list
    await storage.update_session(session)

    resources = [
        ResourceSchema(
            title=r["title"],
            url=r["url"],
            type=r["type"],
            source=r["source"],
            why=r["why"],
            duration=r.get("duration"),
            difficulty=r.get("difficulty"),
            category=r.get("category"),
        )
        for r in raw_list
    ]

    return ResourcesResponse(topic=topic_label, resources=resources)
