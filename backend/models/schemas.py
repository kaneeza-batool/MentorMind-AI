from pydantic import BaseModel, Field
from typing import Optional, Any


# ── Session ──────────────────────────────────────────────────────
class CreateSessionRequest(BaseModel):
    skill:          str = Field(..., example="Python programming")
    goal:           str = Field(..., example="Build production-ready web APIs")
    level:          str = Field(..., example="intermediate")
    timeline_weeks: Optional[int] = Field(4, ge=1, le=52)


class TopicSchema(BaseModel):
    id:                str
    title:             str
    description:       str
    order:             int
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


class QuizQuestion(BaseModel):
    id:       str
    question: str
    options:  list[str]


class QuizGenerateResponse(BaseModel):
    questions: list[QuizQuestion]


class AnswerSubmission(BaseModel):
    question_id: str
    answer:      int


class QuizSubmitRequest(BaseModel):
    session_id: str
    topic_id:   str
    answers:    list[AnswerSubmission]


class QuizResultItem(BaseModel):
    question_id:   str
    correct:       bool
    chosen_index:  int
    correct_index: int
    explanation:   str


class QuizSubmitResponse(BaseModel):
    score:              float
    total:              int
    correct:            int
    passed:             bool
    results:            list[QuizResultItem]
    mastery_delta:      float
    weak_concepts:      list[str]
    curriculum_adapted: bool = False   # True when CoachAgent triggered adaptation


class QuizFeedbackRequest(BaseModel):
    session_id:      str
    topic_id:        str
    score:           float
    correct:         int
    total:           int
    wrong_questions: list[str]


class QuizFeedbackResponse(BaseModel):
    feedback: str


class QuestionSchema(BaseModel):
    id:      str
    text:    str
    options: list[str]
    type:    str = "multiple_choice"


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
    session_id:   str
    topic_id:     str = ""
    quiz_results: dict


class ReflectResponse(BaseModel):
    summary:        str
    strengths:      list[str]
    weaknesses:     list[str]
    recommendation: str
    confidence:     int = 70


# ── Dashboard ─────────────────────────────────────────────────────
class TopicMasteryItem(BaseModel):
    topic_id:   str
    title:      str
    score:      float
    confidence: int
    completed:  bool


class DashboardResponse(BaseModel):
    session_id:               str
    skill:                    str
    goal:                     str
    level:                    str
    overall_progress:         float
    current_topic:            Optional[str]
    topics_completed:         int
    topics_remaining:         int
    total_topics:             int
    average_score:            float
    overall_mastery:          float
    completion_estimate:      str
    streak:                   int
    learning_velocity:        float
    curriculum_complete:      bool
    mastery_by_topic:         list[TopicMasteryItem]
    total_study_minutes:      int   = 0
    curriculum_adaptations:   int   = 0


# ── Analytics ─────────────────────────────────────────────────────
class TopicScorePoint(BaseModel):
    topic_id: str
    title:    str
    score:    float
    taken_at: str


class AnalyticsResponse(BaseModel):
    session_id:               str
    score_trend:              list[TopicScorePoint]
    mastery_trend:            list[dict]   # [{taken_at, overall_mastery}]
    strongest_topic:          Optional[dict]
    weakest_topic:            Optional[dict]
    study_time_by_topic:      dict         # {topic_id: {title, minutes}}
    total_study_minutes:      float
    quizzes_taken:            int
    topics_completed:         int
    topics_remaining:         int
    completion_forecast_days: Optional[int]
    curriculum_adaptations:   int
    weak_areas:               list[str]


# ── Resources ────────────────────────────────────────────────────
class ResourceSchema(BaseModel):
    title:      str
    url:        str
    type:       str
    source:     str
    why:        str
    duration:   Optional[str] = None
    difficulty: Optional[str] = None
    category:   Optional[str] = None


class ResourcesResponse(BaseModel):
    topic:     str
    resources: list[ResourceSchema]


# ── Progress ─────────────────────────────────────────────────────
class ProgressResponse(BaseModel):
    session_id:       str
    mastery:          dict
    completed_topics: list[str]
    weak_areas:       list[str]
    overall_score:    float


# ── MCP ──────────────────────────────────────────────────────────
class MCPRequest(BaseModel):
    jsonrpc: str = "2.0"
    id:      Any = None
    method:  str
    params:  dict = Field(default_factory=dict)


class MCPContent(BaseModel):
    type: str = "text"
    text: str


class MCPToolResult(BaseModel):
    content: list[MCPContent]


class MCPError(BaseModel):
    code:    int
    message: str


class MCPResponse(BaseModel):
    jsonrpc: str = "2.0"
    id:      Any = None
    result:  Optional[Any] = None
    error:   Optional[MCPError] = None
