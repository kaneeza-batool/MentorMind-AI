from fastapi import APIRouter, HTTPException
from models.schemas import ResourceSchema, ResourcesResponse
from tools import storage

router = APIRouter()

MOCK_RESOURCES: list[dict] = [
    {
        "title": "Official Documentation",
        "url": "https://docs.example.com",
        "type": "docs",
        "source": "Official Docs",
        "why": "The authoritative reference. Best for understanding exact behavior and edge cases.",
        "duration": None,
    },
    {
        "title": "Crash Course: Core Concepts Explained",
        "url": "https://youtube.com",
        "type": "video",
        "source": "YouTube",
        "why": "Visual walkthrough of the key ideas covered in this lesson. Great for reinforcement.",
        "duration": "22 min",
    },
    {
        "title": "Interactive Exercises & Practice Problems",
        "url": "https://exercism.org",
        "type": "course",
        "source": "Exercism",
        "why": "Hands-on practice with immediate feedback. The fastest way to build muscle memory.",
        "duration": "Self-paced",
    },
    {
        "title": "Deep Dive Article: Behind the Scenes",
        "url": "https://medium.com",
        "type": "article",
        "source": "Medium",
        "why": "Explains the internals with clear diagrams. Valuable for understanding *why*, not just *how*.",
        "duration": "12 min read",
    },
]


@router.get("/resources/{topic}", response_model=ResourcesResponse)
async def get_resources(topic: str, session_id: str):
    session = storage.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    topic_obj = next(
        (t for t in session.curriculum if t.id == topic or t.title.lower() == topic.lower()),
        None,
    )
    topic_label = topic_obj.title if topic_obj else topic

    resources = [
        ResourceSchema(
            title=r["title"],
            url=r["url"],
            type=r["type"],
            source=r["source"],
            why=r["why"],
            duration=r.get("duration"),
        )
        for r in MOCK_RESOURCES
    ]

    return ResourcesResponse(topic=topic_label, resources=resources)
