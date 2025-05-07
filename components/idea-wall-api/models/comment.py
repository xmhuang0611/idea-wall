from pydantic import BaseModel
from typing import Optional
from .audit import AuditModel

class CommentBase(BaseModel):
    idea_id: str
    description: str
    parent_id: Optional[str] = None

class CommentCreate(CommentBase):
    pass

class CommentInDB(CommentBase, AuditModel):
    votes: int = 0

class Comment(CommentInDB):
    id: str