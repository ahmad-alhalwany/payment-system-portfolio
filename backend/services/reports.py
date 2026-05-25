from __future__ import annotations

from collections import defaultdict
from datetime import datetime
from typing import Any

from sqlalchemy import func, or_
from sqlalchemy.orm import Session, aliased

from models import Branch, Transaction, User

VALID_STATUSES = {"pending", "processing", "completed", "cancelled", "rejected"}

STATUS_ALIASES = {
    "pending": "pending",
    "processing": "processing",
    "completed": "completed",
    "cancelled": "cancelled",
    "rejected": "rejected",
    "معلق": "pending",
    "قيد المعالجة": "processing",
    "قيد التنفيذ": "processing",
    "مكتمل": "completed",
    "ملغي": "cancelled",
    "مرفوض": "rejected",
}

TRANSFER_TYPE_ALIASES = {
    "outgoing": "outgoing",
    "incoming": "incoming",
    "صادر": "outgoing",
    "وارد": "incoming",
}

ROLE_ALIASES = {
    "employee": "employee",
    "branch_manager": "branch_manager",
    "director": "director",
    "موظف": "employee",
    "مدير فرع": "branch_manager",
    "مدير": "director",
}

EMPLOYEE_STATUS_ALIASES = {
    "active": "active",
    "inactive": "inactive",
    "نشط": "active",
    "غير نشط": "inactive",
}


def parse_date(value: str | None, end_of_day: bool = False) -> datetime | None:
    if not value:
        return None
    try:
        parsed = datetime.strptime(value, "%Y-%m-%d")
        if end_of_day:
            return parsed.replace(hour=23, minute=59, second=59)
        return parsed
    except ValueError as exc:
        raise ValueError("Invalid date format. Use YYYY-MM-DD") from exc


def parse_date_range(
    from_date: str | None = None,
    to_date: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
) -> tuple[datetime | None, datetime | None]:
    start = parse_date(from_date or start_date)
    end = parse_date(to_date or end_date, end_of_day=True)
    return start, end


def normalize_status(value: str | None) -> str | None:
    if not value or value in ("all", "الكل"):
        return None
    normalized = STATUS_ALIASES.get(value.strip(), value.strip().lower())
    return normalized if normalized in VALID_STATUSES else None


def normalize_transfer_type(value: str | None) -> str | None:
    if not value or value in ("all", "الكل"):
        return None
    return TRANSFER_TYPE_ALIASES.get(value.strip(), value.strip().lower())


def normalize_role(value: str | None) -> str | None:
    if not value or value in ("all", "الكل"):
        return None
    return ROLE_ALIASES.get(value.strip(), value.strip().lower())


def normalize_employee_status(value: str | None) -> str | None:
    if not value or value in ("all", "الكل"):
        return None
    return EMPLOYEE_STATUS_ALIASES.get(value.strip(), value.strip().lower())


def require_report_access(current_user: dict) -> None:
    if current_user.get("role") not in ("director", "branch_manager"):
        raise PermissionError("Not enough permissions")


def apply_branch_scope(current_user: dict, branch_id: int | None) -> int | None:
    if current_user.get("role") == "branch_manager":
        return current_user.get("branch_id")
    return branch_id


def _apply_date_filters(query, start: datetime | None, end: datetime | None):
    if start:
        query = query.filter(Transaction.date >= start)
    if end:
        query = query.filter(Transaction.date <= end)
    return query


def _serialize_transaction_row(transaction: Transaction, sending_name: str | None, destination_name: str | None) -> dict:
    return {
        "id": transaction.id,
        "sender": transaction.sender,
        "receiver": transaction.receiver,
        "amount": transaction.amount,
        "currency": transaction.currency,
        "date": transaction.date.isoformat() if transaction.date else None,
        "status": transaction.status,
        "branch_id": transaction.branch_id,
        "destination_branch_id": transaction.destination_branch_id,
        "employee_name": transaction.employee_name,
        "sending_branch_name": sending_name or "—",
        "destination_branch_name": destination_name or "—",
        "branch_governorate": transaction.branch_governorate,
        "is_received": transaction.is_received,
        "tax_amount": transaction.tax_amount,
        "tax_rate": transaction.tax_rate,
        "benefited_amount": transaction.benefited_amount,
    }


def compute_transaction_stats(transactions: list[Transaction]) -> dict[str, Any]:
    stats = {
        "total_count": len(transactions),
        "total_amount": 0.0,
        "total_tax": 0.0,
        "completed_count": 0,
        "processing_count": 0,
        "pending_count": 0,
        "cancelled_count": 0,
        "rejected_count": 0,
        "by_status": defaultdict(int),
        "by_currency": defaultdict(float),
    }
    for tx in transactions:
        stats["total_amount"] += tx.amount or 0
        stats["total_tax"] += tx.tax_amount or 0
        status = tx.status or "processing"
        stats["by_status"][status] += 1
        if status == "completed":
            stats["completed_count"] += 1
        elif status == "processing":
            stats["processing_count"] += 1
        elif status == "pending":
            stats["pending_count"] += 1
        elif status == "cancelled":
            stats["cancelled_count"] += 1
        elif status == "rejected":
            stats["rejected_count"] += 1
        currency = (tx.currency or "SYP").upper()
        if "USD" in currency:
            stats["by_currency"]["USD"] += tx.amount or 0
        else:
            stats["by_currency"]["SYP"] += tx.amount or 0
    stats["by_status"] = dict(stats["by_status"])
    stats["by_currency"] = dict(stats["by_currency"])
    return stats


def build_chart_data(transactions: list[Transaction]) -> dict[str, Any]:
    daily: dict[str, float] = defaultdict(float)
    status_counts: dict[str, int] = defaultdict(int)
    for tx in transactions:
        if tx.date:
            daily[tx.date.strftime("%Y-%m-%d")] += tx.amount or 0
        status_counts[tx.status or "processing"] += 1
    daily_series = [{"date": k, "amount": round(v, 2)} for k, v in sorted(daily.items())]
    status_series = [{"status": k, "count": v} for k, v in status_counts.items()]
    return {"daily_amounts": daily_series, "status_counts": status_series}


def get_transactions_report(
    db: Session,
    current_user: dict,
    *,
    from_date: str | None = None,
    to_date: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    status: str | None = None,
    transfer_type: str | None = None,
    type_: str | None = None,
    branch_id: int | None = None,
    destination_branch_id: int | None = None,
    currency: str | None = None,
    search: str | None = None,
    page: int = 1,
    per_page: int = 50,
) -> dict[str, Any]:
    require_report_access(current_user)
    start, end = parse_date_range(from_date, to_date, start_date, end_date)
    status_filter = normalize_status(status)
    type_filter = normalize_transfer_type(transfer_type or type_)
    scoped_branch = apply_branch_scope(current_user, branch_id)

    sending = aliased(Branch)
    destination = aliased(Branch)
    query = (
        db.query(Transaction, sending.name, destination.name)
        .outerjoin(sending, Transaction.branch_id == sending.id)
        .outerjoin(destination, Transaction.destination_branch_id == destination.id)
    )
    query = _apply_date_filters(query, start, end)

    if status_filter:
        query = query.filter(Transaction.status == status_filter)

    if type_filter == "outgoing":
        if scoped_branch:
            query = query.filter(Transaction.branch_id == scoped_branch)
        elif branch_id:
            query = query.filter(Transaction.branch_id == branch_id)
    elif type_filter == "incoming":
        target = destination_branch_id or scoped_branch
        if target:
            query = query.filter(Transaction.destination_branch_id == target)
    else:
        if scoped_branch:
            query = query.filter(
                (Transaction.branch_id == scoped_branch)
                | (Transaction.destination_branch_id == scoped_branch)
            )
        elif branch_id:
            query = query.filter(Transaction.branch_id == branch_id)
        if destination_branch_id:
            query = query.filter(Transaction.destination_branch_id == destination_branch_id)

    if currency and currency not in ("all", "الكل"):
        query = query.filter(Transaction.currency.ilike(f"%{currency}%"))

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Transaction.id.ilike(term),
                Transaction.sender.ilike(term),
                Transaction.receiver.ilike(term),
                Transaction.employee_name.ilike(term),
            )
        )

    all_rows = query.order_by(Transaction.date.desc()).all()
    all_transactions = [row[0] for row in all_rows]
    stats = compute_transaction_stats(all_transactions)
    charts = build_chart_data(all_transactions)

    total = len(all_rows)
    offset = max(page - 1, 0) * per_page
    page_rows = all_rows[offset : offset + per_page]
    items = [_serialize_transaction_row(tx, s_name, d_name) for tx, s_name, d_name in page_rows]

    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": max((total + per_page - 1) // per_page, 1),
        "stats": stats,
        "charts": charts,
    }


def get_branch_report(
    db: Session,
    current_user: dict,
    *,
    from_date: str | None = None,
    to_date: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
) -> dict[str, Any]:
    require_report_access(current_user)
    start, end = parse_date_range(from_date, to_date, start_date, end_date)
    scoped_branch = apply_branch_scope(current_user, None)

    branches_query = db.query(Branch)
    if scoped_branch:
        branches_query = branches_query.filter(Branch.id == scoped_branch)
    branches = branches_query.all()

    branch_stats = []
    for branch in branches:
        outgoing = db.query(Transaction).filter(Transaction.branch_id == branch.id)
        incoming = db.query(Transaction).filter(Transaction.destination_branch_id == branch.id)
        outgoing = _apply_date_filters(outgoing, start, end)
        incoming = _apply_date_filters(incoming, start, end)
        outgoing_rows = outgoing.all()
        incoming_rows = incoming.all()

        total_count = len(outgoing_rows) + len(incoming_rows)
        total_amount = sum((tx.amount or 0) for tx in outgoing_rows + incoming_rows)
        total_tax = sum((tx.tax_amount or 0) for tx in outgoing_rows + incoming_rows)
        employee_count = db.query(func.count(User.id)).filter(User.branch_id == branch.id).scalar() or 0

        branch_stats.append(
            {
                "branch_id": branch.id,
                "name": branch.name,
                "governorate": branch.governorate,
                "transaction_count": total_count,
                "outgoing_count": len(outgoing_rows),
                "incoming_count": len(incoming_rows),
                "total_amount": round(float(total_amount), 2),
                "total_tax": round(float(total_tax), 2),
                "employee_count": employee_count,
            }
        )

    totals = {
        "branch_count": len(branch_stats),
        "transaction_count": sum(b["transaction_count"] for b in branch_stats),
        "total_amount": round(sum(b["total_amount"] for b in branch_stats), 2),
        "total_tax": round(sum(b["total_tax"] for b in branch_stats), 2),
        "employee_count": sum(b["employee_count"] for b in branch_stats),
    }
    return {"branch_stats": branch_stats, "stats": totals}


def get_employees_report(
    db: Session,
    current_user: dict,
    *,
    branch_id: int | None = None,
    status: str | None = None,
    employee_status: str | None = None,
    role: str | None = None,
    employee_role: str | None = None,
    search: str | None = None,
    page: int = 1,
    per_page: int = 50,
) -> dict[str, Any]:
    require_report_access(current_user)
    scoped_branch = apply_branch_scope(current_user, branch_id)
    status_filter = normalize_employee_status(status or employee_status)
    role_filter = normalize_role(role or employee_role)

    query = db.query(User).outerjoin(Branch, User.branch_id == Branch.id)
    if scoped_branch:
        query = query.filter(User.branch_id == scoped_branch)
    elif branch_id:
        query = query.filter(User.branch_id == branch_id)
    if role_filter:
        query = query.filter(User.role == role_filter)
    if status_filter == "active":
        query = query.filter(getattr(User, "is_active", True) == True)  # noqa: E712
    elif status_filter == "inactive":
        query = query.filter(getattr(User, "is_active", True) == False)  # noqa: E712
    if search:
        term = f"%{search.strip()}%"
        query = query.filter((User.username.ilike(term)) | (Branch.name.ilike(term)))

    total = query.count()
    offset = max(page - 1, 0) * per_page
    employees = query.order_by(User.created_at.desc()).offset(offset).limit(per_page).all()

    items = []
    for employee in employees:
        branch = db.query(Branch).filter(Branch.id == employee.branch_id).first()
        items.append(
            {
                "id": employee.id,
                "username": employee.username,
                "role": employee.role,
                "branch_id": employee.branch_id,
                "branch_name": branch.name if branch else "—",
                "created_at": employee.created_at.isoformat() if employee.created_at else None,
                "is_active": getattr(employee, "is_active", True),
            }
        )

    stats = {
        "total_count": total,
        "active_count": sum(1 for e in items if e["is_active"]),
        "inactive_count": sum(1 for e in items if not e["is_active"]),
    }
    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": max((total + per_page - 1) // per_page, 1),
        "stats": stats,
    }


def get_daily_report(
    db: Session,
    current_user: dict,
    *,
    from_date: str | None = None,
    to_date: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
) -> dict[str, Any]:
    require_report_access(current_user)
    today = datetime.now().strftime("%Y-%m-%d")
    start, end = parse_date_range(from_date or today, to_date or today, start_date, end_date)

    query = db.query(Transaction)
    query = _apply_date_filters(query, start, end)
    scoped_branch = apply_branch_scope(current_user, None)
    if scoped_branch:
        query = query.filter(
            (Transaction.branch_id == scoped_branch) | (Transaction.destination_branch_id == scoped_branch)
        )

    transactions = query.all()
    summary = compute_transaction_stats(transactions)
    return {"summary": summary, "items": [_serialize_transaction_row(tx, None, None) for tx in transactions[:100]]}
