from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import HTTPException, status
from core.database import get_database
from models.idea import IdeaCreate, IdeaInDB, Idea, IdeaCategory
from bson import ObjectId

class IdeaService:
    def __init__(self):
        self.collection_name = "ideas"

    def _build_filter_query(
        self,
        category: Optional[IdeaCategory] = None,
        search: Optional[str] = None,
        tags: Optional[List[int]] = None
    ) -> Dict[str, Any]:
        filter_query = {}
        
        # 分类过滤
        if category:
            filter_query["category"] = category
            
        # 标签过滤
        if tags:
            filter_query["tags"] = {"$all": tags}
            
        # 搜索过滤
        if search:
            filter_query["$or"] = [
                {"title": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}}
            ]
            
        return filter_query

    async def get_total_ideas(
        self,
        category: Optional[IdeaCategory] = None,
        search: Optional[str] = None,
        tags: Optional[List[int]] = None
    ) -> int:
        db = await get_database()
        filter_query = self._build_filter_query(category, search, tags)
        return await db[self.collection_name].count_documents(filter_query)

    async def get_ideas(
        self,
        skip: int = 0,
        limit: int = 20,
        category: Optional[IdeaCategory] = None,
        sort_by: Optional[str] = None,
        sort_order: Optional[str] = None,
        search: Optional[str] = None,
        tags: Optional[List[int]] = None
    ) -> List[Idea]:
        db = await get_database()
        
        # 构建过滤条件
        filter_query = self._build_filter_query(category, search, tags)
            
        # 构建排序条件
        sort_options = {}
        if sort_by:
            sort_options[sort_by] = -1 if sort_order == "desc" else 1
        
        cursor = db[self.collection_name].find(filter_query)
        
        # 应用排序
        if sort_options:
            cursor = cursor.sort(list(sort_options.items()))
            
        # 应用分页
        cursor = cursor.skip(skip).limit(limit)
        
        ideas = []
        async for idea_dict in cursor:
            idea_dict["id"] = str(idea_dict.pop("_id"))
            ideas.append(Idea(**idea_dict))
        return ideas

    async def get_idea(self, idea_id: str) -> Optional[Idea]:
        db = await get_database()
        idea_dict = await db[self.collection_name].find_one({"_id": ObjectId(idea_id)})
        if idea_dict:
            idea_dict["id"] = str(idea_dict.pop("_id"))
            return Idea(**idea_dict)
        return None

    async def create_idea(self, idea: IdeaCreate, created_by: str) -> Idea:
        db = await get_database()
        idea_dict = idea.model_dump()
        idea_in_db = IdeaInDB(
            **idea_dict,
            created_by=created_by,
            updated_by=created_by
        )
        
        result = await db[self.collection_name].insert_one(idea_in_db.model_dump())
        
        return Idea(
            id=str(result.inserted_id),
            **idea_dict,
            created_at=idea_in_db.created_at,
            created_by=created_by,
            updated_at=idea_in_db.updated_at,
            total_votes=0
        )

    async def update_idea(
        self,
        idea_id: str,
        idea_update: IdeaCreate,
        updated_by: str
    ) -> Optional[Idea]:
        db = await get_database()
        update_data = idea_update.model_dump()
        update_data.update({
            "updated_at": datetime.utcnow(),
            "updated_by": updated_by
        })
        
        result = await db[self.collection_name].update_one(
            {"_id": ObjectId(idea_id)},
            {"$set": update_data}
        )
        
        if result.modified_count:
            return await self.get_idea(idea_id)
        return None

    async def update_votes(self, idea_id: str, vote_change: int) -> bool:
        db = await get_database()
        result = await db[self.collection_name].update_one(
            {"_id": ObjectId(idea_id)},
            {"$inc": {"total_votes": vote_change}}
        )
        return result.modified_count > 0

idea_service = IdeaService() 