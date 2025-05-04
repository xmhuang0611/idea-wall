from pydantic import BaseModel, Field
from typing import List, Optional, TypeVar, Generic, Dict, Any
from datetime import datetime
from enum import Enum

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

class IdeaInDB(IdeaBase):
    created_at: datetime = Field(default_factory=datetime.utcnow)
    creator_id: str
    creator_name: str
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    updater_id: str
    updater_name: str
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

T = TypeVar('T')

class ResponseMeta(BaseModel):
    page: int
    page_size: int
    total: int

class ErrorDetail(BaseModel):
    code: str
    message: str

class StandardResponse(BaseModel, Generic[T]):
    status: str
    data: Optional[T] = None
    meta: Optional[ResponseMeta] = None
    error: Optional[ErrorDetail] = None 