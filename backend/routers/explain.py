from fastapi import APIRouter
from models.schemas import ExplainRequest, ExplainResponse

router = APIRouter(prefix="/quiz")

MOCK_EXPLANATION = (
    "**Why {correct} is correct:**\n\n"
    "This answer reflects the core principle at work here. "
    "{correct} directly addresses the underlying concept by ensuring "
    "that the design remains maintainable and the intent stays clear.\n\n"
    "**Why {chosen} is incorrect:**\n\n"
    "While {chosen} might seem plausible at first glance, it misses the key "
    "trade-off: prioritizing short-term convenience over long-term clarity. "
    "In practice, this leads to code that is harder to test, debug, and extend.\n\n"
    "**Key takeaway:**\n\n"
    "Always ask: *does this choice make the system easier or harder to reason about?* "
    "The correct answer consistently reduces cognitive load for the next engineer."
)


@router.post("/explain", response_model=ExplainResponse)
async def explain_answer(body: ExplainRequest):
    if body.chosen_answer.strip() == body.correct_answer.strip():
        explanation = (
            f"**Correct! Here's why:**\n\n"
            f"{body.correct_answer} is right because it directly embodies the core "
            f"principle of **{body.topic}**: prioritizing clarity, reusability, and "
            f"separation of concerns. When you internalize this, the right answer "
            f"becomes intuitive."
        )
    else:
        explanation = MOCK_EXPLANATION.format(
            correct=body.correct_answer,
            chosen=body.chosen_answer,
        )
    return ExplainResponse(explanation=explanation)
