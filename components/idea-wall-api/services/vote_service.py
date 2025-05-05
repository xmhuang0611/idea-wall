from datetime import datetime
from typing import Optional, List
from fastapi import HTTPException, status
from core.database import get_database
from models.vote import VoteCreate, VoteInDB, Vote, TargetType
from .idea_service import idea_service
from .comment_service import comment_service
from bson import ObjectId

class VoteService:
    def __init__(self):
        self.collection_name = "votes"

    async def get_vote(self, vote_id: Optional[str] = None, target_id: Optional[str] = None, 
                       target_type: Optional[str] = None, user_id: Optional[str] = None) -> Optional[Vote]:
        db = await get_database()
        query = {}
        
        if vote_id:
            query["_id"] = ObjectId(vote_id)
        if target_id and target_type and user_id:
            query = {
                "target_id": target_id,
                "target_type": target_type,
                "creator_id": user_id
            }
            
        vote_dict = await db[self.collection_name].find_one(query)
        if vote_dict:
            vote_dict["id"] = str(vote_dict.pop("_id"))
            # 确保 target_id 是字符串，而不是 ObjectId
            if isinstance(vote_dict.get("target_id"), ObjectId):
                vote_dict["target_id"] = str(vote_dict["target_id"])
            return Vote(**vote_dict)
        return None
        
    async def get_votes_by_user(self, user_id: str, target_type: str) -> List[Vote]:
        db = await get_database()
        votes = []
        cursor = db[self.collection_name].find({
            "creator_id": user_id,
            "target_type": target_type
        })
        
        async for vote_dict in cursor:
            vote_dict["id"] = str(vote_dict.pop("_id"))
            # 确保 target_id 是字符串，而不是 ObjectId
            if isinstance(vote_dict.get("target_id"), ObjectId):
                vote_dict["target_id"] = str(vote_dict["target_id"])
            votes.append(Vote(**vote_dict))
            
        return votes
    
    async def get_votes(self, idea_id: str, skip: int = 0, limit: int = 20) -> List[Vote]:
        db = await get_database()
        votes = []
        cursor = db[self.collection_name].find({
            "target_id": idea_id,
            "target_type": TargetType.IDEA
        }).skip(skip).limit(limit)
        
        async for vote_dict in cursor:
            vote_dict["id"] = str(vote_dict.pop("_id"))
            # 确保 target_id 是字符串，而不是 ObjectId
            if isinstance(vote_dict.get("target_id"), ObjectId):
                vote_dict["target_id"] = str(vote_dict["target_id"])
            votes.append(Vote(**vote_dict))
            
        return votes

    async def create_vote(self, vote: VoteCreate, creator_id: str, creator_name: str = "Anonymous User") -> Vote:
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
        existing_vote = await self.get_vote(target_id=vote.target_id, target_type=vote.target_type, user_id=creator_id)
        
        # 如果是取消点赞（vote_status=0）且已有点赞记录
        if vote.vote_status == 0 and existing_vote:
            # 删除点赞记录
            await self.delete_vote(str(existing_vote.id))
            
            # 更新目标的点赞计数（减1）
            if vote.target_type == "Idea":
                await idea_service.update_votes(vote.target_id, -1)
            else:
                await comment_service.update_votes(vote.target_id, -1)
                
            # 返回更新后的投票信息
            return Vote(
                id=str(existing_vote.id),
                vote_status=0,
                target_id=vote.target_id,
                target_type=vote.target_type,
                created_at=existing_vote.created_at,
                creator_id=creator_id,
                creator_name=creator_name,
                updated_at=datetime.utcnow(),
                updater_id=creator_id,
                updater_name=creator_name
            )
                
        # 如果有现有投票且状态相同，则返回错误
        if existing_vote and existing_vote.vote_status == vote.vote_status:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Vote already exists"
            )
            
        # 如果是新增点赞（vote_status=1）
        if vote.vote_status == 1:
            vote_dict = vote.model_dump()
            vote_in_db = VoteInDB(
                **vote_dict,
                creator_id=creator_id,
                creator_name=creator_name,
                updater_id=creator_id,
                updater_name=creator_name
            )
            
            result = await db[self.collection_name].insert_one(vote_in_db.model_dump())
            
            # 更新目标的投票计数（加1）
            if vote.target_type == "Idea":
                await idea_service.update_votes(vote.target_id, 1)
            else:
                await comment_service.update_votes(vote.target_id, 1)
            
            return Vote(
                id=str(result.inserted_id),
                **vote_dict,
                created_at=vote_in_db.created_at,
                creator_id=creator_id,
                creator_name=creator_name,
                updated_at=vote_in_db.updated_at,
                updater_id=creator_id,
                updater_name=creator_name
            )
            
        # 其他情况（不应该到达这里）
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid vote operation"
        )

    async def delete_vote(self, vote_id: str) -> bool:
        db = await get_database()
        vote = await self.get_vote(vote_id=vote_id)
        if not vote:
            return False
            
        result = await db[self.collection_name].delete_one({"_id": ObjectId(vote_id)})
        return result.deleted_count > 0

vote_service = VoteService() 