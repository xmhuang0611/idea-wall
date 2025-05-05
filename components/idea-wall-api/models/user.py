from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum
from .audit import AuditModel

class UserRole(str, Enum):
    ADMIN = "ADMIN"
    IDEA_SESSION_PANNEL_REVIEWER = "IDEA_SESSION_PANNEL_REVIEWER"
    IDEA_INCUBATOR_REVIEWER = "IDEA_INCUBATOR_REVIEWER"

# Standard user model
class User(BaseModel):
    user_id: str
    user_name: str
    roles: List[str] = []

# Database user model with additional fields
class UserInDB(User, AuditModel):
    pass 