from fastapi import APIRouter, Depends, HTTPException, Query, Request
from typing import List, Optional
from models.response import ErrorDetail, StandardResponse
from models.review import Review, ReviewCreate, ReviewResult, TargetType, FinalDecisionCreate
from models.idea import Idea, IdeaStatus, SessionReviewCreate, LeanCanvasCreate, ReviewStatus
from services.review_service import review_service
from core.deps import get_current_user
from services.user_service import user_service
from models.user import User, UserRole

router = APIRouter()

@router.get("", response_model=StandardResponse[List[Review]])
async def get_reviews(
    idea_id: str = Query(..., description="ID of the idea to fetch reviews for"),
    target_type: str = Query(..., description="Type of target - Session or Incubator")
):
    """
    Get all reviews for a specific idea and target type.
    This endpoint does not require authentication.
    
    Args:
        idea_id: The ID of the idea
        target_type: The type of review ("Session" or "Incubator")
    
    Returns:
        List of reviews for the specified idea and target type
    """
    # Validate target_type
    if target_type not in ["Session", "Incubator"]:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=400,
                message="Invalid target_type. Must be 'Session' or 'Incubator'."
            )
        )
    
    try:
        reviews = await review_service.get_reviews(idea_id, target_type)
        return StandardResponse(
            success=True,
            message=f"Retrieved {len(reviews)} reviews for idea {idea_id}",
            data=reviews
        )
    except Exception as e:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=500,
                message=f"Failed to retrieve reviews: {str(e)}"
            )
        )

@router.put("/{review_id}", response_model=StandardResponse[Review])
async def update_review(
    review_id: str,
    review_data: ReviewCreate,
    current_user: User = Depends(get_current_user)
):
    """
    Update an existing review.
    
    Args:
        review_id: The ID of the review to update
        review_data: The updated review data
        current_user: The authenticated user making the request
    
    Returns:
        The updated review
    """
    try:
        # Check if the review exists and get it
        existing_review = await review_service.get_review_by_id(review_id)
        if not existing_review:
            return StandardResponse(
                success=False,
                error=ErrorDetail(
                    code=404,
                    message="Review not found"
                )
            )
        
        # Check if the current user is the creator of the review
        if existing_review.creator_id != current_user.user_id:
            return StandardResponse(
                success=False,
                error=ErrorDetail(
                    code=403,
                    message="You can only update your own reviews"
                )
            )
        
        # Update the review
        updated_review = await review_service.update_review(
            review_id=review_id,
            review_result=review_data.review_result,
            updater_id=current_user.user_id,
            updater_name=current_user.user_name
        )
        
        if not updated_review:
            return StandardResponse(
                success=False,
                error=ErrorDetail(
                    code=500,
                    message="Failed to update review"
                )
            )
        
        # Recalculate idea scores after updating a review
        target_type_enum = TargetType.SESSION if existing_review.target_type == "Session" else TargetType.INCUBATOR
        await review_service.recalculate_review_scores(existing_review.idea_id, target_type_enum)
        
        return StandardResponse(
            success=True,
            message="Review updated successfully",
            data=updated_review
        )
        
    except Exception as e:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=500,
                message=f"Failed to update review: {str(e)}"
            )
        )

# Session Review Routes
@router.put("/session/{idea_id}", response_model=StandardResponse[Idea])
async def submit_session_review(
    idea_id: str,
    session_review_data: SessionReviewCreate,
    current_user: User = Depends(get_current_user)
):
    """
    Submit session review for an idea.
    
    Args:
        idea_id: The ID of the idea
        session_review_data: Session review data
        current_user: The authenticated user making the request
    
    Returns:
        The updated idea
    """
    # Check if idea exists
    existing_idea = await review_service._get_idea(idea_id)
    if not existing_idea:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=404,
                message="Idea not found"
            )
        )
    
    # Check if user is the creator
    if existing_idea.creator_id != current_user.user_id:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=403,
                message="Only the creator can submit a session review"
            )
        )
    
    # Check if idea is in correct status
    if existing_idea.status != IdeaStatus.DRAFT and existing_idea.status != None:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=400,
                message="Idea must be in DRAFT status to submit a session review"
            )
        )
    
    # Submit session review
    updated_idea = await review_service.submit_session_review(
        idea_id,
        session_review_data,
        current_user.user_id,
        current_user.user_name
    )
    
    if not updated_idea:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=500,
                message="Failed to submit session review"
            )
        )
    
    return StandardResponse(
        success=True,
        message="Session review submitted successfully",
        data=updated_idea
    )

@router.post("/session/{idea_id}/reviews", response_model=StandardResponse[Idea])
async def add_session_review_result(
    idea_id: str,
    review: ReviewCreate,
    current_user: User = Depends(get_current_user)
):
    """
    Add a review result for a session review.
    
    Args:
        idea_id: The ID of the idea
        review: Review data
        current_user: The authenticated user making the request
    
    Returns:
        The updated idea
    """
    # Check if idea exists
    existing_idea = await review_service._get_idea(idea_id)
    if not existing_idea:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=404,
                message="Idea not found"
            )
        )
    
    # Check if user has permission to review
    db_user = await user_service.get_user(current_user.user_id)
    if not db_user or UserRole.IDEA_SESSION_PANEL_REVIEWER not in db_user.roles:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=403,
                message="You don't have permission to review session"
            )
        )
    
    # Check if idea is in correct status
    if existing_idea.status != IdeaStatus.IN_SESSION_REVIEW:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=400,
                message="Idea must be in IN_SESSION_REVIEW status to add a review"
            )
        )
    
    # Add review result
    updated_idea = await review_service.add_review_result(
        idea_id,
        TargetType.SESSION,
        review.review_result.model_dump(),
        current_user.user_id,
        current_user.user_name
    )
    
    if not updated_idea:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=500,
                message="Failed to add review result"
            )
        )
    
    return StandardResponse(
        success=True,
        message="Review added successfully",
        data=updated_idea
    )

@router.post("/session/{idea_id}/final-decision", response_model=StandardResponse[Idea])
async def make_session_final_decision(
    idea_id: str,
    decision: FinalDecisionCreate,
    current_user: User = Depends(get_current_user)
):
    """
    Make final decision for a session review.
    
    Args:
        idea_id: The ID of the idea
        decision: Final decision data
        current_user: The authenticated user making the request
    
    Returns:
        The updated idea
    """
    # Check if idea exists
    existing_idea = await review_service._get_idea(idea_id)
    if not existing_idea:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=404,
                message="Idea not found"
            )
        )
    
    # Check if user has permission to make decision
    db_user = await user_service.get_user(current_user.user_id)
    if not db_user or UserRole.IDEA_SESSION_PANEL_REVIEWER not in db_user.roles:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=403,
                message="You don't have permission to make session decision"
            )
        )
    
    # Check if idea is in correct status
    if existing_idea.status != IdeaStatus.IN_SESSION_REVIEW:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=400,
                message="Idea must be in IN_SESSION_REVIEW status to make a decision"
            )
        )
    
    # Check if enough reviews have been submitted
    if not existing_idea.session_review or existing_idea.session_review.review_count < 2:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=400,
                message="At least 2 reviews are required before making a final decision"
            )
        )
    
    # Make final decision
    updated_idea = await review_service.make_final_decision(
        idea_id,
        TargetType.SESSION,
        decision.decision.value,
        decision.comments,
        current_user.user_id,
        current_user.user_name
    )
    
    if not updated_idea:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=500,
                message="Failed to make final decision"
            )
        )
    
    return StandardResponse(
        success=True,
        message="Final decision made successfully",
        data=updated_idea
    )

@router.put("/session/{idea_id}/resubmit", response_model=StandardResponse[Idea])
async def resubmit_session_review(
    idea_id: str,
    session_review_data: SessionReviewCreate,
    current_user: User = Depends(get_current_user)
):
    """
    Resubmit session review when the current status is NEED_IMPROVEMENT.
    
    Args:
        idea_id: The ID of the idea
        session_review_data: Updated session review data
        current_user: The authenticated user making the request
    
    Returns:
        The updated idea
    """
    # Check if idea exists
    existing_idea = await review_service._get_idea(idea_id)
    if not existing_idea:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=404,
                message="Idea not found"
            )
        )
    
    # Check if user is the creator
    if existing_idea.creator_id != current_user.user_id:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=403,
                message="Only the creator can resubmit a session review"
            )
        )
    
    # Check if session review exists and status is NEED_IMPROVEMENT
    if not existing_idea.session_review:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=400,
                message="No existing session review found"
            )
        )
    
    if existing_idea.session_review.status != ReviewStatus.NEED_IMPROVEMENT:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=400,
                message="Session review can only be resubmitted when status is NEED_IMPROVEMENT"
            )
        )
    
    # Resubmit session review (this will reset the review process)
    updated_idea = await review_service.resubmit_session_review(
        idea_id,
        session_review_data,
        current_user.user_id,
        current_user.user_name
    )
    
    if not updated_idea:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=500,
                message="Failed to resubmit session review"
            )
        )
    
    return StandardResponse(
        success=True,
        message="Session review resubmitted successfully",
        data=updated_idea
    )

# Incubator Review Routes
@router.put("/incubator/{idea_id}", response_model=StandardResponse[Idea])
async def submit_incubator_review(
    idea_id: str,
    lean_canvas_data: LeanCanvasCreate,
    current_user: User = Depends(get_current_user)
):
    """
    Submit incubator review for an idea.
    
    Args:
        idea_id: The ID of the idea
        lean_canvas_data: Lean canvas data
        current_user: The authenticated user making the request
    
    Returns:
        The updated idea
    """
    # Check if idea exists
    existing_idea = await review_service._get_idea(idea_id)
    if not existing_idea:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=404,
                message="Idea not found"
            )
        )
    
    # Check if user is the creator
    if existing_idea.creator_id != current_user.user_id:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=403,
                message="Only the creator can submit an incubator review"
            )
        )
    
    # Check if idea is in correct status
    if existing_idea.status != IdeaStatus.SESSION_APPROVED:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=400,
                message="Idea must be in SESSION_APPROVED status to submit an incubator review"
            )
        )
    
    # Submit incubator review
    updated_idea = await review_service.submit_incubator_review(
        idea_id,
        lean_canvas_data,
        current_user.user_id,
        current_user.user_name
    )
    
    if not updated_idea:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=500,
                message="Failed to submit incubator review"
            )
        )
    
    return StandardResponse(
        success=True,
        message="Incubator review submitted successfully",
        data=updated_idea
    )

@router.post("/incubator/{idea_id}/reviews", response_model=StandardResponse[Idea])
async def add_incubator_review_result(
    idea_id: str,
    review: ReviewCreate,
    current_user: User = Depends(get_current_user)
):
    """
    Add a review result for an incubator review.
    
    Args:
        idea_id: The ID of the idea
        review: Review data
        current_user: The authenticated user making the request
    
    Returns:
        The updated idea
    """
    # Check if idea exists
    existing_idea = await review_service._get_idea(idea_id)
    if not existing_idea:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=404,
                message="Idea not found"
            )
        )
    
    # Check if user has permission to review
    db_user = await user_service.get_user(current_user.user_id)
    if not db_user or UserRole.IDEA_INCUBATOR_REVIEWER not in db_user.roles:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=403,
                message="You don't have permission to review incubator"
            )
        )
    
    # Check if idea is in correct status
    if existing_idea.status != IdeaStatus.IN_INCUBATOR_REVIEW:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=400,
                message="Idea must be in IN_INCUBATOR_REVIEW status to add a review"
            )
        )
    
    # Add review result
    updated_idea = await review_service.add_review_result(
        idea_id,
        TargetType.INCUBATOR,
        review.review_result.model_dump(),
        current_user.user_id,
        current_user.user_name
    )
    
    if not updated_idea:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=500,
                message="Failed to add review result"
            )
        )
    
    return StandardResponse(
        success=True,
        message="Review added successfully",
        data=updated_idea
    )

@router.post("/incubator/{idea_id}/final-decision", response_model=StandardResponse[Idea])
async def make_incubator_final_decision(
    idea_id: str,
    decision: FinalDecisionCreate,
    current_user: User = Depends(get_current_user)
):
    """
    Make final decision for an incubator review.
    
    Args:
        idea_id: The ID of the idea
        decision: Final decision data
        current_user: The authenticated user making the request
    
    Returns:
        The updated idea
    """
    # Check if idea exists
    existing_idea = await review_service._get_idea(idea_id)
    if not existing_idea:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=404,
                message="Idea not found"
            )
        )
    
    # Check if user has permission to make decision
    db_user = await user_service.get_user(current_user.user_id)
    if not db_user or UserRole.IDEA_INCUBATOR_REVIEWER not in db_user.roles:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=403,
                message="You don't have permission to make incubator decision"
            )
        )
    
    # Check if idea is in correct status
    if existing_idea.status != IdeaStatus.IN_INCUBATOR_REVIEW:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=400,
                message="Idea must be in IN_INCUBATOR_REVIEW status to make a decision"
            )
        )
    
    # Check if enough reviews have been submitted
    if not existing_idea.incubator_review or existing_idea.incubator_review.review_count < 2:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=400,
                message="At least 2 reviews are required before making a final decision"
            )
        )
    
    # Make final decision
    updated_idea = await review_service.make_final_decision(
        idea_id,
        TargetType.INCUBATOR,
        decision.decision.value,
        decision.comments,
        current_user.user_id,
        current_user.user_name
    )
    
    if not updated_idea:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=500,
                message="Failed to make final decision"
            )
        )
    
    return StandardResponse(
        success=True,
        message="Final decision made successfully",
        data=updated_idea
    )
