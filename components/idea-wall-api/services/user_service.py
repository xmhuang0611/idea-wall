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

    async def create_user(self, user_data: dict, current_user: User) -> Optional[User]:
        """
        Create a new user
        """
        db = await get_database()
        
        # Check if user with the same ID already exists
        existing_user = await self.get_user(user_data["user_id"])
        if existing_user:
            return None
        
        try:
            # Convert roles to strings for storage
            roles_str = [role.value for role in user_data.get("roles", [])]
            
            # Create user document
            user_doc = {
                "user_id": user_data["user_id"],
                "user_name": user_data["user_name"],
                "roles": roles_str
            }
            
            # Insert user
            await db[self.collection_name].insert_one(user_doc)
            
            # Get created user
            created_user = await self.get_user(user_data["user_id"])
            
            # Add log
            if created_user:
                await record_operation_log(
                    object_type=ObjectType.USER,
                    object_id=user_data["user_id"],
                    object_data=created_user,
                    operation_type=OperationType.CREATE,
                    user_id=current_user.user_id,
                    user_name=current_user.user_name
                )
            
            return created_user
        except Exception as e:
            # Log the exception
            print(f"Error creating user: {str(e)}")
            return None

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

    async def delete_user(self, user_id: str, current_user: User) -> bool:
        """
        Delete a user by ID
        """
        db = await get_database()
        
        # Check if user exists before deletion
        existing_user = await self.get_user(user_id)
        if not existing_user:
            return False
        
        try:
            # Delete the user
            result = await db[self.collection_name].delete_one({"user_id": user_id})
            
            if result.deleted_count > 0:
                # Add log
                await record_operation_log(
                    object_type=ObjectType.USER,
                    object_id=user_id,
                    object_data=existing_user,
                    operation_type=OperationType.DELETE,
                    user_id=current_user.user_id,
                    user_name=current_user.user_name
                )
                return True
            return False
        except Exception as e:
            # Log the exception
            print(f"Error deleting user: {str(e)}")
            return False

# Create a singleton instance
user_service = UserService() 