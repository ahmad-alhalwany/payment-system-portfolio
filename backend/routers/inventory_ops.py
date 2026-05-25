from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session

from database import get_db
from security import get_current_user
from services.inventory import build_inventory_csv, get_inventory_summary

router = APIRouter(tags=["Inventory"])


def _handle_error(exc: Exception) -> HTTPException:
    if isinstance(exc, PermissionError):
        return HTTPException(status_code=403, detail=str(exc))
    if isinstance(exc, ValueError):
        return HTTPException(status_code=400, detail=str(exc))
    return HTTPException(status_code=500, detail=str(exc))


@router.get("/inventory/summary/")
def inventory_summary(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    from_date: str | None = None,
    to_date: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    branch_id: int | None = None,
    currency: str | None = None,
    status: str | None = Query(None),
):
    try:
        return get_inventory_summary(
            db,
            current_user,
            from_date=from_date,
            to_date=to_date,
            start_date=start_date,
            end_date=end_date,
            branch_id=branch_id,
            currency=currency,
            status=status,
        )
    except Exception as exc:
        raise _handle_error(exc) from exc


@router.get("/inventory/export/csv/")
def inventory_export_csv(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    from_date: str | None = None,
    to_date: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    branch_id: int | None = None,
    currency: str | None = None,
    status: str | None = Query(None),
):
    try:
        data = get_inventory_summary(
            db,
            current_user,
            from_date=from_date,
            to_date=to_date,
            start_date=start_date,
            end_date=end_date,
            branch_id=branch_id,
            currency=currency,
            status=status,
        )
        csv_content = build_inventory_csv(data)
        return PlainTextResponse(
            content=csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=inventory-report.csv"},
        )
    except Exception as exc:
        raise _handle_error(exc) from exc
