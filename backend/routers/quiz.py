from fastapi import APIRouter, HTTPException
from models.schemas import (
    QuizGenerateRequest, QuizGenerateResponse,
    QuizSubmitRequest, QuizSubmitResponse,
    QuestionSchema, QuizResultItem,
)
from tools import storage

router = APIRouter(prefix="/quiz")

# In-memory quiz cache: session_id → { topic_id → correct_answers dict }
_quiz_cache: dict[str, dict[str, dict[str, str]]] = {}

MOCK_QUESTIONS = [
    QuestionSchema(
        id="q1",
        text="Which of the following best describes the primary purpose of this concept?",
        options=[
            "A. To optimize memory allocation at runtime",
            "B. To enable code reuse and logical organization",
            "C. To handle network I/O asynchronously",
            "D. To improve database query performance",
        ],
        type="multiple_choice",
    ),
    QuestionSchema(
        id="q2",
        text="What is the most important principle to follow when applying this pattern?",
        options=[
            "A. Maximize execution speed above all else",
            "B. Always use global mutable state",
            "C. Separate concerns and keep modules focused",
            "D. Minimize the number of functions",
        ],
        type="multiple_choice",
    ),
    QuestionSchema(
        id="q3",
        text="Which approach most closely follows established best practices?",
        options=[
            "A. Deep nesting with many side effects",
            "B. Tight coupling between unrelated modules",
            "C. Pure functions with a single, clear responsibility",
            "D. Duplicating logic across multiple files for flexibility",
        ],
        type="multiple_choice",
    ),
]

CORRECT_ANSWERS: dict[str, str] = {
    "q1": "B. To enable code reuse and logical organization",
    "q2": "C. Separate concerns and keep modules focused",
    "q3": "C. Pure functions with a single, clear responsibility",
}

EXPLANATIONS: dict[str, str] = {
    "q1": "Code reuse and logical organization are the primary goals of this concept. By grouping related functionality, you reduce duplication and make the codebase easier to reason about.",
    "q2": "Separation of concerns ensures each module has one reason to change. This makes systems more maintainable, testable, and scalable over time.",
    "q3": "Pure functions with single responsibility are easier to test, debug, and compose. They minimize unexpected side effects and make intent clear to any reader.",
}


@router.post("/generate", response_model=QuizGenerateResponse)
async def generate_quiz(body: QuizGenerateRequest):
    session = storage.get_session(body.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Cache correct answers for grading
    _quiz_cache.setdefault(body.session_id, {})[body.topic_id] = CORRECT_ANSWERS
    return QuizGenerateResponse(questions=MOCK_QUESTIONS)


@router.post("/submit", response_model=QuizSubmitResponse)
async def submit_quiz(body: QuizSubmitRequest):
    session = storage.get_session(body.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    correct_answers = (
        _quiz_cache.get(body.session_id, {}).get(body.topic_id, CORRECT_ANSWERS)
    )

    results: list[QuizResultItem] = []
    correct_count = 0
    for submission in body.answers:
        expected = correct_answers.get(submission.question_id, "")
        is_correct = submission.answer.strip() == expected.strip()
        if is_correct:
            correct_count += 1
        results.append(
            QuizResultItem(
                question_id=submission.question_id,
                correct=is_correct,
                correct_answer=expected,
                explanation=EXPLANATIONS.get(
                    submission.question_id,
                    "Review the lesson material for more context on this concept.",
                ),
            )
        )

    total = len(body.answers)
    score = round((correct_count / total) * 100, 1) if total > 0 else 0.0
    mastery_delta = round(score * 0.4, 1)  # 40% weight toward topic mastery

    # Update mastery in session
    session.mastery[body.topic_id] = min(100.0, session.mastery.get(body.topic_id, 0) + mastery_delta)
    weak_areas = [r.question_id for r in results if not r.correct]
    if weak_areas:
        session.weak_areas = list(set(session.weak_areas + weak_areas))
    storage.update_session(session)

    return QuizSubmitResponse(
        score=score,
        total=total,
        correct=correct_count,
        results=results,
        mastery_delta=mastery_delta,
        weak_concepts=weak_areas,
    )
