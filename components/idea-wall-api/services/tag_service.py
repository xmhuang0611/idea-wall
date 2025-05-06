from datetime import datetime
from typing import List, Optional
from fastapi import HTTPException, status
from core.database import get_database
from models.tag import TagCreate, TagInDB, Tag
from models.response import StandardResponse

class TagService:
    def __init__(self):
        self.collection_name = "tags"

    async def get_tags(self, skip: int = 0, limit: int = 20) -> List[Tag]:
        db = await get_database()
        cursor = db[self.collection_name].find().skip(skip).limit(limit)
        tags = []
        async for tag_dict in cursor:
            # 确保所有必要字段都存在
            if "created_at" not in tag_dict:
                tag_dict["created_at"] = datetime.utcnow()
            if "creator_id" not in tag_dict:
                tag_dict["creator_id"] = "system"
            if "creator_name" not in tag_dict:
                tag_dict["creator_name"] = "System"
            if "updated_at" not in tag_dict:
                tag_dict["updated_at"] = datetime.utcnow()
            if "updater_id" not in tag_dict:
                tag_dict["updater_id"] = "system"
            if "updater_name" not in tag_dict:
                tag_dict["updater_name"] = "System"
            tags.append(Tag(**tag_dict))
        return tags

    async def get_tag(self, tag_id: int) -> Optional[Tag]:
        db = await get_database()
        tag_dict = await db[self.collection_name].find_one({"tag_id": tag_id})
        if tag_dict:
            # 确保所有必要字段都存在
            if "created_at" not in tag_dict:
                tag_dict["created_at"] = datetime.utcnow()
            if "creator_id" not in tag_dict:
                tag_dict["creator_id"] = "system"
            if "creator_name" not in tag_dict:
                tag_dict["creator_name"] = "System"
            if "updated_at" not in tag_dict:
                tag_dict["updated_at"] = datetime.utcnow()
            if "updater_id" not in tag_dict:
                tag_dict["updater_id"] = "system"
            if "updater_name" not in tag_dict:
                tag_dict["updater_name"] = "System"
            return Tag(**tag_dict)
        return None

    async def create_tag(self, tag: TagCreate, created_by: str) -> Tag:
        db = await get_database()
        
        # 检查标签ID是否已存在
        if await self.get_tag(tag.tag_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tag ID already exists"
            )
            
        # 检查父标签是否存在
        if tag.parent_id != 0:
            parent_tag = await self.get_tag(tag.parent_id)
            if not parent_tag:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Parent tag not found"
                )
        
        tag_dict = tag.model_dump()
        tag_in_db = TagInDB(
            **tag_dict,
            created_by=created_by,
            updated_by=created_by
        )
        
        await db[self.collection_name].insert_one(tag_in_db.model_dump())
        
        return Tag(
            **tag_dict,
            created_at=tag_in_db.created_at,
            creator_id=tag_in_db.creator_id,
            creator_name=tag_in_db.creator_name,
            updated_at=tag_in_db.updated_at,
            updater_id=tag_in_db.updater_id,
            updater_name=tag_in_db.updater_name
        )

tag_service = TagService() 