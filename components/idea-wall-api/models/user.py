from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    IDEA_SESSION_PANNEL_REVIEWER = "IDEA_SESSION_PANNEL_REVIEWER"
    IDEA_INCUBATOR_REVIEWER = "IDEA_INCUBATOR_REVIEWER"
    ADMIN = "ADMIN"

class UserBase(BaseModel):
    user_id: str
    role: UserRole

class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: Optional[str] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    updated_by: Optional[str] = None
    hashed_password: str

class User(UserBase):
    created_at: datetime
    updated_at: datetime 