from fastapi import APIRouter, Depends, HTTPException

from schemas.settings_ops import SystemSettingsUpdate
from security import get_current_user
from services.settings_store import load_system_settings, save_system_settings

router = APIRouter(tags=["Settings"])


def _require_director(current_user: dict) -> None:
    if current_user.get("role") != "director":
        raise HTTPException(status_code=403, detail="Director access required")


@router.get("/settings/system/")
def get_system_settings(current_user: dict = Depends(get_current_user)):
    return load_system_settings()


@router.put("/settings/system/")
def update_system_settings(
    body: SystemSettingsUpdate,
    current_user: dict = Depends(get_current_user),
):
    _require_director(current_user)
    payload = body.model_dump()
    saved = save_system_settings(payload, username=current_user.get("username"))
    return saved
