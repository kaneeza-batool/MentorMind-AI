import logging
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from models.schemas import (
    ProgressResponse, DashboardResponse, TopicMasteryItem,
    AnalyticsResponse, TopicScorePoint,
)
from tools import storage
from routers._validators import validate_session_id

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/progress", response_model=ProgressResponse)
async def get_progress(session_id: str):
    validate_session_id(session_id)
    session = await storage.get_session(session_id)
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
    validate_session_id(session_id)
    session = await storage.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    weak = session.weak_areas
    if not weak:
        return {
            "adapt": False,
            "reason": "Strong performance across all topics. No curriculum changes needed.",
            "suggestions": [],
            "curriculum_versions": len(session.curriculum_versions),
        }

    return {
        "adapt": True,
        "reason": f"Weak areas detected in {len(weak)} concept(s). Recommending review before advancing.",
        "suggestions": [
            {"action": "review", "concept": area, "priority": "high"}
            for area in weak[:3]
        ],
        "curriculum_versions": len(session.curriculum_versions),
    }


@router.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard(session_id: str):
    validate_session_id(session_id)
    session = await storage.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    curriculum = session.curriculum
    total      = len(curriculum)

    completed_topics = [t for t in curriculum if t.status == "completed"]
    completed_count  = len(completed_topics)
    active_topic     = next((t for t in curriculum if t.status == "active"), None)

    overall_progress = round(completed_count / total * 100, 1) if total > 0 else 0.0

    scores    = [qr.score for qr in session.quiz_results]
    avg_score = round(sum(scores) / len(scores), 1) if scores else 0.0

    mastery_vals    = [session.mastery.get(t.id, 0.0) for t in curriculum]
    overall_mastery = round(sum(mastery_vals) / len(mastery_vals), 1) if mastery_vals else 0.0

    streak = 0
    for t in curriculum:
        if t.status == "completed":
            streak += 1
        else:
            break

    curriculum_complete = (completed_count == total and total > 0)
    remaining           = total - completed_count

    if curriculum_complete:
        completion_estimate = "Curriculum complete!"
    elif remaining == 1:
        completion_estimate = "1 topic remaining"
    else:
        completion_estimate = f"{remaining} topics remaining"

    try:
        created  = datetime.fromisoformat(session.created_at.replace("Z", "+00:00"))
        now      = datetime.now(timezone.utc)
        days     = max(1.0, (now - created).total_seconds() / 86400)
        velocity = round(completed_count / days, 2)
    except Exception:
        velocity = 0.0

    total_study_seconds = sum(session.study_time.values())

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
        topics_remaining=remaining,
        total_topics=total,
        average_score=avg_score,
        overall_mastery=overall_mastery,
        completion_estimate=completion_estimate,
        streak=streak,
        learning_velocity=velocity,
        curriculum_complete=curriculum_complete,
        mastery_by_topic=mastery_items,
        total_study_minutes=round(total_study_seconds / 60),
        curriculum_adaptations=len(session.curriculum_versions),
    )


@router.get("/analytics", response_model=AnalyticsResponse)
async def get_analytics(session_id: str):
    """Detailed learning analytics for Mission Control."""
    validate_session_id(session_id)
    session = await storage.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    curriculum = session.curriculum
    completed  = [t for t in curriculum if t.status == "completed"]

    # Quiz score trend (chronological)
    score_trend = [
        TopicScorePoint(
            topic_id=qr.topic_id,
            title=next((t.title for t in curriculum if t.id == qr.topic_id), qr.topic_id),
            score=qr.score,
            taken_at=qr.taken_at,
        )
        for qr in session.quiz_results
    ]

    # Strongest and weakest topic
    completed_mastery = [
        (t.id, t.title, session.mastery.get(t.id, 0.0))
        for t in completed
    ]
    strongest_topic = None
    weakest_topic   = None
    if completed_mastery:
        best  = max(completed_mastery, key=lambda x: x[2])
        worst = min(completed_mastery, key=lambda x: x[2])
        strongest_topic = {"topic_id": best[0],  "title": best[1],  "mastery": best[2]}
        weakest_topic   = {"topic_id": worst[0], "title": worst[1], "mastery": worst[2]}

    # Study time
    study_time_by_topic = {
        t.id: {
            "title":   t.title,
            "minutes": round(session.study_time.get(t.id, 0) / 60, 1),
        }
        for t in curriculum
    }
    total_study_minutes = round(sum(session.study_time.values()) / 60, 1)

    # Completion forecast
    try:
        created  = datetime.fromisoformat(session.created_at.replace("Z", "+00:00"))
        now      = datetime.now(timezone.utc)
        days     = max(1.0, (now - created).total_seconds() / 86400)
        n_done   = len(completed)
        n_remain = len(curriculum) - n_done
        velocity = n_done / days if n_done > 0 else 0.0
        forecast_days = round(n_remain / velocity) if velocity > 0 else None
    except Exception:
        forecast_days = None

    # Overall mastery trend (computed per quiz result in order)
    mastery_snapshot: dict[str, float] = {}
    mastery_trend = []
    for qr in session.quiz_results:
        mastery_snapshot[qr.topic_id] = min(
            100.0,
            mastery_snapshot.get(qr.topic_id, 0.0) + round(qr.score * 0.4, 1)
        )
        overall = (
            round(sum(mastery_snapshot.values()) / len(curriculum), 1)
            if curriculum else 0.0
        )
        mastery_trend.append({"taken_at": qr.taken_at, "overall_mastery": overall})

    return AnalyticsResponse(
        session_id=session_id,
        score_trend=score_trend,
        mastery_trend=mastery_trend,
        strongest_topic=strongest_topic,
        weakest_topic=weakest_topic,
        study_time_by_topic=study_time_by_topic,
        total_study_minutes=total_study_minutes,
        quizzes_taken=len(session.quiz_results),
        topics_completed=len(completed),
        topics_remaining=len(curriculum) - len(completed),
        completion_forecast_days=forecast_days,
        curriculum_adaptations=len(session.curriculum_versions),
        weak_areas=session.weak_areas,
    )
