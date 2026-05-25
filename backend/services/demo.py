"""Demo data and one-click demo login for portfolio mode."""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

from sqlalchemy.orm import Session

from models import Branch, Transaction, User
from security import hash_password

DEMO_PASSWORD = "demo123"
DEMO_TX_PREFIX = "DEMO-"

DEMO_BRANCHES = [
    {
        "branch_id": "BR-DAM",
        "name": "Damascus Branch",
        "location": "Al-Mezzeh",
        "governorate": "Damascus",
        "phone_number": "011-1234567",
        "allocated_amount_syp": 12_500_000,
        "allocated_amount_usd": 25_000,
        "tax_rate": 2.5,
    },
    {
        "branch_id": "BR-ALP",
        "name": "Aleppo Branch",
        "location": "Al-Aziziyah",
        "governorate": "Aleppo",
        "phone_number": "021-7654321",
        "allocated_amount_syp": 8_000_000,
        "allocated_amount_usd": 15_000,
        "tax_rate": 2.0,
    },
    {
        "branch_id": "BR-HMS",
        "name": "Homs Branch",
        "location": "Al-Inshaat",
        "governorate": "Homs",
        "phone_number": "031-4455667",
        "allocated_amount_syp": 4_500_000,
        "allocated_amount_usd": 8_000,
        "tax_rate": 2.25,
    },
]

DEMO_USERS = [
    {"username": "director", "role": "director", "branch_key": None},
    {"username": "manager", "role": "branch_manager", "branch_key": "BR-DAM"},
    {"username": "manager.hlb", "role": "branch_manager", "branch_key": "BR-ALP"},
    {"username": "employee", "role": "employee", "branch_key": "BR-DAM"},
    {"username": "employee2", "role": "employee", "branch_key": "BR-DAM"},
    {"username": "employee.hlb", "role": "employee", "branch_key": "BR-ALP"},
]

ROLE_TO_USERNAME = {
    "director": "director",
    "branch_manager": "manager",
    "employee": "employee",
}

# (index, sender, receiver, amount, benefited, tax_rate, currency, status, from_key, to_key, employee, days_ago, message)
_DEMO_TX_SPECS: list[tuple] = [
    (1, "Ahmad Mohammad", "Sara Ali", 500_000, 12_500, 2.5, "SYP", "processing", "BR-DAM", "BR-ALP", "employee", 0, "Family transfer"),
    (2, "Khaled Youssef", "Layla Hassan", 1_000, 20, 2.0, "USD", "completed", "BR-ALP", "BR-DAM", "employee.hlb", 1, "Personal transfer"),
    (3, "Omar Farouk", "Nour Al-Din", 750_000, 18_750, 2.5, "SYP", "completed", "BR-DAM", "BR-HMS", "employee", 2, "Business payment"),
    (4, "Rami Saleh", "Hala Karim", 2_500, 50, 2.0, "USD", "completed", "BR-DAM", "BR-ALP", "employee2", 3, "Supplier invoice"),
    (5, "Youssef Nasser", "Maya Haddad", 320_000, 8_000, 2.5, "SYP", "completed", "BR-DAM", "BR-ALP", "employee", 4, "Monthly support"),
    (6, "Fadi Awad", "Lina Omari", 1_800, 36, 2.0, "USD", "processing", "BR-ALP", "BR-DAM", "employee.hlb", 5, "Tuition fees"),
    (7, "Hassan Qasem", "Dina Murad", 1_200_000, 30_000, 2.5, "SYP", "completed", "BR-DAM", "BR-HMS", "employee2", 6, "Property payment"),
    (8, "Walid Hamdan", "Rana Suleiman", 900, 18, 2.0, "USD", "completed", "BR-HMS", "BR-DAM", "employee", 7, "Medical expenses"),
    (9, "Tarek Jabbour", "Salma Deeb", 450_000, 11_250, 2.5, "SYP", "pending", "BR-DAM", "BR-ALP", "employee", 8, "Awaiting approval"),
    (10, "Nabil Khoury", "Iman Saad", 3_000, 60, 2.0, "USD", "completed", "BR-DAM", "BR-ALP", "employee2", 10, "Export settlement"),
    (11, "Samir Ghannam", "Reem Fares", 680_000, 17_000, 2.5, "SYP", "completed", "BR-ALP", "BR-DAM", "employee.hlb", 12, "Rent payment"),
    (12, "Adel Mansour", "Huda Zein", 550_000, 13_750, 2.5, "SYP", "completed", "BR-DAM", "BR-HMS", "employee", 14, "Construction materials"),
    (13, "Karim Boutros", "Nada Elias", 1_500, 30, 2.0, "USD", "completed", "BR-HMS", "BR-ALP", "employee.hlb", 16, "Equipment purchase"),
    (14, "Issam Turk", "Yara Naim", 2_100_000, 52_500, 2.5, "SYP", "completed", "BR-DAM", "BR-ALP", "employee2", 18, "Wholesale order"),
    (15, "Ziad Malak", "Ruba Shahin", 750, 15, 2.0, "USD", "completed", "BR-ALP", "BR-HMS", "employee.hlb", 20, "Travel allowance"),
    (16, "Maher Daoud", "Suzan Antoun", 890_000, 22_250, 2.5, "SYP", "completed", "BR-HMS", "BR-DAM", "employee", 22, "Salary remittance"),
    (17, "Bassel Haddad", "Mira Tahan", 410_000, 10_250, 2.5, "SYP", "processing", "BR-DAM", "BR-ALP", "employee", 25, "In progress"),
    (18, "George Nassar", "Lama Rizk", 2_200, 44, 2.0, "USD", "completed", "BR-DAM", "BR-HMS", "employee2", 28, "Consulting fee"),
    (19, "Firas Alam", "Hind Barakat", 1_650_000, 41_250, 2.5, "SYP", "completed", "BR-ALP", "BR-DAM", "employee.hlb", 30, "Year-end bonus"),
    (20, "Anas Merhi", "Dalia Shams", 1_100, 22, 2.0, "USD", "pending", "BR-HMS", "BR-DAM", "employee", 2, "Pending verification"),
]


def _currency_label(code: str) -> str:
    return "USD" if code == "USD" else "ليرة سورية"


def _mobile(seed: int) -> str:
    return f"09{seed % 10}{seed:08d}"[:10]


def _ensure_branches(db: Session) -> dict[str, Branch]:
    branches: dict[str, Branch] = {}
    for data in DEMO_BRANCHES:
        branch = db.query(Branch).filter(Branch.branch_id == data["branch_id"]).first()
        if branch is None:
            branch = Branch(**data)
            db.add(branch)
            db.flush()
        else:
            for field, value in data.items():
                setattr(branch, field, value)
        branches[data["branch_id"]] = branch
    return branches


def _ensure_demo_users(db: Session, branches: dict[str, Branch]) -> dict[str, User]:
    hashed = hash_password(DEMO_PASSWORD)
    users: dict[str, User] = {}
    for user_data in DEMO_USERS:
        branch_id = branches[user_data["branch_key"]].id if user_data["branch_key"] else None
        user = db.query(User).filter(User.username == user_data["username"]).first()
        if user is None:
            user = User(
                username=user_data["username"],
                password=hashed,
                role=user_data["role"],
                branch_id=branch_id,
            )
            db.add(user)
        else:
            user.password = hashed
            user.role = user_data["role"]
            user.branch_id = branch_id
        users[user_data["username"]] = user
    db.flush()
    return users


def _build_transaction_row(
    spec: tuple,
    branches: dict[str, Branch],
    users: dict[str, User],
) -> dict[str, Any]:
    (
        index,
        sender,
        receiver,
        amount,
        benefited,
        tax_rate,
        currency_code,
        status,
        from_key,
        to_key,
        employee_username,
        days_ago,
        message,
    ) = spec

    tax_amount = round(benefited * (tax_rate / 100), 2)
    base_amount = amount - benefited
    branch = branches[from_key]
    dest = branches[to_key]
    employee = users[employee_username]
    currency = _currency_label(currency_code)
    tx_date = datetime.now() - timedelta(days=days_ago, hours=index % 6)
    is_completed = status == "completed"
    is_received = is_completed and (index % 4 != 0)

    return {
        "id": f"{DEMO_TX_PREFIX}{index:04d}",
        "sender": sender,
        "sender_mobile": _mobile(1000 + index),
        "sender_governorate": branch.governorate,
        "sender_location": branch.location,
        "receiver": receiver,
        "receiver_mobile": _mobile(2000 + index),
        "receiver_governorate": dest.governorate,
        "amount": float(amount),
        "base_amount": float(base_amount),
        "benefited_amount": float(benefited),
        "currency": currency,
        "message": message,
        "branch_id": branch.id,
        "destination_branch_id": dest.id,
        "tax_amount": tax_amount,
        "tax_rate": float(tax_rate),
        "employee_id": employee.id,
        "employee_name": employee.username,
        "branch_governorate": branch.governorate,
        "status": status,
        "is_received": is_received if is_completed else False,
        "received_at": tx_date + timedelta(hours=4) if is_completed and is_received else None,
        "date": tx_date,
    }


def _ensure_sample_transactions(
    db: Session,
    branches: dict[str, Branch],
    users: dict[str, User],
) -> None:
    for spec in _DEMO_TX_SPECS:
        row = _build_transaction_row(spec, branches, users)
        existing = db.query(Transaction).filter(Transaction.id == row["id"]).first()
        if existing is None:
            db.add(Transaction(**row))
        else:
            for key, value in row.items():
                setattr(existing, key, value)


def ensure_demo_data(db: Session) -> None:
    """Create or refresh demo accounts, branches, employees, and sample transfers."""
    branches = _ensure_branches(db)
    users = _ensure_demo_users(db, branches)
    _ensure_sample_transactions(db, branches, users)
    db.commit()


def get_demo_user_by_role(db: Session, role: str) -> User | None:
    username = ROLE_TO_USERNAME.get(role)
    if not username:
        return None
    return db.query(User).filter(User.username == username).first()


def demo_data_summary(db: Session) -> dict[str, int]:
    """Counts for health checks / seed script output."""
    return {
        "branches": db.query(Branch).count(),
        "users": db.query(User).count(),
        "transactions": db.query(Transaction).filter(Transaction.id.like(f"{DEMO_TX_PREFIX}%")).count(),
    }
