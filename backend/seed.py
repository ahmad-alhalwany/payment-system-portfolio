"""
Seed demo data for portfolio / local development.

Usage:
    cd backend
    python seed.py
"""

from datetime import datetime, timedelta
import uuid

from database import engine, SessionLocal
from models import Base, User, Branch, Transaction
from security import hash_password

DEMO_PASSWORD = "demo123"

DEMO_USERS = [
    {"username": "director", "role": "director", "branch_key": None},
    {"username": "manager", "role": "branch_manager", "branch_key": "BR-DAM"},
    {"username": "employee", "role": "employee", "branch_key": "BR-DAM"},
]

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


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        if db.query(User).filter(User.username == "director").first():
            print("Demo data already exists — skipping seed.")
            return

        branches = {}
        for data in DEMO_BRANCHES:
            branch = Branch(**data)
            db.add(branch)
            db.flush()
            branches[data["branch_id"]] = branch

        for user_data in DEMO_USERS:
            branch_id = None
            if user_data["branch_key"]:
                branch_id = branches[user_data["branch_key"]].id

            db.add(
                User(
                    username=user_data["username"],
                    password=hash_password(DEMO_PASSWORD),
                    role=user_data["role"],
                    branch_id=branch_id,
                )
            )

        damascus = branches["BR-DAM"]
        aleppo = branches["BR-ALP"]
        employee = db.query(User).filter(User.username == "employee").first()

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

        db.commit()
        print("Demo data seeded successfully.")
        print("")
        print("Demo accounts (password for all: demo123):")
        print("  director  — مدير النظام")
        print("  manager   — مدير فرع دمشق")
        print("  employee  — موظف حوالات")
    except Exception as exc:
        db.rollback()
        raise exc
    finally:
        db.close()


if __name__ == "__main__":
    seed()
