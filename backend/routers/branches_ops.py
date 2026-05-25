from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import Branch
from schemas.branch_ops import FundOperationRequest, TaxRateRequest
from security import require_roles
from services.branch_funds import adjust_branch_funds

router = APIRouter(tags=["Branch Operations"])


def _get_branch_or_404(db: Session, branch_id: int) -> Branch:
    branch = db.query(Branch).filter(Branch.id == branch_id).first()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    return branch


def _invalidate_branch_cache(branch_id: int) -> None:
    try:
        from cache import cache, get_branch_cache_key

        cache.delete(get_branch_cache_key(branch_id))
    except Exception:
        pass


@router.post("/branches/{branch_id}/funds/")
def adjust_funds(
    branch_id: int,
    body: FundOperationRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles("director")),
):
    branch = _get_branch_or_404(db, branch_id)
    try:
        adjust_branch_funds(
            db,
            branch,
            amount=body.amount,
            currency=body.currency,
            operation=body.operation,
            description=body.description,
        )
        db.commit()
        db.refresh(branch)
        _invalidate_branch_cache(branch_id)
        return {
            "status": "success",
            "message": "Funds updated successfully",
            "branch_id": branch.id,
            "allocated_amount_syp": branch.allocated_amount_syp,
            "allocated_amount_usd": branch.allocated_amount_usd,
        }
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.delete("/api/branches/{branch_id}/tax_rate/")
def clear_tax_rate(
    branch_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles("director")),
):
    branch = _get_branch_or_404(db, branch_id)
    branch.tax_rate = 0.0
    db.commit()
    db.refresh(branch)
    _invalidate_branch_cache(branch_id)
    return {
        "status": "success",
        "id": branch.id,
        "tax_rate": 0.0,
        "message": "Tax rate cleared",
    }
