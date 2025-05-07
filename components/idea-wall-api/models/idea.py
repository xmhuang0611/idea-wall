from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum
from .audit import AuditModel

class IdeaCategory(str, Enum):
    IDEA = "Idea"
    PAIN = "Pain"
    THOUGHT = "Thought"

class IdeaTag(BaseModel):
    tag_id: int
    tag_name: str

class IdeaBase(BaseModel):
    title: str
    description: str
    category: IdeaCategory
    feeling: int = Field(ge=1, le=5)
    tags: List[int]

class IdeaCreate(IdeaBase):
    pass

class IdeaInDB(IdeaBase, AuditModel):
    total_votes: int = 0
    total_comments: int = 0

class Idea(IdeaInDB):
    id: str
    tag_details: Optional[List[IdeaTag]] = None
    hasVoted: bool = False 