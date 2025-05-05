from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from .audit import AuditModel

class CommentBase(BaseModel):
    description: str
    parent_id: Optional[str] = None

class CommentCreate(CommentBase):
    pass

class CommentInDB(CommentBase, AuditModel):
    idea_id: str
    votes: int = 0

class Comment(CommentBase):
    id: str
    idea_id: str
    created_at: datetime
    creator_id: str
    creator_name: str
    updated_at: datetime
    updater_id: str
    updater_name: str
    votes: int 