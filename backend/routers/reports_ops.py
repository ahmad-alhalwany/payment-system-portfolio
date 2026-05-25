from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db
from security import get_current_user
from services.reports import (
    get_branch_report,
    get_daily_report,
    get_employees_report,
    get_transactions_report,
)

router = APIRouter(tags=["Reports"])


def _handle_report_error(exc: Exception) -> HTTPException:
    if isinstance(exc, PermissionError):
        return HTTPException(status_code=403, detail=str(exc))
    if isinstance(exc, ValueError):
        return HTTPException(status_code=400, detail=str(exc))
    return HTTPException(status_code=500, detail=str(exc))


@router.get("/reports/transactions/")
def transactions_report(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    from_date: str | None = None,
    to_date: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    status: str | None = None,
    transfer_type: str | None = Query(None, alias="type"),
    branch_id: int | None = None,
    destination_branch_id: int | None = None,
    currency: str | None = None,
    search: str | None = None,
    page: int = 1,
    per_page: int = 50,
):
    try:
        return get_transactions_report(
            db,
            current_user,
            from_date=from_date,
            to_date=to_date,
            start_date=start_date,
            end_date=end_date,
            status=status,
            transfer_type=transfer_type,
            type_=transfer_type,
            branch_id=branch_id,
            destination_branch_id=destination_branch_id,
            currency=currency,
            search=search,
            page=page,
            per_page=per_page,
        )
    except Exception as exc:
        raise _handle_report_error(exc) from exc


@router.get("/reports/branches/")
def branches_report(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    from_date: str | None = None,
    to_date: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
):
    try:
        return get_branch_report(
            db,
            current_user,
            from_date=from_date,
            to_date=to_date,
            start_date=start_date,
            end_date=end_date,
        )
    except Exception as exc:
        raise _handle_report_error(exc) from exc


@router.get("/reports/employees/")
def employees_report(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    branch_id: int | None = None,
    status: str | None = None,
    employee_status: str | None = None,
    role: str | None = None,
    employee_role: str | None = None,
    search: str | None = None,
    page: int = 1,
    per_page: int = 50,
):
    try:
        return get_employees_report(
            db,
            current_user,
            branch_id=branch_id,
            status=status,
            employee_status=employee_status,
            role=role,
            employee_role=employee_role,
            search=search,
            page=page,
            per_page=per_page,
        )
    except Exception as exc:
        raise _handle_report_error(exc) from exc


@router.get("/reports/daily/")
def daily_report(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    from_date: str | None = None,
    to_date: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
):
    try:
        return get_daily_report(
            db,
            current_user,
            from_date=from_date,
            to_date=to_date,
            start_date=start_date,
            end_date=end_date,
        )
    except Exception as exc:
        raise _handle_report_error(exc) from exc
