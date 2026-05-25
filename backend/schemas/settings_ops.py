from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator


class SystemSettingsUpdate(BaseModel):
    systemName: str = Field(min_length=1, max_length=120)
    companyName: str = Field(min_length=1, max_length=120)
    adminEmail: str = Field(min_length=3, max_length=120)
    defaultCurrency: Literal["SYP", "USD", "EUR"]
    mainPhone: str = Field(default="", max_length=20)
    receiptFooter: str = Field(default="", max_length=500)
    transferMinAmount: float = Field(default=0, ge=0)
    transferMaxAmount: float = Field(default=0, ge=0)
    requireReceiverPhone: bool = True
    requireCompletedForTax: bool = True
    defaultLocale: Literal["ar", "en"] = "ar"

    @field_validator("adminEmail")
    @classmethod
    def validate_email(cls, v: str) -> str:
        if "@" not in v:
            raise ValueError("Invalid admin email")
        return v.strip()
