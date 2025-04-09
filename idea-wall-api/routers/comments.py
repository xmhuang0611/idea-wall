from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List
from core.deps import get_current_active_user
from services.comment_service import comment_service
from services.idea_service import idea_service
from models.comment import Comment, CommentCreate
from models.user import User

router = APIRouter()

@router.get("", response_model=List[Comment])
async def get_comments(
    idea_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user)
):
    idea = await idea_service.get_idea(idea_id)
    if not idea:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Idea not found"
        )
    return await comment_service.get_comments(idea_id=idea_id, skip=skip, limit=limit)

@router.post("", response_model=Comment)
async def create_comment(
    idea_id: str,
    comment: CommentCreate,
    current_user: User = Depends(get_current_active_user)
):
    idea = await idea_service.get_idea(idea_id)
    if not idea:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Idea not found"
        )
        
    if comment.parent_id:
        parent_comment = await comment_service.get_comment(comment.parent_id)
        if not parent_comment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent comment not found"
            )
            
    return await comment_service.create_comment(
        idea_id=idea_id,
        comment=comment,
        created_by=current_user.user_id
    ) 