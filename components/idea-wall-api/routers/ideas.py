from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from core.deps import get_current_user, get_current_user_optional
from services.idea_service import idea_service
from services.vote_service import vote_service
from services.bookmark_service import bookmark_service
from services.user_service import user_service
from models.idea import Idea, IdeaCreate, IdeaUpdate, IdeaTag
from models.response import StandardResponse, Pagination, ErrorDetail
from models.user import User
from models.user import UserRole

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
        bookmarked_by=bookmarked_by
    )
    total = await idea_service.get_total_ideas(
        search=search,
        tags=tags,
        creator_id=creator_id,
        voted_by=voted_by,
        bookmarked_by=bookmarked_by
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
    
    # Get user from database to check roles
    db_user = await user_service.get_user(current_user.user_id)
    if not db_user:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=403,
                message="User not found"
            )
        )
    
    # Check if user is the creator or has ADMIN role
    if existing_idea.creator_id != current_user.user_id and UserRole.ADMIN not in db_user.roles:
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
    
    # Get user from database to check roles
    db_user = await user_service.get_user(current_user.user_id)
    if not db_user:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=403,
                message="User not found"
            )
        )
    
    # Check if user is the creator or has ADMIN role
    if existing_idea.creator_id != current_user.user_id and UserRole.ADMIN not in db_user.roles:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=403,
                message="Only the creator or admin can delete this idea"
            )
        )
    
    # Delete idea
    success = await idea_service.delete_idea(idea_id)
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