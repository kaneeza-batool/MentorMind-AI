"""
Shared request validators used across routers.
"""
import re
from fastapi import HTTPException

_UUID_RE = re.compile(
    r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
    re.IGNORECASE,
)


def validate_session_id(session_id: str) -> str:
    """Raise 400 if session_id is not a valid UUID. Returns the id unchanged."""
    if not session_id or not _UUID_RE.match(session_id.strip()):
        raise HTTPException(status_code=400, detail="Invalid session_id format.")
    return session_id.strip()
