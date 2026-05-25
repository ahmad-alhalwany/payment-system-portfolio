from sqlalchemy.orm import Session

from models import Branch, User

VALID_ROLES = {"director", "branch_manager", "employee"}
CREATABLE_ROLES = {"employee", "branch_manager"}


def compute_user_active(user: User) -> bool:
    if user.role == "director":
        return True
    return user.branch_id is not None


def serialize_user(user: User, branch: Branch | None = None) -> dict:
    branch_name = branch.name if branch else None
    return {
        "id": user.id,
        "username": user.username,
        "role": user.role,
        "branch_id": user.branch_id,
        "branch_name": branch_name,
        "created_at": user.created_at.strftime("%Y-%m-%d %H:%M:%S") if user.created_at else None,
        "is_active": compute_user_active(user),
    }


def load_branch_map(db: Session, users: list[User]) -> dict[int, Branch]:
    branch_ids = {u.branch_id for u in users if u.branch_id}
    if not branch_ids:
        return {}
    branches = db.query(Branch).filter(Branch.id.in_(branch_ids)).all()
    return {b.id: b for b in branches}


def serialize_users(db: Session, users: list[User]) -> list[dict]:
    branch_map = load_branch_map(db, users)
    return [serialize_user(u, branch_map.get(u.branch_id)) for u in users]


def validate_user_create(current_user: dict, role: str, branch_id: int | None) -> None:
    if role not in CREATABLE_ROLES and current_user["role"] == "branch_manager":
        raise ValueError("Branch managers can only create employees")
    if current_user["role"] == "branch_manager":
        if role != "employee":
            raise ValueError("Branch managers can only create employees")
        if branch_id != current_user.get("branch_id"):
            raise ValueError("Branch managers can only assign employees to their own branch")
    if role in ("employee", "branch_manager") and not branch_id:
        raise ValueError("Branch is required for this role")


def validate_user_delete(current_user: dict, target: User) -> None:
    if target.role == "director":
        raise ValueError("Directors cannot be deleted")
    if current_user.get("user_id") == target.id:
        raise ValueError("You cannot delete your own account")
    if current_user["role"] == "branch_manager":
        if target.role != "employee" or target.branch_id != current_user.get("branch_id"):
            raise ValueError("You can only delete employees in your branch")
