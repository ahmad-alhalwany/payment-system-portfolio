from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from config import settings
from database import get_db
from models import Branch, User
from schemas.auth import ChangePassword, LoginRequest, PasswordReset, UserCreate
from security import create_access_token, get_current_user, hash_password, verify_password

router = APIRouter(tags=["Auth"])


@router.post("/login/")
async def login(request: Request, user: LoginRequest, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user and verify_password(user.password, db_user.password):
        token_data = {
            "username": db_user.username,
            "role": db_user.role,
            "branch_id": db_user.branch_id,
            "user_id": db_user.id,
        }
        access_token = create_access_token(token_data)
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "role": db_user.role,
            "username": db_user.username,
            "branch_id": db_user.branch_id,
            "user_id": db_user.id,
            "token": access_token,
        }
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect username or password",
        headers={"WWW-Authenticate": "Bearer"},
    )


@router.post("/register/")
def register_user(
    user: UserCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    role = current_user["role"]
    branch_id = current_user["branch_id"]

    if role not in ["director", "branch_manager"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    if role == "branch_manager" and (user.role != "employee" or user.branch_id != branch_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Branch managers can only create employees for their own branch",
        )

    existing_user = db.query(User).filter(User.username == user.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")

    if user.branch_id:
        branch = db.query(Branch).filter(Branch.id == user.branch_id).first()
        if not branch:
            raise HTTPException(status_code=404, detail="Branch not found")

    db_user = User(
        username=user.username,
        password=hash_password(user.password),
        role=user.role,
        branch_id=user.branch_id,
        created_at=datetime.now(),
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    branch_name = None
    if db_user.branch_id:
        branch = db.query(Branch).filter(Branch.id == db_user.branch_id).first()
        branch_name = branch.name if branch else None
    return {
        "id": db_user.id,
        "username": db_user.username,
        "role": db_user.role,
        "branch_id": db_user.branch_id,
        "branch_name": branch_name,
        "created_at": db_user.created_at.strftime("%Y-%m-%d %H:%M:%S") if db_user.created_at else None,
    }


@router.post("/reset-password/")
def reset_password(
    reset_data: PasswordReset,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if current_user["role"] not in ["director", "branch_manager"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    user = db.query(User).filter(User.username == reset_data.username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if current_user["role"] == "branch_manager" and (
        user.role != "employee" or user.branch_id != current_user["branch_id"]
    ):
        raise HTTPException(status_code=403, detail="You can only reset passwords for employees in your branch")

    user.password = hash_password(reset_data.new_password)
    db.commit()
    return {"status": "success", "message": "Password reset successfully"}


@router.post("/change-password/")
def change_password(
    password_data: ChangePassword,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = db.query(User).filter(User.username == current_user["username"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_password(password_data.old_password, user.password):
        raise HTTPException(status_code=400, detail="Incorrect old password")

    user.password = hash_password(password_data.new_password)
    db.commit()
    return {"status": "success", "message": "Password changed successfully"}


def apply_login_rate_limit(app, limiter) -> None:
    if limiter is None:
        return
    for route in app.routes:
        path = getattr(route, "path", None)
        methods = getattr(route, "methods", set()) or set()
        if path == "/login/" and "POST" in methods and hasattr(route, "endpoint"):
            route.endpoint = limiter.limit(settings.login_rate_limit)(route.endpoint)
