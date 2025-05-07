from typing import List, Optional
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

    async def count_comments(self, idea_id: str) -> int:
        """获取指定idea_id的评论总数"""
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
        
        result = await db[self.collection_name].insert_one(comment_in_db.model_dump())
        
        # 评论创建成功后，更新idea的评论数量
        await db["ideas"].update_one(
            {"_id": ObjectId(comment.idea_id)},
            {"$inc": {"total_comments": 1}}
        )
        
        return Comment(
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

    async def update_votes(self, comment_id: str, vote_change: int) -> bool:
        db = await get_database()
        result = await db[self.collection_name].update_one(
            {"_id": ObjectId(comment_id)},
            {"$inc": {"votes": vote_change}}
        )
        return result.modified_count > 0

comment_service = CommentService() 