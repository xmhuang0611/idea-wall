from pydantic import BaseModel
from typing import List, Optional
from enum import Enum
from .audit import AuditModel

class UserRole(str, Enum):
    ADMIN = "ADMIN"
    IDEA_SESSION_PANEL_REVIEWER = "IDEA_SESSION_PANEL_REVIEWER"
    IDEA_INCUBATOR_REVIEWER = "IDEA_INCUBATOR_REVIEWER"

# Standard user model
class User(BaseModel):
    user_id: str
    user_name: str
    roles: List[UserRole] = []

# Database user model with additional fields
class UserInDB(User, AuditModel):
    pass

# User creation/update models
class UserCreate(BaseModel):
    user_id: str
    user_name: str
    roles: List[UserRole] = []

class UserUpdate(BaseModel):
    roles: Optional[List[UserRole]] = None 