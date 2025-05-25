from datetime import datetime
from typing import Optional, List
from fastapi import HTTPException, status
from core.database import get_database
from models.bookmark import BookmarkCreate, BookmarkInDB, Bookmark
from .idea_service import idea_service
from .comment_service import comment_service
from bson import ObjectId
from models.log import ObjectType, OperationType
from utils.logging_utils import record_operation_log

class BookmarkService:
    def __init__(self):
        self.collection_name = "bookmarks"

    async def get_bookmark(self, bookmark_id: Optional[str] = None, target_id: Optional[str] = None, 
                          target_type: Optional[str] = None, user_id: Optional[str] = None) -> Optional[Bookmark]:
        db = await get_database()
        query = {}
        
        if bookmark_id:
            query["_id"] = ObjectId(bookmark_id)
        if target_id and target_type and user_id:
            query = {
                "target_id": target_id,
                "target_type": target_type,
                "creator_id": user_id
            }
            
        bookmark_dict = await db[self.collection_name].find_one(query)
        if bookmark_dict:
            bookmark_dict["id"] = str(bookmark_dict.pop("_id"))
            return Bookmark(**bookmark_dict)
        return None
        
    async def get_bookmarks_by_user(self, user_id: str, target_type: str) -> List[Bookmark]:
        db = await get_database()
        bookmarks = []
        cursor = db[self.collection_name].find({
            "creator_id": user_id,
            "target_type": target_type
        })
        
        async for bookmark_dict in cursor:
            bookmark_dict["id"] = str(bookmark_dict.pop("_id"))
            bookmarks.append(Bookmark(**bookmark_dict))
            
        return bookmarks
    
    async def create_bookmark(self, bookmark: BookmarkCreate, creator_id: str, creator_name: str = "Anonymous User") -> Bookmark:
        db = await get_database()
        
        # Check if target exists
        target_service = idea_service if bookmark.target_type == "Idea" else comment_service
        target = await target_service.get_idea(bookmark.target_id) if bookmark.target_type == "Idea" else await target_service.get_comment(bookmark.target_id)
        
        if not target:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"{bookmark.target_type} not found"
            )

        # Check if bookmark already exists
        existing_bookmark = await self.get_bookmark(target_id=bookmark.target_id, target_type=bookmark.target_type, user_id=creator_id)
        
        # If bookmark exists
        if existing_bookmark:
            # If same status, return error
            if existing_bookmark.bookmark_status == bookmark.bookmark_status:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Bookmark already exists with the same status"
                )
                
            # Update bookmark status
            await db[self.collection_name].update_one(
                {"_id": ObjectId(existing_bookmark.id)},
                {"$set": {
                    "bookmark_status": bookmark.bookmark_status,
                    "updated_at": datetime.utcnow(),
                    "updater_id": creator_id,
                    "updater_name": creator_name
                }}
            )
            
            # Update target bookmark count
            bookmark_change = bookmark.bookmark_status - existing_bookmark.bookmark_status
            if bookmark_change != 0 and bookmark.target_type == "Idea":
                await idea_service.update_bookmarks(bookmark.target_id, bookmark_change)
            
            updated_bookmark = Bookmark(
                id=existing_bookmark.id,
                bookmark_status=bookmark.bookmark_status,
                target_id=bookmark.target_id,
                target_type=bookmark.target_type,
                created_at=existing_bookmark.created_at,
                creator_id=existing_bookmark.creator_id,
                creator_name=existing_bookmark.creator_name,
                updated_at=datetime.utcnow(),
                updater_id=creator_id,
                updater_name=creator_name
            )

            # Add log record for update operation
            await record_operation_log(
                object_type=ObjectType.BOOKMARK,
                object_id=existing_bookmark.id,
                object_data=updated_bookmark,
                operation_type=OperationType.UPDATE,
                user_id=creator_id,
                user_name=creator_name
            )
            
            return updated_bookmark
        
        # Create new bookmark
        bookmark_in_db = BookmarkInDB(
            **bookmark.model_dump(),
            creator_id=creator_id,
            creator_name=creator_name,
            updater_id=creator_id,
            updater_name=creator_name
        )
        
        result = await db[self.collection_name].insert_one(bookmark_in_db.model_dump())
        
        # Update target bookmark count
        if bookmark.bookmark_status != 0 and bookmark.target_type == "Idea":
            await idea_service.update_bookmarks(bookmark.target_id, bookmark.bookmark_status)
        
        result_bookmark = Bookmark(
            id=str(result.inserted_id),
            **bookmark.model_dump(),
            created_at=bookmark_in_db.created_at,
            creator_id=creator_id,
            creator_name=creator_name,
            updated_at=bookmark_in_db.updated_at,
            updater_id=creator_id,
            updater_name=creator_name
        )

        # Add log record for create operation
        await record_operation_log(
            object_type=ObjectType.BOOKMARK,
            object_id=str(result.inserted_id),
            object_data=result_bookmark,
            operation_type=OperationType.CREATE,
            user_id=creator_id,
            user_name=creator_name
        )
        
        return result_bookmark

bookmark_service = BookmarkService() 