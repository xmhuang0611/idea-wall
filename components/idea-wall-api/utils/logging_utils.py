from models.log import ObjectType, OperationType
from services.log_service import log_service
from typing import Dict, Any, Optional, Union
from pydantic import BaseModel
import json
from datetime import datetime

class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

async def record_operation_log(
    object_type: ObjectType,
    object_id: str,
    object_data: Union[Dict[str, Any], BaseModel],
    operation_type: OperationType,
    user_id: str,
    user_name: Optional[str] = "Unknown User"
) -> None:
    """
    Record an operation log for database changes
    
    Args:
        object_type: Type of object being modified (Idea, Comment, etc.)
        object_id: ID of the object being modified
        object_data: Data of the object after modification (dict or Pydantic model)
        operation_type: Type of operation (create, update, delete)
        user_id: ID of the user making the modification
        user_name: Name of the user making the modification
    """
    # Skip logging if the object_type is Log itself to prevent infinite recursion
    if object_type != "Log":
        if isinstance(object_data, BaseModel):
            data_dict = object_data.dict()
        else:
            data_dict = object_data
            
        data_str = json.dumps(data_dict, cls=DateTimeEncoder)
        
        await log_service.create_log(
            object_type=object_type,
            object_id=object_id,
            object_data=data_str,
            operation_type=operation_type,
            creator_id=user_id,
            creator_name=user_name
        ) 