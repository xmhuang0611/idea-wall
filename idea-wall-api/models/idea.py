from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from enum import Enum

class IdeaCategory(str, Enum):
    IDEA = "Idea"
    PAIN = "Pain"
    THOUGHT = "Thought"

class IdeaBase(BaseModel):
    title: str
    description: str
    category: IdeaCategory
    feeling: int = Field(ge=0, le=10)
    tags: List[int]

class IdeaCreate(IdeaBase):
    pass

class IdeaInDB(IdeaBase):
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    updated_by: str
    total_votes: int = 0

class Idea(IdeaBase):
    id: str
    created_at: datetime
    created_by: str
    updated_at: datetime
    total_votes: int 