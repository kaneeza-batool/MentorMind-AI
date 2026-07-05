"""
Explain tool — powers the "Why?" button for every quiz answer.

Called directly by the /quiz/explain endpoint; also exposed as an
ADK tool for the Examiner Agent. Implemented in M4.
"""


async def explain_answer(question: str, chosen: str, correct: str, topic: str) -> str:
    """
    Return a clear explanation of why the correct answer is right
    and (if different) why the chosen answer is wrong.
    """
    raise NotImplementedError("Implemented in M4")
