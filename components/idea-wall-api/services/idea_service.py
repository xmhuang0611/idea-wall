from datetime import datetime
from typing import List, Optional, Dict, Any
from core.database import get_database
from models.idea import IdeaCreate, IdeaUpdate, IdeaInDB, Idea, IdeaTag
from bson import ObjectId
from services.tag_service import tag_service
from models.log import ObjectType, OperationType
from utils.logging_utils import record_operation_log

class IdeaService:
    def __init__(self):
        self.collection_name = "ideas"

    async def _build_filter_query(
        self,
        search: Optional[str] = None,
        tags: Optional[List[int]] = None,
        creator_id: Optional[str] = None,
        voted_by: Optional[str] = None,
        bookmarked_by: Optional[str] = None
    ) -> Dict[str, Any]:
        filter_query = {}
            
        # Filter by tags
        if tags:
            filter_query["tags"] = {"$all": tags}
            
        # Filter by search text
        if search:
            filter_query["$or"] = [
                {"title": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}}
            ]

        # Filter by creator
        if creator_id:
            filter_query["creator_id"] = creator_id

        # Collect all idea IDs that need to be filtered
        idea_ids_to_filter = []
        
        # Get voted ideas if needed
        if voted_by:
            voted_idea_ids = await self._get_voted_idea_ids(voted_by)
            if voted_idea_ids:
                idea_ids_to_filter.append(voted_idea_ids)
            else:
                # If user hasn't voted for any ideas, return empty result
                filter_query["_id"] = {"$in": []}
                return filter_query

        # Get bookmarked ideas if needed
        if bookmarked_by:
            bookmarked_idea_ids = await self._get_bookmarked_idea_ids(bookmarked_by)
            if bookmarked_idea_ids:
                idea_ids_to_filter.append(bookmarked_idea_ids)
            else:
                # If user hasn't bookmarked any ideas, return empty result
                filter_query["_id"] = {"$in": []}
                return filter_query

        # If we have any idea IDs to filter by, find their intersection
        if idea_ids_to_filter:
            # If we have multiple sets of IDs, find their intersection
            if len(idea_ids_to_filter) > 1:
                # Convert all sets to sets of strings for intersection
                idea_id_sets = [set(str(id) for id in ids) for ids in idea_ids_to_filter]
                # Find intersection
                intersection = set.intersection(*idea_id_sets)
                # Convert back to ObjectId
                filter_query["_id"] = {"$in": [ObjectId(id) for id in intersection]}
            else:
                # If only one set of IDs, use it directly
                filter_query["_id"] = {"$in": idea_ids_to_filter[0]}
            
        return filter_query

    async def _get_voted_idea_ids(self, user_id: str) -> List[ObjectId]:
        """Get all idea IDs that a user has voted for"""
        db = await get_database()
        votes = await db["votes"].find({
            "creator_id": user_id,
            "target_type": "Idea",
            "vote_status": 1
        }).to_list(None)
        return [ObjectId(vote["target_id"]) for vote in votes]

    async def _get_bookmarked_idea_ids(self, user_id: str) -> List[ObjectId]:
        """Get all idea IDs that a user has bookmarked"""
        db = await get_database()
        bookmarks = await db["bookmarks"].find({
            "creator_id": user_id,
            "target_type": "Idea",
            "bookmark_status": 1
        }).to_list(None)
        return [ObjectId(bookmark["target_id"]) for bookmark in bookmarks]

    async def get_total_ideas(
        self,
        search: Optional[str] = None,
        tags: Optional[List[int]] = None,
        creator_id: Optional[str] = None,
        voted_by: Optional[str] = None,
        bookmarked_by: Optional[str] = None
    ) -> int:
        db = await get_database()
        filter_query = await self._build_filter_query(search, tags, creator_id, voted_by, bookmarked_by)
        return await db[self.collection_name].count_documents(filter_query)

    async def get_ideas(
        self,
        skip: int = 0,
        limit: int = 20,
        sort_by: Optional[str] = None,
        sort_order: Optional[str] = None,
        search: Optional[str] = None,
        tags: Optional[List[int]] = None,
        creator_id: Optional[str] = None,
        voted_by: Optional[str] = None,
        bookmarked_by: Optional[str] = None
    ) -> List[Idea]:
        db = await get_database()
        
        # Build filter conditions
        filter_query = await self._build_filter_query(search, tags, creator_id, voted_by, bookmarked_by)
            
        # Build sort conditions
        sort_options = {}
        if sort_by:
            sort_options[sort_by] = -1 if sort_order == "desc" else 1
        
        cursor = db[self.collection_name].find(filter_query)
        
        # Apply sorting
        if sort_options:
            cursor = cursor.sort(list(sort_options.items()))
            
        # Apply pagination
        cursor = cursor.skip(skip).limit(limit)
        
        ideas = []
        all_tags = await tag_service.get_all_tags()
        async for idea_dict in cursor:
            idea_dict["id"] = str(idea_dict.pop("_id"))
            idea_dict["tag_details"] = [IdeaTag(tag_id=tag.tag_id, tag_name=tag.tag_name) for tag in all_tags if tag.tag_id in idea_dict["tags"]]                
            ideas.append(Idea(**idea_dict))
        return ideas

    async def get_idea(self, idea_id: str) -> Optional[Idea]:
        db = await get_database()
        idea_dict = await db[self.collection_name].find_one({"_id": ObjectId(idea_id)})
        if idea_dict:
            idea_dict["id"] = str(idea_dict.pop("_id"))
            all_tags = await tag_service.get_all_tags()
            idea_dict["tag_details"] = [IdeaTag(tag_id=tag.tag_id, tag_name=tag.tag_name) for tag in all_tags if tag.tag_id in idea_dict["tags"]]
            return Idea(**idea_dict)
        return None

    async def create_idea(self, idea: IdeaCreate, creator_id: str, creator_name: str = "Anonymous User") -> Idea:
        db = await get_database()
        idea_dict = idea.model_dump()
        idea_in_db = IdeaInDB(
            **idea_dict,
            creator_id=creator_id,
            creator_name=creator_name,
            updater_id=creator_id,
            updater_name=creator_name,
            total_votes=0,
            total_comments=0
        )
        
        result = await db[self.collection_name].insert_one(idea_in_db.model_dump())
        result_idea = Idea(
            id=str(result.inserted_id),
            **idea_dict,
            created_at=idea_in_db.created_at,
            creator_id=creator_id,
            creator_name=creator_name,
            updated_at=idea_in_db.updated_at,
            updater_id=creator_id,
            updater_name=creator_name,
            total_votes=0,
            total_comments=0
        )
        
        # Add log record
        await record_operation_log(
            object_type=ObjectType.IDEA,
            object_id=str(result.inserted_id),
            object_data=result_idea,
            operation_type=OperationType.CREATE,
            user_id=creator_id,
            user_name=creator_name
        )
        
        return result_idea

    async def update_idea(self, idea_id: str, idea: IdeaUpdate, updater_id: str, updater_name: str) -> Optional[Idea]:
        db = await get_database()
        idea_dict = idea.model_dump()
        
        # Get original idea to preserve some fields
        original_idea = await self.get_idea(idea_id)
        if not original_idea:
            return None
            
        # Update idea
        result = await db[self.collection_name].update_one(
            {"_id": ObjectId(idea_id)},
            {
                "$set": {
                    **idea_dict,
                    "updater_id": updater_id,
                    "updater_name": updater_name,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        if result.modified_count > 0:
            # Get updated idea
            updated_idea = await self.get_idea(idea_id)
            
            # Add log record
            if updated_idea:
                await record_operation_log(
                    object_type=ObjectType.IDEA,
                    object_id=idea_id,
                    object_data=updated_idea,
                    operation_type=OperationType.UPDATE,
                    user_id=updater_id,
                    user_name=updater_name
                )
            
            return updated_idea
        return None

    async def update_votes(self, idea_id: str, vote_change: int) -> bool:
        db = await get_database()
        result = await db[self.collection_name].update_one(
            {"_id": ObjectId(idea_id)},
            {"$inc": {"total_votes": vote_change}}
        )
        return result.modified_count > 0

    async def update_bookmarks(self, idea_id: str, bookmark_change: int) -> bool:
        db = await get_database()
        result = await db[self.collection_name].update_one(
            {"_id": ObjectId(idea_id)},
            {"$inc": {"total_bookmarks": bookmark_change}}
        )
        return result.modified_count > 0

    async def delete_idea(self, idea_id: str) -> bool:
        """Delete the specified Idea
        
        Args:
            idea_id: ID of the Idea to be deleted
            
        Returns:
            bool: Whether the deletion was successful
        """
        db = await get_database()
        
        # Get the Idea to be deleted for logging
        idea_to_delete = await self.get_idea(idea_id)
        if not idea_to_delete:
            return False
            
        # Delete the Idea
        result = await db[self.collection_name].delete_one({"_id": ObjectId(idea_id)})
        
        if result.deleted_count > 0:
            # Log the deletion operation
            await record_operation_log(
                object_type=ObjectType.IDEA,
                object_id=idea_id,
                object_data=idea_to_delete,
                operation_type=OperationType.DELETE,
                user_id=idea_to_delete.updater_id,
                user_name=idea_to_delete.updater_name
            )
            
            # Delete related vote records
            await db["votes"].delete_many({
                "target_id": idea_id,
                "target_type": "Idea"
            })
            
            # Delete related bookmark records
            await db["bookmarks"].delete_many({
                "target_id": idea_id,
                "target_type": "Idea"
            })
            
            # Delete related comments
            await db["comments"].delete_many({
                "idea_id": idea_id
            })
            
            return True
            
        return False

idea_service = IdeaService() 