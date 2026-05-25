from datetime import datetime

from models import Transaction

VALID_STATUSES = {"processing", "completed", "cancelled", "rejected", "pending"}


def format_transaction_date(value: datetime | str | None) -> str | None:
    if not value:
        return None
    if isinstance(value, str):
        try:
            parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
            return parsed.strftime("%Y-%m-%d %H:%M")
        except ValueError:
            return value[:16] if len(value) > 16 else value
    return value.strftime("%Y-%m-%d %H:%M")


def serialize_transaction(
    transaction: Transaction,
    *,
    sending_branch_name: str | None = None,
    destination_branch_name: str | None = None,
) -> dict:
    sending = sending_branch_name
    if not sending and transaction.branch_id in (0, None):
        sending = None
    return {
        "id": transaction.id,
        "short_id": transaction.id[:8] if transaction.id else "",
        "sender": transaction.sender,
        "sender_mobile": transaction.sender_mobile,
        "sender_governorate": transaction.sender_governorate,
        "receiver": transaction.receiver,
        "receiver_mobile": transaction.receiver_mobile,
        "receiver_governorate": transaction.receiver_governorate,
        "amount": transaction.amount,
        "base_amount": transaction.base_amount,
        "benefited_amount": transaction.benefited_amount,
        "tax_rate": transaction.tax_rate,
        "tax_amount": transaction.tax_amount,
        "currency": transaction.currency,
        "message": transaction.message,
        "employee_name": transaction.employee_name,
        "branch_governorate": transaction.branch_governorate,
        "branch_id": transaction.branch_id,
        "destination_branch_id": transaction.destination_branch_id,
        "employee_id": transaction.employee_id,
        "status": transaction.status,
        "date": format_transaction_date(transaction.date),
        "is_received": transaction.is_received,
        "sending_branch_name": sending,
        "destination_branch_name": destination_branch_name,
    }


def validate_status(status: str) -> None:
    if status not in VALID_STATUSES:
        raise ValueError(f"Invalid status. Must be one of: {', '.join(sorted(VALID_STATUSES))}")


def can_modify_transaction(current_user: dict, transaction: Transaction) -> None:
    role = current_user.get("role")
    if role == "director":
        return
    if role == "branch_manager":
        branch_id = current_user.get("branch_id")
        if transaction.branch_id != branch_id and transaction.destination_branch_id != branch_id:
            raise ValueError("Not authorized to modify this transaction")
        return
    raise ValueError("Not enough permissions")


def record_branch_profit(db, transaction: Transaction) -> None:
    from models import BranchProfits

    if transaction.benefited_amount <= 0:
        return
    tax_on_benefited = transaction.benefited_amount * (transaction.tax_rate / 100)
    profit_from_benefited = transaction.benefited_amount - tax_on_benefited
    if profit_from_benefited > 0:
        db.add(
            BranchProfits(
                branch_id=transaction.branch_id,
                transaction_id=transaction.id,
                profit_amount=profit_from_benefited,
                currency=transaction.currency,
                source_type="benefited_amount",
                date=transaction.date,
            )
        )
    if tax_on_benefited > 0:
        db.add(
            BranchProfits(
                branch_id=transaction.branch_id,
                transaction_id=transaction.id,
                profit_amount=tax_on_benefited,
                currency=transaction.currency,
                source_type="tax",
                date=transaction.date,
            )
        )


def apply_status_change(db, transaction: Transaction, new_status: str) -> None:
    from models import BranchProfits

    validate_status(new_status)
    old_status = transaction.status
    if old_status == "processing" and new_status == "completed":
        record_branch_profit(db, transaction)
    elif (
        (old_status == "processing" and new_status in ("cancelled", "rejected"))
        or (old_status == "completed" and new_status in ("cancelled", "rejected"))
    ):
        db.query(BranchProfits).filter(BranchProfits.transaction_id == transaction.id).delete()
    transaction.status = new_status
    if new_status == "completed":
        transaction.is_received = True

