from typing import List, Optional
from core.database import get_database
from models.comment import CommentCreate, CommentInDB, Comment
from bson import ObjectId
from models.log import ObjectType, OperationType
from utils.logging_utils import record_operation_log

class CommentService:
    def __init__(self):
        self.collection_name = "comments"

    async def get_comments(self, idea_id: str, skip: int = 0, limit: int = 20) -> List[Comment]:
        db = await get_database()
        cursor = db[self.collection_name].find({"idea_id": idea_id}).skip(skip).limit(limit)
        comments = []
        async for comment_dict in cursor:
            comment_dict["id"] = str(comment_dict.pop("_id"))
            comments.append(Comment(**comment_dict))
        return comments

    async def get_comment(self, comment_id: str) -> Optional[Comment]:
        db = await get_database()
        comment_dict = await db[self.collection_name].find_one({"_id": ObjectId(comment_id)})
        if comment_dict:
            comment_dict["id"] = str(comment_dict.pop("_id"))
            return Comment(**comment_dict)
        return None

    async def count_comments(self, idea_id: str) -> int:
        """Get total number of comments for a specific idea_id"""
        db = await get_database()
        return await db[self.collection_name].count_documents({"idea_id": idea_id})

    async def create_comment(
        self,
        comment: CommentCreate,
        creator_id: str,
        creator_name: str = "Anonymous User"
    ) -> Comment:
        db = await get_database()
        comment_dict = comment.model_dump()
        comment_in_db = CommentInDB(
            **comment_dict,
            creator_id=creator_id,
            creator_name=creator_name,
            updater_id=creator_id,
            updater_name=creator_name,
            votes=0
        )
        
        # Create comment
        result = await db[self.collection_name].insert_one(comment_in_db.model_dump())
        
        # Update idea comment count
        await db["ideas"].update_one(
            {"_id": ObjectId(comment.idea_id)},
            {"$inc": {"total_comments": 1}}
        )
        
        result_comment = Comment(
            id=str(result.inserted_id),
            **comment_dict,
            created_at=comment_in_db.created_at,
            creator_id=creator_id,
            creator_name=creator_name,
            updated_at=comment_in_db.updated_at,
            updater_id=creator_id,
            updater_name=creator_name,
            votes=0
        )
        
        # Add log record for create operation
        await record_operation_log(
            object_type=ObjectType.COMMENT,
            object_id=str(result.inserted_id),
            object_data=result_comment,
            operation_type=OperationType.CREATE,
            user_id=creator_id,
            user_name=creator_name
        )
        
        return result_comment

    async def update_votes(self, comment_id: str, vote_change: int) -> bool:
        db = await get_database()
        result = await db[self.collection_name].update_one(
            {"_id": ObjectId(comment_id)},
            {"$inc": {"votes": vote_change}}
        )
        return result.modified_count > 0

    async def delete_comment(self, comment_id: str, user_id: str, user_name: str) -> bool:
        """Delete a comment by ID"""
        db = await get_database()
        
        # Get comment first for logging
        comment = await self.get_comment(comment_id)
        if not comment:
            return False
            
        # Delete comment
        result = await db[self.collection_name].delete_one({"_id": ObjectId(comment_id)})
        if result.deleted_count == 0:
            return False
            
        # Update idea comment count
        await db["ideas"].update_one(
            {"_id": ObjectId(comment.idea_id)},
            {"$inc": {"total_comments": -1}}
        )
        
        # Add log record for delete operation
        await record_operation_log(
            object_type=ObjectType.COMMENT,
            object_id=comment_id,
            object_data=comment,
            operation_type=OperationType.DELETE,
            user_id=user_id,
            user_name=user_name
        )
        
        return True

comment_service = CommentService() 