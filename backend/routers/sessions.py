import logging
from fastapi import APIRouter, HTTPException
from models.schemas import CreateSessionRequest, SessionResponse, TopicSchema
from models.state import Topic
from agents.strategist_agent import StrategistAgent
from tools import storage

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/sessions")

_strategist = StrategistAgent()


@router.post("", response_model=SessionResponse, status_code=201)
async def create_session(body: CreateSessionRequest):
    """
    Create a new learning session.

    The StrategistAgent generates a personalised curriculum via Groq AI.
    Falls back to deterministic topics if the AI call fails — the learner
    is never blocked by an AI outage.
    """
    session = storage.create_session(
        skill=body.skill,
        goal=body.goal,
        level=body.level,
    )

    logger.info(
        "Session %s created — skill='%s', level='%s', weeks=%s",
        session.id, body.skill, body.level, body.timeline_weeks,
    )

    # plan() handles all AI failures internally and always returns a valid list
    raw_topics = await _strategist.plan(
        skill=body.skill,
        goal=body.goal,
        level=body.level,
        timeline_weeks=body.timeline_weeks or 4,
    )

    topics_schema = [
        TopicSchema(
            id=t["id"],
            title=t["title"],
            description=t["description"],
            order=t["order"],
            estimated_minutes=t["estimated_minutes"],
        )
        for t in raw_topics
    ]

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
        "skill":      session.skill,
        "goal":       session.goal,
        "level":      session.level,
        "curriculum": [
            {
                "id":                t.id,
                "title":             t.title,
                "description":       t.description,
                "order":             t.order,
                "estimated_minutes": t.estimated_minutes,
                "status":            t.status,
                "mastery":           t.mastery,
            }
            for t in session.curriculum
        ],
        "mastery":    session.mastery,
        "weak_areas": session.weak_areas,
    }
