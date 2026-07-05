from fastapi import APIRouter, HTTPException
from models.schemas import ProgressResponse
from tools import storage

router = APIRouter()


@router.get("/progress", response_model=ProgressResponse)
async def get_progress(session_id: str):
    session = storage.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    completed = [t.id for t in session.curriculum if t.status == "completed"]
    mastery = session.mastery
    overall = round(sum(mastery.values()) / len(session.curriculum), 1) if session.curriculum else 0.0

    return ProgressResponse(
        session_id=session_id,
        mastery=mastery,
        completed_topics=completed,
        weak_areas=session.weak_areas,
        overall_score=overall,
    )


@router.get("/progress/adapt")
async def adapt_path(session_id: str):
    session = storage.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    weak = session.weak_areas
    if not weak:
        return {
            "adapt": False,
            "reason": "Strong performance across all topics. No curriculum changes needed.",
            "suggestions": [],
        }

    return {
        "adapt": True,
        "reason": f"Weak areas detected in {len(weak)} concept(s). Recommending review before advancing.",
        "suggestions": [
            {"action": "review", "concept": area, "priority": "high"}
            for area in weak[:3]
        ],
    }
