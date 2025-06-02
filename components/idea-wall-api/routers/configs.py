from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from motor.motor_asyncio import AsyncIOMotorDatabase
from core.deps import user_has_role
from models.config import SystemConfigCreate, SystemConfigUpdate, SystemConfig
from services.config_service import config_service
from models.user import UserRole
from models.response import StandardResponse, ErrorDetail

router = APIRouter()

@router.get("", response_model=StandardResponse[List[SystemConfig]])
async def get_configs(
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(user_has_role(UserRole.ADMIN))
):
    """
    Get all system configurations with pagination
    """
    try:
        configs = await config_service.get_configs(skip=skip, limit=limit)
        return StandardResponse(
            success=True,
            data=configs
        )
    except Exception as e:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message=str(e)
            )
        )

@router.get("/{key}", response_model=StandardResponse[SystemConfig])
async def get_config(
    key: str,
    current_user: dict = Depends(user_has_role(UserRole.ADMIN))
):
    """
    Get a single system configuration by key
    """
    config = await config_service.get_config(key=key)
    if not config:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=status.HTTP_404_NOT_FOUND,
                message="Configuration not found"
            )
        )
    return StandardResponse(
        success=True,
        data=config
    )

@router.post("", response_model=StandardResponse[SystemConfig])
async def create_config(
    config: SystemConfigCreate,
    current_user: dict = Depends(user_has_role(UserRole.ADMIN))
):
    """
    Create a new system configuration
    """
    try:
        config = await config_service.create_config(
            config, 
            creator_id=current_user.user_id,
            creator_name=current_user.user_name
        )
        return StandardResponse(
            success=True,
            data=config
        )
    except ValueError as e:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=status.HTTP_400_BAD_REQUEST,
                message=str(e)
            )
        )
    except Exception as e:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message=str(e)
            )
        )

@router.put("/{key}", response_model=StandardResponse[SystemConfig])
async def update_config(
    key: str,
    config: SystemConfigUpdate,
    current_user: dict = Depends(user_has_role(UserRole.ADMIN))
):
    """
    Update a system configuration
    """
    try:
        config = await config_service.update_config(key=key, config=config, updater_id=current_user.user_id, updater_name=current_user.user_name)
        if not config:
            return StandardResponse(
                success=False,
                error=ErrorDetail(
                    code=status.HTTP_404_NOT_FOUND,
                    message="Configuration not found"
                )
            )
        return StandardResponse(
            success=True,
            data=config
        )
    except Exception as e:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message=str(e)
            )
        )

@router.delete("/{key}", response_model=StandardResponse[bool])
async def delete_config(
    key: str,
    current_user: dict = Depends(user_has_role(UserRole.ADMIN))
):
    """
    Delete a system configuration
    """
    try:
        success = await config_service.delete_config(key=key, user_id=current_user.user_id, user_name=current_user.user_name)
        if not success:
            return StandardResponse(
                success=False,
                error=ErrorDetail(
                    code=status.HTTP_404_NOT_FOUND,
                    message="Configuration not found"
                )
            )
        return StandardResponse(
            success=True,
            data=True
        )
    except Exception as e:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message=str(e)
            )
        ) 