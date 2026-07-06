from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class Topic:
    id:                str
    title:             str
    description:       str
    order:             int
    estimated_minutes: int   = 20
    status:            str   = "locked"    # locked | active | completed
    mastery:           float = 0.0


@dataclass
class QuizResult:
    topic_id:      str
    score:         float
    total:         int
    correct:       int
    weak_concepts: list = field(default_factory=list)
    taken_at:      str  = field(default_factory=lambda: datetime.utcnow().isoformat())


@dataclass
class Resource:
    title:    str
    url:      str
    type:     str
    source:   str
    why:      str
    duration: str = ""


@dataclass
class LearningSession:
    id:      str
    skill:   str
    goal:    str
    level:   str

    curriculum:   list = field(default_factory=list)   # list[Topic]
    quiz_results: list = field(default_factory=list)   # list[QuizResult]
    mastery:      dict = field(default_factory=dict)   # { topic_id: score }
    weak_areas:   list = field(default_factory=list)

    # { topic_id: { completed_at, word_count } }
    lesson_history: dict = field(default_factory=dict)

    # { topic_id: { summary, strengths, weaknesses, recommendation, confidence } }
    reflections: dict = field(default_factory=dict)

    # { topic_id: list[dict] } — AI-generated resources per topic
    resources: dict = field(default_factory=dict)

    # History of curriculum adaptations triggered by CoachAgent
    # Each entry: { timestamp, reason, version, snapshot: list[{id, title, status}] }
    curriculum_versions: list = field(default_factory=list)

    # { topic_id: seconds } — actual study time tracked via /learn/complete
    study_time: dict = field(default_factory=dict)

    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
