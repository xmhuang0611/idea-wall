from fastapi import APIRouter, status, Depends, Query
from typing import List, Optional
from core.deps import get_current_user
from services.tag_service import tag_service
from models.tag import Tag, TagCreate, TagUpdate
from models.user import User
from models.response import StandardResponse, Pagination, ErrorDetail

router = APIRouter()

@router.get("/all", response_model=StandardResponse[List[Tag]])
async def get_all_tags():
    """
    Get all tags without pagination
    """
    try:
        tags = await tag_service.get_all_tags()
        return StandardResponse(
            success=True,
            data=tags
        )
    except Exception as e:
        return StandardResponse(
            success=False,
            error=ErrorDetail(code=status.HTTP_500_INTERNAL_SERVER_ERROR, message=str(e))
        )

@router.get("", response_model=StandardResponse[List[Tag]])
async def get_tags(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
):
    """
    Get all tags with pagination
    """
    try:
        tags, total = await tag_service.get_tags(skip=skip, limit=limit)
        return StandardResponse(
            success=True,
            data=tags,
            pagination=Pagination(skip=skip, limit=limit, total=total)
        )
    except Exception as e:
        return StandardResponse(
            success=False,
            error=ErrorDetail(code=status.HTTP_500_INTERNAL_SERVER_ERROR, message=str(e))
        )

@router.post("", response_model=StandardResponse[Tag], status_code=status.HTTP_201_CREATED)
async def create_tag(
    tag: TagCreate,
    current_user: User = Depends(get_current_user)
):
    """
    Create a new tag
    """
    try:
        created_tag = await tag_service.create_tag(
            tag,
            creator_id=current_user.user_id,
            creator_name=current_user.user_name
        )
        return StandardResponse(
            success=True,
            data=created_tag
        )
    except Exception as e:
        return StandardResponse(
            success=False,
            error=ErrorDetail(code=status.HTTP_500_INTERNAL_SERVER_ERROR, message=str(e))
        )

@router.put("/{tag_id}", response_model=StandardResponse[Optional[Tag]])
async def update_tag(
    tag_id: int, 
    tag: TagUpdate,
    current_user: User = Depends(get_current_user)
):
    """
    Update an existing tag
    """
    try:
        updated_tag = await tag_service.update_tag(
            tag_id, 
            tag,
            updater_id=current_user.user_id,
            updater_name=current_user.user_name
        )
        if not updated_tag:
            return StandardResponse(
                success=False,
                error=ErrorDetail(
                    code=status.HTTP_404_NOT_FOUND,
                    message=f"Tag with ID {tag_id} not found"
                )
            )
        return StandardResponse(
            success=True,
            data=updated_tag
        )
    except Exception as e:
        return StandardResponse(
            success=False,
            error=ErrorDetail(code=status.HTTP_500_INTERNAL_SERVER_ERROR, message=str(e))
        )

@router.delete("/{tag_id}", response_model=StandardResponse[bool])
async def delete_tag(tag_id: int):
    """
    Delete a tag
    """
    try:
        deleted = await tag_service.delete_tag(tag_id)
        if not deleted:
            return StandardResponse(
                success=False,
                error=ErrorDetail(
                    code=status.HTTP_404_NOT_FOUND,
                    message=f"Tag with ID {tag_id} not found"
                )
            )
        return StandardResponse(
            success=True,
            data=True
        )
    except ValueError as e:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=status.HTTP_400_BAD_REQUEST,
                message=str(e)
            )
        )
    except Exception as e:
        return StandardResponse(
            success=False,
            error=ErrorDetail(code=status.HTTP_500_INTERNAL_SERVER_ERROR, message=str(e))
        )