from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from security import get_current_user
from services.branch_manager import get_branch_manager_dashboard

router = APIRouter(tags=["Branch Manager"])


@router.get("/branch-manager/dashboard/")
def branch_manager_dashboard(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    try:
        return get_branch_manager_dashboard(db, current_user)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
