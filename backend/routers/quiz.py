import logging
from fastapi import APIRouter, HTTPException
from models.schemas import (
    QuizGenerateRequest, QuizGenerateResponse, QuizQuestion,
    QuizSubmitRequest, QuizSubmitResponse, QuizResultItem,
    QuizFeedbackRequest, QuizFeedbackResponse,
)
from agents.coach_agent import CoachAgent
from tools import storage

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/quiz")

PASS_THRESHOLD = 70.0
_coach = CoachAgent()

# session_id → topic_id → list of full question dicts (id, question, options, answer int, explanation)
# Answers are never sent to the frontend — only used for server-side grading.
_quiz_cache: dict[str, dict[str, list[dict]]] = {}


@router.post("/generate", response_model=QuizGenerateResponse)
async def generate_quiz(body: QuizGenerateRequest):
    session = storage.get_session(body.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    topic = next((t for t in session.curriculum if t.id == body.topic_id), None)
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    from agents.examiner_agent import ExaminerAgent
    try:
        questions = await ExaminerAgent().generate_quiz(topic.title, session.level)
    except Exception as exc:
        logger.exception("Quiz generation failed for topic %s: %s", body.topic_id, exc)
        raise HTTPException(
            status_code=503,
            detail="Quiz generation temporarily unavailable. Please retry.",
        )

    # Cache full question data (including answers) server-side
    _quiz_cache.setdefault(body.session_id, {})[body.topic_id] = questions

    # Return questions only — no answer or explanation exposed before submission
    return QuizGenerateResponse(
        questions=[
            QuizQuestion(id=q["id"], question=q["question"], options=q["options"])
            for q in questions
        ]
    )


@router.post("/submit", response_model=QuizSubmitResponse)
async def submit_quiz(body: QuizSubmitRequest):
    session = storage.get_session(body.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    cached = _quiz_cache.get(body.session_id, {}).get(body.topic_id)
    if not cached:
        raise HTTPException(
            status_code=409,
            detail="No active quiz found for this topic. Generate a quiz first.",
        )

    answer_map = {q["id"]: q for q in cached}
    results: list[QuizResultItem] = []
    correct_count = 0
    weak_concepts: list[str] = []

    for submission in body.answers:
        q_data = answer_map.get(submission.question_id)
        if not q_data:
            continue
        correct_idx = int(q_data["answer"])
        is_correct = submission.answer == correct_idx
        if is_correct:
            correct_count += 1
        else:
            weak_concepts.append(submission.question_id)
        results.append(QuizResultItem(
            question_id=submission.question_id,
            correct=is_correct,
            chosen_index=submission.answer,
            correct_index=correct_idx,
            explanation=q_data["explanation"],
        ))

    total = len(body.answers)
    score = round((correct_count / total) * 100, 1) if total > 0 else 0.0

    # Delegate mastery computation to CoachAgent
    coach_result = _coach.analyze(
        topic_id=body.topic_id,
        score=score,
        correct=correct_count,
        total=total,
        weak_question_ids=weak_concepts,
        current_mastery=session.mastery.get(body.topic_id, 0.0),
        current_weak=session.weak_areas,
    )
    passed        = coach_result["passed"]
    mastery_delta = coach_result["mastery_delta"]

    session.mastery[body.topic_id] = coach_result["new_mastery"]
    session.weak_areas             = coach_result["weak_areas"]

    # When passed: mark topic completed and unlock the next one
    if passed:
        for i, t in enumerate(session.curriculum):
            if t.id == body.topic_id:
                t.status = "completed"
                t.mastery = min(100.0, score)
                if i + 1 < len(session.curriculum):
                    if session.curriculum[i + 1].status == "locked":
                        session.curriculum[i + 1].status = "active"
                break

    # Record quiz result in session history
    from models.state import QuizResult
    session.quiz_results.append(QuizResult(
        topic_id=body.topic_id,
        score=score,
        total=total,
        correct=correct_count,
        weak_concepts=weak_concepts,
    ))
    storage.update_session(session)

    return QuizSubmitResponse(
        score=score,
        total=total,
        correct=correct_count,
        passed=passed,
        results=results,
        mastery_delta=mastery_delta,
        weak_concepts=weak_concepts,
    )


@router.post("/feedback", response_model=QuizFeedbackResponse)
async def quiz_feedback(body: QuizFeedbackRequest):
    session = storage.get_session(body.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    topic_title = next(
        (t.title for t in session.curriculum if t.id == body.topic_id),
        body.topic_id,
    )

    from agents.examiner_agent import ExaminerAgent
    try:
        text = await ExaminerAgent().generate_feedback(
            topic=topic_title,
            level=session.level,
            score=body.score,
            correct=body.correct,
            total=body.total,
            wrong_questions=body.wrong_questions,
        )
        return QuizFeedbackResponse(feedback=text)
    except Exception as exc:
        logger.exception("Feedback generation failed: %s", exc)
        # Non-critical — return a static fallback so the UI doesn't hang
        pct = int(body.score)
        if pct >= 90:
            msg = "Excellent work! Your understanding of this topic is strong — you're ready to move on."
        elif pct >= PASS_THRESHOLD:
            msg = f"Good job passing with {pct}%. Review any questions you found tricky before continuing."
        else:
            msg = f"You scored {pct}%. Spend a few minutes reviewing the lesson, then try again."
        return QuizFeedbackResponse(feedback=msg)
