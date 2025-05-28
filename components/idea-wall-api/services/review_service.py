from typing import List, Dict, Any, Optional
from datetime import datetime
from bson import ObjectId
from core.database import get_database
from models.review import Review, ReviewResult, ReviewBase, TargetType
from models.idea import Idea, IdeaStatus, SessionReview, IncubatorReview, ReviewStatus, LeanCanvas, SessionReviewCreate, LeanCanvasCreate
from models.log import ObjectType, OperationType
from utils.logging_utils import record_operation_log

class ReviewService:
    collection_name = "reviews"
    ideas_collection_name = "ideas"

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

    async def _get_idea(self, idea_id: str) -> Optional[Idea]:
        """
        Helper method to get an idea by ID.
        
        Args:
            idea_id: The ID of the idea
            
        Returns:
            The Idea object or None if not found
        """
        db = await get_database()
        
        try:
            idea_doc = await db[self.ideas_collection_name].find_one({"_id": ObjectId(idea_id)})
            if idea_doc:
                idea_doc["id"] = str(idea_doc.pop("_id"))
                return Idea(**idea_doc)
            return None
        except Exception:
            return None

    async def submit_session_review(
        self, 
        idea_id: str, 
        session_review_data: SessionReviewCreate, 
        submitter_id: str, 
        submitter_name: str
    ) -> Optional[Idea]:
        """
        Submit session review for an idea.
        
        Args:
            idea_id: The ID of the idea
            session_review_data: Session review data
            submitter_id: ID of the submitter (creator)
            submitter_name: Name of the submitter (creator)
            
        Returns:
            The updated Idea object or None if failed
        """
        db = await get_database()
        
        # Get current idea
        idea = await self._get_idea(idea_id)
        if not idea:
            return None
        
        # Prepare session review data
        session_review = SessionReview(
            submitter_job=session_review_data.submitter_job,
            manager=session_review_data.manager,
            stream=session_review_data.stream,
            clients=session_review_data.clients,
            problem_statements=session_review_data.problem_statements,
            solutions=session_review_data.solutions,
            values=session_review_data.values,
            status=ReviewStatus.IN_REVIEW,
            review_count=0,
            submitted_at=datetime.utcnow()
        )
        
        # Update idea with session review and change status
        update_dict = {
            "session_review": session_review.model_dump(),
            "status": IdeaStatus.IN_SESSION_REVIEW,
            "updater_id": submitter_id,
            "updater_name": submitter_name,
            "updated_at": datetime.utcnow()
        }
        
        result = await db[self.ideas_collection_name].update_one(
            {"_id": ObjectId(idea_id)},
            {"$set": update_dict}
        )
        
        if result.modified_count == 0:
            return None
        
        # Get updated idea
        updated_idea = await self._get_idea(idea_id)
        
        # Add log record
        await record_operation_log(
            object_type=ObjectType.IDEA_LIFECYCLE,
            object_id=idea_id,
            object_data=updated_idea,
            operation_type=OperationType.UPDATE,
            user_id=submitter_id,
            user_name=submitter_name,
        )
        
        return updated_idea

    async def resubmit_session_review(
        self, 
        idea_id: str, 
        session_review_data: SessionReviewCreate, 
        submitter_id: str, 
        submitter_name: str
    ) -> Optional[Idea]:
        """
        Resubmit session review when status is NEED_IMPROVEMENT.
        This will reset the review process and clear existing reviews.
        
        Args:
            idea_id: The ID of the idea
            session_review_data: Updated session review data
            submitter_id: ID of the submitter
            submitter_name: Name of the submitter
            
        Returns:
            The updated Idea object or None if failed
        """
        db = await get_database()
        
        # Get current idea
        idea = await self._get_idea(idea_id)
        if not idea:
            return None
        
        # Prepare updated session review data
        session_review = SessionReview(
            submitter_job=session_review_data.submitter_job,
            manager=session_review_data.manager,
            stream=session_review_data.stream,
            clients=session_review_data.clients,
            problem_statements=session_review_data.problem_statements,
            solutions=session_review_data.solutions,
            values=session_review_data.values,
            status=ReviewStatus.IN_REVIEW,  # Reset to IN_REVIEW
            review_count=0,  # Reset review count
            average_score=0.0,  # Reset average score
            submitted_at=datetime.utcnow()  # Update submission time
        )
        
        # Update idea with new session review data and reset status
        update_dict = {
            "session_review": session_review.model_dump(),
            "status": IdeaStatus.IN_SESSION_REVIEW,  # Reset to IN_SESSION_REVIEW
            "updater_id": submitter_id,
            "updater_name": submitter_name,
            "updated_at": datetime.utcnow()
        }
        
        result = await db[self.ideas_collection_name].update_one(
            {"_id": ObjectId(idea_id)},
            {"$set": update_dict}
        )
        
        if result.modified_count == 0:
            return None
        
        # Clear existing reviews for this idea (session reviews)
        await self.clear_reviews_by_idea_and_type(idea_id, TargetType.SESSION.value)
        
        # Get updated idea
        updated_idea = await self._get_idea(idea_id)
        
        # Add log record
        await record_operation_log(
            object_type=ObjectType.IDEA_LIFECYCLE,
            object_id=idea_id,
            object_data=updated_idea,
            operation_type=OperationType.UPDATE,
            user_id=submitter_id,
            user_name=submitter_name,
        )
        
        return updated_idea

    async def submit_incubator_review(
        self, 
        idea_id: str, 
        lean_canvas_data: LeanCanvasCreate, 
        submitter_id: str, 
        submitter_name: str
    ) -> Optional[Idea]:
        """
        Submit incubator review for an idea.
        
        Args:
            idea_id: The ID of the idea
            lean_canvas_data: Lean canvas data
            submitter_id: ID of the submitter
            submitter_name: Name of the submitter
            
        Returns:
            The updated Idea object or None if failed
        """
        db = await get_database()
        
        # Get current idea
        idea = await self._get_idea(idea_id)
        if not idea:
            return None
        
        # Check if idea is in correct status
        if idea.status != IdeaStatus.SESSION_APPROVED:
            return None
        
        # Prepare lean canvas
        lean_canvas = LeanCanvas(
            problem=lean_canvas_data.problem,
            existing_alternatives=lean_canvas_data.existing_alternatives,
            solution=lean_canvas_data.solution,
            key_metrics=lean_canvas_data.key_metrics,
            unique_value=lean_canvas_data.unique_value,
            high_level_concept=lean_canvas_data.high_level_concept,
            unfair_advantage=lean_canvas_data.unfair_advantage,
            channels=lean_canvas_data.channels,
            customer_segments=lean_canvas_data.customer_segments,
            early_adopters=lean_canvas_data.early_adopters,
            cost_structure=lean_canvas_data.cost_structure,
            revenue_stream=lean_canvas_data.revenue_stream
        )
        
        # Prepare incubator review
        incubator_review = IncubatorReview(
            lean_canvas=lean_canvas,
            status=ReviewStatus.IN_REVIEW,
            review_count=0,
            submitted_at=datetime.utcnow()
        )
        
        # Update idea with incubator review and change status
        update_dict = {
            "incubator_review": incubator_review.model_dump(),
            "status": IdeaStatus.IN_INCUBATOR_REVIEW,
            "updater_id": submitter_id,
            "updater_name": submitter_name,
            "updated_at": datetime.utcnow()
        }
        
        result = await db[self.ideas_collection_name].update_one(
            {"_id": ObjectId(idea_id)},
            {"$set": update_dict}
        )
        
        if result.modified_count == 0:
            return None
        
        # Get updated idea
        updated_idea = await self._get_idea(idea_id)
        
        # Add log record
        await record_operation_log(
            object_type=ObjectType.IDEA_LIFECYCLE,
            object_id=idea_id,
            object_data=updated_idea,
            operation_type=OperationType.UPDATE,
            user_id=submitter_id,
            user_name=submitter_name,
        )
        
        return updated_idea

    async def add_review_result(
        self, 
        idea_id: str, 
        target_type: TargetType, 
        review_result: Dict[str, Any], 
        reviewer_id: str, 
        reviewer_name: str
    ) -> Optional[Idea]:
        """
        Add a review result for an idea.
        
        Args:
            idea_id: The ID of the idea
            target_type: The type of review target
            review_result: The review result data
            reviewer_id: ID of the reviewer
            reviewer_name: Name of the reviewer
            
        Returns:
            The updated Idea object or None if failed
        """
        db = await get_database()
        
        # Get current idea
        idea = await self._get_idea(idea_id)
        if not idea:
            return None
        
        # Calculate average score from review result
        average_score = sum([
            review_result["innovation"]["score"],
            review_result["value"]["score"],
            review_result["feasibility"]["score"],
            review_result["impact"]["score"],
            review_result["return_on_investment"]["score"]
        ]) / 5.0
        
        # Update review count and recalculate average score
        if target_type == TargetType.SESSION:
            if not idea.session_review:
                return None
            
            current_count = idea.session_review.review_count
            current_avg = idea.session_review.average_score
            new_count = current_count + 1
            new_avg = ((current_avg * current_count) + average_score) / new_count if new_count > 0 else average_score
            
            update_dict = {
                "session_review.review_count": new_count,
                "session_review.average_score": new_avg,
                "updater_id": reviewer_id,
                "updater_name": reviewer_name,
                "updated_at": datetime.utcnow()
            }
        else:  # Incubator
            if not idea.incubator_review:
                return None
            
            current_count = idea.incubator_review.review_count
            current_avg = idea.incubator_review.average_score
            new_count = current_count + 1
            new_avg = ((current_avg * current_count) + average_score) / new_count if new_count > 0 else average_score
            
            update_dict = {
                "incubator_review.review_count": new_count,
                "incubator_review.average_score": new_avg,
                "updater_id": reviewer_id,
                "updater_name": reviewer_name,
                "updated_at": datetime.utcnow()
            }
        
        result = await db[self.ideas_collection_name].update_one(
            {"_id": ObjectId(idea_id)},
            {"$set": update_dict}
        )
        
        if result.modified_count == 0:
            return None
        
        # Save review to reviews collection
        try:
            review_data = ReviewBase(
                idea_id=idea_id,
                target_type=target_type,
                review_result=review_result
            )
            await self.create_review(review_data, reviewer_id, reviewer_name)
        except Exception as e:
            print(f"Error saving review to database: {str(e)}")
            # Continue even if saving to reviews collection fails
        
        # Get updated idea
        updated_idea = await self._get_idea(idea_id)
        
        # Add log record
        await record_operation_log(
            object_type=ObjectType.REVIEW,
            object_id=idea_id,
            object_data=review_result,
            operation_type=OperationType.UPDATE,
            user_id=reviewer_id,
            user_name=reviewer_name,
        )
        
        return updated_idea

    async def make_final_decision(
        self, 
        idea_id: str, 
        target_type: TargetType, 
        decision: str, 
        comments: str, 
        decision_maker_id: str, 
        decision_maker_name: str
    ) -> Optional[Idea]:
        """
        Make a final decision for a review.
        
        Args:
            idea_id: The ID of the idea
            target_type: The type of review target
            decision: The final decision
            comments: Decision comments
            decision_maker_id: ID of the decision maker
            decision_maker_name: Name of the decision maker
            
        Returns:
            The updated Idea object or None if failed
        """
        db = await get_database()
        
        # Get current idea
        idea = await self._get_idea(idea_id)
        if not idea:
            return None
        
        # Check if decision is valid
        if decision not in ["APPROVED", "REJECTED", "NEED_IMPROVEMENT"]:
            return None
        
        # Determine new idea status based on decision and target type
        new_status = None
        if target_type == TargetType.SESSION:
            if decision == "APPROVED":
                new_status = IdeaStatus.SESSION_APPROVED
            elif decision == "REJECTED":
                new_status = IdeaStatus.SESSION_REJECTED
            # NEED_IMPROVEMENT keeps the current status
        else:  # Incubator
            if decision == "APPROVED":
                new_status = IdeaStatus.INCUBATOR_APPROVED
            elif decision == "REJECTED":
                new_status = IdeaStatus.INCUBATOR_REJECTED
            # NEED_IMPROVEMENT keeps the current status
        
        # Update idea with decision and potentially new status
        update_dict = {
            f"{target_type.value.lower()}_review.status": decision,
            f"{target_type.value.lower()}_review.review_comments": comments,
            "updater_id": decision_maker_id,
            "updater_name": decision_maker_name,
            "updated_at": datetime.utcnow()
        }
        
        # Only update status if it changed
        if new_status:
            update_dict["status"] = new_status
        
        result = await db[self.ideas_collection_name].update_one(
            {"_id": ObjectId(idea_id)},
            {"$set": update_dict}
        )
        
        if result.modified_count == 0:
            return None
        
        # Get updated idea
        updated_idea = await self._get_idea(idea_id)
        
        # Add log record
        await record_operation_log(
            object_type=ObjectType.FINAL_DECISION,
            object_id=idea_id,
            object_data=decision,
            operation_type=OperationType.UPDATE,
            user_id=decision_maker_id,
            user_name=decision_maker_name,
        )
        
        return updated_idea

    async def recalculate_review_scores(self, idea_id: str, target_type: TargetType) -> Optional[Idea]:
        """
        Recalculate review scores for an idea.
        
        Args:
            idea_id: The ID of the idea
            target_type: The type of review target
            
        Returns:
            The updated Idea object or None if failed
        """
        db = await get_database()
        
        # Get all reviews for this idea and target type
        reviews = await self.get_reviews(idea_id, target_type.value)
        
        if not reviews:
            return await self._get_idea(idea_id)
        
        # Calculate average score
        total_score = 0
        count = 0
        
        for review in reviews:
            review_result = review.review_result
            individual_score = (
                review_result.innovation.score +
                review_result.value.score +
                review_result.feasibility.score +
                review_result.impact.score +
                review_result.return_on_investment.score
            ) / 5.0
            total_score += individual_score
            count += 1
        
        average_score = total_score / count if count > 0 else 0.0
        
        # Update idea with new scores
        if target_type == TargetType.SESSION:
            update_dict = {
                "session_review.review_count": count,
                "session_review.average_score": average_score,
                "updated_at": datetime.utcnow()
            }
        else:  # Incubator
            update_dict = {
                "incubator_review.review_count": count,
                "incubator_review.average_score": average_score,
                "updated_at": datetime.utcnow()
            }
        
        result = await db[self.ideas_collection_name].update_one(
            {"_id": ObjectId(idea_id)},
            {"$set": update_dict}
        )
        
        if result.modified_count == 0:
            return None
        
        return await self._get_idea(idea_id)

# Create an instance of the service
review_service = ReviewService() 