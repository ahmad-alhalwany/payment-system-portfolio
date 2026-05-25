from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy.orm import Session

from models import Branch, Transaction
from services.inventory import compute_branch_profit


def _require_branch_manager(current_user: dict) -> int:
    if current_user.get("role") != "branch_manager":
        raise PermissionError("Branch manager access required")
    branch_id = current_user.get("branch_id")
    if not branch_id:
        raise ValueError("Branch ID is required")
    return int(branch_id)


def get_branch_profits(
    db: Session,
    current_user: dict,
    *,
    start_date: str | None = None,
    end_date: str | None = None,
    from_date: str | None = None,
    to_date: str | None = None,
    currency: str | None = None,
    search: str | None = None,
) -> dict[str, Any]:
    branch_id = _require_branch_manager(current_user)

    branch = db.query(Branch).filter(Branch.id == branch_id).first()
    if not branch:
        raise ValueError("Branch not found")

    query = db.query(Transaction).filter(
        Transaction.branch_id == branch_id,
        Transaction.status == "completed",
    )

    start = start_date or from_date
    end = end_date or to_date
    if start:
        query = query.filter(Transaction.date >= datetime.strptime(start, "%Y-%m-%d"))
    if end:
        end_dt = datetime.strptime(end, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
        query = query.filter(Transaction.date <= end_dt)

    if currency and currency not in ("all", "الكل"):
        query = query.filter(Transaction.currency.ilike(f"%{currency}%"))

    transactions = query.order_by(Transaction.date.desc()).all()

    if search and search.strip():
        term = search.strip().lower()
        transactions = [
            tx
            for tx in transactions
            if term in tx.id.lower()
            or term in (tx.currency or "").lower()
            or term in (tx.status or "").lower()
        ]

    total_syp = 0.0
    total_usd = 0.0
    items: list[dict[str, Any]] = []

    for tx in transactions:
        tax_amount = tx.tax_amount if tx.tax_amount is not None else (tx.benefited_amount or 0) * ((tx.tax_rate or 0) / 100)
        profit = compute_branch_profit(tx.benefited_amount, tax_amount, tx.branch_id)
        benefited_profit = profit

        if (tx.currency or "SYP").upper().find("USD") >= 0 or "$" in (tx.currency or ""):
            total_usd += profit
        else:
            total_syp += profit

        items.append(
            {
                "id": tx.id,
                "date": tx.date.strftime("%Y-%m-%d %H:%M:%S") if tx.date else None,
                "benefited_amount": float(tx.benefited_amount or 0),
                "tax_rate": float(tx.tax_rate or 0),
                "tax_amount": float(tax_amount or 0),
                "benefited_profit": float(benefited_profit),
                "tax_profit": 0.0,
                "profit": float(profit),
                "currency": tx.currency or "SYP",
                "status": tx.status,
            }
        )

    return {
        "branch": {
            "id": branch.id,
            "name": branch.name,
            "location": branch.location,
            "governorate": branch.governorate,
        },
        "stats": {
            "total_profits_syp": round(total_syp, 2),
            "total_profits_usd": round(total_usd, 2),
            "total_transactions": len(items),
            "avg_tax_rate": round(
                sum(i["tax_rate"] for i in items) / len(items) if items else 0,
                2,
            ),
        },
        "items": items,
        "chart": [
            {"currency": "SYP", "profit": round(total_syp, 2)},
            {"currency": "USD", "profit": round(total_usd, 2)},
        ],
    }
