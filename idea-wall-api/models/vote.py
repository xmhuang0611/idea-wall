from pydantic import BaseModel, Field
from typing import Literal
from datetime import datetime
from enum import Enum

class TargetType(str, Enum):
    IDEA = "Idea"
    COMMENT = "Comment"

class VoteBase(BaseModel):
    vote_status: int = Field(ge=0, le=1)
    target_id: str
    target_type: TargetType

class VoteCreate(VoteBase):
    pass

class VoteInDB(VoteBase):
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    updated_by: str

class Vote(VoteBase):
    id: str
    created_at: datetime
    created_by: str
    updated_at: datetime 