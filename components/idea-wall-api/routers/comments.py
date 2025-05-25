from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from core.deps import get_current_user  
from services.comment_service import comment_service
from services.idea_service import idea_service
from models.comment import Comment, CommentCreate
from models.user import User
from models.response import StandardResponse, Pagination, ErrorDetail

router = APIRouter()

@router.get("", response_model=StandardResponse[List[Comment]])
async def get_comments(
    idea_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    comments = await comment_service.get_comments(idea_id=idea_id, skip=skip, limit=limit)
    total = await comment_service.count_comments(idea_id=idea_id)
    return StandardResponse(
        success=True,
        data=comments,
        pagination=Pagination(
            skip=skip,
            limit=limit,
            total=total
        )
    )

@router.post("", response_model=StandardResponse[Comment])
async def create_comment(
    comment: CommentCreate,
    current_user: User = Depends(get_current_user)
):
    idea = await idea_service.get_idea(comment.idea_id)
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
            
    created_comment = await comment_service.create_comment(
        comment=comment,
        creator_id=current_user.user_id,
        creator_name=current_user.user_name
    )
    
    return StandardResponse(
        success=True,
        data=created_comment
    )

@router.delete("/{comment_id}", response_model=StandardResponse[bool])
async def delete_comment(
    comment_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Delete a comment. Only the comment creator or admin can delete it.
    """
    try:
        # Get comment first to check permissions
        comment = await comment_service.get_comment(comment_id)
        if not comment:
            return StandardResponse(
                success=False,
                error=ErrorDetail(
                    code=status.HTTP_404_NOT_FOUND,
                    message="Comment not found"
                )
            )

        # Check if user is the creator (case-insensitive comparison)
        if comment.creator_id != current_user.user_id:
            # If not creator, check if user is admin
            db_user = await user_service.get_user(current_user.user_id)
            if not db_user or UserRole.ADMIN not in db_user.roles:
                return StandardResponse(
                    success=False,
                    error=ErrorDetail(
                        code=403,
                        message="Only the creator or admin can delete this comment"
                    )
                )
            
        deleted = await comment_service.delete_comment(
            comment_id,
            user_id=current_user.user_id,
            user_name=current_user.user_name
        )
        
        if not deleted:
            return StandardResponse(
                success=False,
                error=ErrorDetail(
                    code=status.HTTP_404_NOT_FOUND,
                    message="Comment not found"
                )
            )
            
        return StandardResponse(
            success=True,
            data=True
        )
    except HTTPException as e:
        return StandardResponse(
            success=False,
            error=ErrorDetail(code=e.status_code, message=str(e.detail))
        )
    except Exception as e:
        return StandardResponse(
            success=False,
            error=ErrorDetail(code=status.HTTP_500_INTERNAL_SERVER_ERROR, message=str(e))
        )
