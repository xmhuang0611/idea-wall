from datetime import datetime
from typing import List, Optional
from fastapi import HTTPException
from core.database import get_database
from models.comment import CommentCreate, CommentInDB, Comment
from bson import ObjectId

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

    async def create_comment(
        self,
        idea_id: str,
        comment: CommentCreate,
        created_by: str
    ) -> Comment:
        db = await get_database()
        comment_dict = comment.model_dump()
        comment_in_db = CommentInDB(
            **comment_dict,
            idea_id=idea_id,
            created_by=created_by,
            updated_by=created_by
        )
        
        result = await db[self.collection_name].insert_one(comment_in_db.model_dump())
        
        return Comment(
            id=str(result.inserted_id),
            **comment_dict,
            idea_id=idea_id,
            created_at=comment_in_db.created_at,
            created_by=created_by,
            updated_at=comment_in_db.updated_at,
            votes=0
        )

    async def update_votes(self, comment_id: str, vote_change: int) -> bool:
        db = await get_database()
        result = await db[self.collection_name].update_one(
            {"_id": ObjectId(comment_id)},
            {"$inc": {"votes": vote_change}}
        )
        return result.modified_count > 0

comment_service = CommentService() 