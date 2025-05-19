from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from pydantic import BaseModel
from core.deps import user_has_role, get_current_user
from models.user import User, UserRole
from services.user_service import user_service
from models.response import StandardResponse, ErrorDetail

router = APIRouter()

class UpdateUserRolesRequest(BaseModel):
    roles: List[UserRole]

@router.get("", response_model=StandardResponse[List[User]])
async def list_users(current_user: User = Depends(user_has_role(UserRole.ADMIN))):
    users = await user_service.list_users()
    return StandardResponse(success=True, data=users)

@router.put("/{user_id}/roles", response_model=StandardResponse[User])
async def update_user_roles(
    user_id: str,
    request: UpdateUserRolesRequest,
    current_user: User = Depends(user_has_role(UserRole.ADMIN))
):
    """
    Update user roles. An empty roles list will remove all roles from the user.
    """
    # Check if user exists
    existing_user = await user_service.get_user(user_id)
    if not existing_user:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=404,
                message="User not found"
            )
        )
    
    # Update user roles (empty list is allowed)
    updated_user = await user_service.update_user_roles(user_id, request.roles, current_user)
    if not updated_user:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=500,
                message="Failed to update user roles"
            )
        )
    
    return StandardResponse(
        success=True,
        data=updated_user
    )

@router.get("/{user_id}", response_model=StandardResponse[User])
async def get_user(
    user_id: str,
    current_user: User = Depends(get_current_user)
):
    user = await user_service.get_user(user_id)
    if not user:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=404,
                message="User not found"
            )
        )
    
    return StandardResponse(
        success=True,
        data=user
    ) 