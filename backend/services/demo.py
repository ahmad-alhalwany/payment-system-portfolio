"""Demo data and one-click demo login for portfolio mode."""

from __future__ import annotations

from datetime import datetime, timedelta
import uuid

from sqlalchemy.orm import Session

from models import Branch, Transaction, User
from security import hash_password

DEMO_PASSWORD = "demo123"

DEMO_BRANCHES = [
    {
        "branch_id": "BR-DAM",
        "name": "فرع دمشق",
        "location": "المزة",
        "governorate": "دمشق",
        "phone_number": "011-1234567",
        "allocated_amount_syp": 5_000_000,
        "allocated_amount_usd": 10_000,
        "tax_rate": 2.5,
    },
    {
        "branch_id": "BR-ALP",
        "name": "فرع حلب",
        "location": "العزيزية",
        "governorate": "حلب",
        "phone_number": "021-7654321",
        "allocated_amount_syp": 3_000_000,
        "allocated_amount_usd": 5_000,
        "tax_rate": 2.0,
    },
]

DEMO_USERS = [
    {"username": "director", "role": "director", "branch_key": None},
    {"username": "manager", "role": "branch_manager", "branch_key": "BR-DAM"},
    {"username": "employee", "role": "employee", "branch_key": "BR-DAM"},
]

ROLE_TO_USERNAME = {
    "director": "director",
    "branch_manager": "manager",
    "employee": "employee",
}


def _ensure_branches(db: Session) -> dict[str, Branch]:
    branches: dict[str, Branch] = {}
    for data in DEMO_BRANCHES:
        branch = db.query(Branch).filter(Branch.branch_id == data["branch_id"]).first()
        if branch is None:
            branch = Branch(**data)
            db.add(branch)
            db.flush()
        branches[data["branch_id"]] = branch
    return branches


def _ensure_demo_users(db: Session, branches: dict[str, Branch]) -> None:
    hashed = hash_password(DEMO_PASSWORD)
    for user_data in DEMO_USERS:
        branch_id = branches[user_data["branch_key"]].id if user_data["branch_key"] else None
        user = db.query(User).filter(User.username == user_data["username"]).first()
        if user is None:
            db.add(
                User(
                    username=user_data["username"],
                    password=hashed,
                    role=user_data["role"],
                    branch_id=branch_id,
                )
            )
        else:
            user.password = hashed
            user.role = user_data["role"]
            user.branch_id = branch_id


def _ensure_sample_transactions(db: Session, branches: dict[str, Branch]) -> None:
    if db.query(Transaction).count() > 0:
        return

    employee = db.query(User).filter(User.username == "employee").first()
    if employee is None:
        return

    damascus = branches["BR-DAM"]
    aleppo = branches["BR-ALP"]
    sample_transactions = [
        {
            "id": str(uuid.uuid4())[:8].upper(),
            "sender": "أحمد محمد",
            "sender_mobile": "0991234567",
            "sender_governorate": "دمشق",
            "sender_location": "المزة",
            "receiver": "سارة علي",
            "receiver_mobile": "0997654321",
            "receiver_governorate": "حلب",
            "amount": 500_000,
            "base_amount": 487_500,
            "benefited_amount": 12_500,
            "currency": "ليرة سورية",
            "message": "حوالة عائلية",
            "branch_id": damascus.id,
            "destination_branch_id": aleppo.id,
            "employee_id": employee.id,
            "employee_name": "employee",
            "branch_governorate": "دمشق",
            "tax_amount": 12_500,
            "tax_rate": 2.5,
            "status": "processing",
            "date": datetime.now() - timedelta(hours=2),
        },
        {
            "id": str(uuid.uuid4())[:8].upper(),
            "sender": "خالد يوسف",
            "sender_mobile": "0981112233",
            "sender_governorate": "حلب",
            "sender_location": "العزيزية",
            "receiver": "ليلى حسن",
            "receiver_mobile": "0989988776",
            "receiver_governorate": "دمشق",
            "amount": 1_000,
            "base_amount": 980,
            "benefited_amount": 20,
            "currency": "دولار أمريكي",
            "message": "تحويل شخصي",
            "branch_id": aleppo.id,
            "destination_branch_id": damascus.id,
            "employee_id": employee.id,
            "employee_name": "employee",
            "branch_governorate": "حلب",
            "tax_amount": 20,
            "tax_rate": 2.0,
            "status": "completed",
            "is_received": True,
            "received_at": datetime.now() - timedelta(hours=1),
            "date": datetime.now() - timedelta(days=1),
        },
    ]
    for tx in sample_transactions:
        db.add(Transaction(**tx))


def ensure_demo_data(db: Session) -> None:
    """Create or refresh demo accounts — always resets demo passwords."""
    branches = _ensure_branches(db)
    _ensure_demo_users(db, branches)
    _ensure_sample_transactions(db, branches)
    db.commit()


def get_demo_user_by_role(db: Session, role: str) -> User | None:
    username = ROLE_TO_USERNAME.get(role)
    if not username:
        return None
    return db.query(User).filter(User.username == username).first()
