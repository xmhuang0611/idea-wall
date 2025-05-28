from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from bson import ObjectId
from fastapi import HTTPException
from models.idea import IdeaCreate, IdeaUpdate, IdeaInDB, Idea, IdeaTag, IdeaStatus
from models.log import ObjectType, OperationType
from utils.logging_utils import record_operation_log
from core.database import get_database
from services.tag_service import tag_service

class IdeaService:
    def __init__(self):
        self.collection_name = "ideas"

    async def _db(self):
        """Get database connection"""
        return await get_database()

    async def _build_filter_query(
        self,
        search: Optional[str] = None,
        tags: Optional[List[int]] = None,
        creator_id: Optional[str] = None,
        voted_by: Optional[str] = None,
        bookmarked_by: Optional[str] = None,
        status: Optional[List[str]] = None
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
            
        # Filter by status (multiple statuses)
        if status:
            if len(status) == 1:
                filter_query["status"] = status[0]
            else:
                filter_query["status"] = {"$in": status}

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
        db = await self._db()
        votes = await db["votes"].find({
            "creator_id": user_id,
            "target_type": "Idea",
            "vote_status": 1
        }).to_list(None)
        return [ObjectId(vote["target_id"]) for vote in votes]

    async def _get_bookmarked_idea_ids(self, user_id: str) -> List[ObjectId]:
        """Get all idea IDs that a user has bookmarked"""
        db = await self._db()
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
        bookmarked_by: Optional[str] = None,
        status: Optional[List[str]] = None
    ) -> int:
        db = await self._db()
        filter_query = await self._build_filter_query(search, tags, creator_id, voted_by, bookmarked_by, status)
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
        bookmarked_by: Optional[str] = None,
        status: Optional[List[str]] = None
    ) -> List[Idea]:
        db = await self._db()
        
        # Build filter conditions
        filter_query = await self._build_filter_query(search, tags, creator_id, voted_by, bookmarked_by, status)
            
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
        db = await self._db()
        idea_dict = await db[self.collection_name].find_one({"_id": ObjectId(idea_id)})
        if idea_dict:
            idea_dict["id"] = str(idea_dict.pop("_id"))
            all_tags = await tag_service.get_all_tags()
            idea_dict["tag_details"] = [IdeaTag(tag_id=tag.tag_id, tag_name=tag.tag_name) for tag in all_tags if tag.tag_id in idea_dict["tags"]]
            return Idea(**idea_dict)
        return None

    async def create_idea(self, idea: IdeaCreate, creator_id: str, creator_name: str = "Anonymous User") -> Idea:
        db = await self._db()
        idea_dict = idea.model_dump()
        idea_in_db = IdeaInDB(
            **idea_dict,
            creator_id=creator_id,
            creator_name=creator_name,
            updater_id=creator_id,
            updater_name=creator_name,
            total_votes=0,
            total_comments=0,
            total_bookmarks=0,
            status=IdeaStatus.DRAFT
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
            total_comments=0,
            total_bookmarks=0,
            status=IdeaStatus.DRAFT
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
        db = await self._db()
        idea_dict = idea.model_dump()
        
        update_dict = {
            **idea_dict,
            "updater_id": updater_id,
            "updater_name": updater_name,
            "updated_at": datetime.utcnow()
        }
        
        # Update idea
        result = await db[self.collection_name].update_one(
            {"_id": ObjectId(idea_id)},
            {"$set": update_dict}
        )
        
        if result.modified_count == 0:
            return None
        
        # Get updated idea
        updated_idea = await self.get_idea(idea_id)
        
        # Add log record
        await record_operation_log(
            object_type=ObjectType.IDEA,
            object_id=idea_id,
            object_data=updated_idea,
            operation_type=OperationType.UPDATE,
            user_id=updater_id,
            user_name=updater_name
        )
        
        return updated_idea

    async def update_votes(self, idea_id: str, vote_change: int) -> bool:
        db = await self._db()
        result = await db[self.collection_name].update_one(
            {"_id": ObjectId(idea_id)},
            {"$inc": {"total_votes": vote_change}}
        )
        return result.modified_count > 0

    async def update_bookmarks(self, idea_id: str, bookmark_change: int) -> bool:
        db = await self._db()
        result = await db[self.collection_name].update_one(
            {"_id": ObjectId(idea_id)},
            {"$inc": {"total_bookmarks": bookmark_change}}
        )
        return result.modified_count > 0

    async def update_comments(self, idea_id: str, comment_change: int) -> bool:
        db = await self._db()
        result = await db[self.collection_name].update_one(
            {"_id": ObjectId(idea_id)},
            {"$inc": {"total_comments": comment_change}}
        )
        return result.modified_count > 0

    async def delete_idea(self, idea_id: str, user_id: str, user_name: str) -> bool:
        db = await self._db()
        
        # Get idea before deletion for logging
        idea = await self.get_idea(idea_id)
        if not idea:
            return False
        
        # Delete idea
        result = await db[self.collection_name].delete_one({"_id": ObjectId(idea_id)})
        
        if result.deleted_count > 0:
            # Add log record
            await record_operation_log(
                object_type=ObjectType.IDEA,
                object_id=idea_id,
                object_data=idea,
                operation_type=OperationType.DELETE,
                user_id=user_id,
                user_name=user_name
            )
            return True
        return False



    # Roll Out Method
    async def roll_out_idea(
        self,
        idea_id: str,
        user_id: str,
        user_name: str
    ) -> Optional[Idea]:
        db = await self._db()
        
        # Get current idea
        idea = await self.get_idea(idea_id)
        if not idea:
            return None
        
        # Check if idea is in correct status
        if idea.status != IdeaStatus.INCUBATOR_APPROVED:
            return None
        
        # Update idea status to ROLL_OUT
        update_dict = {
            "status": IdeaStatus.ROLL_OUT,
            "updater_id": user_id,
            "updater_name": user_name,
            "updated_at": datetime.utcnow()
        }
        
        result = await db[self.collection_name].update_one(
            {"_id": ObjectId(idea_id)},
            {"$set": update_dict}
        )
        
        if result.modified_count == 0:
            return None
        
        # Get updated idea
        updated_idea = await self.get_idea(idea_id)
        
        # Add log record
        await record_operation_log(
            object_type=ObjectType.IDEA,
            object_id=idea_id,
            object_data=updated_idea,
            operation_type=OperationType.UPDATE,
            user_id=user_id,
            user_name=user_name
        )
        
        return updated_idea



    async def get_hot_topics(self, limit: int = 5, days: int = 90) -> List[dict]:
        """
        Get the most popular topics (tags) from ideas created in the specified time period
        
        Args:
            limit: Number of top topics to return (default: 5)
            days: Number of days to look back for ideas (default: 90)
            
        Returns:
            List of topics with their counts
        """
        try:
            # Calculate date N days ago
            start_date = datetime.utcnow() - timedelta(days=days)
            
            # Get database connection
            db = await self._db()
            
            # Aggregate query: group by tags and count
            pipeline = [
                # Only query ideas from specified time period
                {"$match": {
                    "created_at": {"$gte": start_date}
                }},
                # Unwind tags array to create a document for each tag
                {"$unwind": "$tags"},
                # Group by tag and count
                {"$group": {
                    "_id": "$tags",
                    "count": {"$sum": 1}
                }},
                # Sort by count in descending order
                {"$sort": {"count": -1}},
                # Limit number of results
                {"$limit": limit},
                # Get tag details
                {"$lookup": {
                    "from": "tags",
                    "localField": "_id",
                    "foreignField": "tag_id",
                    "as": "tag_info"
                }},
                # Unwind tag_info array
                {"$unwind": "$tag_info"},
                # Restructure output format
                {"$project": {
                    "tag_id": "$_id",
                    "name": "$tag_info.tag_name",
                    "count": 1,
                    "_id": 0
                }}
            ]
            
            return await db[self.collection_name].aggregate(pipeline).to_list(None)
        except Exception as e:
            raise Exception(f"Failed to get hot topics: {str(e)}")

idea_service = IdeaService() 