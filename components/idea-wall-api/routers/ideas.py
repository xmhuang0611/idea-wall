from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List, Optional, Dict, Any
from core.deps import get_current_user, get_current_user_optional
from services.idea_service import idea_service
from services.vote_service import vote_service
from services.bookmark_service import bookmark_service
from services.user_service import user_service
from models.idea import Idea, IdeaCreate, IdeaUpdate, IdeaStatus, SessionReview, IncubatorReview, SessionReviewCreate, LeanCanvasCreate
from models.review import ReviewCreate, FinalDecisionCreate, TargetType, ReviewStatus, ReviewResult
from models.response import StandardResponse, Pagination, ErrorDetail
from models.user import User
from models.user import UserRole
from services.log_service import log_service
from services.tag_service import tag_service
from models.log import ObjectType, OperationType
import json
from datetime import datetime
from bson import ObjectId

router = APIRouter()

@router.get("", response_model=StandardResponse[List[Idea]])
async def get_ideas(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    sort_by: Optional[str] = Query(None, regex="^(created_at|updated_at|title|feeling|total_votes|total_bookmarks)$"),
    sort_order: Optional[str] = Query(None, regex="^(asc|desc)$"),
    search: Optional[str] = None,
    tags: Optional[List[int]] = Query(None),
    creator_id: Optional[str] = None,
    voted_by: Optional[str] = None,
    bookmarked_by: Optional[str] = None,
    status: Optional[List[str]] = Query(None),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    ideas = await idea_service.get_ideas(
        skip=skip,
        limit=limit,
        sort_by=sort_by,
        sort_order=sort_order,
        search=search,
        tags=tags,
        creator_id=creator_id,
        voted_by=voted_by,
        bookmarked_by=bookmarked_by,
        status=status
    )
    total = await idea_service.get_total_ideas(
        search=search,
        tags=tags,
        creator_id=creator_id,
        voted_by=voted_by,
        bookmarked_by=bookmarked_by,
        status=status
    )
    
    # If user is logged in, get vote and bookmark status
    if current_user:
        # Get vote status
        user_votes = await vote_service.get_votes_by_user(current_user.user_id, "Idea")
        user_voted_ideas = {vote.target_id: vote.vote_status for vote in user_votes}
        
        # Get bookmark status
        user_bookmarks = await bookmark_service.get_bookmarks_by_user(current_user.user_id, "Idea")
        user_bookmarkd_ideas = {bookmark.target_id: bookmark.bookmark_status for bookmark in user_bookmarks}
        
        # Add vote and bookmark status to each idea
        for idea in ideas:
            if idea.id in user_voted_ideas:
                idea.has_voted = user_voted_ideas[idea.id] == 1
            if idea.id in user_bookmarkd_ideas:
                idea.has_bookmarked = user_bookmarkd_ideas[idea.id] == 1
    
    return StandardResponse(
        success=True,
        data=ideas,
        pagination=Pagination(
            skip=skip,
            limit=limit,
            total=total
        )
    )

@router.get("/{idea_id}", response_model=StandardResponse[Idea])
async def get_idea(
    idea_id: str,
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    idea = await idea_service.get_idea(idea_id)
    if not idea:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=404,
                message="Idea not found"
            )
        )
    
    # If user is logged in, get vote and bookmark status
    if current_user:
        # Get vote status
        vote = await vote_service.get_vote(
            target_id=idea_id, 
            target_type="Idea",
            user_id=current_user.user_id
        )
        if vote:
            idea.has_voted = vote.vote_status == 1
            
        # Get bookmark status
        bookmark = await bookmark_service.get_bookmark(
            target_id=idea_id,
            target_type="Idea",
            user_id=current_user.user_id
        )
        if bookmark:
            idea.has_bookmarked = bookmark.bookmark_status == 1
    
    return StandardResponse(
        success=True,
        data=idea
    )

@router.post("", response_model=StandardResponse[Idea])
async def create_idea(
    idea: IdeaCreate,
    current_user: User = Depends(get_current_user)
):
    created_idea = await idea_service.create_idea(
        idea, 
        creator_id=current_user.user_id,
        creator_name=current_user.user_name
    )
    return StandardResponse(
        success=True,
        data=created_idea
    )

@router.put("/{idea_id}", response_model=StandardResponse[Idea])
async def update_idea(
    idea_id: str,
    idea: IdeaUpdate,
    current_user: User = Depends(get_current_user)
):
    # Check if idea exists
    existing_idea = await idea_service.get_idea(idea_id)
    if not existing_idea:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=404,
                message="Idea not found"
            )
        )
    
    # Check if user is the creator (case-insensitive comparison)
    if existing_idea.creator_id != current_user.user_id:
        # If not creator, check if user is admin
        db_user = await user_service.get_user(current_user.user_id)
        if not db_user or UserRole.ADMIN not in db_user.roles:
            return StandardResponse(
                success=False,
                error=ErrorDetail(
                    code=403,
                    message="Only the creator or admin can update this idea"
                )
            )
    
    # Update idea
    updated_idea = await idea_service.update_idea(
        idea_id,
        idea,
        updater_id=current_user.user_id,
        updater_name=current_user.user_name
    )
    
    if not updated_idea:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=500,
                message="Failed to update idea"
            )
        )
    
    return StandardResponse(
        success=True,
        data=updated_idea
    )

@router.delete("/{idea_id}", response_model=StandardResponse)
async def delete_idea(
    idea_id: str,
    current_user: User = Depends(get_current_user)
):
    # Check if idea exists
    existing_idea = await idea_service.get_idea(idea_id)
    if not existing_idea:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=404,
                message="Idea not found"
            )
        )

    # Check if user is the creator (case-insensitive comparison)
    if existing_idea.creator_id.upper() != current_user.user_id.upper():
        # If not creator, check if user is admin
        db_user = await user_service.get_user(current_user.user_id)
        if not db_user or UserRole.ADMIN not in db_user.roles:
            return StandardResponse(
                success=False,
                error=ErrorDetail(
                    code=403,
                    message="Only the creator or admin can delete this idea"
                )
            )

    # Delete idea
    success = await idea_service.delete_idea(idea_id, current_user.user_id, current_user.user_name)
    if not success:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=500,
                message="Failed to delete idea"
            )
        )

    return StandardResponse(
        success=True,
        message="Idea deleted successfully"
    )

@router.get("/{idea_id}/history", response_model=StandardResponse[List[dict]])
async def get_idea_history(
    idea_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100)
):
    """
    Get the history of an idea
    """
    # First check if the idea exists
    idea = await idea_service.get_idea(idea_id)
    if not idea:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=404,
                message="Idea not found"
            )
        )
    
    # Calculate page number from skip and limit
    page = (skip // limit) + 1
    
    # Get logs for this idea
    logs = await log_service.list_logs(
        page=page,
        page_size=limit,
        object_type=ObjectType.IDEA,
        object_id=idea_id,
        operation_type=None,  # Get all operation types (create, update)
        start_date=None,
        end_date=None
    )
    
    # Count total logs for pagination
    total_logs = await log_service.count_logs(
        object_type=ObjectType.IDEA,
        object_id=idea_id
    )
    
    # Convert logs to history records
    history_records = []
    for log in logs:
        try:
            # Parse the object_data JSON
            data = json.loads(log.object_data)
            
            # Add tag details - they might be missing in the log data
            if "tags" in data and ("tag_details" not in data or not data["tag_details"]):
                all_tags = await tag_service.get_all_tags()
                data["tag_details"] = [{"tag_id": tag.tag_id, "tag_name": tag.tag_name} 
                                     for tag in all_tags if tag.tag_id in data["tags"]]
            
            # Create history record
            history_record = {
                "id": log.id,
                "idea_id": idea_id,
                "title": data.get("title", ""),
                "description": data.get("description", ""),
                "feeling": data.get("feeling", 1),
                "tags": data.get("tags", []),
                "tag_details": data.get("tag_details", []),
                "created_at": log.created_at,
                "creator_id": log.creator_id,
                "creator_name": log.creator_name,
                "action": log.operation_type
            }
            
            history_records.append(history_record)
        
        except Exception as e:
            # Skip malformed log entries
            print(f"Error parsing log data: {e}")
            continue
    
    return StandardResponse(
        success=True,
        data=history_records,
        pagination=Pagination(
            skip=skip,
            limit=limit,
            total=total_logs
        )
    )

# Session Review Routes
@router.put("/{idea_id}/session-review", response_model=StandardResponse[Idea])
async def submit_session_review(
    idea_id: str,
    session_review_data: SessionReviewCreate,
    current_user: User = Depends(get_current_user)
):
    # Check if idea exists
    existing_idea = await idea_service.get_idea(idea_id)
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
    updated_idea = await idea_service.submit_session_review(
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
        data=updated_idea
    )

@router.post("/{idea_id}/session-review/reviews", response_model=StandardResponse[Idea])
async def add_session_review_result(
    idea_id: str,
    review: ReviewCreate,
    current_user: User = Depends(get_current_user)
):
    # Check if idea exists
    existing_idea = await idea_service.get_idea(idea_id)
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
    updated_idea = await idea_service.add_review_result(
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
        data=updated_idea
    )

@router.post("/{idea_id}/session-review/final-decision", response_model=StandardResponse[Idea])
async def make_session_final_decision(
    idea_id: str,
    decision: FinalDecisionCreate,
    current_user: User = Depends(get_current_user)
):
    # Check if idea exists
    existing_idea = await idea_service.get_idea(idea_id)
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
    updated_idea = await idea_service.make_final_decision(
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
        data=updated_idea
    )

# Incubator Review Routes
@router.put("/{idea_id}/incubator-review", response_model=StandardResponse[Idea])
async def submit_incubator_review(
    idea_id: str,
    lean_canvas_data: LeanCanvasCreate,
    current_user: User = Depends(get_current_user)
):
    # Check if idea exists
    existing_idea = await idea_service.get_idea(idea_id)
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
    updated_idea = await idea_service.submit_incubator_review(
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
        data=updated_idea
    )

@router.post("/{idea_id}/incubator-review/reviews", response_model=StandardResponse[Idea])
async def add_incubator_review_result(
    idea_id: str,
    review: ReviewCreate,
    current_user: User = Depends(get_current_user)
):
    # Check if idea exists
    existing_idea = await idea_service.get_idea(idea_id)
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
    if existing_idea.status != IdeaStatus.IN_INCUBATION_REVIEW:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=400,
                message="Idea must be in IN_INCUBATION_REVIEW status to add a review"
            )
        )
    
    # Add review result
    updated_idea = await idea_service.add_review_result(
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
        data=updated_idea
    )

@router.post("/{idea_id}/incubator-review/final-decision", response_model=StandardResponse[Idea])
async def make_incubator_final_decision(
    idea_id: str,
    decision: FinalDecisionCreate,
    current_user: User = Depends(get_current_user)
):
    # Check if idea exists
    existing_idea = await idea_service.get_idea(idea_id)
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
    if existing_idea.status != IdeaStatus.IN_INCUBATION_REVIEW:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=400,
                message="Idea must be in IN_INCUBATION_REVIEW status to make a decision"
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
    updated_idea = await idea_service.make_final_decision(
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
        data=updated_idea
    )

@router.post("/{idea_id}/roll-out", response_model=StandardResponse[Idea])
async def roll_out_idea(
    idea_id: str,
    current_user: User = Depends(get_current_user)
):
    # Check if idea exists
    existing_idea = await idea_service.get_idea(idea_id)
    if not existing_idea:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=404,
                message="Idea not found"
            )
        )
    
    # Check if user has permission
    db_user = await user_service.get_user(current_user.user_id)
    if not db_user or UserRole.ADMIN not in db_user.roles:
        # Check if user is the creator
        if existing_idea.creator_id != current_user.user_id:
            return StandardResponse(
                success=False,
                error=ErrorDetail(
                    code=403,
                    message="Only the creator or admin can roll out an idea"
                )
            )
    
    # Check if idea is in correct status
    if existing_idea.status != IdeaStatus.INCUBATION_APPROVED:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=400,
                message="Idea must be in INCUBATION_APPROVED status to roll out"
            )
        )
    
    # Roll out idea
    updated_idea = await idea_service.roll_out_idea(
        idea_id,
        current_user.user_id,
        current_user.user_name
    )
    
    if not updated_idea:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=500,
                message="Failed to roll out idea"
            )
        )
    
    return StandardResponse(
        success=True,
        data=updated_idea
    )