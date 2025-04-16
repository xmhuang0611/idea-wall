from datetime import datetime
from typing import List, Optional
from fastapi import HTTPException, status
from core.database import get_database
from models.tag import TagCreate, TagInDB, Tag

class TagService:
    def __init__(self):
        self.collection_name = "tags"

    async def get_tags(self, skip: int = 0, limit: int = 20) -> List[Tag]:
        db = await get_database()
        cursor = db[self.collection_name].find().skip(skip).limit(limit)
        tags = []
        async for tag_dict in cursor:
            tags.append(Tag(**tag_dict))
        return tags

    async def get_tag(self, tag_id: int) -> Optional[Tag]:
        db = await get_database()
        tag_dict = await db[self.collection_name].find_one({"tag_id": tag_id})
        if tag_dict:
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
            updated_at=tag_in_db.updated_at
        )

tag_service = TagService() 