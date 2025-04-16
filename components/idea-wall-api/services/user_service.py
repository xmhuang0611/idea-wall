from datetime import datetime
from typing import Optional
from core.database import get_database
from core.security import get_password_hash, verify_password
from models.user import UserCreate, UserInDB, User
from fastapi import HTTPException, status

class UserService:
    def __init__(self):
        self.collection_name = "users"

    async def get_user(self, user_id: str) -> Optional[UserInDB]:
        db = await get_database()
        user_dict = await db[self.collection_name].find_one({"user_id": user_id})
        if user_dict:
            return UserInDB(**user_dict)
        return None

    async def create_user(self, user: UserCreate, created_by: Optional[str] = None) -> User:
        db = await get_database()
        
        # 检查用户是否已存在
        if await self.get_user(user.user_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User already exists"
            )
        
        # 创建新用户
        user_dict = user.model_dump()
        user_in_db = UserInDB(
            **user_dict,
            hashed_password=get_password_hash(user.password),
            created_by=created_by,
            updated_by=created_by
        )
        
        await db[self.collection_name].insert_one(user_in_db.model_dump())
        
        return User(
            user_id=user.user_id,
            role=user.role,
            created_at=user_in_db.created_at,
            updated_at=user_in_db.updated_at
        )

    async def authenticate_user(self, user_id: str, password: str) -> Optional[UserInDB]:
        user = await self.get_user(user_id)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

    async def update_user(self, user_id: str, updated_by: str, **kwargs) -> Optional[User]:
        db = await get_database()
        update_data = {
            "updated_at": datetime.utcnow(),
            "updated_by": updated_by
        }
        
        if "password" in kwargs:
            update_data["hashed_password"] = get_password_hash(kwargs["password"])
            del kwargs["password"]
            
        update_data.update(kwargs)
        
        result = await db[self.collection_name].update_one(
            {"user_id": user_id},
            {"$set": update_data}
        )
        
        if result.modified_count:
            user = await self.get_user(user_id)
            return User(
                user_id=user.user_id,
                role=user.role,
                created_at=user.created_at,
                updated_at=user.updated_at
            )
        return None

user_service = UserService() 