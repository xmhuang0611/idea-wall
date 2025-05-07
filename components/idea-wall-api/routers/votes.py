from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from core.deps import get_current_user
from services.vote_service import vote_service
from models.vote import Vote, VoteCreate
from models.user import User

router = APIRouter()

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