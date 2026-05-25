"""
Seed demo data for portfolio / local development.

Usage:
    cd backend
    python seed.py
"""

from database import engine, SessionLocal
from models import Base
from services.demo import ensure_demo_data


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        ensure_demo_data(db)
        print("Demo data synced successfully.")
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
