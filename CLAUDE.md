# MentorMind AI

An AI-powered, multi-agent personalized learning platform built for the **Kaggle AI Agents Capstone**.

MentorMind adapts a complete learning curriculum to each learner's skill, goal, experience level, and timeline — then teaches, quizzes, reflects, and curates resources entirely through specialized AI agents.

---

## Architecture

### Multi-Agent System

Six specialized agents collaborate through a shared session state:

| Agent | Role | Model | Status |
|---|---|---|---|
| **StrategistAgent** | Generates a personalized topic curriculum | Groq llama-3.3-70b | Active |
| **MentorAgent** | Streams personalized lessons via SSE | Groq llama-3.3-70b | Active |
| **ExaminerAgent** | Creates adaptive MCQ quizzes + grades + explains | Groq llama-3.3-70b | Active |
| **CoachAgent** | Tracks mastery, identifies weak areas | Rule-based | Active |
| **ReflectionAgent** | Generates post-quiz narrative reflections | Groq llama-3.3-70b | Active |
| **ResourceAgent** | Curates categorized learning resources | Groq llama-3.3-70b | Active |

The `RootAgent` owns all sub-agents and exposes a unified `agent_configs` registry.

### Tech Stack

**Backend**
- FastAPI + Uvicorn (async, SSE streaming)
- Pydantic v2 for schema validation
- Groq API via OpenAI-compatible client (`llama-3.3-70b-versatile`)
- In-process dict store (production: swap for Redis / SQLite)
- Google ADK shim (`adk/`) for agent registration pattern

**Frontend**
- React 18 + Vite
- Zustand 5 with `persist` middleware (localStorage)
- Framer Motion for animations
- Tailwind CSS (dark-only design system)
- React Router v6
- EventSource (SSE) for real-time lesson streaming

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 20+
- A [Groq API key](https://console.groq.com) (free tier is sufficient)

### Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env and set GROQ_API_KEY=your_key_here
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

### Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `GROQ_API_KEY` | Yes | — | Groq API key for all AI agents |
| `GROQ_MODEL` | No | `llama-3.3-70b-versatile` | Groq model for generation |
| `CORS_ORIGINS` | No | `http://localhost:5173` | Comma-separated allowed origins |

---

## Project Structure

```
mentormind-ai/
├── backend/
│   ├── agents/                  # AI agent implementations
│   │   ├── strategist_agent.py  # Curriculum generation
│   │   ├── mentor_agent.py      # Lesson streaming
│   │   ├── examiner_agent.py    # Quiz generation + grading
│   │   ├── coach_agent.py       # Mastery tracking
│   │   ├── reflection_agent.py  # Post-quiz reflection
│   │   ├── resource_agent.py    # Resource curation
│   │   └── root_agent.py        # Agent registry
│   ├── routers/                 # FastAPI route handlers
│   ├── models/
│   │   ├── schemas.py           # Pydantic request/response models
│   │   └── state.py             # Session dataclasses
│   ├── tools/
│   │   ├── gemini_client.py     # Groq API client (OpenAI-compatible)
│   │   └── storage.py           # In-process session store
│   ├── adk/                     # Google ADK compatibility shim
│   └── main.py                  # FastAPI app + lifespan
│
├── frontend/
│   ├── src/
│   │   ├── agents/              # (reserved for client-side agent logic)
│   │   ├── components/          # Reusable UI components
│   │   │   ├── layout/          # Sidebar, Header, AppShell
│   │   │   ├── quiz/            # QuizCard, ResultBanner, ExplanationDrawer
│   │   │   ├── reflection/      # ReflectionCard, StrengthWeakGrid
│   │   │   ├── resources/       # ResourceCard, ResourceFeed, ResourceBadge
│   │   │   └── progress/        # MasteryRing, ScoreTimeline
│   │   ├── hooks/               # useStream, useReflection, useResources, …
│   │   ├── pages/               # Full-page route components
│   │   ├── services/api.js      # Axios + SSE client
│   │   └── store/learningStore.js  # Zustand + persist
│   └── tailwind.config.js       # Dark design system tokens
│
├── .github/workflows/ci.yml     # GitHub Actions CI
└── CLAUDE.md                    # This file
```

---

## API Reference

| Method | Path | Agent | Description |
|---|---|---|---|
| `POST` | `/sessions` | StrategistAgent | Create session + AI curriculum |
| `GET` | `/sessions/{id}` | — | Retrieve session state |
| `POST` | `/learn` | MentorAgent | Start lesson (non-streaming) |
| `GET` | `/learn/stream` | MentorAgent | Stream lesson via SSE |
| `POST` | `/learn/next` | MentorAgent | Advance to next topic |
| `GET` | `/learn/why` | MentorAgent | Explain why this topic now |
| `POST` | `/quiz/generate` | ExaminerAgent | Generate 5-question MCQ |
| `POST` | `/quiz/submit` | CoachAgent + ExaminerAgent | Grade + update mastery |
| `POST` | `/quiz/feedback` | ExaminerAgent | Generate AI performance feedback |
| `POST` | `/quiz/explain` | ExaminerAgent | Explain a specific wrong answer |
| `POST` | `/reflect` | ReflectionAgent | Generate post-quiz reflection |
| `GET` | `/resources/{topic}` | ResourceAgent | Curate learning resources |
| `GET` | `/progress` | CoachAgent | Session mastery snapshot |
| `GET` | `/dashboard` | CoachAgent | Full learning dashboard |
| `GET` | `/health` | — | Service health check |
| `GET` | `/debug/agents` | RootAgent | Agent registry status |

---

## Agent Design Patterns

### Fallback Chain
Every AI agent implements a deterministic fallback:
```
Groq AI call → JSON parse + validate → return data
           ↓ (on any failure)
      deterministic fallback → return data
```
The learner is never blocked by an AI outage.

### Two-Layer Cache
ResourceAgent and StrategistAgent cache at two levels:
1. **In-process** (`_CACHE` dict): fastest, survives hot-reloads
2. **Session** (`session.resources`, `session.reflections`): survives within server lifetime

### Mastery Tracking (CoachAgent)
```
quiz score → mastery_delta = score × 0.4
           → new_mastery = min(100, current + delta)
           → passed = score >= 70%
           → should_adapt = not passed and mastery < 50
```

---

## Kaggle Capstone Notes

This project was built milestone-by-milestone for the **Google AI Agents Capstone (2025)**:

- **M1–M3**: Scaffolding, landing page, onboarding wizard
- **M4**: Backend foundation — 7 routers, agent stubs, ADK shim
- **M5**: MentorAgent — Groq SSE streaming lessons
- **M6**: ExaminerAgent — AI quiz generation, grading, explanations
- **M7**: ReflectionAgent — post-quiz narrative reflections; MissionControl dashboard
- **M8**: ResourceAgent — AI resource curation; Zustand persist; Sidebar navigation; JourneyComplete page
- **M9**: StrategistAgent — AI curriculum generation; CoachAgent wired; CI pipeline

All agents use **Groq's llama-3.3-70b-versatile** (fast, free-tier friendly) via an OpenAI-compatible client, making the system portable to any OpenAI-compatible provider.
