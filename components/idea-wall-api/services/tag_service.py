from typing import List, Optional, Tuple
from datetime import datetime
from core.database import get_database
from models.tag import Tag, TagCreate, TagUpdate

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

    async def create_tag(self, tag: TagCreate, creator_id: str, creator_name: str ) -> Tag:
        """
        Create a new tag
        Args:
            tag: Tag data to create
        Returns:
            Created tag with generated ID
        """
        db = await get_database()
        # Get the next available tag_id
        last_tag = await db[self.collection_name].find_one(
            sort=[("tag_id", -1)]
        )
        next_id = 1 if not last_tag else last_tag["tag_id"] + 1
        
        # Create new tag document
        tag_doc = {
            "tag_id": next_id,
            "tag_name": tag.tag_name,
            "parent_id": tag.parent_id,
            "created_at": datetime.utcnow(),
            "creator_id": creator_id,
            "creator_name": creator_name,
            "updated_at": datetime.utcnow(),
            "updater_id": creator_id,
            "updater_name": creator_name
        }
        
        # Insert the new tag
        result = await db[self.collection_name].insert_one(tag_doc)
        created_tag = await db[self.collection_name].find_one({"_id": result.inserted_id})
        return Tag(**created_tag)

    async def update_tag(self, tag_id: int, tag: TagUpdate, updater_id: str, updater_name: str) -> Optional[Tag]:
        """
        Update an existing tag
        Args:
            tag_id: ID of the tag to update
            tag: New tag data
        Returns:
            Updated tag if found, None otherwise
        """
        db = await get_database()
        # Check if tag exists
        existing_tag = await db[self.collection_name].find_one({"tag_id": tag_id})
        if not existing_tag:
            return None
            
        # Update tag document
        update_data = {
            "tag_name": tag.tag_name,
            "parent_id": tag.parent_id,
            "updated_at": datetime.utcnow(),
            "updater_id": updater_id,
            "updater_name": updater_name
        }
        
        # Update the tag
        await db[self.collection_name].update_one(
            {"tag_id": tag_id},
            {"$set": update_data}
        )
        
        # Return updated tag
        updated_tag = await db[self.collection_name].find_one({"tag_id": tag_id})
        return Tag(**updated_tag) if updated_tag else None

    async def delete_tag(self, tag_id: int) -> bool:
        """
        Delete a tag
        Args:
            tag_id: ID of the tag to delete
        Returns:
            True if tag was deleted, False if tag not found
        """
        db = await get_database()
        # Check if tag exists
        existing_tag = await db[self.collection_name].find_one({"tag_id": tag_id})
        if not existing_tag:
            return False
            
        # Check if tag has children
        child_count = await db[self.collection_name].count_documents({"parent_id": tag_id})
        if child_count > 0:
            raise ValueError("Cannot delete tag with existing children")
            
        # Delete the tag
        result = await db[self.collection_name].delete_one({"tag_id": tag_id})
        return result.deleted_count > 0

tag_service = TagService() 