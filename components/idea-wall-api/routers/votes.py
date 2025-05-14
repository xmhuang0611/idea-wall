from fastapi import APIRouter, Depends
from core.deps import get_current_user
from services.vote_service import vote_service
from models.vote import Vote, VoteCreate
from models.user import User
from models.response import StandardResponse

router = APIRouter()

@router.post("", response_model=StandardResponse[Vote])
async def create_vote(
    vote: VoteCreate,
    current_user: User = Depends(get_current_user)
):
    created_vote = await vote_service.create_vote(
        vote, 
        creator_id=current_user.user_id, 
        creator_name=current_user.user_name
    )

    return StandardResponse(
        success=True,
        data=created_vote
    )
