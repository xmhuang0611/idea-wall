from pydantic import BaseModel, Field
from datetime import datetime
from .audit import AuditModel

class TagBase(BaseModel):
    tag_id: int
    tag: str
    parent_id: int = 0

class TagCreate(TagBase):
    pass

class TagInDB(TagBase, AuditModel):
    pass

class Tag(TagBase):
    created_at: datetime
    creator_id: str
    creator_name: str
    updated_at: datetime
    updater_id: str
    updater_name: str 