from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import func
from sqlalchemy.orm import Session

from models import Branch, Transaction, User
from services.inventory import compute_branch_profit


def _require_branch_access(current_user: dict, branch_id: int) -> None:
    role = current_user.get("role")
    if role not in ("director", "branch_manager"):
        raise PermissionError("Not enough permissions")
    if role == "branch_manager" and current_user.get("branch_id") != branch_id:
        raise PermissionError("Can only access your branch")


def get_branch_manager_dashboard(db: Session, current_user: dict, branch_id: int | None = None) -> dict[str, Any]:
    bid = branch_id or current_user.get("branch_id")
    if not bid:
        raise ValueError("Branch ID is required")
    _require_branch_access(current_user, bid)

    branch = db.query(Branch).filter(Branch.id == bid).first()
    if not branch:
        raise ValueError("Branch not found")

    employee_total = db.query(func.count(User.id)).filter(User.branch_id == bid, User.role == "employee").scalar() or 0

    outgoing_q = db.query(Transaction).filter(Transaction.branch_id == bid)
    incoming_q = db.query(Transaction).filter(Transaction.destination_branch_id == bid)

    outgoing_count = outgoing_q.count()
    incoming_count = incoming_q.count()

    def count_by_status(query, status: str) -> int:
        return query.filter(Transaction.status == status).count()

    completed_out = count_by_status(outgoing_q, "completed")
    processing_out = count_by_status(outgoing_q, "processing") + count_by_status(outgoing_q, "pending")
    completed_in = count_by_status(incoming_q, "completed")

    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    today_out = outgoing_q.filter(Transaction.date >= today).count()
    today_in = incoming_q.filter(Transaction.date >= today).count()

    completed_txs = (
        db.query(Transaction)
        .filter(Transaction.branch_id == bid, Transaction.status == "completed")
        .all()
    )
    total_profit = sum(
        compute_branch_profit(tx.benefited_amount, tx.tax_amount, tx.branch_id) for tx in completed_txs
    )
    total_tax = sum(tx.tax_amount or 0 for tx in completed_txs)

    recent = (
        db.query(Transaction)
        .filter((Transaction.branch_id == bid) | (Transaction.destination_branch_id == bid))
        .order_by(Transaction.date.desc())
        .limit(8)
        .all()
    )
    recent_items = [
        {
            "id": tx.id,
            "sender": tx.sender,
            "receiver": tx.receiver,
            "amount": tx.amount,
            "currency": tx.currency,
            "status": tx.status,
            "date": tx.date.isoformat() if tx.date else None,
            "direction": "outgoing" if tx.branch_id == bid else "incoming",
        }
        for tx in recent
    ]

    return {
        "branch": {
            "id": branch.id,
            "name": branch.name,
            "location": branch.location,
            "governorate": branch.governorate,
            "phone_number": branch.phone_number,
            "tax_rate": branch.tax_rate or 0,
            "allocated_amount_syp": branch.allocated_amount_syp or 0,
            "allocated_amount_usd": branch.allocated_amount_usd or 0,
        },
        "stats": {
            "employees": employee_total,
            "outgoing_count": outgoing_count,
            "incoming_count": incoming_count,
            "completed_outgoing": completed_out,
            "processing_outgoing": processing_out,
            "completed_incoming": completed_in,
            "today_outgoing": today_out,
            "today_incoming": today_in,
            "total_profit": round(total_profit, 2),
            "total_tax": round(total_tax, 2),
        },
        "recent_transfers": recent_items,
        "manager": {
            "username": current_user.get("username"),
            "role": current_user.get("role"),
        },
    }
