from fastapi import APIRouter, Depends, Query, HTTPException, Path
from typing import List, Optional
from core.deps import get_current_user
from services.review_service import review_service
from services.session_service import session_service
from models.review import (
    Review, ReviewCreate,
    FinalDecision, FinalDecisionCreate
)
from models.session import ReviewStatus
from models.response import StandardResponse, Pagination, ErrorDetail
from models.user import User, UserRole
from services.user_service import user_service

router = APIRouter()

# ============== Review Routes ==============

@router.post("/sessions/{session_id}/reviews", response_model=StandardResponse[Review])
async def create_review(
    review: ReviewCreate,
    session_id: str = Path(..., title="The ID of the session to review"),
    current_user: User = Depends(get_current_user)
):
    """Create a review for a session"""
    # Check if the user is a reviewer
    db_user = await user_service.get_user(current_user.user_id)
    if not db_user or (
        UserRole.IDEA_SESSION_PANEL_REVIEWER not in db_user.roles and
        UserRole.ADMIN not in db_user.roles
    ):
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=403,
                message="You don't have permission to review sessions"
            )
        )
    
    # Check if the session exists
    session = await session_service.get_session(session_id)
    if not session:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=404,
                message="Session not found"
            )
        )
    
    # Check if the session is in a reviewable status
    if session.status not in [ReviewStatus.PENDING, ReviewStatus.IN_REVIEW, ReviewStatus.RESUBMITTED]:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=400,
                message=f"Cannot review session in {session.status} status"
            )
        )
    
    # Create the review
    created_review = await review_service.create_review(
        session_id,
        review,
        reviewer_id=current_user.user_id,
        reviewer_name=current_user.user_name
    )
    
    if not created_review:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=500,
                message="Failed to create review"
            )
        )
    
    return StandardResponse(
        success=True,
        data=created_review
    )

@router.get("/sessions/{session_id}/reviews", response_model=StandardResponse[List[Review]])
async def get_reviews_by_session(
    session_id: str = Path(..., title="The ID of the session")
):
    """Get all reviews for a session"""
    # Public endpoint - no authentication required
    
    # Check if the session exists
    session = await session_service.get_session(session_id)
    if not session:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=404,
                message="Session not found"
            )
        )
    
    # Get the reviews
    reviews = await review_service.get_reviews_by_session(session_id)
    
    return StandardResponse(
        success=True,
        data=reviews
    )

# ============== Final Decision Routes ==============

@router.post("/sessions/{session_id}/final-decision", response_model=StandardResponse[FinalDecision])
async def create_final_decision(
    decision: FinalDecisionCreate,
    session_id: str = Path(..., title="The ID of the session"),
    current_user: User = Depends(get_current_user)
):
    """Create a final decision for a session"""
    # Check if the user is a reviewer or admin
    db_user = await user_service.get_user(current_user.user_id)
    if not db_user or (
        UserRole.IDEA_SESSION_PANEL_REVIEWER not in db_user.roles and
        UserRole.ADMIN not in db_user.roles
    ):
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=403,
                message="You don't have permission to make final decisions"
            )
        )
    
    # Check if the session exists
    session = await session_service.get_session(session_id)
    if not session:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=404,
                message="Session not found"
            )
        )
    
    # Check if the session already has a final decision
    if session.has_final_decision:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=400,
                message="This session already has a final decision"
            )
        )
    
    # Check if the session has enough reviews
    # In a real application, you might want to configure this minimum number
    min_reviews_required = 3
    if session.review_count < min_reviews_required:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=400,
                message=f"This session needs at least {min_reviews_required} reviews before a final decision can be made"
            )
        )
    
    # Create the final decision
    created_decision = await review_service.create_final_decision(
        session_id,
        decision,
        decision_maker_id=current_user.user_id,
        decision_maker_name=current_user.user_name
    )
    
    if not created_decision:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=500,
                message="Failed to create final decision"
            )
        )
    
    return StandardResponse(
        success=True,
        data=created_decision
    ) 