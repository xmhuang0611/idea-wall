from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import HTTPException
from core.database import get_database
from models.idea import IdeaCreate, IdeaInDB, Idea, IdeaCategory, IdeaTag
from bson import ObjectId
from services.tag_service import tag_service

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
        tags: Optional[List[int]] = None,
        refresh_comment_count: bool = True
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
        # 先获取所有idea对象，以便后续进行批量评论数更新
        idea_dicts = []
        async for idea_dict in cursor:
            idea_dict["id"] = str(idea_dict.pop("_id"))
            idea_dicts.append(idea_dict)
            
        # 如果需要刷新评论数，对每个idea进行评论数更新
        if refresh_comment_count:
            from services.comment_service import comment_service
            
            for idea_dict in idea_dicts:
                # 获取真实评论数量
                real_comment_count = await comment_service.count_comments(idea_dict["id"])
                
                # 如果数据库中的评论数与实际不符，更新数据库
                if "comment_count" not in idea_dict or idea_dict["comment_count"] != real_comment_count:
                    # 更新内存中的评论数
                    idea_dict["comment_count"] = real_comment_count
                    
                    # 更新数据库中的评论数
                    await db[self.collection_name].update_one(
                        {"_id": ObjectId(idea_dict["id"])},
                        {"$set": {"comment_count": real_comment_count}}
                    )
        
        # 处理每个idea对象
        for idea_dict in idea_dicts:
            # 确保所有必要字段都存在，按照新的数据库设计
            if "creator_id" not in idea_dict:
                idea_dict["creator_id"] = "anonymous"
            if "creator_name" not in idea_dict:
                idea_dict["creator_name"] = "Anonymous User"
            if "updater_id" not in idea_dict:
                idea_dict["updater_id"] = idea_dict.get("creator_id", "anonymous")
            if "updater_name" not in idea_dict:
                idea_dict["updater_name"] = idea_dict.get("creator_name", "Anonymous User")
            if "updated_at" not in idea_dict:
                idea_dict["updated_at"] = idea_dict.get("created_at", datetime.utcnow())
            if "total_votes" not in idea_dict:
                idea_dict["total_votes"] = 0
            if "comment_count" not in idea_dict:
                idea_dict["comment_count"] = 0
                
            # 获取标签详情
            if "tags" in idea_dict and idea_dict["tags"]:
                tag_details = []
                for tag_id in idea_dict["tags"]:
                    tag = await tag_service.get_tag(tag_id)
                    if tag:
                        tag_details.append(IdeaTag(tag_id=tag.tag_id, tag=tag.tag))
                if tag_details:
                    idea_dict["tag_details"] = tag_details
                
            ideas.append(Idea(**idea_dict))
        return ideas

    async def get_idea(self, idea_id: str, refresh_comment_count: bool = True) -> Optional[Idea]:
        db = await get_database()
        idea_dict = await db[self.collection_name].find_one({"_id": ObjectId(idea_id)})
        if idea_dict:
            idea_dict["id"] = str(idea_dict.pop("_id"))
            
            # 如果需要刷新评论数
            if refresh_comment_count:
                from services.comment_service import comment_service
                # 获取真实评论数量
                real_comment_count = await comment_service.count_comments(idea_id)
                
                # 如果数据库中的评论数与实际不符，更新数据库
                if "comment_count" not in idea_dict or idea_dict["comment_count"] != real_comment_count:
                    # 更新内存中的评论数
                    idea_dict["comment_count"] = real_comment_count
                    
                    # 更新数据库中的评论数
                    await db[self.collection_name].update_one(
                        {"_id": ObjectId(idea_id)},
                        {"$set": {"comment_count": real_comment_count}}
                    )
            
            # 确保所有必要字段都存在，按照新的数据库设计
            if "creator_id" not in idea_dict:
                idea_dict["creator_id"] = "anonymous"
            if "creator_name" not in idea_dict:
                idea_dict["creator_name"] = "Anonymous User"
            if "updater_id" not in idea_dict:
                idea_dict["updater_id"] = idea_dict.get("creator_id", "anonymous")
            if "updater_name" not in idea_dict:
                idea_dict["updater_name"] = idea_dict.get("creator_name", "Anonymous User")
            if "updated_at" not in idea_dict:
                idea_dict["updated_at"] = idea_dict.get("created_at", datetime.utcnow())
            if "total_votes" not in idea_dict:
                idea_dict["total_votes"] = 0
            if "comment_count" not in idea_dict:
                idea_dict["comment_count"] = 0
                
            # 获取标签详情
            if "tags" in idea_dict and idea_dict["tags"]:
                tag_details = []
                for tag_id in idea_dict["tags"]:
                    tag = await tag_service.get_tag(tag_id)
                    if tag:
                        tag_details.append(IdeaTag(tag_id=tag.tag_id, tag=tag.tag))
                if tag_details:
                    idea_dict["tag_details"] = tag_details
                
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
            comment_count=0  # 初始化评论数为0
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
            comment_count=0  # 初始化评论数为0
        )

    async def update_idea(
        self,
        idea_id: str,
        idea_update: IdeaCreate,
        updater_id: str,
        updater_name: str = "Anonymous User"
    ) -> Optional[Idea]:
        db = await get_database()
        update_data = idea_update.model_dump()
        update_data.update({
            "updated_at": datetime.utcnow(),
            "updater_id": updater_id,
            "updater_name": updater_name
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
    
    async def delete_idea(self, idea_id: str, user_id: str) -> bool:
        db = await get_database()
        # 获取idea信息
        idea = await self.get_idea(idea_id)
        if not idea:
            return False
            
        # 只有创建者或管理员可以删除
        result = await db[self.collection_name].delete_one({
            "_id": ObjectId(idea_id),
            "$or": [
                {"creator_id": user_id},
                # 注: 实际应用中可能需要检查用户角色是否为管理员
            ]
        })
        return result.deleted_count > 0

idea_service = IdeaService() 