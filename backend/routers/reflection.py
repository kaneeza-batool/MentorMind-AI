import logging
from fastapi import APIRouter, HTTPException
from models.schemas import ReflectRequest, ReflectResponse
from agents.reflection_agent import ReflectionAgent
from tools import storage
from routers._validators import validate_session_id

logger = logging.getLogger(__name__)
router = APIRouter()
_agent = ReflectionAgent()


@router.post("/reflect", response_model=ReflectResponse)
async def reflect(body: ReflectRequest):
    validate_session_id(body.session_id)
    session = await storage.get_session(body.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    topic_id = body.topic_id or ""

    # Return cached reflection if already generated for this topic
    if topic_id and topic_id in session.reflections:
        cached = session.reflections[topic_id]
        return ReflectResponse(**cached)

    # Resolve topic title from curriculum
    topic_title = next(
        (t.title for t in session.curriculum if t.id == topic_id),
        "this topic",
    )

    # Topics already completed before this one (for context)
    previous = [
        t.title for t in session.curriculum
        if t.status == "completed" and t.id != topic_id
    ]

    quiz     = body.quiz_results
    score    = float(quiz.get("score",    70.0))
    correct  = int(quiz.get("correct",   0))
    total    = int(quiz.get("total",     5))
    weak     = list(quiz.get("weak_concepts", []))

    # Include adaptation context if curriculum was recently adapted
    adapted_context = ""
    if session.curriculum_versions:
        adapted_context = (
            f"Note: The remaining curriculum was recently adapted because of weak areas in: "
            f"{', '.join(session.weak_areas[:3])}."
        )

    reflection = await _agent.reflect(
        goal=session.goal,
        level=session.level,
        topic=topic_title,
        score=score,
        correct=correct,
        total=total,
        weak_concepts=weak,
        previous_topics=previous,
        adapted_context=adapted_context,
    )

    # Cache in session so repeat visits return the same reflection
    if topic_id:
        session.reflections[topic_id] = reflection
        await storage.update_session(session)

    return ReflectResponse(**reflection)
