from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from core.deps import get_current_active_user
from services.user_service import user_service
from models.user import User, UserCreate

router = APIRouter()

@router.get("/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user

@router.get("/{user_id}", response_model=User)
async def read_user(
    user_id: str,
    current_user: User = Depends(get_current_active_user)
):
    user = await user_service.get_user(user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return User(
        user_id=user.user_id,
        role=user.role,
        created_at=user.created_at,
        updated_at=user.updated_at
    )

@router.post("", response_model=User)
async def create_user(
    user: UserCreate,
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return await user_service.create_user(user, current_user.user_id)

@router.put("/{user_id}", response_model=User)
async def update_user(
    user_id: str,
    user_update: UserCreate,
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role != "ADMIN" and current_user.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    updated_user = await user_service.update_user(
        user_id=user_id,
        updated_by=current_user.user_id,
        role=user_update.role,
        password=user_update.password
    )
    
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return updated_user 