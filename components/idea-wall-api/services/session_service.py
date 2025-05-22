from datetime import datetime
from typing import List, Optional, Dict, Any
from core.database import get_database
from models.session import (
    SessionCreate, SessionUpdate, SessionInDB, Session, 
    ReviewStatus, FinalDecisionType
)
from bson import ObjectId
from models.log import ObjectType, OperationType
from utils.logging_utils import record_operation_log
from models.idea import IdeaStatus

class SessionService:
    def __init__(self):
        self.sessions_collection = "idea_sessions"
        self.ideas_collection = "ideas"
    
    async def create_session(self, session: SessionCreate, creator_id: str, creator_name: str) -> Session:
        """Create a new idea session for review"""
        db = await get_database()
        
        # Check if there's an existing session for this idea
        existing_session = await db[self.sessions_collection].find_one({
            "idea_id": session.idea_id,
            "is_current": True
        })
        
        # If there's an existing session, set its is_current to False
        if existing_session:
            await db[self.sessions_collection].update_one(
                {"_id": existing_session["_id"]},
                {"$set": {"is_current": False}}
            )
            
            # Set previous_session_id to the existing session's ID
            previous_session_id = str(existing_session["_id"])
            session_version = existing_session.get("session_version", 0) + 1
        else:
            previous_session_id = None
            session_version = 1
            
        # Create new session
        session_dict = session.model_dump()
        session_in_db = SessionInDB(
            **session_dict,
            session_version=session_version,
            previous_session_id=previous_session_id,
            creator_id=creator_id,
            creator_name=creator_name,
            updater_id=creator_id,
            updater_name=creator_name
        )
        
        result = await db[self.sessions_collection].insert_one(session_in_db.model_dump())
        
        # Update the idea's current status and current_session_id
        await db[self.ideas_collection].update_one(
            {"_id": ObjectId(session.idea_id)},
            {
                "$set": {
                    "current_status": IdeaStatus.IN_SESSION_REVIEW,
                    "current_session_id": str(result.inserted_id)
                }
            }
        )
        
        # Create the result session object
        result_session = Session(
            id=str(result.inserted_id),
            **session_in_db.model_dump()
        )
        
        # Add log record
        await record_operation_log(
            object_type=ObjectType.IDEA_SESSION,
            object_id=str(result.inserted_id),
            object_data=result_session,
            operation_type=OperationType.CREATE,
            user_id=creator_id,
            user_name=creator_name
        )
        
        return result_session
    
    async def get_session(self, session_id: str) -> Optional[Session]:
        """Get a session by ID"""
        db = await get_database()
        session_dict = await db[self.sessions_collection].find_one({"_id": ObjectId(session_id)})
        if session_dict:
            session_dict["id"] = str(session_dict.pop("_id"))
            return Session(**session_dict)
        return None
    
    async def get_current_session_by_idea(self, idea_id: str) -> Optional[Session]:
        """Get the current session for an idea"""
        db = await get_database()
        session_dict = await db[self.sessions_collection].find_one({
            "idea_id": idea_id,
            "is_current": True
        })
        if session_dict:
            session_dict["id"] = str(session_dict.pop("_id"))
            return Session(**session_dict)
        return None
    
    async def get_sessions(
        self,
        skip: int = 0,
        limit: int = 20,
        status: Optional[ReviewStatus] = None,
        idea_id: Optional[str] = None,
        creator_id: Optional[str] = None,
        is_current: Optional[bool] = None
    ) -> List[Session]:
        """Get sessions with filters"""
        db = await get_database()
        
        # Build filter conditions
        filter_query = {}
        if status:
            filter_query["status"] = status
        if idea_id:
            filter_query["idea_id"] = idea_id
        if creator_id:
            filter_query["creator_id"] = creator_id
        if is_current is not None:
            filter_query["is_current"] = is_current
            
        cursor = db[self.sessions_collection].find(filter_query)
        cursor = cursor.sort("created_at", -1).skip(skip).limit(limit)
        
        sessions = []
        async for session_dict in cursor:
            session_dict["id"] = str(session_dict.pop("_id"))
            sessions.append(Session(**session_dict))
        return sessions
    
    async def get_total_sessions(
        self,
        status: Optional[ReviewStatus] = None,
        idea_id: Optional[str] = None,
        creator_id: Optional[str] = None,
        is_current: Optional[bool] = None
    ) -> int:
        """Get total count of sessions with filters"""
        db = await get_database()
        
        # Build filter conditions
        filter_query = {}
        if status:
            filter_query["status"] = status
        if idea_id:
            filter_query["idea_id"] = idea_id
        if creator_id:
            filter_query["creator_id"] = creator_id
        if is_current is not None:
            filter_query["is_current"] = is_current
            
        return await db[self.sessions_collection].count_documents(filter_query)
    
    async def update_session(
        self,
        session_id: str,
        session_update: SessionUpdate,
        updater_id: str,
        updater_name: str
    ) -> Optional[Session]:
        """Update a session"""
        db = await get_database()
        
        # Get the current session
        current_session = await self.get_session(session_id)
        if not current_session:
            return None
            
        # Only allow updates if the session is in NEED_IMPROVEMENT or PENDING status
        if current_session.status not in [ReviewStatus.NEED_IMPROVEMENT, ReviewStatus.PENDING]:
            return None
            
        # Update the session
        update_data = {k: v for k, v in session_update.model_dump().items() if v is not None}
        if update_data:
            update_data.update({
                "updated_at": datetime.utcnow(),
                "updater_id": updater_id,
                "updater_name": updater_name,
                "status": ReviewStatus.RESUBMITTED if current_session.status == ReviewStatus.NEED_IMPROVEMENT else ReviewStatus.PENDING
            })
            
            await db[self.sessions_collection].update_one(
                {"_id": ObjectId(session_id)},
                {"$set": update_data}
            )
            
            # Get the updated session
            updated_session = await self.get_session(session_id)
            
            # Add log record
            await record_operation_log(
                object_type=ObjectType.IDEA_SESSION,
                object_id=session_id,
                object_data=updated_session,
                operation_type=OperationType.UPDATE,
                user_id=updater_id,
                user_name=updater_name
            )
            
            return updated_session
        return current_session
    
    async def update_session_review_count(
        self,
        session_id: str,
        updater_id: str,
        updater_name: str
    ) -> bool:
        """Update a session's review count"""
        db = await get_database()
        
        # Update the session's review count and status
        result = await db[self.sessions_collection].update_one(
            {"_id": ObjectId(session_id)},
            {
                "$inc": {"review_count": 1},
                "$set": {
                    "status": ReviewStatus.IN_REVIEW,
                    "updated_at": datetime.utcnow(),
                    "updater_id": updater_id,
                    "updater_name": updater_name
                }
            }
        )
        
        return result.modified_count > 0
    
    async def update_session_final_decision(
        self,
        session_id: str,
        decision: FinalDecisionType,
        comments: str,
        decision_maker_id: str,
        decision_maker_name: str
    ) -> bool:
        """Update a session with final decision"""
        db = await get_database()
        
        # Get the session
        session = await self.get_session(session_id)
        if not session:
            return False
        
        # Update the session with the final decision
        result = await db[self.sessions_collection].update_one(
            {"_id": ObjectId(session_id)},
            {
                "$set": {
                    "has_final_decision": True,
                    "final_reviewer_id": decision_maker_id,
                    "final_reviewer_name": decision_maker_name,
                    "final_decision": decision,
                    "final_comments": comments,
                    "status": decision,
                    "updated_at": datetime.utcnow(),
                    "updater_id": decision_maker_id,
                    "updater_name": decision_maker_name
                }
            }
        )
        
        if result.modified_count > 0:
            # Update the idea's status based on the decision
            idea_status = IdeaStatus.SESSION_APPROVED if decision == FinalDecisionType.APPROVED else IdeaStatus.SESSION_REJECTED
            await db[self.ideas_collection].update_one(
                {"_id": ObjectId(session.idea_id)},
                {
                    "$set": {
                        "current_status": idea_status,
                        "updated_at": datetime.utcnow(),
                        "updater_id": decision_maker_id,
                        "updater_name": decision_maker_name
                    }
                }
            )
            return True
        
        return False

session_service = SessionService() 