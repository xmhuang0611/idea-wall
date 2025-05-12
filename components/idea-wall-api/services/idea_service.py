from datetime import datetime
from typing import List, Optional, Dict, Any
from core.database import get_database
from models.idea import IdeaCreate, IdeaUpdate, IdeaInDB, Idea, IdeaTag
from bson import ObjectId
from services.tag_service import tag_service

class IdeaService:
    def __init__(self):
        self.collection_name = "ideas"

    def _build_filter_query(
        self,
        search: Optional[str] = None,
        tags: Optional[List[int]] = None,
        creator_id: Optional[str] = None
    ) -> Dict[str, Any]:
        filter_query = {}
            
        # 标签过滤
        if tags:
            filter_query["tags"] = {"$all": tags}
            
        # 搜索过滤
        if search:
            filter_query["$or"] = [
                {"title": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}}
            ]

        # 创建者过滤
        if creator_id:
            filter_query["creator_id"] = creator_id
            
        return filter_query

    async def get_total_ideas(
        self,
        search: Optional[str] = None,
        tags: Optional[List[int]] = None,
        creator_id: Optional[str] = None
    ) -> int:
        db = await get_database()
        filter_query = self._build_filter_query(search, tags, creator_id)
        return await db[self.collection_name].count_documents(filter_query)

    async def get_ideas(
        self,
        skip: int = 0,
        limit: int = 20,
        sort_by: Optional[str] = None,
        sort_order: Optional[str] = None,
        search: Optional[str] = None,
        tags: Optional[List[int]] = None,
        creator_id: Optional[str] = None
    ) -> List[Idea]:
        db = await get_database()
        
        # 构建过滤条件
        filter_query = self._build_filter_query(search, tags, creator_id)
            
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
        return Idea(
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

    async def update_idea(self, idea_id: str, idea: IdeaUpdate, updater_id: str, updater_name: str) -> Optional[Idea]:
        db = await get_database()
        idea_dict = idea.model_dump()
        
        # 获取原始idea以保留一些字段
        original_idea = await self.get_idea(idea_id)
        if not original_idea:
            return None
            
        # 更新idea
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
            # 获取更新后的idea
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