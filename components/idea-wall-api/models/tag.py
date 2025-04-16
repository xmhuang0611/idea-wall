from pydantic import BaseModel, Field
from datetime import datetime

class TagBase(BaseModel):
    tag_id: int
    tag: str
    parent_id: int = 0

class TagCreate(TagBase):
    pass

class TagInDB(TagBase):
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    updated_by: str

class Tag(TagBase):
    created_at: datetime
    updated_at: datetime 