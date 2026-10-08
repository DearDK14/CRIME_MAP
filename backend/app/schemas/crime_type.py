from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class CrimeTypeBase(BaseModel):
    name: str = Field(..., max_length=100)
    code: str = Field(..., max_length=20)
    category: str = Field(..., max_length=50)
    base_severity: str = Field(default="Medium")
    description: Optional[str] = None

class CrimeTypeCreate(CrimeTypeBase):
    pass

class CrimeTypeResponse(CrimeTypeBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}
