from fastapi import APIRouter

from config import settings
from database import check_db_connection

router = APIRouter(tags=["Health"])


@router.get("/health")
def health_check():
    db_ok = check_db_connection()
    return {
        "status": "ok" if db_ok else "degraded",
        "environment": settings.environment,
        "database": "connected" if db_ok else "disconnected",
    }


@router.get("/")
def root():
    return {
        "name": "Payment Transfer System API",
        "docs": "/docs",
        "health": "/health",
    }
