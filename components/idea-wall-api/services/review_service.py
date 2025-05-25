from typing import List, Dict, Any, Optional
from datetime import datetime
from bson import ObjectId
from core.database import get_database
from models.review import Review, ReviewResult, ReviewBase

class ReviewService:
    collection_name = "reviews"

    async def get_reviews(self, idea_id: str, target_type: str) -> List[Review]:
        """
        Get all reviews for a specific idea and target type.
        
        Args:
            idea_id: The ID of the idea
            target_type: The type of target ("Session" or "Incubator")
            
        Returns:
            List of Review objects
        """
        db = await get_database()
        reviews_cursor = db[self.collection_name].find({
            "idea_id": idea_id,
            "target_type": target_type
        })
        
        reviews = []
        async for review in reviews_cursor:
            # Convert ObjectId to string
            review["id"] = str(review.pop("_id"))
            reviews.append(Review(**review))
            
        return reviews
    
    async def create_review(self, review_data: ReviewBase, reviewer_id: str, reviewer_name: str) -> Review:
        """
        Create a new review in the database.
        
        Args:
            review_data: The review data
            reviewer_id: ID of the reviewer for audit purposes
            reviewer_name: Name of the reviewer for audit purposes
            
        Returns:
            The created Review object
        """
        db = await get_database()
        
        # Prepare review document
        review_dict = review_data.model_dump()
        review_dict["created_at"] = datetime.utcnow()
        review_dict["updated_at"] = review_dict["created_at"]
        
        # Add audit fields required by AuditModel
        review_dict["creator_id"] = reviewer_id
        review_dict["creator_name"] = reviewer_name
        review_dict["updater_id"] = reviewer_id
        review_dict["updater_name"] = reviewer_name
        
        # Insert into database
        result = await db[self.collection_name].insert_one(review_dict)
        
        # Return created review with ID
        review_dict["id"] = str(result.inserted_id)
        return Review(**review_dict)

    async def update_review(self, review_id: str, review_result: ReviewResult, updater_id: str, updater_name: str) -> Optional[Review]:
        """
        Update an existing review in the database.
        
        Args:
            review_id: The ID of the review to update
            review_result: The updated review result data
            updater_id: ID of the user updating the review
            updater_name: Name of the user updating the review
            
        Returns:
            The updated Review object or None if not found
        """
        db = await get_database()
        
        # Check if review exists
        existing_review = await db[self.collection_name].find_one({"_id": ObjectId(review_id)})
        if not existing_review:
            return None
        
        # Prepare update data
        update_data = {
            "review_result": review_result.model_dump(),
            "updated_at": datetime.utcnow(),
            "updater_id": updater_id,
            "updater_name": updater_name
        }
        
        # Update the review
        result = await db[self.collection_name].update_one(
            {"_id": ObjectId(review_id)},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            return None
        
        # Fetch and return the updated review
        updated_review = await db[self.collection_name].find_one({"_id": ObjectId(review_id)})
        updated_review["id"] = str(updated_review.pop("_id"))
        return Review(**updated_review)

    async def get_review_by_id(self, review_id: str) -> Optional[Review]:
        """
        Get a review by its ID.
        
        Args:
            review_id: The ID of the review
            
        Returns:
            The Review object or None if not found
        """
        db = await get_database()
        
        try:
            review = await db[self.collection_name].find_one({"_id": ObjectId(review_id)})
            if review:
                review["id"] = str(review.pop("_id"))
                return Review(**review)
            return None
        except Exception:
            return None

    async def clear_reviews_by_idea_and_type(self, idea_id: str, target_type: str) -> bool:
        """
        Clear all reviews for a specific idea and target type.
        This is used when resubmitting a review to reset the review process.
        
        Args:
            idea_id: The ID of the idea
            target_type: The type of target ("Session" or "Incubator")
            
        Returns:
            True if successful, False otherwise
        """
        db = await get_database()
        
        try:
            # Delete all reviews for this idea and target type
            result = await db[self.collection_name].delete_many({
                "idea_id": idea_id,
                "target_type": target_type
            })
            
            return True
        except Exception as e:
            print(f"Error clearing reviews: {e}")
            return False

# Create an instance of the service
review_service = ReviewService() 