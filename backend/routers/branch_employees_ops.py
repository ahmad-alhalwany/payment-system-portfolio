from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db
from security import get_current_user
from services.branch_employees import get_branch_employees

router = APIRouter(tags=["Branch Manager Employees"])


@router.get("/branch-manager/employees/")
def branch_manager_employees(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    search: str | None = Query(None),
    status: str | None = Query(None, description="active | inactive"),
):
    try:
        return get_branch_employees(db, current_user, search=search, status=status)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
