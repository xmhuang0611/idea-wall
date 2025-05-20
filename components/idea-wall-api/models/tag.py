from pydantic import BaseModel
from .audit import AuditModel

class TagBase(BaseModel):
    tag_id: int
    tag_name: str
    parent_id: int = 0

class TagCreate(TagBase):
    pass

class TagUpdate(TagBase):
    pass

class TagInDB(TagBase, AuditModel):
    pass

class Tag(TagInDB):
    pass
