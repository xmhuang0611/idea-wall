from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from core.deps import get_current_user
from services.idea_service import idea_service
from models.idea import Idea, IdeaCreate, StandardResponse, ResponseMeta, ErrorDetail, IdeaCategory
from models.user import User

router = APIRouter()

@router.get("", response_model=StandardResponse[List[Idea]])
async def get_ideas(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    category: Optional[IdeaCategory] = None,
    sort_by: Optional[str] = Query(None, regex="^(created_at|title|feeling|total_votes)$"),
    sort_order: Optional[str] = Query(None, regex="^(asc|desc)$"),
    search: Optional[str] = None,
    tags: Optional[List[int]] = Query(None),
    current_user: Optional[User] = Depends(get_current_user)
):
    skip = (page - 1) * page_size
    ideas = await idea_service.get_ideas(
        skip=skip,
        limit=page_size,
        category=category,
        sort_by=sort_by,
        sort_order=sort_order,
        search=search,
        tags=tags
    )
    total = await idea_service.get_total_ideas(
        category=category,
        search=search,
        tags=tags
    )
    
    return StandardResponse(
        status="success",
        data=ideas,
        meta=ResponseMeta(
            page=page,
            page_size=page_size,
            total=total
        )
    )

@router.get("/{idea_id}", response_model=StandardResponse[Idea])
async def get_idea(
    idea_id: str,
    current_user: Optional[User] = Depends(get_current_user)
):
    idea = await idea_service.get_idea(idea_id)
    if not idea:
        return StandardResponse(
            status="error",
            error=ErrorDetail(
                code="NOT_FOUND",
                message="Idea not found"
            )
        )
    return StandardResponse(
        status="success",
        data=idea
    )

@router.post("", response_model=StandardResponse[Idea])
async def create_idea(
    idea: IdeaCreate,
    current_user: User = Depends(get_current_user)
):
    created_idea = await idea_service.create_idea(idea, current_user.user_id)
    return StandardResponse(
        status="success",
        data=created_idea
    )

@router.put("/{idea_id}", response_model=StandardResponse[Idea])
async def update_idea(
    idea_id: str,
    idea_update: IdeaCreate,
    current_user: User = Depends(get_current_user)
):
    updated_idea = await idea_service.update_idea(idea_id, idea_update, current_user.user_id)
    if not updated_idea:
        return StandardResponse(
            status="error",
            error=ErrorDetail(
                code="NOT_FOUND",
                message="Idea not found"
            )
        )
    return StandardResponse(
        status="success",
        data=updated_idea
    )

@router.delete("/{idea_id}", response_model=StandardResponse)
async def delete_idea(
    idea_id: str,
    current_user: User = Depends(get_current_user)
):
    success = await idea_service.delete_idea(idea_id, current_user.user_id)
    if not success:
        return StandardResponse(
            status="error",
            error=ErrorDetail(
                code="NOT_FOUND",
                message="Idea not found or you don't have permission to delete it"
            )
        )
    return StandardResponse(
        status="success"
    ) 