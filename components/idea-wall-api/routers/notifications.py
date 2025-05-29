from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List
from models.notification import Notification
from models.response import StandardResponse
from services.notification_service import notification_service
from services.email_template_service import email_template_service
from core.deps import get_current_user, user_has_role
from core.config import get_settings
from models.user import User, UserRole
from services.email_service import email_service
import logging

router = APIRouter()

settings = get_settings()
logger = logging.getLogger(__name__)

@router.get("/notifications", response_model=StandardResponse[List[Notification]])
async def get_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user)
):
    """Get notifications for the current user"""
    notifications = await notification_service.get_notifications(
        user_id=current_user.user_id,
        skip=skip,
        limit=limit
    )
    return StandardResponse(success=True, data=notifications)

@router.post("/notifications/{notification_id}/read", response_model=StandardResponse[Notification])
async def mark_notification_as_read(
    notification_id: str,
    current_user: User = Depends(get_current_user)
):
    """Mark a notification as read"""
    notification = await notification_service.mark_as_read(
        notification_id=notification_id,
        user_id=current_user.user_id
    )
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    return StandardResponse(success=True, data=notification)

@router.post("/notifications/read-all", response_model=StandardResponse[bool])
async def mark_all_notifications_as_read(
    current_user: User = Depends(get_current_user)
):
    """Mark all notifications as read for the current user"""
    success = await notification_service.mark_all_as_read(current_user.user_id)
    return StandardResponse(success=True, data=success)

@router.get("/notifications/unread-count", response_model=StandardResponse[int])
async def get_unread_notification_count(
    current_user: User = Depends(get_current_user)
):
    """Get count of unread notifications for the current user"""
    count = await notification_service.get_unread_count(current_user.user_id)
    return StandardResponse(success=True, data=count)

@router.get("/notifications/email-preview", response_model=StandardResponse[dict])
async def preview_notification_email_template(
    current_user: User = Depends(user_has_role([UserRole.ADMIN]))
):
    """Preview notification email template (Admin only)"""
    from models.notification import NotificationType
    from datetime import datetime
    
    # Create a sample notification for preview
    sample_notification = Notification(
        id="sample_id",
        user_id=current_user.user_id,
        type=NotificationType.COMMENT,
        content="John Doe commented on your idea: Implement AI-powered code review system",
        related_id="sample_idea_id",
        is_read=False,
        created_at=datetime.utcnow(),
        creator_id="john.doe",
        creator_name="John Doe"
    )
    
    # Generate preview
    html_content = email_template_service.render_notification_email_html(
        notification=sample_notification
    )
    
    text_content = email_template_service.render_notification_email_text(
        notification=sample_notification
    )
    
    return StandardResponse(success=True, data={
        "html": html_content,
        "text": text_content,
        "subject": email_template_service._generate_email_subject(sample_notification)
    })

@router.post("/notifications/test-email", response_model=StandardResponse[dict])
async def test_email_configuration(
    current_user: User = Depends(user_has_role([UserRole.ADMIN]))
):
    """Test email configuration and send a test email (Admin only)"""
    from models.notification import NotificationType
    from datetime import datetime
    
    # First test the connection
    connection_test = await email_service.test_email_connection()
    
    if not connection_test["success"]:
        return StandardResponse(
            success=False, 
            data=connection_test,
            error={"code": 500, "message": "Email connection test failed"}
        )
    
    # Create a test notification
    test_notification = Notification(
        id="test_id",
        user_id=current_user.user_id,
        type=NotificationType.COMMENT,
        content="This is a test notification to verify your email configuration is working correctly.",
        related_id="test_idea_id",
        is_read=False,
        created_at=datetime.utcnow(),
        creator_id="system",
        creator_name="System Test"
    )
    
    # Generate test email
    try:
        subject = f"[TEST] {email_template_service._generate_email_subject(test_notification)}"
        html_content = email_template_service.render_notification_email_html(
            notification=test_notification
        )
        text_content = email_template_service.render_notification_email_text(
            notification=test_notification
        )
        
        # Send test email
        user_email = f"{test_notification.user_id}{settings.company_email_domain}"
        email_sent = await email_service.send_email(
            to_email=user_email,
            subject=subject,
            html_content=html_content,
            text_content=text_content
        )
        
        if email_sent:
            return StandardResponse(
                success=True,
                data={
                    "message": f"Test email sent successfully to {user_email}",
                    "connection_test": connection_test,
                    "email_sent": True
                }
            )
        else:
            return StandardResponse(
                success=False,
                data={
                    "message": f"Failed to send test email to {user_email}",
                    "connection_test": connection_test,
                    "email_sent": False
                },
                error={"code": 500, "message": "Test email sending failed"}
            )
            
    except Exception as e:
        logger.error(f"Error in test email: {str(e)}")
        return StandardResponse(
            success=False,
            data={
                "message": f"Error generating test email: {str(e)}",
                "connection_test": connection_test,
                "email_sent": False
            },
            error={"code": 500, "message": "Test email generation failed"}
        )

@router.get("/notifications/email-config", response_model=StandardResponse[dict])
async def get_email_configuration(
    current_user: User = Depends(user_has_role([UserRole.ADMIN]))
):
    """Get email configuration details (Admin only)"""
    config_details = email_service._get_config_details()
    return StandardResponse(success=True, data=config_details) 