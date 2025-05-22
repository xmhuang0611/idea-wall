from datetime import datetime
from typing import List, Optional, Dict, Any
from core.database import get_database
from models.review import (
    ReviewCreate, ReviewInDB, Review, 
    FinalDecisionCreate, FinalDecisionInDB, FinalDecision
)
from models.session import FinalDecisionType
from services.session_service import session_service
from bson import ObjectId
from models.log import ObjectType, OperationType
from utils.logging_utils import record_operation_log

class ReviewService:
    def __init__(self):
        self.reviews_collection = "idea_reviews"
        self.final_decisions_collection = "final_decisions"
    
    # ============== Review Methods ==============
    
    async def create_review(
        self,
        session_id: str,
        review: ReviewCreate,
        reviewer_id: str,
        reviewer_name: str
    ) -> Optional[Review]:
        """Create a review for a session"""
        db = await get_database()
        
        # Get the session
        session = await session_service.get_session(session_id)
        if not session:
            return None
            
        # Check if the reviewer has already reviewed this session
        existing_review = await db[self.reviews_collection].find_one({
            "target_id": session_id,
            "target_type": "Session",
            "target_version": session.session_version,
            "reviewer_id": reviewer_id
        })
        
        if existing_review:
            # Update the existing review
            await db[self.reviews_collection].update_one(
                {"_id": existing_review["_id"]},
                {
                    "$set": {
                        "review_result": review.review_result.model_dump(),
                        "updated_at": datetime.utcnow(),
                        "updater_id": reviewer_id,
                        "updater_name": reviewer_name
                    }
                }
            )
            
            review_id = str(existing_review["_id"])
            operation_type = OperationType.UPDATE
        else:
            # Create a new review
            review_dict = ReviewInDB(
                idea_id=session.idea_id,
                target_id=session_id,
                target_type="Session",
                target_version=session.session_version,
                reviewer_id=reviewer_id,
                reviewer_name=reviewer_name,
                review_result=review.review_result,
                creator_id=reviewer_id,
                creator_name=reviewer_name,
                updater_id=reviewer_id,
                updater_name=reviewer_name
            ).model_dump()
            
            result = await db[self.reviews_collection].insert_one(review_dict)
            review_id = str(result.inserted_id)
            operation_type = OperationType.CREATE
            
            # Update the session's review count and status
            await session_service.update_session_review_count(
                session_id,
                updater_id=reviewer_id,
                updater_name=reviewer_name
            )
        
        # Get the created/updated review
        review_dict = await db[self.reviews_collection].find_one({"_id": ObjectId(review_id)})
        review_dict["id"] = str(review_dict.pop("_id"))
        result_review = Review(**review_dict)
        
        # Add log record
        await record_operation_log(
            object_type=ObjectType.REVIEW,
            object_id=review_id,
            object_data=result_review,
            operation_type=operation_type,
            user_id=reviewer_id,
            user_name=reviewer_name
        )
        
        return result_review
    
    async def get_reviews_by_session(
        self,
        session_id: str,
        session_version: Optional[int] = None
    ) -> List[Review]:
        """Get all reviews for a session"""
        db = await get_database()
        
        # Build filter conditions
        filter_query = {
            "target_id": session_id,
            "target_type": "Session"
        }
        
        if session_version is not None:
            filter_query["target_version"] = session_version
            
        cursor = db[self.reviews_collection].find(filter_query)
        
        reviews = []
        async for review_dict in cursor:
            review_dict["id"] = str(review_dict.pop("_id"))
            reviews.append(Review(**review_dict))
        return reviews
    
    # ============== Final Decision Methods ==============
    
    async def create_final_decision(
        self,
        session_id: str,
        decision: FinalDecisionCreate,
        decision_maker_id: str,
        decision_maker_name: str
    ) -> Optional[FinalDecision]:
        """Create a final decision for a session"""
        db = await get_database()
        
        # Get the session
        session = await session_service.get_session(session_id)
        if not session:
            return None
            
        # Check if the session already has a final decision
        if session.has_final_decision:
            return None
            
        # Create the final decision
        decision_dict = FinalDecisionInDB(
            idea_id=session.idea_id,
            target_id=session_id,
            target_type="Session",
            target_version=session.session_version,
            decision_maker_id=decision_maker_id,
            decision_maker_name=decision_maker_name,
            decision=decision.decision,
            comments=decision.comments,
            creator_id=decision_maker_id,
            creator_name=decision_maker_name,
            updater_id=decision_maker_id,
            updater_name=decision_maker_name
        ).model_dump()
        
        result = await db[self.final_decisions_collection].insert_one(decision_dict)
        
        # Update the session with the final decision
        await session_service.update_session_final_decision(
            session_id,
            decision=decision.decision,
            comments=decision.comments,
            decision_maker_id=decision_maker_id,
            decision_maker_name=decision_maker_name
        )
        
        # Get the created final decision
        decision_dict = await db[self.final_decisions_collection].find_one({"_id": result.inserted_id})
        decision_dict["id"] = str(decision_dict.pop("_id"))
        result_decision = FinalDecision(**decision_dict)
        
        # Add log record
        await record_operation_log(
            object_type=ObjectType.FINAL_DECISION,
            object_id=str(result.inserted_id),
            object_data=result_decision,
            operation_type=OperationType.CREATE,
            user_id=decision_maker_id,
            user_name=decision_maker_name
        )
        
        return result_decision

review_service = ReviewService() 