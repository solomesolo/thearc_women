"""Database connection for workers (same Postgres as Prisma)."""
from __future__ import annotations

import os
import uuid
from contextlib import contextmanager
from pathlib import Path

# Load env from project root
_root = Path(__file__).resolve().parent.parent
try:
    from dotenv import load_dotenv
    if (_root / ".env").exists():
        load_dotenv(_root / ".env")
    if (_root / ".env.local").exists():
        load_dotenv(_root / ".env.local", override=True)
except ImportError:
    pass

def _get_connection():
    import psycopg2
    # Use DIRECT_URL for workers (session mode); DATABASE_URL may have pgbouncer params psycopg2 rejects
    url = os.environ.get("DIRECT_URL") or os.environ.get("DATABASE_URL")
    if not url:
        raise ValueError("DIRECT_URL or DATABASE_URL required")
    return psycopg2.connect(url)


@contextmanager
def get_conn():
    conn = _get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def uuid4_str():
    return str(uuid.uuid4())
