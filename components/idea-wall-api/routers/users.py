from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from core.deps import get_current_user, has_role
from services.user_service import user_service
from models.user import User, UserInDB, UserRole
from models.response import StandardResponse, ErrorDetail
from pydantic import BaseModel

router = APIRouter()

class RoleUpdate(BaseModel):
    roles: List[str]

# Helper function to get a User model from user_id
async def get_user_model(user_id: str) -> User:
    user = await user_service.get_user(user_id)
    if not user:
        return User(user_id=user_id, roles=[])
    return User(user_id=user.user_id, roles=user.roles)

@router.get("/me", response_model=StandardResponse)
async def read_users_me(user_id: str = Depends(get_current_user)):
    """Get current user information"""
    user = await get_user_model(user_id)
    return StandardResponse(
        success=True,
        data=user.dict()
    )

@router.get("/with-roles", response_model=StandardResponse)
async def get_users_with_roles(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    role: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """
    Get all users with roles with pagination and optional role filtering
    Only admins can access this endpoint
    """
    # Check if user is admin
    if "ADMIN" not in current_user.roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    result = await user_service.get_all_users(page=page, page_size=page_size, role=role)
    
    return StandardResponse(
        success=True,
        data=[user.dict() for user in result["users"]],
        pagination=result["pagination"]
    )

@router.get("/{user_id}", response_model=StandardResponse)
async def get_user(
    user_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific user by ID
    Users can view their own information, admins can view any user
    """
    # Check if user is admin or requesting their own info
    if "ADMIN" not in current_user.roles and current_user.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    user = await get_user_model(user_id)
    if not user:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=status.HTTP_404_NOT_FOUND,
                message="User not found"
            )
        )
    
    return StandardResponse(
        success=True,
        data=user.dict()
    )

@router.post("/{user_id}/roles", response_model=StandardResponse)
async def add_user_roles(
    user_id: str,
    role_update: RoleUpdate,
    current_user: User = Depends(get_current_user)
):
    """
    Add roles to a user
    Only admins can assign roles
    """
    # Check if current user is admin
    if "ADMIN" not in current_user.roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Validate roles
    for role in role_update.roles:
        try:
            UserRole(role)
        except ValueError:
            return StandardResponse(
                success=False,
                error=ErrorDetail(
                    code=status.HTTP_400_BAD_REQUEST,
                    message=f"Invalid role: {role}"
                )
            )
    
    # Get existing user if available
    existing_user = await get_user_model(user_id)
    
    # Combine existing and new roles
    combined_roles = list(set((existing_user.roles if existing_user else []) + role_update.roles))
    
    # Update user roles
    updated_user = await user_service.update_user_roles(
        user_id=user_id,
        roles=combined_roles,
        admin_user_id=current_user.user_id,
        admin_user_name=current_user.user_id  # Ideally would be user's name
    )
    
    if not updated_user:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message="Failed to update user roles"
            )
        )
    
    return StandardResponse(
        success=True,
        data=updated_user.dict()
    )

@router.put("/{user_id}/roles", response_model=StandardResponse)
async def update_user_roles(
    user_id: str,
    role_update: RoleUpdate,
    current_user: User = Depends(get_current_user)
):
    """
    Replace all roles for a user
    Only admins can update roles
    """
    # Check if current user is admin
    if "ADMIN" not in current_user.roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Validate roles
    for role in role_update.roles:
        try:
            UserRole(role)
        except ValueError:
            return StandardResponse(
                success=False,
                error=ErrorDetail(
                    code=status.HTTP_400_BAD_REQUEST,
                    message=f"Invalid role: {role}"
                )
            )
    
    # Update user roles (complete replacement)
    updated_user = await user_service.update_user_roles(
        user_id=user_id,
        roles=role_update.roles,
        admin_user_id=current_user.user_id,
        admin_user_name=current_user.user_id  # Ideally would be user's name
    )
    
    if not updated_user:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message="Failed to update user roles"
            )
        )
    
    return StandardResponse(
        success=True,
        data=updated_user.dict()
    )

@router.delete("/{user_id}/roles", response_model=StandardResponse)
async def delete_user_roles(
    user_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Delete all roles from a user
    Only admins can delete roles
    """
    # Check if current user is admin
    if "ADMIN" not in current_user.roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    success = await user_service.delete_user_roles(
        user_id=user_id,
        admin_user_id=current_user.user_id,
        admin_user_name=current_user.user_id  # Ideally would be user's name
    )
    
    if not success:
        return StandardResponse(
            success=False,
            error=ErrorDetail(
                code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message="Failed to delete user roles"
            )
        )
    
    return StandardResponse(
        success=True,
        data={"message": "All roles removed successfully"}
    ) 