from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from core.deps import get_current_user
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
    current_user: Optional[User] = Depends(get_current_user)
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
    current_user: User = Depends(get_current_user)
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
        creator_id=current_user.user_id,
        creator_name=current_user.user_name
    )

@router.delete("/{comment_id}", response_model=dict)
async def delete_comment(
    idea_id: str,
    comment_id: str,
    current_user: User = Depends(get_current_user)
):
    comment = await comment_service.get_comment(comment_id)
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
        
    if comment.created_by != current_user.user_id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
        
    success = await comment_service.delete_comment(comment_id)
    return {"success": success} 