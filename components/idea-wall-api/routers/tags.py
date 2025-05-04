from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List
from core.deps import get_current_user
from services.tag_service import tag_service
from models.tag import Tag, TagCreate
from models.user import User

router = APIRouter()

@router.get("", response_model=List[Tag])
async def get_tags(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user)
):
    return await tag_service.get_tags(skip=skip, limit=limit)

@router.post("", response_model=Tag)
async def create_tag(
    tag: TagCreate,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return await tag_service.create_tag(tag, current_user.user_id) 