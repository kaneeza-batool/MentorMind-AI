# MentorMind AI

> An adaptive multi-agent personalized learning platform built for the **Kaggle AI Agents Capstone 2025**.

MentorMind uses six specialized AI agents that collaborate to generate a personalized curriculum, stream live lessons, quiz the learner, track mastery, reflect on performance, curate resources, and adapt the remaining curriculum — all orchestrated through the CoachAgent's mastery signals.

---

## Architecture

### Multi-Agent Collaboration Pipeline

```
                        ┌─────────────────────────────────────────┐
                        │          MentorMind AI System           │
                        └─────────────────────────────────────────┘

  Learner Input
       │
       ▼
  ┌──────────────────┐
  │ StrategistAgent  │  Generates personalized curriculum from skill + goal + level
  │ (Groq AI)        │
  └────────┬─────────┘
           │  Topic list
           ▼
  ┌──────────────────┐
  │   MentorAgent    │  Streams adaptive lessons via SSE (real-time)
  │ (Groq AI + SSE)  │
  └────────┬─────────┘
           │  Lesson complete
           ▼
  ┌──────────────────┐
  │ ExaminerAgent    │  Generates 5-question MCQ + grades + explains wrong answers
  │ (Groq AI)        │
  └────────┬─────────┘
           │  Score + wrong answers
           ▼
  ┌──────────────────┐        ┌────────────────────────┐
  │   CoachAgent     │───────▶│  StrategistAgent       │
  │ (Rule-based)     │        │  adapt_remaining()     │
  │                  │        │  (Groq AI — only when  │
  │  mastery_delta   │        │  mastery critically    │
  │  should_adapt?   │        │  low)                  │
  └────────┬─────────┘        └────────────────────────┘
           │
           ├──────────────────▶ ReflectionAgent  (Groq AI — narrative + strengths)
           │
           └──────────────────▶ ResourceAgent    (Groq AI — validated resource curation)
```

### Agent Interaction Diagram

```
  POST /sessions          POST /quiz/submit          POST /reflect
       │                        │                         │
       ▼                        ▼                         ▼
  StrategistAgent          ExaminerAgent           ReflectionAgent
  ───────────────          ─────────────           ───────────────
  plan(skill, goal,        grade(answers,          reflect(score,
    level, weeks)            questions)              weak_areas,
       │                        │                    adapted?)
       │ curriculum             │ scored_results          │
       │                        ▼                         │ narrative
       │                  CoachAgent                      │
       │                  ──────────                      ▼
       │                  analyze(score,           session.reflections
       │                    mastery, weak)
       │                        │
       │                  should_adapt?
       │                    │       │
       │                   No      Yes
       │                    │       │
       │                    │       ▼
       │                    │  StrategistAgent
       │                    │  adapt_remaining()
       │                    │  (patch locked topics)
       │                    │       │
       └────────────────────┴───────┘
                                    │
                                    ▼
                              SQLite (aiosqlite)
                              sessions table
```

### Six Specialized Agents

| Agent | Role | Model | Adaptive |
|---|---|---|---|
| **StrategistAgent** | Generates + adapts curriculum | Groq llama-3.3-70b | Yes — `adapt_remaining()` |
| **MentorAgent** | Streams personalized lessons via SSE | Groq llama-3.3-70b | — |
| **ExaminerAgent** | Creates MCQ quizzes, grades, explains | Groq llama-3.3-70b | — |
| **CoachAgent** | Computes mastery, signals adaptation | Rule-based | Yes — triggers adaptation |
| **ReflectionAgent** | Generates post-quiz narrative reflections | Groq llama-3.3-70b | — |
| **ResourceAgent** | Curates validated learning resources | Groq llama-3.3-70b | — |

### Tech Stack

**Backend**
- FastAPI + Uvicorn (async, SSE streaming)
- Pydantic v2 for schema validation
- Groq API via OpenAI-compatible client (`llama-3.3-70b-versatile`)
- **SQLite via aiosqlite** — sessions persist across backend restarts
- **MCP 2024-11-05** JSON-RPC 2.0 server at `POST /mcp`
- Structural URL validation for all AI-generated resources
- UUID session ID validation on all endpoints

**Frontend**
- React 18 + Vite (code-split bundles, lazy-loaded pages)
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

## Docker Deployment

### One-command start

```bash
# Copy and fill in your API key
cp backend/.env.example .env

# Start both services
docker compose up -d
```

Backend: `http://localhost:8000`
Frontend: `http://localhost:5173` (after `npm run build`)

### Production frontend

```bash
cd frontend
npm run build          # outputs to frontend/dist/
docker compose up -d   # nginx serves dist/ on port 5173
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `GROQ_API_KEY` | **Yes** | — | Groq API key |
| `GROQ_MODEL` | No | `llama-3.3-70b-versatile` | Groq model |
| `DB_PATH` | No | `data/mentormind.db` | SQLite database path |
| `CORS_ORIGINS` | No | `http://localhost:5173` | Comma-separated allowed origins |
| `VALIDATE_RESOURCE_URLS` | No | `false` | Enable live HTTP URL validation |
| `AI_TIMEOUT_SECONDS` | No | `60` | Groq API timeout |
| `LOG_LEVEL` | No | `INFO` | Logging level (DEBUG/INFO/WARNING) |

---

## Database

MentorMind uses SQLite with a single `sessions` table. Complex fields (curriculum, quiz results, mastery, resources, reflections) are stored as JSON columns.

### Schema

```sql
CREATE TABLE sessions (
    id                  TEXT PRIMARY KEY,       -- UUID
    skill               TEXT NOT NULL,          -- e.g. "Python programming"
    goal                TEXT NOT NULL,          -- e.g. "Build REST APIs"
    level               TEXT NOT NULL,          -- beginner / intermediate / advanced
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

MentorMind exposes a full **MCP 2024-11-05** server that external AI agents can use to inspect learner state.

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

| Tool | Arguments | Description |
|---|---|---|
| `get_session` | `session_id` | Full session state |
| `get_progress` | `session_id` | Per-topic mastery + weak areas |
| `get_dashboard` | `session_id` | Aggregated metrics (progress, velocity, streak, avg score) |
| `get_curriculum` | `session_id` | Ordered curriculum with statuses |
| `get_resources` | `session_id`, `topic_id` | Cached AI-curated resources |

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

Interactive docs available at `/docs` (Swagger UI) and `/redoc`.

---

## Agent Design Patterns

### Fallback Chain

Every AI agent implements a deterministic fallback:
```
Groq AI call → JSON parse + validate → return data
           ↓ (on any failure)
      deterministic fallback → return data
```
The learner is **never blocked** by an AI outage.

### Adaptive Curriculum Flow

```
POST /quiz/submit
    → CoachAgent.analyze()
        → mastery_delta = score × 0.4
        → new_mastery = min(100, current + delta)
        → passed = score ≥ 70%
        → should_adapt = not passed AND new_mastery < 50
    → if should_adapt:
        → StrategistAgent.adapt_remaining(session, weak_areas)
            → snapshot locked topics → curriculum_versions
            → regenerate locked topics with weak-area context (Groq AI)
            → patch topics in-place (IDs preserved — frontend stays consistent)
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
2. **Trusted domain list** (always): 50+ known-good educational platforms
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
│   │   ├── mcp.py                # MCP JSON-RPC server
│   │   └── _validators.py        # Shared UUID + input validation
│   ├── models/
│   │   ├── schemas.py            # Pydantic request/response models
│   │   └── state.py              # Session dataclasses
│   ├── tools/
│   │   ├── database.py           # SQLite layer (aiosqlite)
│   │   ├── storage.py            # Session store (memory + SQLite)
│   │   ├── gemini_client.py      # Groq API client (OpenAI-compatible)
│   │   └── resource_tools.py     # Resource utilities
│   ├── config.py                 # Centralized settings
│   ├── Dockerfile                # Production container image
│   ├── .env.example              # Environment variable template
│   └── main.py                   # FastAPI app + lifespan
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/           # Sidebar (desktop + mobile drawer), Header, AppShell
│   │   │   ├── quiz/             # QuizCard, ResultBanner, ExplanationDrawer
│   │   │   ├── reflection/       # ReflectionCard, StrengthWeakGrid, NextStepPrompt
│   │   │   ├── resources/        # ResourceCard, ResourceFeed, ResourceBadge
│   │   │   └── progress/         # MasteryRing, ScoreTimeline, AdaptiveBadge
│   │   ├── hooks/
│   │   │   ├── useStream.js      # SSE lesson streaming + study time tracking
│   │   │   ├── useReflection.js  # Reflection generation
│   │   │   ├── useResources.js   # Resource fetching
│   │   │   └── useProgress.js    # Progress syncing
│   │   ├── pages/
│   │   │   ├── Home.jsx          # Landing page
│   │   │   ├── Onboarding.jsx    # 6-step onboarding wizard
│   │   │   ├── Learning.jsx      # Lesson view (SSE streaming)
│   │   │   ├── Quiz.jsx          # MCQ quiz + adaptation banner
│   │   │   ├── Reflection.jsx    # Post-quiz reflection + resources (lazy)
│   │   │   ├── Resources.jsx     # Resource browser (lazy)
│   │   │   ├── MissionControl.jsx # Dashboard + analytics (lazy)
│   │   │   └── JourneyComplete.jsx # Completion page (lazy)
│   │   ├── services/api.js       # Axios + SSE client
│   │   └── store/learningStore.js # Zustand + persist
│   ├── vite.config.js            # Build config with manual chunk splitting
│   └── .env.example              # Frontend environment template
│
├── docker-compose.yml            # Full-stack Docker deployment
├── nginx.conf                    # Nginx config for SPA + SSE proxy
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
| M10 | SQLite persistence; adaptive curriculum; MCP server; analytics; URL validation |
| **M11** | **Docker deployment; code splitting; security hardening; Kaggle submission polish** |

---

## Kaggle Judging Criteria Coverage

| Criterion | How MentorMind addresses it | Evidence |
|---|---|---|
| **Uses AI agents** | 6 specialized agents with distinct roles | `backend/agents/` |
| **Agent collaboration** | CoachAgent signals StrategistAgent after every quiz | `routers/quiz.py:127-140` |
| **Adaptive behavior** | Curriculum regenerated based on mastery signals | `agents/strategist_agent.py: adapt_remaining()` |
| **Real-time interaction** | SSE lesson streaming — tokens arrive as generated | `GET /learn/stream` + `useStream.js` |
| **Persistent state** | SQLite sessions survive backend restarts | `tools/database.py`, `tools/storage.py` |
| **External protocol** | MCP 2024-11-05 JSON-RPC server for agent interop | `routers/mcp.py` |
| **Production readiness** | Docker, env config, error handling, UUID validation | `Dockerfile`, `docker-compose.yml`, `config.py` |
| **Code quality** | Ruff lint clean, no debug code, consistent logging | CI workflow |
| **Documentation** | Comprehensive README, architecture diagrams, demo script | This file |
| **Learning analytics** | Score trends, study time, forecast, adaptation history | `GET /analytics`, `MissionControl.jsx` |

---

## Deployment Guide

### Local development

```bash
# Backend (with hot reload)
cd backend
uvicorn main:app --reload --port 8000

# Frontend (with HMR)
cd frontend
npm run dev
```

### Docker (production)

```bash
# 1. Build frontend static assets
cd frontend && npm run build && cd ..

# 2. Set your API key
echo "GROQ_API_KEY=your_key_here" > .env

# 3. Start
docker compose up -d

# 4. Check health
curl http://localhost:8000/health
```

### Cloud deployment

**Backend** — any platform that can run a Docker container:
```bash
# Railway / Render / Fly.io: connect your repo, set GROQ_API_KEY env var
# The Dockerfile handles everything else
```

**Frontend** — deploy `frontend/dist/` to any static host:
```bash
cd frontend && npm run build
# Upload dist/ to Vercel, Netlify, Cloudflare Pages, S3 + CloudFront, etc.
# Set VITE_API_URL to your backend URL before building
```

---

## CI

GitHub Actions runs on every push to `main` and every pull request:

- **Backend**: ruff lint + import checks + agent logic tests + UUID validator tests + URL validator tests
- **Frontend**: `npm ci` + `npm run build`

```bash
# Run locally
cd backend && python -m ruff check . --select E,W,F --ignore E501
cd frontend && npm run build
```

---

## Demo Script (≤ 5 minutes)

**Goal**: Show end-to-end AI agent collaboration from onboarding through quiz adaptation.

```
0:00  Introduction
      - "MentorMind uses 6 AI agents that collaborate to create a personalized
         learning experience — from curriculum generation to adaptive quizzes."

0:30  Onboarding
      - Open http://localhost:5173
      - Complete 6-step wizard: skill="Python", goal="Build REST APIs", level="beginner"
      - Show the StrategistAgent generating 8 topics in real-time

1:00  Live lesson streaming
      - Click "Start Lesson" on topic 1
      - Show tokens streaming in real-time (MentorAgent + SSE)
      - Point out the "Why are we learning this?" accordion — MentorAgent explains

1:45  AI quiz + CoachAgent adaptation
      - Click "Take Quiz" (ExaminerAgent generates 5 questions)
      - Answer all 5 questions — get some wrong on purpose
      - Submit — show the score, AI feedback, and answer explanations
      - If score < 70%: show the Sparkles banner — "Curriculum adapted"
      - This is CoachAgent triggering StrategistAgent to regenerate locked topics

2:45  Post-quiz reflection
      - Click "View Reflection" — ReflectionAgent generates narrative summary
      - Show strengths, weaknesses, confidence meter, and recommended resources
      - Point out ResourceAgent curation with URL validation

3:30  Mission Control dashboard
      - Click "Mission Control" in sidebar
      - Show analytics: score trend, mastery by topic, study time, curriculum adaptations

4:15  MCP integration
      - curl -X POST http://localhost:8000/mcp -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
      - Show external AI agents can query learner state via MCP protocol

4:45  Architecture summary
      - Show README architecture diagram
      - "6 agents, 1 SQLite DB, MCP server, SSE streaming — all running locally,
         free API tier, Docker-ready"

5:00  End
```

---

## Screenshots Checklist

For Kaggle submission, capture these screens:

- [ ] Landing page (Home.jsx) — hero section with agent orbit
- [ ] Onboarding wizard — skill/goal/level selection
- [ ] StrategistAgent generating curriculum (loading state → topics appear)
- [ ] Live lesson streaming — tokens appearing in real-time
- [ ] Quiz page — question with answer options
- [ ] Quiz results — score banner + AI feedback
- [ ] Curriculum adaptation banner (Sparkles icon, "Curriculum adapted")
- [ ] Reflection page — narrative + strengths/weaknesses/resources
- [ ] Mission Control — stats grid + analytics
- [ ] MCP curl output — showing external agent tool listing

---

## Video Recording Checklist

- [ ] Screen recording at 1920×1080, 30fps minimum
- [ ] Audio narration following the Demo Script above
- [ ] Show browser DevTools Network tab briefly during lesson stream (SSE frames)
- [ ] Show terminal during quiz submit — log output with `CoachAgent signalled adaptation`
- [ ] Close with architecture diagram from README

---

## Kaggle Writeup Outline

**Title**: MentorMind AI — Adaptive Multi-Agent Personalized Learning

**Abstract** (100 words)
MentorMind deploys six specialized AI agents that collaborate in real time to deliver a complete personalized learning experience. StrategistAgent generates a custom curriculum; MentorAgent streams lessons via SSE; ExaminerAgent creates and grades adaptive quizzes; CoachAgent tracks mastery and triggers curriculum regeneration when a learner struggles; ReflectionAgent synthesizes post-quiz narratives; ResourceAgent curates validated learning resources. Session state is persisted in SQLite and exposed via a MCP 2024-11-05 server for external agent interoperability. Built on Groq's llama-3.3-70b-versatile via OpenAI-compatible API.

**Sections**
1. Problem Statement — one-size-fits-all learning fails; personalization requires intelligence
2. Agent Architecture — six agents, roles, communication pattern, fallback chain
3. Adaptive Curriculum — CoachAgent mastery model, adaptation trigger logic
4. Technical Implementation — FastAPI + SSE + SQLite + MCP + React
5. Real-time Interaction — SSE streaming architecture and client implementation
6. Persistence & Recovery — two-layer cache (memory + SQLite), restart recovery
7. Production Readiness — Docker, CORS hardening, UUID validation, logging
8. Results & Demo — curriculum adaptation in action, analytics screenshots
9. Kaggle Criteria Self-Assessment — table mapping criteria to implementation
10. Limitations & Future Work — vector search, spaced repetition, multi-user auth

---

## CI Status

![CI](https://github.com/kaneeza-batool/MentorMind-AI/actions/workflows/ci.yml/badge.svg)
