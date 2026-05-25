from typing import Literal, Optional

from pydantic import BaseModel, Field


class TransactionUpdateRequest(BaseModel):
    sender: Optional[str] = None
    receiver: Optional[str] = None
    sender_mobile: Optional[str] = None
    receiver_mobile: Optional[str] = None
    message: Optional[str] = None


class TransactionStatusPatch(BaseModel):
    status: Literal["processing", "completed", "cancelled", "rejected", "pending"]


class TransferPreviewRequest(BaseModel):
    amount: float = Field(gt=0)
    benefited_amount: float = Field(ge=0, default=0)
    currency: Literal["SYP", "USD"]
    sending_branch_id: int | None = None
    destination_branch_id: int | None = None
