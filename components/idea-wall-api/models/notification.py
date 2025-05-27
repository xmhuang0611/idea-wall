from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from enum import Enum
from .audit import AuditModel

class NotificationType(str, Enum):
    COMMENT = "comment"
    VOTE = "vote"
    BOOKMARK = "bookmark"

class NotificationBase(BaseModel):
    """Base notification model"""
    user_id: str = Field(..., description="ID of the user who will receive the notification")
    type: NotificationType = Field(..., description="Type of notification")
    content: str = Field(..., description="Notification content")
    related_id: str = Field(..., description="ID of the related content (idea_id, comment_id, etc.)")
    is_read: bool = Field(default=False, description="Whether the notification has been read")

class NotificationCreate(NotificationBase):
    """Model for creating a new notification"""
    pass

class NotificationUpdate(BaseModel):
    """Model for updating a notification"""
    is_read: bool = Field(..., description="Whether the notification has been read")

class NotificationInDB(NotificationBase, AuditModel):
    """Database notification model with audit fields"""
    pass

class Notification(NotificationBase):
    """Complete notification model with ID"""
    id: str = Field(..., description="Notification ID")
    created_at: datetime = Field(..., description="When the notification was created")
    creator_id: str = Field(..., description="ID of the user who triggered the notification")
    creator_name: str = Field(..., description="Name of the user who triggered the notification")

    class Config:
        from_attributes = True 