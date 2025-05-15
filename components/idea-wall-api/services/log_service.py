from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import HTTPException, status
from core.database import get_database
from models.log import LogCreate, LogInDB, Log, ObjectType, OperationType
from bson import ObjectId
import json

# Add custom JSON encoder to handle datetime objects
class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

class LogService:
    def __init__(self):
        self.collection_name = "logs"

    async def create_log(self, 
                         object_type: ObjectType, 
                         object_id: str, 
                         object_data: str, 
                         operation_type: OperationType,
                         creator_id: str, 
                         creator_name: str) -> Log:
        """
        Create a new log entry
        
        Args:
            object_type: Type of object being modified
            object_id: ID of the object being modified
            object_data: JSON string of the object data
            operation_type: Type of operation (create, update, delete)
            creator_id: ID of the user making the modification
            creator_name: Name of the user making the modification
        """
        db = await get_database()
        
        # object_data should already be a serialized JSON string
        
        # Get current time
        now = datetime.utcnow()
            
        log_in_db = LogInDB(
            object_type=object_type,
            object_id=object_id,
            object_data=object_data,
            operation_type=operation_type,
            creator_id=creator_id,
            creator_name=creator_name,
            updater_id=creator_id,
            updater_name=creator_name,
            created_at=now,
            updated_at=now
        )
        
        result = await db[self.collection_name].insert_one(log_in_db.model_dump())
        return Log(
            id=str(result.inserted_id),
            object_type=object_type,
            object_id=object_id,
            object_data=object_data,
            operation_type=operation_type,
            created_at=log_in_db.created_at,
            creator_id=creator_id,
            creator_name=creator_name,
            updated_at=log_in_db.updated_at,
            updater_id=creator_id,
            updater_name=creator_name,
        )

    async def get_log(self, log_id: str) -> Optional[Log]:
        """
        Get a log by ID
        """
        db = await get_database()
        log_dict = await db[self.collection_name].find_one({"_id": ObjectId(log_id)})
        if log_dict:
            log_dict["id"] = str(log_dict.pop("_id"))
            return Log(**log_dict)
        return None

    async def list_logs(self, 
                        page: int = 1, 
                        page_size: int = 20, 
                        object_type: Optional[ObjectType] = None, 
                        object_id: Optional[str] = None,
                        operation_type: Optional[OperationType] = None,
                        start_date: Optional[datetime] = None,
                        end_date: Optional[datetime] = None) -> List[Log]:
        """
        List logs with pagination and filtering
        """
        db = await get_database()
        query = {}
        
        # Apply filters if provided
        if object_type:
            query["object_type"] = object_type
        if object_id:
            query["object_id"] = object_id
        if operation_type:
            query["operation_type"] = operation_type
        
        # Date range filter on created_at
        if start_date or end_date:
            date_query = {}
            if start_date:
                date_query["$gte"] = start_date
            if end_date:
                date_query["$lte"] = end_date
            if date_query:
                query["created_at"] = date_query
        
        # Calculate skip for pagination
        skip = (page - 1) * page_size
        
        logs = []
        cursor = db[self.collection_name].find(query).sort("created_at", -1).skip(skip).limit(page_size)
        
        async for log_dict in cursor:
            log_dict["id"] = str(log_dict.pop("_id"))
            logs.append(Log(**log_dict))
            
        return logs

    async def count_logs(self, 
                         object_type: Optional[ObjectType] = None, 
                         object_id: Optional[str] = None,
                         operation_type: Optional[OperationType] = None,
                         start_date: Optional[datetime] = None,
                         end_date: Optional[datetime] = None) -> int:
        """
        Count logs with filtering
        """
        db = await get_database()
        query = {}
        
        # Apply filters if provided
        if object_type:
            query["object_type"] = object_type
        if object_id:
            query["object_id"] = object_id
        if operation_type:
            query["operation_type"] = operation_type
        
        # Date range filter on created_at
        if start_date or end_date:
            date_query = {}
            if start_date:
                date_query["$gte"] = start_date
            if end_date:
                date_query["$lte"] = end_date
            if date_query:
                query["created_at"] = date_query
        
        return await db[self.collection_name].count_documents(query)

# Create a singleton instance
log_service = LogService() 