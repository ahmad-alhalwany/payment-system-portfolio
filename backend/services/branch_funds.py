from sqlalchemy.orm import Session

from models import Branch, BranchFund


def compute_branch_status(branch: Branch, employee_count: int = 0) -> str:
    has_balance = (branch.allocated_amount_syp or 0) > 0 or (branch.allocated_amount_usd or 0) > 0
    return "active" if has_balance or employee_count > 0 else "inactive"


def adjust_branch_funds(
    db: Session,
    branch: Branch,
    *,
    amount: float,
    currency: str,
    operation: str,
    description: str | None = None,
) -> Branch:
    if amount <= 0:
        raise ValueError("Amount must be greater than zero")

    currency = currency.upper()
    if currency not in ("SYP", "USD"):
        raise ValueError("Currency must be SYP or USD")

    if operation == "add":
        if currency == "SYP":
            branch.allocated_amount_syp = (branch.allocated_amount_syp or 0) + amount
            branch.allocated_amount = branch.allocated_amount_syp
        else:
            branch.allocated_amount_usd = (branch.allocated_amount_usd or 0) + amount
        fund_amount = amount
        fund_type = "allocation"
        default_desc = f"Fund allocation ({currency})"
    elif operation == "deduct":
        if currency == "SYP":
            current = branch.allocated_amount_syp or 0
            if amount > current:
                raise ValueError("Insufficient SYP balance")
            branch.allocated_amount_syp = current - amount
            branch.allocated_amount = branch.allocated_amount_syp
        else:
            current = branch.allocated_amount_usd or 0
            if amount > current:
                raise ValueError("Insufficient USD balance")
            branch.allocated_amount_usd = current - amount
        fund_amount = -amount
        fund_type = "deduction"
        default_desc = f"Fund deduction ({currency})"
    else:
        raise ValueError("Operation must be add or deduct")

    db.add(
        BranchFund(
            branch_id=branch.id,
            amount=fund_amount,
            type=fund_type,
            currency=currency,
            description=description or default_desc,
        )
    )
    return branch
