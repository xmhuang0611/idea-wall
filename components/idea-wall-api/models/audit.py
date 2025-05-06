from pydantic import BaseModel, Field
from datetime import datetime

class AuditModel(BaseModel):
    """
    Base audit model with common audit fields for all database models as per db-design.md
    """
    id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    creator_id: str
    creator_name: str
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    updater_id: str
    updater_name: str 