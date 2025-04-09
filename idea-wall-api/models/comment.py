from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class CommentBase(BaseModel):
    description: str
    parent_id: Optional[str] = None

class CommentCreate(CommentBase):
    pass

class CommentInDB(CommentBase):
    idea_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    updated_by: str
    votes: int = 0

class Comment(CommentBase):
    id: str
    idea_id: str
    created_at: datetime
    created_by: str
    updated_at: datetime
    votes: int 