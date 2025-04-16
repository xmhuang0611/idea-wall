from fastapi import APIRouter, Depends, HTTPException, status
from core.deps import get_current_active_user
from services.vote_service import vote_service
from models.vote import Vote, VoteCreate
from models.user import User

router = APIRouter()

@router.post("", response_model=Vote)
async def create_vote(
    vote: VoteCreate,
    current_user: User = Depends(get_current_active_user)
):
    return await vote_service.create_vote(vote, current_user.user_id) 