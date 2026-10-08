from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., min_length=5, max_length=100)
    role: str = Field(default="police_officer")
    badge_number: Optional[str] = None
    police_station_id: Optional[int] = None
    is_active: bool = True

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., min_length=5, max_length=100)
    password: str = Field(..., min_length=6)
    role: Optional[str] = "police_officer"
    badge_number: Optional[str] = None
    police_station_id: Optional[int] = None

class UserLogin(BaseModel):
    username: str
    password: str

class UserUpdateRole(BaseModel):
    role: str = Field(..., description="admin, police_officer, analyst")

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    badge_number: Optional[str] = None
    police_station_id: Optional[int] = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
    exp: Optional[int] = None
