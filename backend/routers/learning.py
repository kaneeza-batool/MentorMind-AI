import asyncio
from fastapi import APIRouter, HTTPException, Request
from sse_starlette.sse import EventSourceResponse
from models.schemas import LessonRequest
from tools import storage

router = APIRouter()

MOCK_LESSON_TEMPLATE = """\
## {title}

Welcome! In this lesson we'll explore **{title}** in depth.

### What You'll Learn
- The core principles behind {title}
- How to apply these concepts in real scenarios
- Common patterns and best practices

---

### Core Concepts

**Foundation**
Every journey begins with understanding the fundamentals. {title} is built on a set of elegant principles that, once grasped, make everything else click into place.

**Application**
Theory without practice is incomplete. Let's look at how {title} applies to real-world problems you'll encounter in your journey.

**Best Practices**
Experienced practitioners follow specific patterns that separate good work from great work. These are the habits worth building from day one:

1. Start small, iterate fast.
2. Read the error messages — they tell you exactly what's wrong.
3. Write code you can explain to a colleague.

---

### Summary

You've covered the essentials of **{title}**. Here's what to remember:

- Master the fundamentals before advancing.
- Practice consistently to build durable skills.
- Connect new knowledge to what you already know.

---

*Great work! When you're ready, take the quiz to test your understanding.*
"""


async def _lesson_stream(title: str, request: Request):
    text = MOCK_LESSON_TEMPLATE.format(title=title)
    chunk_size = 6
    for i in range(0, len(text), chunk_size):
        if await request.is_disconnected():
            break
        yield {"event": "chunk", "data": text[i : i + chunk_size]}
        await asyncio.sleep(0.025)
    yield {"event": "done", "data": "[DONE]"}


@router.post("/learn", status_code=200)
async def start_lesson(body: LessonRequest):
    session = storage.get_session(body.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    topic = next((t for t in session.curriculum if t.id == body.topic_id), None)
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    return {"session_id": body.session_id, "topic_id": body.topic_id, "stream_url": f"/learn/stream?session_id={body.session_id}&topic_id={body.topic_id}"}


@router.get("/learn/stream")
async def stream_lesson(session_id: str, topic_id: str, request: Request):
    session = storage.get_session(session_id)
    title = topic_id
    if session:
        topic = next((t for t in session.curriculum if t.id == topic_id), None)
        if topic:
            title = topic.title

    return EventSourceResponse(_lesson_stream(title, request))


@router.post("/next")
async def next_topic(session_id: str):
    session = storage.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    current_idx = next(
        (i for i, t in enumerate(session.curriculum) if t.status == "active"), None
    )
    if current_idx is None:
        return {"message": "Curriculum complete", "next_topic": None}

    session.curriculum[current_idx].status = "completed"
    next_idx = current_idx + 1
    if next_idx < len(session.curriculum):
        session.curriculum[next_idx].status = "active"
        next_topic = session.curriculum[next_idx]
        storage.update_session(session)
        return {"next_topic": {"id": next_topic.id, "title": next_topic.title}}

    storage.update_session(session)
    return {"message": "Curriculum complete", "next_topic": None}
