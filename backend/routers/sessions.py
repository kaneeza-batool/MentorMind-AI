import uuid
from fastapi import APIRouter, HTTPException
from models.schemas import CreateSessionRequest, SessionResponse, TopicSchema
from models.state import LearningSession, Topic
from tools import storage

router = APIRouter(prefix="/sessions")


def _mock_curriculum(skill: str) -> list[TopicSchema]:
    s = skill.strip().title() if skill.strip() else "the subject"
    return [
        TopicSchema(id="t1", title=f"Getting Started with {s}",
                    description=f"Environment setup, core syntax, and your first {s} program.",
                    order=1, estimated_minutes=20),
        TopicSchema(id="t2", title=f"Core {s} Concepts",
                    description="Fundamental building blocks: data types, control flow, and functions.",
                    order=2, estimated_minutes=30),
        TopicSchema(id="t3", title=f"Working with Data",
                    description=f"Collections, I/O, and common data-processing patterns in {s}.",
                    order=3, estimated_minutes=35),
        TopicSchema(id="t4", title=f"Advanced {s} Patterns",
                    description="OOP, error handling, testing, and design principles.",
                    order=4, estimated_minutes=40),
        TopicSchema(id="t5", title="Capstone Project",
                    description=f"Apply everything by building a real {s} project end-to-end.",
                    order=5, estimated_minutes=45),
    ]


@router.post("", response_model=SessionResponse, status_code=201)
async def create_session(body: CreateSessionRequest):
    session = storage.create_session(
        skill=body.skill,
        goal=body.goal,
        level=body.level,
    )
    topics_schema = _mock_curriculum(body.skill)
    # Persist curriculum in the session store
    session.curriculum = [
        Topic(
            id=t.id,
            title=t.title,
            description=t.description,
            order=t.order,
            estimated_minutes=t.estimated_minutes,
            status="active" if t.order == 1 else "locked",
        )
        for t in topics_schema
    ]
    storage.update_session(session)
    return SessionResponse(session_id=session.id, curriculum=topics_schema)


@router.get("/{session_id}")
async def get_session(session_id: str):
    session = storage.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {
        "session_id": session.id,
        "skill": session.skill,
        "goal": session.goal,
        "level": session.level,
        "curriculum": [
            {
                "id": t.id,
                "title": t.title,
                "description": t.description,
                "order": t.order,
                "estimated_minutes": t.estimated_minutes,
                "status": t.status,
                "mastery": t.mastery,
            }
            for t in session.curriculum
        ],
        "mastery": session.mastery,
        "weak_areas": session.weak_areas,
    }
