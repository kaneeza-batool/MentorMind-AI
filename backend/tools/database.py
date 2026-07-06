"""
SQLite persistence layer using aiosqlite.

Single `sessions` table; complex fields stored as JSON columns.
WAL mode enabled for improved read/write concurrency.
"""
import json
import logging
from pathlib import Path

import aiosqlite

from config import settings

logger = logging.getLogger(__name__)

_DB_PATH = settings.DB_PATH

_CREATE_TABLE = """
CREATE TABLE IF NOT EXISTS sessions (
    id                  TEXT PRIMARY KEY,
    skill               TEXT NOT NULL,
    goal                TEXT NOT NULL,
    level               TEXT NOT NULL,
    curriculum          TEXT NOT NULL DEFAULT '[]',
    quiz_results        TEXT NOT NULL DEFAULT '[]',
    mastery             TEXT NOT NULL DEFAULT '{}',
    weak_areas          TEXT NOT NULL DEFAULT '[]',
    lesson_history      TEXT NOT NULL DEFAULT '{}',
    reflections         TEXT NOT NULL DEFAULT '{}',
    resources           TEXT NOT NULL DEFAULT '{}',
    curriculum_versions TEXT NOT NULL DEFAULT '[]',
    study_time          TEXT NOT NULL DEFAULT '{}',
    created_at          TEXT NOT NULL,
    updated_at          TEXT NOT NULL
)
"""


async def init_db() -> None:
    """Create the database and tables. Called once at app startup."""
    Path(_DB_PATH).parent.mkdir(parents=True, exist_ok=True)
    async with aiosqlite.connect(_DB_PATH) as db:
        await db.execute("PRAGMA journal_mode=WAL")
        await db.execute("PRAGMA synchronous=NORMAL")
        await db.execute(_CREATE_TABLE)
        await db.commit()
    logger.info("SQLite database ready at %s", _DB_PATH)


async def db_save(session_data: dict) -> None:
    """Insert or replace a session record."""
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc).isoformat()

    async with aiosqlite.connect(_DB_PATH) as db:
        await db.execute("""
            INSERT INTO sessions (
                id, skill, goal, level,
                curriculum, quiz_results, mastery, weak_areas,
                lesson_history, reflections, resources,
                curriculum_versions, study_time,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                curriculum          = excluded.curriculum,
                quiz_results        = excluded.quiz_results,
                mastery             = excluded.mastery,
                weak_areas          = excluded.weak_areas,
                lesson_history      = excluded.lesson_history,
                reflections         = excluded.reflections,
                resources           = excluded.resources,
                curriculum_versions = excluded.curriculum_versions,
                study_time          = excluded.study_time,
                updated_at          = excluded.updated_at
        """, (
            session_data["id"],
            session_data["skill"],
            session_data["goal"],
            session_data["level"],
            json.dumps(session_data.get("curriculum", [])),
            json.dumps(session_data.get("quiz_results", [])),
            json.dumps(session_data.get("mastery", {})),
            json.dumps(session_data.get("weak_areas", [])),
            json.dumps(session_data.get("lesson_history", {})),
            json.dumps(session_data.get("reflections", {})),
            json.dumps(session_data.get("resources", {})),
            json.dumps(session_data.get("curriculum_versions", [])),
            json.dumps(session_data.get("study_time", {})),
            session_data.get("created_at", now),
            now,
        ))
        await db.commit()


async def db_load(session_id: str) -> dict | None:
    """Load a session from SQLite. Returns None if not found."""
    async with aiosqlite.connect(_DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM sessions WHERE id = ?", (session_id,)
        ) as cursor:
            row = await cursor.fetchone()

    if not row:
        return None

    return {
        "id":                  row["id"],
        "skill":               row["skill"],
        "goal":                row["goal"],
        "level":               row["level"],
        "curriculum":          json.loads(row["curriculum"]),
        "quiz_results":        json.loads(row["quiz_results"]),
        "mastery":             json.loads(row["mastery"]),
        "weak_areas":          json.loads(row["weak_areas"]),
        "lesson_history":      json.loads(row["lesson_history"]),
        "reflections":         json.loads(row["reflections"]),
        "resources":           json.loads(row["resources"]),
        "curriculum_versions": json.loads(row["curriculum_versions"]),
        "study_time":          json.loads(row["study_time"]),
        "created_at":          row["created_at"],
    }


async def db_delete(session_id: str) -> None:
    """Delete a session from SQLite."""
    async with aiosqlite.connect(_DB_PATH) as db:
        await db.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
        await db.commit()
