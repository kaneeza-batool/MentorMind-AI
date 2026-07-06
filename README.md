# MentorMind AI

> An adaptive multi-agent personalized learning platform built for the **Kaggle AI Agents Capstone 2025**.

MentorMind uses six specialized AI agents that collaborate to generate a personalized curriculum, stream live lessons, quiz the learner, track mastery, reflect on performance, curate resources, and adapt the remaining curriculum — all driven by the CoachAgent's mastery signals.

---

## Architecture

### Multi-Agent Collaboration Pipeline

```
StrategistAgent ──► MentorAgent ──► ExaminerAgent
       ▲                                   │
       │         CoachAgent ◄──────────────┘
       │           │  analyzes mastery
       │           │  signals: should_adapt?
       └───────────┘
                   │
          ReflectionAgent ──► ResourceAgent
```

After every quiz, the **CoachAgent** computes mastery delta and weak areas. If mastery is critically low (`score < 70%` AND `new_mastery < 50`), it signals `should_adapt=True`. The quiz router then calls **StrategistAgent.adapt_remaining()** which regenerates only the locked (not-yet-started) topics using the learner's weak areas as context. Topic IDs are preserved so frontend state stays consistent.

### Six Specialized Agents

| Agent | Role | Model | Adaptive |
|---|---|---|---|
| **StrategistAgent** | Generates + adapts curriculum | Groq llama-3.3-70b | Yes |
| **MentorAgent** | Streams personalized lessons via SSE | Groq llama-3.3-70b | — |
| **ExaminerAgent** | Creates adaptive MCQ quizzes, grades, explains | Groq llama-3.3-70b | — |
| **CoachAgent** | Computes mastery, triggers adaptation | Rule-based | Yes |
| **ReflectionAgent** | Generates post-quiz narrative reflections | Groq llama-3.3-70b | — |
| **ResourceAgent** | Curates validated learning resources | Groq llama-3.3-70b | — |

### Tech Stack

**Backend**
- FastAPI + Uvicorn (async, SSE streaming)
- Pydantic v2 for schema validation
- Groq API via OpenAI-compatible client (`llama-3.3-70b-versatile`)
- **SQLite via aiosqlite** — sessions persist across backend restarts
- MCP 2024-11-05 JSON-RPC server at `POST /mcp`
- Structural URL validation for all AI-generated resources

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
# Edit .env and add: GROQ_API_KEY=your_key_here
uvicorn main:app --reload --port 8000
```

The SQLite database is created automatically at `backend/data/mentormind.db` on first run.

### Frontend

```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `GROQ_API_KEY` | Yes | — | Groq API key |
| `GROQ_MODEL` | No | `llama-3.3-70b-versatile` | Groq model |
| `DB_PATH` | No | `backend/data/mentormind.db` | SQLite database path |
| `CORS_ORIGINS` | No | `http://localhost:5173` | Allowed CORS origins |
| `VALIDATE_RESOURCE_URLS` | No | `false` | Enable live HTTP URL validation |
| `AI_TIMEOUT_SECONDS` | No | `60` | Groq API timeout |

---

## Database

MentorMind uses SQLite with a single `sessions` table. Complex fields (curriculum, quiz results, mastery, resources, reflections) are stored as JSON columns.

### Schema

```sql
CREATE TABLE sessions (
    id                  TEXT PRIMARY KEY,
    skill               TEXT NOT NULL,
    goal                TEXT NOT NULL,
    level               TEXT NOT NULL,
    curriculum          TEXT NOT NULL DEFAULT '[]',   -- JSON: list[Topic]
    quiz_results        TEXT NOT NULL DEFAULT '[]',   -- JSON: list[QuizResult]
    mastery             TEXT NOT NULL DEFAULT '{}',   -- JSON: {topic_id: score}
    weak_areas          TEXT NOT NULL DEFAULT '[]',   -- JSON: list[str]
    lesson_history      TEXT NOT NULL DEFAULT '{}',   -- JSON: {topic_id: {completed_at, study_minutes}}
    reflections         TEXT NOT NULL DEFAULT '{}',   -- JSON: {topic_id: reflection_dict}
    resources           TEXT NOT NULL DEFAULT '{}',   -- JSON: {topic_id: list[resource]}
    curriculum_versions TEXT NOT NULL DEFAULT '[]',   -- JSON: adaptation history
    study_time          TEXT NOT NULL DEFAULT '{}',   -- JSON: {topic_id: seconds}
    created_at          TEXT NOT NULL,
    updated_at          TEXT NOT NULL
)
```

### Recovery

Sessions survive backend restarts. On a cache miss, the storage layer transparently loads the session from SQLite and re-populates the in-memory cache.

---

## MCP Integration

MentorMind exposes a full MCP 2024-11-05 server that external AI agents can use to inspect learner state.

### Endpoint

```
POST /mcp
Content-Type: application/json
```

### Supported Methods

| Method | Description |
|---|---|
| `initialize` | Handshake and capability negotiation |
| `tools/list` | List all available tools |
| `tools/call` | Invoke a tool by name |

### Available Tools

| Tool | Description |
|---|---|
| `get_session` | Full session state (skill, level, curriculum, mastery, weak areas) |
| `get_progress` | Per-topic mastery, completed topics, remaining count |
| `get_dashboard` | Aggregated metrics: progress, velocity, streak, average score |
| `get_curriculum` | Ordered curriculum with topic statuses and mastery scores |
| `get_resources` | Cached AI-curated resources for a specific topic |

### Example

```bash
# List tools
curl -X POST http://localhost:8000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'

# Get learner progress
curl -X POST http://localhost:8000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "get_progress",
      "arguments": {"session_id": "your-session-id"}
    }
  }'

# Server capabilities
curl http://localhost:8000/mcp/info
```

---

## API Reference

| Method | Path | Agent | Description |
|---|---|---|---|
| `POST` | `/sessions` | StrategistAgent | Create session + AI curriculum |
| `GET` | `/sessions/{id}` | — | Retrieve session state |
| `POST` | `/learn` | MentorAgent | Start lesson (non-streaming) |
| `GET` | `/learn/stream` | MentorAgent | Stream lesson via SSE |
| `POST` | `/learn/complete` | — | Record study time |
| `POST` | `/learn/next` | MentorAgent | Advance to next topic |
| `GET` | `/learn/why` | MentorAgent | Explain why this topic now |
| `POST` | `/quiz/generate` | ExaminerAgent | Generate 5-question MCQ |
| `POST` | `/quiz/submit` | CoachAgent + ExaminerAgent | Grade + update mastery + adapt curriculum |
| `POST` | `/quiz/feedback` | ExaminerAgent | Generate AI performance feedback |
| `POST` | `/quiz/explain` | ExaminerAgent | Explain a specific wrong answer |
| `POST` | `/reflect` | ReflectionAgent | Generate post-quiz reflection |
| `GET` | `/resources/{topic}` | ResourceAgent | Curate validated learning resources |
| `GET` | `/progress` | CoachAgent | Session mastery snapshot |
| `GET` | `/dashboard` | CoachAgent | Full learning dashboard |
| `GET` | `/analytics` | CoachAgent | Detailed analytics (trends, study time, forecast) |
| `POST` | `/mcp` | — | MCP JSON-RPC 2.0 endpoint |
| `GET` | `/mcp/info` | — | MCP server capabilities |
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

### Adaptive Curriculum Flow

```
quiz submit
    → CoachAgent.analyze()
        → mastery_delta, new_mastery, should_adapt
    → if should_adapt:
        → StrategistAgent.adapt_remaining(session, weak_areas)
            → snapshot old locked topics into curriculum_versions
            → regenerate locked topics with weak-area context
            → patch topics in-place (IDs preserved)
        → invalidate cached resources for affected topics
    → persist session to SQLite
    → return QuizSubmitResponse(curriculum_adapted=True/False)
```

### Two-Layer Resource Cache

1. **In-process** (`_CACHE` dict): fastest, survives hot-reloads
2. **Session** (`session.resources`): SQLite-persisted, survives restarts

### URL Validation

Before resources are cached, every URL passes two checks:

1. **Structural** (always): must be HTTPS, have a real domain
2. **Trusted domain list** (always): 50+ known-good educational platforms bypass HTTP checks
3. **Live HTTP HEAD** (opt-in, `VALIDATE_RESOURCE_URLS=true`): confirms reachability

If fewer than 3 resources survive validation, the original set is returned as fallback.

---

## Project Structure

```
mentormind-ai/
├── backend/
│   ├── agents/
│   │   ├── strategist_agent.py   # Curriculum generation + adaptation
│   │   ├── mentor_agent.py       # Lesson streaming
│   │   ├── examiner_agent.py     # Quiz generation + grading
│   │   ├── coach_agent.py        # Mastery tracking + adaptation signals
│   │   ├── reflection_agent.py   # Post-quiz reflections
│   │   ├── resource_agent.py     # Resource curation
│   │   └── root_agent.py         # Agent registry
│   ├── routers/
│   │   ├── sessions.py           # Session creation + retrieval
│   │   ├── learning.py           # Lesson stream + study time
│   │   ├── quiz.py               # Quiz + grading + adaptation trigger
│   │   ├── reflection.py         # Reflection generation
│   │   ├── resources.py          # Resource curation + URL validation
│   │   ├── progress.py           # Dashboard + analytics
│   │   ├── explain.py            # Answer explanation
│   │   └── mcp.py                # MCP JSON-RPC server
│   ├── models/
│   │   ├── schemas.py            # Pydantic request/response models
│   │   └── state.py              # Session dataclasses
│   ├── tools/
│   │   ├── database.py           # SQLite layer (aiosqlite)
│   │   ├── storage.py            # Session store (memory + SQLite)
│   │   ├── gemini_client.py      # Groq API client
│   │   └── resource_tools.py     # Resource utilities
│   ├── config.py                 # Centralized settings
│   ├── data/                     # SQLite database (gitignored)
│   └── main.py                   # FastAPI app + lifespan
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/           # Sidebar, Header, AppShell
│   │   │   ├── quiz/             # QuizCard, ResultBanner, ExplanationDrawer
│   │   │   ├── reflection/       # ReflectionCard, StrengthWeakGrid
│   │   │   ├── resources/        # ResourceCard, ResourceFeed, ResourceBadge
│   │   │   └── progress/         # MasteryRing, ScoreTimeline
│   │   ├── hooks/
│   │   │   ├── useStream.js      # SSE lesson streaming + study time
│   │   │   ├── useReflection.js  # Reflection generation
│   │   │   ├── useResources.js   # Resource fetching
│   │   │   └── useProgress.js    # Progress syncing
│   │   ├── pages/
│   │   │   ├── Learning.jsx      # Lesson view with curriculum nav
│   │   │   ├── Quiz.jsx          # MCQ quiz + adaptation banner
│   │   │   ├── Reflection.jsx    # Post-quiz reflection + resources
│   │   │   ├── Resources.jsx     # Resource browser
│   │   │   ├── MissionControl.jsx # Dashboard + analytics
│   │   │   └── JourneyComplete.jsx # Completion page
│   │   ├── services/api.js       # Axios + SSE client
│   │   └── store/learningStore.js # Zustand + persist
│   └── tailwind.config.js
│
├── .github/workflows/ci.yml      # GitHub Actions CI
├── CLAUDE.md                     # Codebase guide for AI assistants
└── README.md                     # This file
```

---

## Kaggle Capstone Milestone History

| Milestone | Description |
|---|---|
| M1–M3 | Scaffolding, landing page, onboarding wizard |
| M4 | Backend foundation — 7 routers, agent stubs, ADK shim |
| M5 | MentorAgent — Groq SSE streaming lessons |
| M6 | ExaminerAgent — AI quiz generation, grading, explanations |
| M7 | ReflectionAgent — post-quiz narrative reflections; MissionControl dashboard |
| M8 | ResourceAgent — AI resource curation; Zustand persist; Sidebar navigation; JourneyComplete |
| M9 | StrategistAgent — AI curriculum generation; CoachAgent wired; CI pipeline |
| **M10** | **SQLite persistence; adaptive curriculum; MCP server; analytics; URL validation** |

---

## Deployment

### Local development

```bash
# Backend
cd backend && uvicorn main:app --reload --port 8000

# Frontend
cd frontend && npm run dev
```

### Production

```bash
# Backend — Gunicorn with Uvicorn workers
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

# Frontend — build static assets
npm run build
# Serve dist/ with nginx, Caddy, or a static host (Vercel, Netlify)
```

Set `CORS_ORIGINS` to your frontend's production URL.

---

## CI

GitHub Actions runs on every push to `main` and every pull request:

- **Backend**: ruff lint + import validation + agent logic tests + URL validator tests
- **Frontend**: `npm ci` + `npm run build`

```bash
# Run locally
cd backend && ruff check . --select E,W,F --ignore E501
cd frontend && npm run build
```
