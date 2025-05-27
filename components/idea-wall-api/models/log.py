from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from enum import Enum
from .audit import AuditModel

class ObjectType(str, Enum):
    IDEA = "Idea"
    COMMENT = "Comment"
    VOTE = "Vote"
    BOOKMARK = "Bookmark"
    TAG = "Tag"
    USER = "User"
    REVIEW = "Review"
    FINAL_DECISION = "Final Decision"
    IDEA_LIFECYCLE = "Idea Lifecycle"

class OperationType(str, Enum):
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"

class LogBase(BaseModel):
    """
    Base log model for system operations
    """
    object_type: ObjectType
    object_id: str
    object_data: str
    operation_type: OperationType

class LogCreate(LogBase):
    pass

class LogInDB(LogBase, AuditModel):
    pass

class Log(LogBase, AuditModel):
    id: str 