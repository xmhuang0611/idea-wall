from pydantic import BaseModel, Field
from typing import Literal
from datetime import datetime
from enum import Enum
from .audit import AuditModel

class TargetType(str, Enum):
    IDEA = "Idea"
    COMMENT = "Comment"

class BookmarkBase(BaseModel):
    bookmark_status: int = Field(ge=0, le=1)
    target_id: str
    target_type: TargetType

class BookmarkCreate(BookmarkBase):
    pass

class BookmarkInDB(BookmarkBase, AuditModel):
    pass

class Bookmark(BookmarkInDB):
    id: str 