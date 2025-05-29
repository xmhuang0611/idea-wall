from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from core.database import get_database
from core.config import get_settings
from models.notification import Notification, NotificationCreate, NotificationUpdate, NotificationInDB
from models.log import ObjectType, OperationType
from utils.logging_utils import record_operation_log
import asyncio
import logging
import traceback

settings = get_settings()
logger = logging.getLogger(__name__)

class NotificationService:
    def __init__(self):
        self.collection_name = "notifications"

    async def create_notification(self, notification: NotificationCreate, creator_id: str, creator_name: str) -> Notification:
        """Create a new notification and send email immediately"""
        db = await get_database()
        
        now = datetime.utcnow()
        notification_in_db = NotificationInDB(
            **notification.model_dump(),
            creator_id=creator_id,
            creator_name=creator_name,
            updater_id=creator_id,
            updater_name=creator_name,
            created_at=now,
            updated_at=now
        )
        
        result = await db[self.collection_name].insert_one(notification_in_db.model_dump())
        
        created_notification = Notification(
            id=str(result.inserted_id),
            **notification_in_db.model_dump()
        )
        
        # Send email notification immediately (non-blocking)
        asyncio.create_task(self._send_notification_email(created_notification))
        
        return created_notification

    async def get_notifications(self, user_id: str, skip: int = 0, limit: int = 20) -> List[Notification]:
        """Get notifications for a user with pagination"""
        db = await get_database()
        notifications = []
        
        cursor = db[self.collection_name].find(
            {"user_id": user_id}
        ).sort("created_at", -1).skip(skip).limit(limit)
        
        async for notification_dict in cursor:
            notification_dict["id"] = str(notification_dict.pop("_id"))
            notifications.append(Notification(**notification_dict))
            
        return notifications

    async def mark_as_read(self, notification_id: str, user_id: str) -> Optional[Notification]:
        """Mark a notification as read"""
        db = await get_database()
        
        update_data = {"is_read": True, "updated_at": datetime.utcnow()}
        result = await db[self.collection_name].find_one_and_update(
            {"_id": ObjectId(notification_id), "user_id": user_id},
            {"$set": update_data},
            return_document=True
        )
        
        if result:
            result["id"] = str(result.pop("_id"))
            return Notification(**result)
        return None

    async def mark_all_as_read(self, user_id: str) -> bool:
        """Mark all notifications as read for a user"""
        db = await get_database()
        
        result = await db[self.collection_name].update_many(
            {"user_id": user_id, "is_read": False},
            {"$set": {"is_read": True, "updated_at": datetime.utcnow()}}
        )
        
        return result.modified_count > 0

    async def get_unread_count(self, user_id: str) -> int:
        """Get count of unread notifications for a user"""
        db = await get_database()
        return await db[self.collection_name].count_documents({
            "user_id": user_id,
            "is_read": False
        })

    async def check_existing_notification(self, user_id: str, creator_id: str, type: str, related_id: str) -> bool:
        """Check if a similar notification already exists"""
        db = await get_database()
        existing = await db[self.collection_name].find_one({
            "user_id": user_id,
            "creator_id": creator_id,
            "type": type,
            "related_id": related_id
        })
        return existing is not None

    async def create_notification_if_not_exists(self, notification: NotificationCreate, creator_id: str, creator_name: str) -> Optional[Notification]:
        """Create a new notification only if a similar one doesn't already exist"""
        # Check if similar notification already exists
        exists = await self.check_existing_notification(
            user_id=notification.user_id,
            creator_id=creator_id,
            type=notification.type,
            related_id=notification.related_id
        )
        
        if exists:
            return None  # Don't create duplicate notification
            
        return await self.create_notification(notification, creator_id, creator_name)

    async def _send_notification_email(self, notification: Notification):
        """Send email for a single notification (internal method)"""
        try:
            logger.info(f"Starting email notification process for user {notification.user_id}")
            
            # Import here to avoid circular imports
            from services.email_service import email_service
            from services.email_template_service import email_template_service
            from services.user_service import user_service
            
            # Generate email content using templates
            logger.info("Generating email content from templates")
            try:
                subject = email_template_service._generate_email_subject(notification)
                html_content = email_template_service.render_notification_email_html(
                    notification=notification
                )
                text_content = email_template_service.render_notification_email_text(
                    notification=notification
                )
                logger.info("Email content generated successfully")
                
            except Exception as template_error:
                logger.error(f"Error generating email templates: {str(template_error)}")
                return
            
            # Get user email
            user_email = notification.user_id + settings.company_email_domain
            logger.info(f"Sending email to: {user_email}")
            
            # Send email
            email_sent = await email_service.send_email(
                to_email=user_email,
                subject=subject,
                html_content=html_content,
                text_content=text_content
            )
            
            if email_sent:
                logger.info(f"Email notification sent successfully to {notification.user_id} ({user_email}) for {notification.type}")
            else:
                logger.error(f"Failed to send email notification to {notification.user_id} ({user_email}) for {notification.type}")
                
        except Exception as e:
            logger.error(f"Unexpected error in email notification process: {str(e)}")
            logger.error(f"Error type: {type(e).__name__}")
            logger.error(f"Notification details: {notification.model_dump_json()}")

# Create a singleton instance
notification_service = NotificationService() 