from fastapi import APIRouter, Depends
from core.deps import get_current_user
from services.bookmark_service import bookmark_service
from models.bookmark import Bookmark, BookmarkCreate
from models.user import User
from models.response import StandardResponse

router = APIRouter()

@router.post("", response_model=StandardResponse[Bookmark])
async def create_bookmark(
    bookmark: BookmarkCreate,
    current_user: User = Depends(get_current_user)
):
    created_bookmark = await bookmark_service.create_bookmark(
        bookmark, 
        creator_id=current_user.user_id, 
        creator_name=current_user.user_name
    )

    return StandardResponse(
        success=True,
        data=created_bookmark
    ) 