from typing import Literal

from pydantic import BaseModel

DemoRole = Literal["director", "branch_manager", "employee"]


class DemoLoginRequest(BaseModel):
    role: DemoRole
