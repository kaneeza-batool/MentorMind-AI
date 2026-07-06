from fastapi import APIRouter, HTTPException
from models.schemas import ProgressResponse, DashboardResponse, TopicMasteryItem
from tools import storage

router = APIRouter()


@router.get("/progress", response_model=ProgressResponse)
async def get_progress(session_id: str):
    session = storage.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    completed = [t.id for t in session.curriculum if t.status == "completed"]
    mastery   = session.mastery
    overall   = round(sum(mastery.values()) / len(session.curriculum), 1) if session.curriculum else 0.0

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


@router.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard(session_id: str):
    session = storage.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    curriculum = session.curriculum
    total      = len(curriculum)

    completed_topics = [t for t in curriculum if t.status == "completed"]
    completed_count  = len(completed_topics)
    active_topic     = next((t for t in curriculum if t.status == "active"), None)

    overall_progress = round(completed_count / total * 100, 1) if total > 0 else 0.0

    # Average score: latest quiz result per topic
    scores = [qr.score for qr in session.quiz_results]
    avg_score = round(sum(scores) / len(scores), 1) if scores else 0.0

    # Streak: consecutive completed topics from the beginning
    streak = 0
    for t in curriculum:
        if t.status == "completed":
            streak += 1
        else:
            break

    curriculum_complete = (completed_count == total and total > 0)

    remaining = total - completed_count
    if curriculum_complete:
        completion_estimate = "Curriculum complete!"
    elif remaining == 1:
        completion_estimate = "1 topic remaining"
    else:
        completion_estimate = f"{remaining} topics remaining"

    # Mastery breakdown per topic
    mastery_items = []
    for t in curriculum:
        score      = session.mastery.get(t.id, 0.0)
        reflection = session.reflections.get(t.id, {})
        confidence = int(reflection.get("confidence", 0)) if t.status == "completed" else 0
        mastery_items.append(TopicMasteryItem(
            topic_id=t.id,
            title=t.title,
            score=score,
            confidence=confidence,
            completed=(t.status == "completed"),
        ))

    return DashboardResponse(
        session_id=session_id,
        skill=session.skill,
        goal=session.goal,
        level=session.level,
        overall_progress=overall_progress,
        current_topic=active_topic.title if active_topic else None,
        topics_completed=completed_count,
        total_topics=total,
        average_score=avg_score,
        completion_estimate=completion_estimate,
        streak=streak,
        curriculum_complete=curriculum_complete,
        mastery_by_topic=mastery_items,
    )
