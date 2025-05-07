from typing import List, Optional, Tuple
from core.database import get_database
from models.tag import Tag

class TagService:
    def __init__(self):
        self.collection_name = "tags"

    async def get_all_tags(self) -> List[Tag]:
        db = await get_database()
        tags = []
        async for tag_doc in db[self.collection_name].find():
            tags.append(Tag(**tag_doc))
        return tags
        
    async def get_tags(self, skip: int = 0, limit: int = 100) -> Tuple[List[Tag], int]:
        """
        Retrieve a list of tags with pagination
        """
        db = await get_database()
        cursor = db[self.collection_name].find().skip(skip).limit(limit)
        total = await db[self.collection_name].count_documents({})
        tags = []
        async for tag_doc in cursor:
            tags.append(Tag(**tag_doc))
        return tags, total


tag_service = TagService() 