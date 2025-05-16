from fastapi import APIRouter, Depends, Query, Path
from typing import Optional, List
from datetime import datetime
from services.log_service import log_service
from models.log import Log, ObjectType, OperationType
from models.response import StandardResponse
from core.deps import get_current_user

router = APIRouter()

@router.get("", response_model=StandardResponse[List[Log]])
async def list_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    object_type: Optional[ObjectType] = None,
    object_id: Optional[str] = None,
    operation_type: Optional[OperationType] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user = Depends(get_current_user)
):
    """
    List logs with pagination and filtering
    """
    logs = await log_service.list_logs(
        page=page,
        page_size=page_size,
        object_type=object_type,
        object_id=object_id,
        operation_type=operation_type,
        start_date=start_date,
        end_date=end_date
    )
    
    total = await log_service.count_logs(
        object_type=object_type,
        object_id=object_id,
        operation_type=operation_type,
        start_date=start_date,
        end_date=end_date
    )
    
    return StandardResponse(
        success=True,
        data=logs,
        pagination={"skip": (page - 1) * page_size, "limit": page_size, "total": total}
    )

@router.get("/{log_id}", response_model=StandardResponse[Log])
async def get_log(
    log_id: str = Path(...),
    current_user = Depends(get_current_user)
):
    """
    Get a log by ID
    """
    log = await log_service.get_log(log_id)
    if not log:
        return StandardResponse(
            success=False,
            error={"code": 404, "message": "Log not found"}
        )
    
    return StandardResponse(
        success=True,
        data=log
    ) 