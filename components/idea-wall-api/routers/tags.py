from fastapi import APIRouter, status, Query
from typing import List
from services.tag_service import tag_service
from models.tag import Tag
from models.response import StandardResponse, Pagination, ErrorDetail

router = APIRouter()

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
