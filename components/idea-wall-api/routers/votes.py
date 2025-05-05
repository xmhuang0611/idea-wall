from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from core.deps import get_current_user
from services.vote_service import vote_service
from models.vote import Vote, VoteCreate
from models.user import User

router = APIRouter()

@router.get("", response_model=List[Vote])
async def get_votes(
    idea_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: Optional[User] = Depends(get_current_user)
):
    # 读操作不需要登录
    return await vote_service.get_votes(idea_id=idea_id, skip=skip, limit=limit)

@router.post("", response_model=Vote)
async def create_vote(
    vote: VoteCreate,
    current_user: User = Depends(get_current_user)
):
    # 写操作需要登录
    return await vote_service.create_vote(
        vote, 
        creator_id=current_user.user_id, 
        creator_name=current_user.user_name
    )

@router.delete("/{vote_id}", response_model=dict)
async def delete_vote(
    vote_id: str,
    current_user: User = Depends(get_current_user)
):
    # 写操作需要登录
    vote = await vote_service.get_vote(vote_id)
    if not vote:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vote not found"
        )
        
    # 只有投票作者才能删除投票
    if vote.creator_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
        
    success = await vote_service.delete_vote(vote_id)
    return {"success": success} 