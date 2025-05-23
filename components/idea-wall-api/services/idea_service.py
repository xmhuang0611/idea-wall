from typing import List, Dict, Any, Optional
from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException
from models.idea import IdeaCreate, IdeaUpdate, IdeaInDB, Idea, IdeaTag, IdeaStatus, SessionReview, IncubatorReview, ReviewStatus, LeanCanvas, SessionReviewCreate, LeanCanvasCreate
from models.log import ObjectType, OperationType
from utils.logging_utils import record_operation_log
from models.review import ReviewBase
from services.review_service import review_service
from core.database import get_database
from services.tag_service import tag_service

class IdeaService:
    def __init__(self):
        self.collection_name = "ideas"

    async def _db(self):
        """Get database connection"""
        return await get_database()

    async def _build_filter_query(
        self,
        search: Optional[str] = None,
        tags: Optional[List[int]] = None,
        creator_id: Optional[str] = None,
        voted_by: Optional[str] = None,
        bookmarked_by: Optional[str] = None,
        status: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        filter_query = {}
            
        # Filter by tags
        if tags:
            filter_query["tags"] = {"$all": tags}
            
        # Filter by search text
        if search:
            filter_query["$or"] = [
                {"title": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}}
            ]

        # Filter by creator
        if creator_id:
            filter_query["creator_id"] = creator_id
            
        # Filter by status (multiple statuses)
        if status:
            if len(status) == 1:
                filter_query["status"] = status[0]
            else:
                filter_query["status"] = {"$in": status}

        # Collect all idea IDs that need to be filtered
        idea_ids_to_filter = []
        
        # Get voted ideas if needed
        if voted_by:
            voted_idea_ids = await self._get_voted_idea_ids(voted_by)
            if voted_idea_ids:
                idea_ids_to_filter.append(voted_idea_ids)
            else:
                # If user hasn't voted for any ideas, return empty result
                filter_query["_id"] = {"$in": []}
                return filter_query

        # Get bookmarked ideas if needed
        if bookmarked_by:
            bookmarked_idea_ids = await self._get_bookmarked_idea_ids(bookmarked_by)
            if bookmarked_idea_ids:
                idea_ids_to_filter.append(bookmarked_idea_ids)
            else:
                # If user hasn't bookmarked any ideas, return empty result
                filter_query["_id"] = {"$in": []}
                return filter_query

        # If we have any idea IDs to filter by, find their intersection
        if idea_ids_to_filter:
            # If we have multiple sets of IDs, find their intersection
            if len(idea_ids_to_filter) > 1:
                # Convert all sets to sets of strings for intersection
                idea_id_sets = [set(str(id) for id in ids) for ids in idea_ids_to_filter]
                # Find intersection
                intersection = set.intersection(*idea_id_sets)
                # Convert back to ObjectId
                filter_query["_id"] = {"$in": [ObjectId(id) for id in intersection]}
            else:
                # If only one set of IDs, use it directly
                filter_query["_id"] = {"$in": idea_ids_to_filter[0]}
            
        return filter_query

    async def _get_voted_idea_ids(self, user_id: str) -> List[ObjectId]:
        """Get all idea IDs that a user has voted for"""
        db = await self._db()
        votes = await db["votes"].find({
            "creator_id": user_id,
            "target_type": "Idea",
            "vote_status": 1
        }).to_list(None)
        return [ObjectId(vote["target_id"]) for vote in votes]

    async def _get_bookmarked_idea_ids(self, user_id: str) -> List[ObjectId]:
        """Get all idea IDs that a user has bookmarked"""
        db = await self._db()
        bookmarks = await db["bookmarks"].find({
            "creator_id": user_id,
            "target_type": "Idea",
            "bookmark_status": 1
        }).to_list(None)
        return [ObjectId(bookmark["target_id"]) for bookmark in bookmarks]

    async def get_total_ideas(
        self,
        search: Optional[str] = None,
        tags: Optional[List[int]] = None,
        creator_id: Optional[str] = None,
        voted_by: Optional[str] = None,
        bookmarked_by: Optional[str] = None,
        status: Optional[List[str]] = None
    ) -> int:
        db = await self._db()
        filter_query = await self._build_filter_query(search, tags, creator_id, voted_by, bookmarked_by, status)
        return await db[self.collection_name].count_documents(filter_query)

    async def get_ideas(
        self,
        skip: int = 0,
        limit: int = 20,
        sort_by: Optional[str] = None,
        sort_order: Optional[str] = None,
        search: Optional[str] = None,
        tags: Optional[List[int]] = None,
        creator_id: Optional[str] = None,
        voted_by: Optional[str] = None,
        bookmarked_by: Optional[str] = None,
        status: Optional[List[str]] = None
    ) -> List[Idea]:
        db = await self._db()
        
        # Build filter conditions
        filter_query = await self._build_filter_query(search, tags, creator_id, voted_by, bookmarked_by, status)
            
        # Build sort conditions
        sort_options = {}
        if sort_by:
            sort_options[sort_by] = -1 if sort_order == "desc" else 1
        
        cursor = db[self.collection_name].find(filter_query)
        
        # Apply sorting
        if sort_options:
            cursor = cursor.sort(list(sort_options.items()))
            
        # Apply pagination
        cursor = cursor.skip(skip).limit(limit)
        
        ideas = []
        all_tags = await tag_service.get_all_tags()
        async for idea_dict in cursor:
            idea_dict["id"] = str(idea_dict.pop("_id"))
            idea_dict["tag_details"] = [IdeaTag(tag_id=tag.tag_id, tag_name=tag.tag_name) for tag in all_tags if tag.tag_id in idea_dict["tags"]]                
            ideas.append(Idea(**idea_dict))
        return ideas

    async def get_idea(self, idea_id: str) -> Optional[Idea]:
        db = await self._db()
        idea_dict = await db[self.collection_name].find_one({"_id": ObjectId(idea_id)})
        if idea_dict:
            idea_dict["id"] = str(idea_dict.pop("_id"))
            all_tags = await tag_service.get_all_tags()
            idea_dict["tag_details"] = [IdeaTag(tag_id=tag.tag_id, tag_name=tag.tag_name) for tag in all_tags if tag.tag_id in idea_dict["tags"]]
            return Idea(**idea_dict)
        return None

    async def create_idea(self, idea: IdeaCreate, creator_id: str, creator_name: str = "Anonymous User") -> Idea:
        db = await self._db()
        idea_dict = idea.model_dump()
        idea_in_db = IdeaInDB(
            **idea_dict,
            creator_id=creator_id,
            creator_name=creator_name,
            updater_id=creator_id,
            updater_name=creator_name,
            total_votes=0,
            total_comments=0,
            total_bookmarks=0,
            status=IdeaStatus.DRAFT
        )
        
        result = await db[self.collection_name].insert_one(idea_in_db.model_dump())
        result_idea = Idea(
            id=str(result.inserted_id),
            **idea_dict,
            created_at=idea_in_db.created_at,
            creator_id=creator_id,
            creator_name=creator_name,
            updated_at=idea_in_db.updated_at,
            updater_id=creator_id,
            updater_name=creator_name,
            total_votes=0,
            total_comments=0,
            total_bookmarks=0,
            status=IdeaStatus.DRAFT
        )
        
        # Add log record
        await record_operation_log(
            object_type=ObjectType.IDEA,
            object_id=str(result.inserted_id),
            object_data=result_idea,
            operation_type=OperationType.CREATE,
            user_id=creator_id,
            user_name=creator_name
        )
        
        return result_idea

    async def update_idea(self, idea_id: str, idea: IdeaUpdate, updater_id: str, updater_name: str) -> Optional[Idea]:
        db = await self._db()
        idea_dict = idea.model_dump()
        
        update_dict = {
            **idea_dict,
            "updater_id": updater_id,
            "updater_name": updater_name,
            "updated_at": datetime.utcnow()
        }
        
        # Update idea
        result = await db[self.collection_name].update_one(
            {"_id": ObjectId(idea_id)},
            {"$set": update_dict}
        )
        
        if result.modified_count == 0:
            return None
        
        # Get updated idea
        updated_idea = await self.get_idea(idea_id)
        
        # Add log record
        await record_operation_log(
            object_type=ObjectType.IDEA,
            object_id=idea_id,
            object_data=updated_idea,
            operation_type=OperationType.UPDATE,
            user_id=updater_id,
            user_name=updater_name
        )
        
        return updated_idea

    async def update_votes(self, idea_id: str, vote_change: int) -> bool:
        db = await self._db()
        result = await db[self.collection_name].update_one(
            {"_id": ObjectId(idea_id)},
            {"$inc": {"total_votes": vote_change}}
        )
        return result.modified_count > 0

    async def update_bookmarks(self, idea_id: str, bookmark_change: int) -> bool:
        db = await self._db()
        result = await db[self.collection_name].update_one(
            {"_id": ObjectId(idea_id)},
            {"$inc": {"total_bookmarks": bookmark_change}}
        )
        return result.modified_count > 0

    async def update_comments(self, idea_id: str, comment_change: int) -> bool:
        db = await self._db()
        result = await db[self.collection_name].update_one(
            {"_id": ObjectId(idea_id)},
            {"$inc": {"total_comments": comment_change}}
        )
        return result.modified_count > 0

    async def delete_idea(self, idea_id: str, user_id: str, user_name: str) -> bool:
        db = await self._db()
        
        # Get idea before deletion for logging
        idea = await self.get_idea(idea_id)
        if not idea:
            return False
        
        # Delete idea
        result = await db[self.collection_name].delete_one({"_id": ObjectId(idea_id)})
        
        if result.deleted_count > 0:
            # Add log record
            await record_operation_log(
                object_type=ObjectType.IDEA,
                object_id=idea_id,
                object_data=idea,
                operation_type=OperationType.DELETE,
                user_id=user_id,
                user_name=user_name
            )
            return True
        return False

    # Session Review Methods
    async def submit_session_review(
        self, 
        idea_id: str, 
        session_review_data: SessionReviewCreate, 
        submitter_id: str, 
        submitter_name: str
    ) -> Optional[Idea]:
        db = await self._db()
        
        # Get current idea
        idea = await self.get_idea(idea_id)
        if not idea:
            return None
        
        # Prepare session review data
        session_review = SessionReview(
            submitter_id=submitter_id,
            submitter_name=submitter_name,
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
        
        result = await db[self.collection_name].update_one(
            {"_id": ObjectId(idea_id)},
            {"$set": update_dict}
        )
        
        if result.modified_count == 0:
            return None
        
        # Get updated idea
        updated_idea = await self.get_idea(idea_id)
        
        # Add log record
        await record_operation_log(
            object_type=ObjectType.IDEA,
            object_id=idea_id,
            object_data=updated_idea,
            operation_type=OperationType.UPDATE,
            user_id=submitter_id,
            user_name=submitter_name,
        )
        
        return updated_idea

    # Incubator Review Methods
    async def submit_incubator_review(
        self, 
        idea_id: str, 
        lean_canvas_data: LeanCanvasCreate, 
        submitter_id: str, 
        submitter_name: str
    ) -> Optional[Idea]:
        db = await self._db()
        
        # Get current idea
        idea = await self.get_idea(idea_id)
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
            "status": IdeaStatus.IN_INCUBATION_REVIEW,
            "updater_id": submitter_id,
            "updater_name": submitter_name,
            "updated_at": datetime.utcnow()
        }
        
        result = await db[self.collection_name].update_one(
            {"_id": ObjectId(idea_id)},
            {"$set": update_dict}
        )
        
        if result.modified_count == 0:
            return None
        
        # Get updated idea
        updated_idea = await self.get_idea(idea_id)
        
        # Add log record
        await record_operation_log(
            object_type=ObjectType.IDEA,
            object_id=idea_id,
            object_data=updated_idea,
            operation_type=OperationType.UPDATE,
            user_id=submitter_id,
            user_name=submitter_name,
        )
        
        return updated_idea

    # Review Results Methods
    async def add_review_result(
        self, 
        idea_id: str, 
        target_type: str, 
        review_result: Dict[str, Any], 
        reviewer_id: str, 
        reviewer_name: str
    ) -> Optional[Idea]:
        db = await self._db()
        
        # Get current idea
        idea = await self.get_idea(idea_id)
        if not idea:
            return None
        
        # Check if target type is valid
        if target_type not in ["Session", "Incubator"]:
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
        if target_type == "Session":
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
        
        result = await db[self.collection_name].update_one(
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
                reviewer_id=reviewer_id,
                reviewer_name=reviewer_name,
                review_result=review_result
            )
            await review_service.create_review(review_data)
        except Exception as e:
            print(f"Error saving review to database: {str(e)}")
            # Continue even if saving to reviews collection fails
        
        # Get updated idea
        updated_idea = await self.get_idea(idea_id)
        
        # Add log record
        await record_operation_log(
            object_type=ObjectType.IDEA,
            object_id=idea_id,
            object_data=updated_idea,
            operation_type=OperationType.UPDATE,
            user_id=reviewer_id,
            user_name=reviewer_name,
        )
        
        return updated_idea

    # Final Decision Methods
    async def make_final_decision(
        self, 
        idea_id: str, 
        target_type: str, 
        decision: str, 
        comments: str, 
        decision_maker_id: str, 
        decision_maker_name: str
    ) -> Optional[Idea]:
        db = await self._db()
        
        # Get current idea
        idea = await self.get_idea(idea_id)
        if not idea:
            return None
        
        # Check if target type is valid
        if target_type not in ["Session", "Incubator"]:
            return None
        
        # Check if decision is valid
        if decision not in ["APPROVED", "REJECTED", "NEED_IMPROVEMENT"]:
            return None
        
        # Determine new idea status based on decision and target type
        new_status = None
        if target_type == "Session":
            if decision == "APPROVED":
                new_status = IdeaStatus.SESSION_APPROVED
            elif decision == "REJECTED":
                new_status = IdeaStatus.SESSION_REJECTED
            # NEED_IMPROVEMENT keeps the current status
        else:  # Incubator
            if decision == "APPROVED":
                new_status = IdeaStatus.INCUBATION_APPROVED
            elif decision == "REJECTED":
                new_status = IdeaStatus.INCUBATION_REJECTED
            # NEED_IMPROVEMENT keeps the current status
        
        # Update idea with decision and potentially new status
        update_dict = {
            f"{target_type.lower()}_review.status": decision,
            "updater_id": decision_maker_id,
            "updater_name": decision_maker_name,
            "updated_at": datetime.utcnow()
        }
        
        # Only update status if it changed
        if new_status:
            update_dict["status"] = new_status
        
        result = await db[self.collection_name].update_one(
            {"_id": ObjectId(idea_id)},
            {"$set": update_dict}
        )
        
        if result.modified_count == 0:
            return None
        
        # Get updated idea
        updated_idea = await self.get_idea(idea_id)
        
        # Add log record
        await record_operation_log(
            object_type=ObjectType.IDEA,
            object_id=idea_id,
            object_data=updated_idea,
            operation_type=OperationType.UPDATE,
            user_id=decision_maker_id,
            user_name=decision_maker_name,
        )
        
        return updated_idea

    # Roll Out Method
    async def roll_out_idea(
        self,
        idea_id: str,
        user_id: str,
        user_name: str
    ) -> Optional[Idea]:
        db = await self._db()
        
        # Get current idea
        idea = await self.get_idea(idea_id)
        if not idea:
            return None
        
        # Check if idea is in correct status
        if idea.status != IdeaStatus.INCUBATION_APPROVED:
            return None
        
        # Update idea status to ROLL_OUT
        update_dict = {
            "status": IdeaStatus.ROLL_OUT,
            "updater_id": user_id,
            "updater_name": user_name,
            "updated_at": datetime.utcnow()
        }
        
        result = await db[self.collection_name].update_one(
            {"_id": ObjectId(idea_id)},
            {"$set": update_dict}
        )
        
        if result.modified_count == 0:
            return None
        
        # Get updated idea
        updated_idea = await self.get_idea(idea_id)
        
        # Add log record
        await record_operation_log(
            object_type=ObjectType.IDEA,
            object_id=idea_id,
            object_data=updated_idea,
            operation_type=OperationType.UPDATE,
            user_id=user_id,
            user_name=user_name
        )
        
        return updated_idea

idea_service = IdeaService() 