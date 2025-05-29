from typing import List, Dict
from datetime import datetime, timedelta
from services.notification_service import notification_service
from services.email_service import email_service
from services.user_service import user_service
from models.notification import Notification
from models.user import User
from core.config import get_settings
import logging

settings = get_settings()
logger = logging.getLogger(__name__)

class NotificationDigestService:
    def __init__(self):
        pass
    
    async def get_users_with_unread_notifications(self, since: datetime) -> List[str]:
        """Get list of user IDs who have unread notifications since the given time"""
        from core.database import get_database
        db = await get_database()
        
        # Aggregate to find users with unread notifications from the past day
        pipeline = [
            {
                "$match": {
                    "is_read": False,
                    "created_at": {"$gte": since}
                }
            },
            {
                "$group": {
                    "_id": "$user_id"
                }
            }
        ]
        
        user_ids = []
        async for result in db["notifications"].aggregate(pipeline):
            user_ids.append(result["_id"])
            
        return user_ids
    
    async def get_user_unread_notifications_since(self, user_id: str, since: datetime) -> List[Notification]:
        """Get unread notifications for a user since the given time"""
        from core.database import get_database
        db = await get_database()
        
        notifications = []
        cursor = db["notifications"].find({
            "user_id": user_id,
            "is_read": False,
            "created_at": {"$gte": since}
        }).sort("created_at", -1)
        
        async for notification_dict in cursor:
            notification_dict["id"] = str(notification_dict.pop("_id"))
            notifications.append(Notification(**notification_dict))
            
        return notifications
    
    async def send_daily_notification_digest(self) -> Dict[str, int]:
        """Send daily notification digest to all users with unread notifications"""
        logger.info("Starting daily notification digest process")
        
        # Get notifications from the past 24 hours
        since = datetime.utcnow() - timedelta(days=1)
        
        # Get users with unread notifications
        user_ids = await self.get_users_with_unread_notifications(since)
        logger.info(f"Found {len(user_ids)} users with unread notifications")
        
        results = {
            "emails_sent": 0,
            "emails_failed": 0,
            "users_processed": 0
        }
        
        for user_id in user_ids:
            try:
                # Get user details
                user = await user_service.get_user(user_id)
                if not user:
                    logger.warning(f"User {user_id} not found")
                    continue
                
                # Get user's unread notifications
                notifications = await self.get_user_unread_notifications_since(user_id, since)
                if not notifications:
                    continue
                
                # Generate email content
                subject = f"You have {len(notifications)} unread notification{'s' if len(notifications) != 1 else ''} - Idea Wall"
                html_content = email_service.generate_notification_email_html(user, notifications)
                text_content = email_service.generate_notification_email_text(user, notifications)
                
                # Send email (assuming user_id is email for now, you might need to add email field to User model)
                email_sent = await email_service.send_email(
                    to_email=f"{user_id}{settings.company_email_domain}",  # You'll need to modify this based on your user model
                    subject=subject,
                    html_content=html_content,
                    text_content=text_content
                )
                
                if email_sent:
                    results["emails_sent"] += 1
                    logger.info(f"Notification digest sent to {user_id}")
                else:
                    results["emails_failed"] += 1
                    logger.error(f"Failed to send notification digest to {user_id}")
                
                results["users_processed"] += 1
                
            except Exception as e:
                logger.error(f"Error processing notifications for user {user_id}: {str(e)}")
                results["emails_failed"] += 1
        
        logger.info(f"Daily notification digest completed: {results}")
        return results

# Create a singleton instance
notification_digest_service = NotificationDigestService() 