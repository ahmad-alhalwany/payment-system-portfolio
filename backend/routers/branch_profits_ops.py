from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db
from security import get_current_user
from services.branch_profits import get_branch_profits

router = APIRouter(tags=["Branch Manager Profits"])


@router.get("/branch-manager/profits/")
def branch_manager_profits(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    start_date: str | None = None,
    end_date: str | None = None,
    from_date: str | None = None,
    to_date: str | None = None,
    currency: str | None = Query(None),
    search: str | None = Query(None),
):
    try:
        return get_branch_profits(
            db,
            current_user,
            start_date=start_date,
            end_date=end_date,
            from_date=from_date,
            to_date=to_date,
            currency=currency,
            search=search,
        )
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
