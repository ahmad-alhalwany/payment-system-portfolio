from __future__ import annotations

import json
import os
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any

SETTINGS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
SETTINGS_FILE = os.path.join(SETTINGS_DIR, "system_settings.json")

DEFAULT_SYSTEM_SETTINGS: dict[str, Any] = {
    "systemName": "Payment Transfer System",
    "companyName": "Company Name",
    "adminEmail": "admin@example.com",
    "defaultCurrency": "SYP",
    "mainPhone": "",
    "receiptFooter": "",
    "transferMinAmount": 1000,
    "transferMaxAmount": 0,
    "requireReceiverPhone": True,
    "requireCompletedForTax": True,
    "defaultLocale": "ar",
    "updatedAt": None,
    "updatedBy": None,
}


def _ensure_dir() -> None:
    os.makedirs(SETTINGS_DIR, exist_ok=True)


def _normalize_currency(value: str) -> str:
    c = (value or "SYP").upper()
    if "USD" in c or "دولار" in value:
        return "USD"
    if "EUR" in c or "يورو" in value:
        return "EUR"
    return "SYP"


def load_system_settings() -> dict[str, Any]:
    _ensure_dir()
    if not os.path.exists(SETTINGS_FILE):
        return deepcopy(DEFAULT_SYSTEM_SETTINGS)
    try:
        with open(SETTINGS_FILE, encoding="utf-8") as f:
            stored = json.load(f)
        merged = deepcopy(DEFAULT_SYSTEM_SETTINGS)
        merged.update(stored)
        merged["defaultCurrency"] = _normalize_currency(merged.get("defaultCurrency", "SYP"))
        return merged
    except (json.JSONDecodeError, OSError):
        return deepcopy(DEFAULT_SYSTEM_SETTINGS)


def save_system_settings(data: dict[str, Any], username: str | None = None) -> dict[str, Any]:
    _ensure_dir()
    current = load_system_settings()
    current.update(data)
    current["updatedAt"] = datetime.now(timezone.utc).isoformat()
    current["updatedBy"] = username
    with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
        json.dump(current, f, ensure_ascii=False, indent=2)
    return current


def validate_system_settings(data: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    email = data.get("adminEmail", "")
    if email and "@" not in str(email):
        errors.append("Invalid admin email")
    currency = str(data.get("defaultCurrency", "SYP")).upper()
    if currency not in ("SYP", "USD", "EUR"):
        errors.append("Unsupported default currency")
    min_amt = data.get("transferMinAmount", 0)
    max_amt = data.get("transferMaxAmount", 0)
    if min_amt is not None and float(min_amt) < 0:
        errors.append("Minimum transfer amount cannot be negative")
    if max_amt and min_amt and float(max_amt) < float(min_amt):
        errors.append("Maximum amount cannot be less than minimum")
    locale = data.get("defaultLocale", "ar")
    if locale not in ("ar", "en"):
        errors.append("Default locale must be ar or en")
    return errors
