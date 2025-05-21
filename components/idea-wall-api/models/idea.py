from pydantic import BaseModel, Field
from typing import List, Optional
from .audit import AuditModel
from enum import Enum

class IdeaStatus(str, Enum):
    PUBLISHED = "PUBLISHED"
    IN_SESSION_REVIEW = "IN_SESSION_REVIEW"
    SESSION_APPROVED = "SESSION_APPROVED"
    SESSION_REJECTED = "SESSION_REJECTED"
    IN_INCUBATION_REVIEW = "IN_INCUBATION_REVIEW"
    INCUBATION_APPROVED = "INCUBATION_APPROVED"
    INCUBATION_REJECTED = "INCUBATION_REJECTED"
    ROLL_OUT = "ROLL_OUT"

class IdeaTag(BaseModel):
    tag_id: int
    tag_name: str

class IdeaBase(BaseModel):
    title: str
    description: str
    feeling: int = Field(ge=1, le=5)
    tags: List[int]

class IdeaCreate(IdeaBase):
    pass

class IdeaUpdate(IdeaBase):
    pass

class IdeaInDB(IdeaBase, AuditModel):
    total_votes: int = 0
    total_comments: int = 0
    total_bookmarks: int = 0
    current_status: IdeaStatus = IdeaStatus.PUBLISHED
    current_session_id: Optional[str] = None
    current_incubator_id: Optional[str] = None

class Idea(IdeaInDB):
    id: str
    tag_details: Optional[List[IdeaTag]] = None
    has_voted: bool = False
    has_bookmarked: bool = False 