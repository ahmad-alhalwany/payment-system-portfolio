from pydantic import BaseModel


class LoginRequest(BaseModel):
    username: str
    password: str


class UserCreate(BaseModel):
    username: str
    password: str
    role: str = "employee"
    branch_id: int | None = None


class PasswordReset(BaseModel):
    username: str
    new_password: str


class ChangePassword(BaseModel):
    old_password: str
    new_password: str
