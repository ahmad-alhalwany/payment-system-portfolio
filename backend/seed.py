"""
Seed demo data for portfolio / local development.

Usage:
    cd backend
    python seed.py
"""

from database import engine, SessionLocal
from models import Base
from services.demo import ensure_demo_data, demo_data_summary


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        ensure_demo_data(db)
        counts = demo_data_summary(db)
        print("Demo data synced successfully.")
        print("")
        print(f"  Branches:     {counts['branches']}")
        print(f"  Users:        {counts['users']}")
        print(f"  Transfers:    {counts['transactions']} (DEMO-* IDs)")
        print("")
        print("Demo login accounts (password for all: demo123):")
        print("  director  — System director")
        print("  manager   — Damascus branch manager")
        print("  employee  — Damascus transfer clerk")
        print("")
        print("Additional seeded users (same password): manager.hlb, employee2, employee.hlb")
    except Exception as exc:
        db.rollback()
        raise exc
    finally:
        db.close()


if __name__ == "__main__":
    seed()
