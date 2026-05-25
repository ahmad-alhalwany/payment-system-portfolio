from __future__ import annotations

from collections import defaultdict
from datetime import datetime
from typing import Any

from sqlalchemy.orm import Session

from models import Branch, Transaction
from services.reports import apply_branch_scope, normalize_status, parse_date_range, require_report_access


def compute_branch_profit(benefited_amount: float, tax_amount: float, branch_id: int | None = None) -> float:
    benefited = benefited_amount or 0
    tax = tax_amount or 0
    if branch_id == 0:
        return benefited
    return benefited - tax


def normalize_currency_filter(currency: str | None) -> str | None:
    if not currency or currency in ("all", "الكل"):
        return None
    c = currency.upper()
    if c == "USD":
        return "USD"
    if c == "SYP":
        return "SYP"
    return currency


def _currency_matches(tx_currency: str | None, filter_currency: str | None) -> bool:
    if not filter_currency:
        return True
    normalized = (tx_currency or "SYP").upper()
    if filter_currency == "USD":
        return "USD" in normalized or "$" in normalized
    return "SYP" in normalized or "ليرة" in normalized or filter_currency not in ("USD",)


def _apply_inventory_filters(
    db: Session,
    current_user: dict,
    *,
    from_date: str | None = None,
    to_date: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    branch_id: int | None = None,
    currency: str | None = None,
    status: str | None = None,
) -> list[Transaction]:
    require_report_access(current_user)
    start, end = parse_date_range(from_date, to_date, start_date, end_date)
    scoped_branch = apply_branch_scope(current_user, branch_id)
    status_filter = normalize_status(status)
    currency_filter = normalize_currency_filter(currency)

    query = db.query(Transaction)
    if start:
        query = query.filter(Transaction.date >= start)
    if end:
        query = query.filter(Transaction.date <= end)
    if status_filter:
        query = query.filter(Transaction.status == status_filter)
    if scoped_branch:
        query = query.filter(
            (Transaction.branch_id == scoped_branch) | (Transaction.destination_branch_id == scoped_branch)
        )
    elif branch_id is not None:
        query = query.filter(
            (Transaction.branch_id == branch_id) | (Transaction.destination_branch_id == branch_id)
        )

    rows = query.order_by(Transaction.date.desc()).all()
    if currency_filter:
        rows = [tx for tx in rows if _currency_matches(tx.currency, currency_filter)]
    return rows


def get_inventory_summary(
    db: Session,
    current_user: dict,
    *,
    from_date: str | None = None,
    to_date: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    branch_id: int | None = None,
    currency: str | None = None,
    status: str | None = None,
) -> dict[str, Any]:
    transactions = _apply_inventory_filters(
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

    branch_buckets: dict[int, dict[str, Any]] = {}
    tx_items: list[dict[str, Any]] = []
    total_amount = 0.0
    total_benefited = 0.0
    total_tax = 0.0
    total_profit = 0.0

    branch_cache: dict[int, Branch | None] = {}

    def get_branch(b_id: int | None) -> Branch | None:
        if b_id is None:
            return None
        if b_id not in branch_cache:
            branch_cache[b_id] = db.query(Branch).filter(Branch.id == b_id).first()
        return branch_cache[b_id]

    for tx in transactions:
        b_id = tx.branch_id or 0
        sending = get_branch(tx.branch_id)
        destination = get_branch(tx.destination_branch_id)
        profit = compute_branch_profit(tx.benefited_amount, tx.tax_amount, b_id)

        total_amount += tx.amount or 0
        total_benefited += tx.benefited_amount or 0
        total_tax += tx.tax_amount or 0
        total_profit += profit

        if b_id not in branch_buckets:
            branch_buckets[b_id] = {
                "branch_id": b_id,
                "branch_name": sending.name if sending else ("Main" if b_id == 0 else str(b_id)),
                "tax_rate": sending.tax_rate if sending else (tx.tax_rate or 0),
                "transaction_count": 0,
                "total_amount": 0.0,
                "benefited_amount": 0.0,
                "tax_amount": 0.0,
                "profit": 0.0,
                "currency": tx.currency or "SYP",
            }
        bucket = branch_buckets[b_id]
        bucket["transaction_count"] += 1
        bucket["total_amount"] += tx.amount or 0
        bucket["benefited_amount"] += tx.benefited_amount or 0
        bucket["tax_amount"] += tx.tax_amount or 0
        bucket["profit"] += profit

        tx_items.append(
            {
                "id": tx.id,
                "date": tx.date.isoformat() if tx.date else None,
                "amount": tx.amount,
                "benefited_amount": tx.benefited_amount,
                "tax_rate": tx.tax_rate,
                "tax_amount": tx.tax_amount,
                "profit": round(profit, 2),
                "currency": tx.currency,
                "sending_branch_name": sending.name if sending else "—",
                "destination_branch_name": destination.name if destination else "—",
                "status": tx.status,
            }
        )

    avg_tax_rate = round((total_tax / total_benefited * 100), 2) if total_benefited > 0 else 0.0
    by_branch = list(branch_buckets.values())
    for row in by_branch:
        row["total_amount"] = round(row["total_amount"], 2)
        row["benefited_amount"] = round(row["benefited_amount"], 2)
        row["tax_amount"] = round(row["tax_amount"], 2)
        row["profit"] = round(row["profit"], 2)

    charts = {
        "by_branch": [
            {
                "branch_name": row["branch_name"],
                "tax_amount": row["tax_amount"],
                "profit": row["profit"],
            }
            for row in by_branch
        ]
    }

    return {
        "summary": {
            "tax_collected": round(total_tax, 2),
            "transactions_count": len(transactions),
            "total_profit": round(total_profit, 2),
            "avg_tax_rate": avg_tax_rate,
            "total_amount": round(total_amount, 2),
            "total_benefited_amount": round(total_benefited, 2),
        },
        "by_branch": by_branch,
        "transactions": tx_items,
        "charts": charts,
    }


def build_inventory_csv(summary: dict[str, Any]) -> str:
    lines = [
        "branch_name,tax_rate,transaction_count,total_amount,benefited_amount,tax_amount,profit,currency",
    ]
    for row in summary.get("by_branch", []):
        lines.append(
            ",".join(
                str(row.get(k, ""))
                for k in (
                    "branch_name",
                    "tax_rate",
                    "transaction_count",
                    "total_amount",
                    "benefited_amount",
                    "tax_amount",
                    "profit",
                    "currency",
                )
            )
        )
    lines.append("")
    lines.append("id,date,amount,benefited_amount,tax_rate,tax_amount,profit,currency,sending_branch,destination_branch,status")
    for row in summary.get("transactions", []):
        lines.append(
            ",".join(
                str(row.get(k, ""))
                for k in (
                    "id",
                    "date",
                    "amount",
                    "benefited_amount",
                    "tax_rate",
                    "tax_amount",
                    "profit",
                    "currency",
                    "sending_branch_name",
                    "destination_branch_name",
                    "status",
                )
            )
        )
    return "\n".join(lines)
