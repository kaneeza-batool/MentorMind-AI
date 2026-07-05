from fastapi import APIRouter, HTTPException
from models.schemas import ReflectRequest, ReflectResponse
from tools import storage

router = APIRouter()


@router.post("/reflect", response_model=ReflectResponse)
async def reflect(body: ReflectRequest):
    session = storage.get_session(body.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    quiz = body.quiz_results
    score = quiz.get("score", 70.0)
    correct = quiz.get("correct", 2)
    total = quiz.get("total", 3)
    weak = quiz.get("weak_concepts", [])

    if score >= 80:
        narrative = (
            f"Excellent work! You answered {correct} out of {total} correctly, "
            f"scoring {score}%. You've demonstrated strong command of the material. "
            f"Your understanding of the core concepts is solid — keep this momentum going."
        )
        strengths = ["Strong conceptual grasp", "Consistent accuracy", "Ready to advance"]
        next_step = "Move on to the next topic and continue building on this foundation."
    elif score >= 60:
        narrative = (
            f"Good progress! You scored {score}% ({correct}/{total}). "
            f"You've got the essentials down, but there are a couple of areas "
            f"where a bit more practice will make a big difference."
        )
        strengths = ["Solid foundational understanding", "Grasping key patterns"]
        next_step = "Review the highlighted weak areas, then advance when you feel confident."
    else:
        narrative = (
            f"You scored {score}% ({correct}/{total}). This topic has some tricky parts — "
            f"that's completely normal. The key is to revisit the lesson with fresh eyes "
            f"and focus on the areas where you're less certain."
        )
        strengths = ["Persistence and effort", "Willingness to tackle difficult material"]
        next_step = "Re-read the lesson, focusing on the weak areas below, then retake the quiz."

    weak_area_labels = weak if weak else (["No specific weak areas identified"] if score >= 80 else ["Core concept application", "Best practice selection"])

    return ReflectResponse(
        narrative=narrative,
        strengths=strengths,
        weak_areas=weak_area_labels,
        next_step=next_step,
    )
