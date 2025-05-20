from typing import Optional
from core.database import get_database
from models.user import User, UserRole
from models.log import ObjectType, OperationType
from utils.logging_utils import record_operation_log

class UserService:
    def __init__(self):
        self.collection_name = "users"

    async def get_user(self, user_id: str) -> Optional[User]:
        """
        Get a user by ID (case-insensitive)
        """
        db = await get_database()
        # Use regex with case-insensitive flag for user_id comparison
        user_dict = await db[self.collection_name].find_one({"user_id": user_id})
        if user_dict:
            # Validate and convert roles
            roles = []
            for role in user_dict.get("roles", []):
                try:
                    roles.append(UserRole(role))
                except ValueError:
                    # Skip invalid roles
                    continue
            user_dict["roles"] = roles
            return User(**user_dict)
        return None

    async def list_users(self) -> list[User]:
        """
        List all users
        """
        db = await get_database()
        users = []
        async for user_dict in db[self.collection_name].find():
            # Validate and convert roles
            roles = []
            for role in user_dict.get("roles", []):
                try:
                    roles.append(UserRole(role))
                except ValueError:
                    # Skip invalid roles
                    continue
            user_dict["roles"] = roles
            users.append(User(**user_dict))
        return users

    async def update_user_roles(self, user_id: str, roles: list[UserRole], current_user: User) -> Optional[User]:
        """
        Update user roles. If roles list is empty, all roles will be removed.
        """
        db = await get_database()
        
        # Convert roles to strings for storage (empty list is allowed)
        roles_str = [role.value for role in roles]
        
        # Update user roles with case-insensitive user_id comparison
        result = await db[self.collection_name].update_one(
            {"user_id": user_id},
            {"$set": {"roles": roles_str}}
        )
        
        if result.modified_count > 0:
            # Get updated user
            updated_user = await self.get_user(user_id)
            
            # Add log
            if updated_user:
                await record_operation_log(
                    object_type=ObjectType.USER,
                    object_id=user_id,
                    object_data=updated_user,
                    operation_type=OperationType.UPDATE,
                    user_id=current_user.user_id,
                    user_name=current_user.user_name
                )
            
            return updated_user
        return None

# Create a singleton instance
user_service = UserService() 