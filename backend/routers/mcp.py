"""
MCP (Model Context Protocol) Server — MentorMind AI

Implements MCP 2024-11-05 over JSON-RPC 2.0 (HTTP transport).
Exposes MentorMind session data as MCP tools that external AI agents
can invoke to inspect learner progress and curriculum state.

Endpoints:
  POST /mcp        — JSON-RPC 2.0 tool dispatch
  GET  /mcp/info   — Server capability manifest

Supported MCP methods:
  initialize            — Handshake / capability negotiation
  tools/list            — Enumerate available tools
  tools/call            — Invoke a tool by name

Available tools:
  get_session           — Full session state
  get_progress          — Mastery, weak areas, completed topics
  get_dashboard         — Aggregated dashboard metrics
  get_curriculum        — Current curriculum with topic statuses
  get_resources         — Cached resources for a topic

Reference: https://spec.modelcontextprotocol.io/specification/2024-11-05/
"""
import json
import logging

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from tools import storage

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/mcp", tags=["mcp"])

# ── Server metadata ───────────────────────────────────────────────

_SERVER_INFO = {
    "name":    "mentormind-mcp",
    "version": "1.0.0",
}

_CAPABILITIES = {
    "tools": {"listChanged": False},
}

# ── Tool definitions ──────────────────────────────────────────────

_TOOLS = [
    {
        "name":        "get_session",
        "description": "Retrieve the full learning session state for a learner, including skill, level, goal, curriculum, mastery, and weak areas.",
        "inputSchema": {
            "type":     "object",
            "properties": {
                "session_id": {"type": "string", "description": "The session ID returned by POST /sessions"}
            },
            "required": ["session_id"],
        },
    },
    {
        "name":        "get_progress",
        "description": "Get the learner's current mastery scores per topic, completed topics list, and identified weak areas.",
        "inputSchema": {
            "type":     "object",
            "properties": {
                "session_id": {"type": "string", "description": "The session ID"}
            },
            "required": ["session_id"],
        },
    },
    {
        "name":        "get_dashboard",
        "description": "Retrieve aggregated dashboard metrics: overall progress, average score, learning velocity, streak, mastery breakdown, and completion estimate.",
        "inputSchema": {
            "type":     "object",
            "properties": {
                "session_id": {"type": "string", "description": "The session ID"}
            },
            "required": ["session_id"],
        },
    },
    {
        "name":        "get_curriculum",
        "description": "Return the ordered curriculum with each topic's title, description, status (active/locked/completed), and mastery score.",
        "inputSchema": {
            "type":     "object",
            "properties": {
                "session_id": {"type": "string", "description": "The session ID"}
            },
            "required": ["session_id"],
        },
    },
    {
        "name":        "get_resources",
        "description": "Retrieve cached AI-curated learning resources for a specific topic in the session.",
        "inputSchema": {
            "type":     "object",
            "properties": {
                "session_id": {"type": "string", "description": "The session ID"},
                "topic_id":   {"type": "string", "description": "The topic ID (e.g. 't1', 't2')"},
            },
            "required": ["session_id", "topic_id"],
        },
    },
]


# ── Tool handlers ─────────────────────────────────────────────────

async def _tool_get_session(args: dict) -> dict:
    session_id = args.get("session_id", "")
    session    = await storage.get_session(session_id)
    if not session:
        raise ValueError(f"Session '{session_id}' not found")

    return {
        "session_id": session.id,
        "skill":      session.skill,
        "goal":       session.goal,
        "level":      session.level,
        "created_at": session.created_at,
        "curriculum": [
            {
                "id":     t.id,
                "title":  t.title,
                "status": t.status,
                "order":  t.order,
            }
            for t in session.curriculum
        ],
        "mastery":               session.mastery,
        "weak_areas":            session.weak_areas,
        "curriculum_adaptations": len(session.curriculum_versions),
    }


async def _tool_get_progress(args: dict) -> dict:
    session_id = args.get("session_id", "")
    session    = await storage.get_session(session_id)
    if not session:
        raise ValueError(f"Session '{session_id}' not found")

    completed = [t.id for t in session.curriculum if t.status == "completed"]
    n         = len(session.curriculum)
    overall   = round(sum(session.mastery.values()) / n, 1) if n else 0.0

    return {
        "session_id":        session_id,
        "mastery":           session.mastery,
        "completed_topics":  completed,
        "topics_remaining":  n - len(completed),
        "weak_areas":        session.weak_areas,
        "overall_score":     overall,
    }


async def _tool_get_dashboard(args: dict) -> dict:
    from datetime import datetime, timezone

    session_id = args.get("session_id", "")
    session    = await storage.get_session(session_id)
    if not session:
        raise ValueError(f"Session '{session_id}' not found")

    curriculum      = session.curriculum
    total           = len(curriculum)
    completed_count = sum(1 for t in curriculum if t.status == "completed")
    scores          = [qr.score for qr in session.quiz_results]
    avg_score       = round(sum(scores) / len(scores), 1) if scores else 0.0
    mastery_vals    = [session.mastery.get(t.id, 0.0) for t in curriculum]
    overall_mastery = round(sum(mastery_vals) / total, 1) if total else 0.0
    streak          = sum(1 for _ in
                        __import__("itertools").takewhile(
                            lambda t: t.status == "completed", curriculum))

    try:
        created  = datetime.fromisoformat(session.created_at.replace("Z", "+00:00"))
        days     = max(1.0, (datetime.now(timezone.utc) - created).total_seconds() / 86400)
        velocity = round(completed_count / days, 2)
    except Exception:
        velocity = 0.0

    return {
        "session_id":       session_id,
        "skill":            session.skill,
        "overall_progress": round(completed_count / total * 100, 1) if total else 0.0,
        "topics_completed": completed_count,
        "topics_remaining": total - completed_count,
        "total_topics":     total,
        "average_score":    avg_score,
        "overall_mastery":  overall_mastery,
        "streak":           streak,
        "velocity":         velocity,
        "curriculum_complete": completed_count == total and total > 0,
        "curriculum_adaptations": len(session.curriculum_versions),
    }


async def _tool_get_curriculum(args: dict) -> dict:
    session_id = args.get("session_id", "")
    session    = await storage.get_session(session_id)
    if not session:
        raise ValueError(f"Session '{session_id}' not found")

    return {
        "session_id": session_id,
        "skill":      session.skill,
        "curriculum": [
            {
                "id":                t.id,
                "title":             t.title,
                "description":       t.description,
                "order":             t.order,
                "status":            t.status,
                "estimated_minutes": t.estimated_minutes,
                "mastery":           session.mastery.get(t.id, 0.0),
            }
            for t in session.curriculum
        ],
        "curriculum_versions": len(session.curriculum_versions),
    }


async def _tool_get_resources(args: dict) -> dict:
    session_id = args.get("session_id", "")
    topic_id   = args.get("topic_id", "")
    session    = await storage.get_session(session_id)
    if not session:
        raise ValueError(f"Session '{session_id}' not found")

    resources = session.resources.get(topic_id, [])
    topic_title = next(
        (t.title for t in session.curriculum if t.id == topic_id),
        topic_id,
    )

    return {
        "session_id": session_id,
        "topic_id":   topic_id,
        "topic":      topic_title,
        "resources":  resources,
        "count":      len(resources),
    }


_TOOL_HANDLERS = {
    "get_session":    _tool_get_session,
    "get_progress":   _tool_get_progress,
    "get_dashboard":  _tool_get_dashboard,
    "get_curriculum": _tool_get_curriculum,
    "get_resources":  _tool_get_resources,
}


# ── JSON-RPC helpers ──────────────────────────────────────────────

def _ok(id, result) -> dict:
    return {"jsonrpc": "2.0", "id": id, "result": result}


def _err(id, code: int, message: str) -> dict:
    return {"jsonrpc": "2.0", "id": id, "error": {"code": code, "message": message}}


# ── MCP endpoint ──────────────────────────────────────────────────

@router.post("")
async def mcp_dispatch(request: Request):
    """
    MCP JSON-RPC 2.0 endpoint.

    Accepts POST with Content-Type: application/json.
    Supports batch requests (list of RPC objects).
    """
    try:
        body = await request.json()
    except Exception:
        return JSONResponse(
            _err(None, -32700, "Parse error"),
            status_code=200,   # MCP always returns 200
        )

    # Batch request
    if isinstance(body, list):
        results = [await _handle_single(req) for req in body]
        return JSONResponse(results)

    # Single request
    result = await _handle_single(body)
    return JSONResponse(result)


async def _handle_single(req: dict) -> dict:
    if not isinstance(req, dict):
        return _err(None, -32600, "Invalid Request")

    req_id  = req.get("id")
    method  = req.get("method", "")
    params  = req.get("params", {})

    if req.get("jsonrpc") != "2.0":
        return _err(req_id, -32600, "Invalid Request: jsonrpc must be '2.0'")

    # ── initialize ────────────────────────────────────────────────
    if method == "initialize":
        return _ok(req_id, {
            "protocolVersion": "2024-11-05",
            "serverInfo":      _SERVER_INFO,
            "capabilities":    _CAPABILITIES,
        })

    # ── notifications/initialized (no response per spec) ─────────
    if method == "notifications/initialized":
        return _ok(req_id, None)

    # ── tools/list ───────────────────────────────────────────────
    if method == "tools/list":
        return _ok(req_id, {"tools": _TOOLS})

    # ── tools/call ───────────────────────────────────────────────
    if method == "tools/call":
        tool_name = params.get("name", "")
        tool_args = params.get("arguments", {})

        handler = _TOOL_HANDLERS.get(tool_name)
        if not handler:
            return _err(req_id, -32601, f"Tool not found: '{tool_name}'")

        try:
            data = await handler(tool_args)
            text = json.dumps(data, indent=2)
            return _ok(req_id, {
                "content": [{"type": "text", "text": text}]
            })
        except ValueError as exc:
            return _err(req_id, -32602, str(exc))
        except Exception as exc:
            logger.exception("MCP tool '%s' failed: %s", tool_name, exc)
            return _err(req_id, -32603, "Internal error")

    # ── unknown method ────────────────────────────────────────────
    return _err(req_id, -32601, f"Method not found: '{method}'")


@router.get("/info")
async def mcp_info():
    """MCP server capability manifest (non-RPC convenience endpoint)."""
    return {
        "protocol":    "MCP 2024-11-05",
        "transport":   "HTTP JSON-RPC 2.0",
        "endpoint":    "POST /mcp",
        "server":      _SERVER_INFO,
        "capabilities": _CAPABILITIES,
        "tools": [
            {"name": t["name"], "description": t["description"]}
            for t in _TOOLS
        ],
    }
