from pydantic import BaseModel
from typing import Optional
from .audit import AuditModel

class CommentBase(BaseModel):
    description: str
    parent_id: Optional[str] = None

class CommentCreate(CommentBase):
    pass

class CommentInDB(CommentBase, AuditModel):
    idea_id: str
    votes: int = 0

class Comment(CommentInDB):
    pass