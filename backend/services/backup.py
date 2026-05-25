import json
import os
import shutil
import subprocess
import tempfile
from datetime import datetime
from typing import Any, Dict
from urllib.parse import urlparse

from sqlalchemy.orm import Session

from config import settings
from models import Branch, BranchFund, BranchProfits, Notification, Transaction, User


def _parse_pg_url(url: str) -> Dict[str, str]:
    """Parse sqlalchemy postgres URL into pg connection params."""
    # postgresql+psycopg2://user:pass@host:port/db
    clean = url.replace("postgresql+psycopg2://", "postgresql://")
    parsed = urlparse(clean)
    return {
        "host": parsed.hostname or "localhost",
        "port": str(parsed.port or 5432),
        "user": parsed.username or "postgres",
        "password": parsed.password or "",
        "dbname": (parsed.path or "/paymentdb").lstrip("/"),
    }


def create_sql_backup() -> str:
    """Create PostgreSQL dump via pg_dump. Returns temp file path."""
    if not settings.database_url.startswith("postgresql"):
        raise RuntimeError("SQL backup requires PostgreSQL")

    pg = _parse_pg_url(settings.database_url)
    fd, path = tempfile.mkstemp(suffix=".sql")
    os.close(fd)

    env = os.environ.copy()
    if pg["password"]:
        env["PGPASSWORD"] = pg["password"]

    cmd = [
        "pg_dump",
        "-h", pg["host"],
        "-p", pg["port"],
        "-U", pg["user"],
        "-d", pg["dbname"],
        "-f", path,
        "--no-owner",
        "--no-acl",
    ]

    if not shutil.which("pg_dump"):
        os.remove(path)
        raise RuntimeError("pg_dump not found — install PostgreSQL client tools")

    result = subprocess.run(cmd, env=env, capture_output=True, text=True)
    if result.returncode != 0:
        os.remove(path)
        raise RuntimeError(result.stderr or "pg_dump failed")

    return path


def create_json_backup(db: Session) -> str:
    """Portable JSON backup (works without pg_dump)."""
    payload: Dict[str, Any] = {
        "exported_at": datetime.utcnow().isoformat(),
        "branches": [_row_to_dict(b) for b in db.query(Branch).all()],
        "users": [
            {**_row_to_dict(u), "password": u.password}
            for u in db.query(User).all()
        ],
        "transactions": [_row_to_dict(t) for t in db.query(Transaction).all()],
        "notifications": [_row_to_dict(n) for n in db.query(Notification).all()],
        "branch_funds": [_row_to_dict(f) for f in db.query(BranchFund).all()],
        "branch_profits": [_row_to_dict(p) for p in db.query(BranchProfits).all()],
    }

    fd, path = tempfile.mkstemp(suffix=".json")
    os.close(fd)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2, default=str)
    return path


def _row_to_dict(row: Any) -> Dict[str, Any]:
    return {c.name: getattr(row, c.name) for c in row.__table__.columns}
