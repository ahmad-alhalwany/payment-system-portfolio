from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session, aliased

from database import get_db
from models import Branch, Notification, Transaction
from schemas.transaction_ops import TransactionStatusPatch, TransactionUpdateRequest, TransferPreviewRequest
from security import get_current_user
from services.transactions import (
    apply_status_change,
    can_modify_transaction,
    serialize_transaction,
)
from services.transfer_preview import (
    compute_transfer_fees,
    get_branch_balance,
    normalize_currency,
    validate_transfer_amounts,
)
from services.settings_store import load_system_settings

router = APIRouter(tags=["Transaction Operations"])


def _get_transaction_with_branches(db: Session, transaction_id: str):
    sending = aliased(Branch)
    destination = aliased(Branch)
    result = (
        db.query(Transaction, sending.name, destination.name)
        .outerjoin(sending, Transaction.branch_id == sending.id)
        .outerjoin(destination, Transaction.destination_branch_id == destination.id)
        .filter(Transaction.id == transaction_id)
        .first()
    )
    if not result:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return result


@router.put("/transactions/{transaction_id}/")
def update_transaction(
    transaction_id: str,
    body: TransactionUpdateRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    transaction, sending_name, dest_name = _get_transaction_with_branches(db, transaction_id)
    try:
        can_modify_transaction(current_user, transaction)
    except ValueError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc

    updates = body.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    for key, value in updates.items():
        if value is not None:
            setattr(transaction, key, value)

    db.commit()
    db.refresh(transaction)
    return serialize_transaction(transaction, sending_branch_name=sending_name, destination_branch_name=dest_name)


@router.patch("/transactions/{transaction_id}/status/")
def patch_transaction_status(
    transaction_id: str,
    body: TransactionStatusPatch,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    transaction, sending_name, dest_name = _get_transaction_with_branches(db, transaction_id)
    try:
        can_modify_transaction(current_user, transaction)
        apply_status_change(db, transaction, body.status)
    except ValueError as exc:
        code = 400 if "Invalid status" in str(exc) else 403
        raise HTTPException(status_code=code, detail=str(exc)) from exc

    notification_status = {
        "completed": "sent",
        "cancelled": "failed",
        "rejected": "failed",
        "processing": "pending",
        "pending": "pending",
    }.get(body.status, "pending")

    notification = db.query(Notification).filter(Notification.transaction_id == transaction_id).first()
    if notification:
        notification.status = notification_status

    db.commit()
    db.refresh(transaction)
    return {
        "status": "success",
        "message": "Status updated successfully",
        "transaction": serialize_transaction(
            transaction,
            sending_branch_name=sending_name,
            destination_branch_name=dest_name,
        ),
    }


@router.get("/money-transfer/summary/")
def money_transfer_summary(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    role = current_user.get("role", "employee")
    branch_id = current_user.get("branch_id")
    username = current_user.get("username", "")

    branch_name = None
    if branch_id:
        branch = db.query(Branch).filter(Branch.id == branch_id).first()
        branch_name = branch.name if branch else None

    outgoing_query = db.query(func.count(Transaction.id))
    incoming_query = db.query(func.count(Transaction.id))

    if role == "employee" and branch_id:
        outgoing_query = outgoing_query.filter(Transaction.branch_id == branch_id)
        incoming_query = incoming_query.filter(Transaction.destination_branch_id == branch_id)
    elif role == "branch_manager" and branch_id:
        outgoing_query = outgoing_query.filter(
            (Transaction.branch_id == branch_id) | (Transaction.destination_branch_id == branch_id)
        )
        incoming_query = incoming_query.filter(Transaction.destination_branch_id == branch_id)
    else:
        outgoing_query = outgoing_query.filter(Transaction.branch_id.isnot(None))
        incoming_query = incoming_query.filter(Transaction.destination_branch_id.isnot(None))

    return {
        "username": username,
        "role": role,
        "branch_id": branch_id,
        "branch_name": branch_name,
        "outgoing_count": outgoing_query.scalar() or 0,
        "incoming_count": incoming_query.scalar() or 0,
    }


@router.post("/money-transfer/preview/")
def preview_transfer(
    body: TransferPreviewRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    sending_id = body.sending_branch_id or current_user.get("branch_id")
    sending_branch = db.query(Branch).filter(Branch.id == sending_id).first() if sending_id else None

    dest_branch = None
    if body.destination_branch_id:
        dest_branch = db.query(Branch).filter(Branch.id == body.destination_branch_id).first()
        if not dest_branch:
            raise HTTPException(status_code=404, detail="Destination branch not found")

    tax_rate = sending_branch.tax_rate if sending_branch else 0.0
    fees = compute_transfer_fees(body.benefited_amount or body.amount, tax_rate)
    balance = get_branch_balance(sending_branch, body.currency)
    errors = validate_transfer_amounts(
        body.amount,
        body.benefited_amount or 0,
        balance,
        load_system_settings(),
    )

    return {
        "tax_rate": fees["tax_rate"],
        "tax_amount": fees["tax_amount"],
        "branch_profit": fees["branch_profit"],
        "available_balance": balance,
        "currency": normalize_currency(body.currency),
        "sufficient_balance": body.amount <= balance if balance > 0 else True,
        "valid": len(errors) == 0,
        "errors": errors,
        "sending_branch_name": sending_branch.name if sending_branch else None,
        "destination_branch_name": dest_branch.name if dest_branch else None,
    }
