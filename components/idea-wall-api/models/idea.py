from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
from .audit import AuditModel

class IdeaCategory(str, Enum):
    IDEA = "Idea"
    PAIN = "Pain"
    THOUGHT = "Thought"

class IdeaTag(BaseModel):
    tag_id: int
    tag: str

class IdeaBase(BaseModel):
    title: str
    description: str
    category: IdeaCategory
    feeling: int = Field(ge=0, le=10)
    tags: List[int]

class IdeaCreate(IdeaBase):
    pass

class IdeaInDB(IdeaBase, AuditModel):
    total_votes: int = 0

class Idea(IdeaBase):
    id: str
    created_at: datetime
    creator_id: str
    creator_name: str
    updated_at: datetime
    updater_id: str
    updater_name: str
    total_votes: int
    tag_details: Optional[List[IdeaTag]] = None
    hasVoted: bool = False 