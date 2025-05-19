from datetime import datetime
from typing import Optional, List
from fastapi import HTTPException, status
from core.database import get_database
from models.vote import VoteCreate, VoteInDB, Vote
from .idea_service import idea_service
from .comment_service import comment_service
from bson import ObjectId
from models.log import ObjectType, OperationType
from utils.logging_utils import record_operation_log

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
                "creator_id": {"$regex": f"^{user_id}$", "$options": "i"}
            }
            
        vote_dict = await db[self.collection_name].find_one(query)
        if vote_dict:
            vote_dict["id"] = str(vote_dict.pop("_id"))
            return Vote(**vote_dict)
        return None
        
    async def get_votes_by_user(self, user_id: str, target_type: str) -> List[Vote]:
        db = await get_database()
        votes = []
        cursor = db[self.collection_name].find({
            "creator_id": {"$regex": f"^{user_id}$", "$options": "i"},
            "target_type": target_type
        })
        
        async for vote_dict in cursor:
            vote_dict["id"] = str(vote_dict.pop("_id"))
            votes.append(Vote(**vote_dict))
            
        return votes
    
    async def create_vote(self, vote: VoteCreate, creator_id: str, creator_name: str = "Anonymous User") -> Vote:
        db = await get_database()
        
        # Check if target exists
        target_service = idea_service if vote.target_type == "Idea" else comment_service
        target = await target_service.get_idea(vote.target_id) if vote.target_type == "Idea" else await target_service.get_comment(vote.target_id)
        
        if not target:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"{vote.target_type} not found"
            )

        # Check if vote already exists
        existing_vote = await self.get_vote(target_id=vote.target_id, target_type=vote.target_type, user_id=creator_id)
        
        # If vote exists
        if existing_vote:
            # If same status, return error
            if existing_vote.vote_status == vote.vote_status:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Vote already exists with the same status"
                )
                
            # Update vote status
            await db[self.collection_name].update_one(
                {"_id": ObjectId(existing_vote.id)},
                {"$set": {
                    "vote_status": vote.vote_status,
                    "updated_at": datetime.utcnow(),
                    "updater_id": creator_id,
                    "updater_name": creator_name
                }}
            )
            
            # Update target vote count
            vote_change = vote.vote_status - existing_vote.vote_status
            if vote_change != 0:
                await target_service.update_votes(vote.target_id, vote_change)
            
            # Create updated Vote object
            updated_vote = Vote(
                id=existing_vote.id,
                vote_status=vote.vote_status,
                target_id=vote.target_id,
                target_type=vote.target_type,
                created_at=existing_vote.created_at,
                creator_id=existing_vote.creator_id,
                creator_name=existing_vote.creator_name,
                updated_at=datetime.utcnow(),
                updater_id=creator_id,
                updater_name=creator_name
            )
            
            # Add log record for update operation
            await record_operation_log(
                object_type=ObjectType.VOTE,
                object_id=existing_vote.id,
                object_data=updated_vote,
                operation_type=OperationType.UPDATE,
                user_id=creator_id,
                user_name=creator_name
            )
            
            return updated_vote
        
        # Create new vote
        vote_in_db = VoteInDB(
            **vote.model_dump(),
            creator_id=creator_id,
            creator_name=creator_name,
            updater_id=creator_id,
            updater_name=creator_name
        )
        
        result = await db[self.collection_name].insert_one(vote_in_db.model_dump())
        
        # Update target vote count
        if vote.vote_status != 0:
            await target_service.update_votes(vote.target_id, vote.vote_status)
        
        result_vote = Vote(
            id=str(result.inserted_id),
            vote_status=vote.vote_status,
            target_id=vote.target_id,
            target_type=vote.target_type,
            created_at=vote_in_db.created_at,
            creator_id=creator_id,
            creator_name=creator_name,
            updated_at=vote_in_db.updated_at,
            updater_id=creator_id,
            updater_name=creator_name
        )
        
        # Add log record for create operation
        await record_operation_log(
            object_type=ObjectType.VOTE,
            object_id=str(result.inserted_id),
            object_data=result_vote,
            operation_type=OperationType.CREATE,
            user_id=creator_id,
            user_name=creator_name
        )
        
        return result_vote

vote_service = VoteService() 