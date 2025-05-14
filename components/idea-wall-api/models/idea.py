from pydantic import BaseModel, Field
from typing import List, Optional
from .audit import AuditModel

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

class Idea(IdeaInDB):
    id: str
    tag_details: Optional[List[IdeaTag]] = None
    has_voted: bool = False
    has_bookmarked: bool = False 