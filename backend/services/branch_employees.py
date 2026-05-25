from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from models import Branch, User
from services.users import compute_user_active, serialize_user, serialize_users


def _require_branch_manager(current_user: dict) -> int:
    if current_user.get("role") != "branch_manager":
        raise PermissionError("Branch manager access required")
    branch_id = current_user.get("branch_id")
    if not branch_id:
        raise ValueError("Branch ID is required")
    return int(branch_id)


def get_branch_employees(
    db: Session,
    current_user: dict,
    *,
    search: str | None = None,
    status: str | None = None,
) -> dict[str, Any]:
    branch_id = _require_branch_manager(current_user)

    branch = db.query(Branch).filter(Branch.id == branch_id).first()
    if not branch:
        raise ValueError("Branch not found")

    query = db.query(User).filter(User.branch_id == branch_id, User.role == "employee")

    if search and search.strip():
        query = query.filter(User.username.ilike(f"%{search.strip()}%"))

    users = query.order_by(User.created_at.desc()).all()

    if status == "active":
        users = [u for u in users if compute_user_active(u)]
    elif status == "inactive":
        users = [u for u in users if not compute_user_active(u)]

    all_employees = db.query(User).filter(User.branch_id == branch_id, User.role == "employee").all()
    active_count = sum(1 for u in all_employees if compute_user_active(u))

    return {
        "branch": {
            "id": branch.id,
            "name": branch.name,
            "location": branch.location,
            "governorate": branch.governorate,
        },
        "stats": {
            "total": len(all_employees),
            "active": active_count,
            "inactive": len(all_employees) - active_count,
        },
        "items": serialize_users(db, users),
        "manager": {
            "username": current_user.get("username"),
            "role": current_user.get("role"),
        },
    }
