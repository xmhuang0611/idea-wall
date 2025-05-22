from fastapi import APIRouter, Depends, Query, HTTPException, Path
from typing import List, Optional
from core.deps import get_current_user
from services.session_service import session_service
from services.idea_service import idea_service
from models.session import (
    Session, SessionCreate, SessionUpdate,
    ReviewStatus
)
from models.response import StandardResponse, Pagination, ErrorDetail
from models.user import User, UserRole
from services.user_service import user_service

router = APIRouter()

@router.post("", response_model=StandardResponse[Session])
async def create_session(
    session: SessionCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new idea session for review"""
    # Check if the idea exists
    idea = await idea_service.get_idea(session.idea_id)
    if not idea:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=404,
                message="Idea not found"
            )
        )
    
    # Check if the user is the creator of the idea
    if idea.creator_id != current_user.user_id:
        # If not creator, check if user is admin
        db_user = await user_service.get_user(current_user.user_id)
        if not db_user or UserRole.ADMIN not in db_user.roles:
            return StandardResponse(
                success=False,
                error=ErrorDetail(
                    code=403,
                    message="Only the creator or admin can submit this idea for review"
                )
            )
    
    # Create the session
    created_session = await session_service.create_session(
        session,
        creator_id=current_user.user_id,
        creator_name=current_user.user_name
    )
    
    return StandardResponse(
        success=True,
        data=created_session
    )

@router.get("", response_model=StandardResponse[List[Session]])
async def get_sessions(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[ReviewStatus] = None,
    idea_id: Optional[str] = None,
    creator_id: Optional[str] = None,
    is_current: Optional[bool] = None,
):
    """Get sessions with filters"""
    # Public endpoint - no authentication required
    sessions = await session_service.get_sessions(
        skip=skip,
        limit=limit,
        status=status,
        idea_id=idea_id,
        creator_id=creator_id,
        is_current=is_current
    )
    
    total = await session_service.get_total_sessions(
        status=status,
        idea_id=idea_id,
        creator_id=creator_id,
        is_current=is_current
    )
    
    return StandardResponse(
        success=True,
        data=sessions,
        pagination=Pagination(
            skip=skip,
            limit=limit,
            total=total
        )
    )

@router.get("/{session_id}", response_model=StandardResponse[Session])
async def get_session(
    session_id: str = Path(..., title="The ID of the session to get")
):
    """Get a session by ID"""
    session = await session_service.get_session(session_id)
    if not session:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=404,
                message="Session not found"
            )
        )
    
    # Public endpoint - no authentication required
    return StandardResponse(
        success=True,
        data=session
    )

@router.get("/ideas/{idea_id}/current", response_model=StandardResponse[Session])
async def get_current_session_by_idea(
    idea_id: str = Path(..., title="The ID of the idea")
):
    """Get the current session for an idea"""
    # Check if the idea exists
    idea = await idea_service.get_idea(idea_id)
    if not idea:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=404,
                message="Idea not found"
            )
        )
    
    # Get the current session
    session = await session_service.get_current_session_by_idea(idea_id)
    if not session:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=404,
                message="No current session found for this idea"
            )
        )
    
    # Public endpoint - no authentication required
    return StandardResponse(
        success=True,
        data=session
    )

@router.put("/{session_id}", response_model=StandardResponse[Session])
async def update_session(
    session_update: SessionUpdate,
    session_id: str = Path(..., title="The ID of the session to update"),
    current_user: User = Depends(get_current_user)
):
    """Update a session"""
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
    
    # Check if the user is the creator of the session
    if session.creator_id != current_user.user_id:
        # If not creator, check if user is admin
        db_user = await user_service.get_user(current_user.user_id)
        if not db_user or UserRole.ADMIN not in db_user.roles:
            return StandardResponse(
                success=False,
                error=ErrorDetail(
                    code=403,
                    message="Only the creator or admin can update this session"
                )
            )
    
    # Check if the session is in a status that allows updates
    if session.status not in [ReviewStatus.NEED_IMPROVEMENT, ReviewStatus.PENDING]:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=400,
                message=f"Cannot update session in {session.status} status"
            )
        )
    
    # Update the session
    updated_session = await session_service.update_session(
        session_id,
        session_update,
        updater_id=current_user.user_id,
        updater_name=current_user.user_name
    )
    
    if not updated_session:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=500,
                message="Failed to update session"
            )
        )
    
    return StandardResponse(
        success=True,
        data=updated_session
    ) 