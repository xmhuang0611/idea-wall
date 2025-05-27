from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List
from models.notification import Notification
from models.response import StandardResponse
from services.notification_service import notification_service
from services.notification_digest_service import notification_digest_service
from core.deps import get_current_user, user_has_role
from models.user import User, UserRole

router = APIRouter()

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

@router.post("/notifications/send-digest", response_model=StandardResponse[dict])
async def send_notification_digest(
    current_user: User = Depends(user_has_role([UserRole.ADMIN]))
):
    """Manually trigger daily notification digest (Admin only)"""
    results = await notification_digest_service.send_daily_notification_digest()
    return StandardResponse(success=True, data=results)

@router.get("/notifications/digest-preview/{user_id}", response_model=StandardResponse[str])
async def preview_notification_digest(
    user_id: str,
    current_user: User = Depends(user_has_role([UserRole.ADMIN]))
):
    """Preview notification digest email for a user (Admin only)"""
    from datetime import datetime, timedelta
    from services.email_service import email_service
    from services.user_service import user_service
    
    # Get user
    user = await user_service.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get notifications from past 24 hours
    since = datetime.utcnow() - timedelta(days=1)
    notifications = await notification_digest_service.get_user_unread_notifications_since(user_id, since)
    
    if not notifications:
        return StandardResponse(success=True, data="<p>No unread notifications for this user.</p>")
    
    # Generate preview
    html_content = email_service.generate_notification_email_html(user, notifications)
    return StandardResponse(success=True, data=html_content) 