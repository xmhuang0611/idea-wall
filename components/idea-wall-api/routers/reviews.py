from fastapi import APIRouter, Depends, HTTPException, Query, Request
from typing import List, Optional
from models.response import ErrorDetail, StandardResponse
from models.review import Review, ReviewCreate, ReviewResult
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
