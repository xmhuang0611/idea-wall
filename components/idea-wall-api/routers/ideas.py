from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from core.deps import get_current_user, get_current_user_optional
from services.idea_service import idea_service
from services.vote_service import vote_service
from models.idea import Idea, IdeaCreate, IdeaCategory
from models.response import StandardResponse, Pagination, ErrorDetail
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
    current_user: Optional[User] = Depends(get_current_user_optional)
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
    
    # 如果用户已登录，获取用户点赞状态
    if current_user:
        user_votes = await vote_service.get_votes_by_user(current_user.user_id, "Idea")
        user_voted_ideas = {vote.target_id: vote.vote_status for vote in user_votes}
        
        # 为每个 idea 添加用户点赞状态
        for idea in ideas:
            if idea.id in user_voted_ideas:
                idea.hasVoted = user_voted_ideas[idea.id] == 1
    
    return StandardResponse(
        success=True,
        data=ideas,
        pagination=Pagination(
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
            success=False,
            error=ErrorDetail(
                code=404,
                message="Idea not found"
            )
        )
    
    # 如果用户已登录，获取用户点赞状态
    if current_user:
        vote = await vote_service.get_vote(
            target_id=idea_id, 
            target_type="Idea",
            user_id=current_user.user_id
        )
        if vote:
            idea.hasVoted = vote.vote_status == 1
    
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
    idea_update: IdeaCreate,
    current_user: User = Depends(get_current_user)
):
    updated_idea = await idea_service.update_idea(
        idea_id, 
        idea_update, 
        updater_id=current_user.user_id, 
        updater_name=current_user.user_name
    )
    if not updated_idea:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=404,
                message="Idea not found"
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
    success = await idea_service.delete_idea(idea_id, current_user.user_id)
    if not success:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=404,
                message="Idea not found or you don't have permission to delete it"
            )
        )
    return StandardResponse(
        success=True
    ) 