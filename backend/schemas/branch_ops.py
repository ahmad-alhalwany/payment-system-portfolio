from typing import Literal, Optional

from pydantic import BaseModel, Field


class FundOperationRequest(BaseModel):
    amount: float = Field(gt=0)
    currency: Literal["SYP", "USD"]
    operation: Literal["add", "deduct"]
    description: Optional[str] = None


class TaxRateRequest(BaseModel):
    tax_rate: float = Field(ge=0, le=100)
