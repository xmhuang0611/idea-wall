from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List
from core.deps import get_current_active_user
from services.idea_service import idea_service
from models.idea import Idea, IdeaCreate
from models.user import User

router = APIRouter()

@router.get("", response_model=List[Idea])
async def get_ideas(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user)
):
    return await idea_service.get_ideas(skip=skip, limit=limit)

@router.get("/{idea_id}", response_model=Idea)
async def get_idea(
    idea_id: str,
    current_user: User = Depends(get_current_active_user)
):
    idea = await idea_service.get_idea(idea_id)
    if idea is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Idea not found"
        )
    return idea

@router.post("", response_model=Idea)
async def create_idea(
    idea: IdeaCreate,
    current_user: User = Depends(get_current_active_user)
):
    return await idea_service.create_idea(idea, current_user.user_id)

@router.put("/{idea_id}", response_model=Idea)
async def update_idea(
    idea_id: str,
    idea_update: IdeaCreate,
    current_user: User = Depends(get_current_active_user)
):
    idea = await idea_service.get_idea(idea_id)
    if idea is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Idea not found"
        )
    
    if idea.created_by != current_user.user_id and current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    updated_idea = await idea_service.update_idea(
        idea_id=idea_id,
        idea_update=idea_update,
        updated_by=current_user.user_id
    )
    
    return updated_idea 