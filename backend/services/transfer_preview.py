from models import Branch


def normalize_currency(currency: str) -> str:
    c = (currency or "SYP").upper()
    if "USD" in c or c == "$":
        return "USD"
    return "SYP"


def compute_transfer_fees(benefited_amount: float, tax_rate: float) -> dict:
    benefited = max(benefited_amount or 0, 0)
    rate = max(tax_rate or 0, 0)
    tax_amount = benefited * (rate / 100)
    branch_profit = benefited - tax_amount
    return {
        "tax_rate": rate,
        "tax_amount": round(tax_amount, 2),
        "branch_profit": round(branch_profit, 2),
    }


def get_branch_balance(branch: Branch | None, currency: str) -> float:
    if not branch:
        return 0.0
    if normalize_currency(currency) == "USD":
        return branch.allocated_amount_usd or 0.0
    return branch.allocated_amount_syp or 0.0


def validate_transfer_amounts(amount: float, benefited_amount: float, balance: float, settings: dict | None = None) -> list[str]:
    errors: list[str] = []
    if amount <= 0:
        errors.append("Amount must be greater than zero")
    if benefited_amount < 0:
        errors.append("Benefited amount cannot be negative")
    if benefited_amount > amount:
        errors.append("Benefited amount cannot exceed transfer amount")
    if balance > 0 and amount > balance:
        errors.append("Insufficient branch balance")
    if settings:
        min_amt = float(settings.get("transferMinAmount") or 0)
        max_amt = float(settings.get("transferMaxAmount") or 0)
        if min_amt > 0 and amount < min_amt:
            errors.append(f"Amount must be at least {min_amt}")
        if max_amt > 0 and amount > max_amt:
            errors.append(f"Amount cannot exceed {max_amt}")
    return errors
