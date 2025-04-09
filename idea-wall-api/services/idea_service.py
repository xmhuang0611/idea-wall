from datetime import datetime
from typing import List, Optional
from fastapi import HTTPException, status
from core.database import get_database
from models.idea import IdeaCreate, IdeaInDB, Idea
from bson import ObjectId

class IdeaService:
    def __init__(self):
        self.collection_name = "ideas"

    async def get_ideas(self, skip: int = 0, limit: int = 20) -> List[Idea]:
        db = await get_database()
        cursor = db[self.collection_name].find().skip(skip).limit(limit)
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