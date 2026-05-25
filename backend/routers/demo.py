from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from config import settings
from database import get_db
from models import User
from schemas.demo import DemoLoginRequest
from security import create_access_token
from services.demo import ensure_demo_data, get_demo_user_by_role

router = APIRouter(tags=["Demo"])


def _login_response(user: User) -> dict:
    token_data = {
        "username": user.username,
        "role": user.role,
        "branch_id": user.branch_id,
        "user_id": user.id,
    }
    access_token = create_access_token(token_data)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "username": user.username,
        "branch_id": user.branch_id,
        "user_id": user.id,
        "token": access_token,
    }


@router.post("/demo/login/")
def demo_login(body: DemoLoginRequest, db: Session = Depends(get_db)):
    if not settings.demo_mode:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Demo login is disabled")

    try:
        ensure_demo_data(db)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database unavailable: {exc}",
        ) from exc

    user = get_demo_user_by_role(db, body.role)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Demo user not found")

    return _login_response(user)


@router.get("/demo/accounts/")
def demo_accounts():
    if not settings.demo_mode:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Demo mode is disabled")

    return {
        "password": "demo123",
        "accounts": [
            {"role": "director", "username": "director", "dashboard": "/dashboard/director"},
            {"role": "branch_manager", "username": "manager", "dashboard": "/branch-dashboard"},
            {"role": "employee", "username": "employee", "dashboard": "/money-transfer"},
        ],
    }
