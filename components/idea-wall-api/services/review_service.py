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

# Create an instance of the service
review_service = ReviewService() 