from datetime import datetime
from typing import Optional
from fastapi import HTTPException, status
from core.database import get_database
from models.vote import VoteCreate, VoteInDB, Vote
from .idea_service import idea_service
from .comment_service import comment_service
from bson import ObjectId

class VoteService:
    def __init__(self):
        self.collection_name = "votes"

    async def get_vote(self, target_id: str, target_type: str, user_id: str) -> Optional[Vote]:
        db = await get_database()
        vote_dict = await db[self.collection_name].find_one({
            "target_id": target_id,
            "target_type": target_type,
            "created_by": user_id
        })
        if vote_dict:
            vote_dict["id"] = str(vote_dict.pop("_id"))
            return Vote(**vote_dict)
        return None

    async def create_vote(self, vote: VoteCreate, created_by: str) -> Vote:
        db = await get_database()
        
        # 检查目标是否存在
        if vote.target_type == "Idea":
            target = await idea_service.get_idea(vote.target_id)
            if not target:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Idea not found"
                )
        else:
            target = await comment_service.get_comment(vote.target_id)
            if not target:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Comment not found"
                )

        # 检查是否已经投票
        existing_vote = await self.get_vote(vote.target_id, vote.target_type, created_by)
        if existing_vote:
            if existing_vote.vote_status == vote.vote_status:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Vote already exists"
                )
            # 如果投票状态不同，则更新投票
            await self.update_vote(str(existing_vote.id), vote, created_by)
            return existing_vote

        vote_dict = vote.model_dump()
        vote_in_db = VoteInDB(
            **vote_dict,
            created_by=created_by,
            updated_by=created_by
        )
        
        result = await db[self.collection_name].insert_one(vote_in_db.model_dump())
        
        # 更新目标的投票计数
        if vote.target_type == "Idea":
            await idea_service.update_votes(vote.target_id, 1 if vote.vote_status == 1 else -1)
        else:
            await comment_service.update_votes(vote.target_id, 1 if vote.vote_status == 1 else -1)
        
        return Vote(
            id=str(result.inserted_id),
            **vote_dict,
            created_at=vote_in_db.created_at,
            created_by=created_by,
            updated_at=vote_in_db.updated_at
        )

    async def update_vote(self, vote_id: str, vote_update: VoteCreate, updated_by: str) -> Optional[Vote]:
        db = await get_database()
        update_data = vote_update.model_dump()
        update_data.update({
            "updated_at": datetime.utcnow(),
            "updated_by": updated_by
        })
        
        result = await db[self.collection_name].update_one(
            {"_id": ObjectId(vote_id)},
            {"$set": update_data}
        )
        
        if result.modified_count:
            vote_dict = await db[self.collection_name].find_one({"_id": ObjectId(vote_id)})
            vote_dict["id"] = str(vote_dict.pop("_id"))
            return Vote(**vote_dict)
        return None

vote_service = VoteService() 