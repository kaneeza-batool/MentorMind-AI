from pydantic import BaseModel, Field
from typing import Optional


# ── Session ──────────────────────────────────────────────────────
class CreateSessionRequest(BaseModel):
    skill:           str = Field(..., example="Python programming")
    goal:            str = Field(..., example="Build production-ready web APIs")
    level:           str = Field(..., example="intermediate")   # beginner | intermediate | advanced
    timeline_weeks:  Optional[int] = Field(4, ge=1, le=52)


class TopicSchema(BaseModel):
    id:          str
    title:       str
    description: str
    order:       int
    estimated_minutes: int = 20


class SessionResponse(BaseModel):
    session_id: str
    curriculum: list[TopicSchema]


# ── Learning ─────────────────────────────────────────────────────
class LessonRequest(BaseModel):
    session_id: str
    topic_id:   str


# ── Quiz ─────────────────────────────────────────────────────────
class QuizGenerateRequest(BaseModel):
    session_id: str
    topic_id:   str
    difficulty: Optional[str] = "adaptive"  # easy | medium | hard | adaptive


class AnswerSubmission(BaseModel):
    question_id: str
    answer:      str


class QuizSubmitRequest(BaseModel):
    session_id: str
    topic_id:   str
    answers:    list[AnswerSubmission]


class QuestionSchema(BaseModel):
    id:      str
    text:    str
    options: list[str]
    type:    str = "multiple_choice"


class QuizGenerateResponse(BaseModel):
    questions: list[QuestionSchema]


class QuizResultItem(BaseModel):
    question_id:    str
    correct:        bool
    correct_answer: str
    explanation:    str


class QuizSubmitResponse(BaseModel):
    score:          float
    total:          int
    correct:        int
    results:        list[QuizResultItem]
    mastery_delta:  float
    weak_concepts:  list[str]


# ── Explain ──────────────────────────────────────────────────────
class ExplainRequest(BaseModel):
    question:       str
    chosen_answer:  str
    correct_answer: str
    topic:          str


class ExplainResponse(BaseModel):
    explanation: str


# ── Reflection ───────────────────────────────────────────────────
class ReflectRequest(BaseModel):
    session_id:  str
    quiz_results: dict


class ReflectResponse(BaseModel):
    narrative:   str
    strengths:   list[str]
    weak_areas:  list[str]
    next_step:   str


# ── Resources ────────────────────────────────────────────────────
class ResourceSchema(BaseModel):
    title:       str
    url:         str
    type:        str   # article | video | course | docs | repo
    source:      str
    why:         str
    duration:    Optional[str] = None


class ResourcesResponse(BaseModel):
    topic:     str
    resources: list[ResourceSchema]


# ── Progress ─────────────────────────────────────────────────────
class ProgressResponse(BaseModel):
    session_id:        str
    mastery:           dict    # { topic_id: score 0-100 }
    completed_topics:  list[str]
    weak_areas:        list[str]
    overall_score:     float
