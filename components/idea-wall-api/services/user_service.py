from core.database import get_database
from typing import Optional, List, Dict
from datetime import datetime
from models.user import User, UserInDB, UserRole

class UserService:
    def __init__(self):
        self.collection_name = "users"
    
    async def get_user(self, user_id: str) -> Optional[UserInDB]:
        """Get user information"""
        db = await get_database()
        user_dict = await db[self.collection_name].find_one({"user_id": user_id})
        if user_dict:
            return UserInDB(**user_dict)
        return None
    
    async def get_all_users(self, page: int = 1, page_size: int = 20, role: Optional[str] = None) -> Dict:
        """
        Get all users with pagination and optional role filtering
        
        Returns dict with users list and pagination metadata
        """
        db = await get_database()
        skip = (page - 1) * page_size
        
        # Build filter
        filter_query = {}
        if role:
            filter_query["roles"] = role
        
        # Get users with pagination
        users = []
        cursor = db[self.collection_name].find(filter_query).skip(skip).limit(page_size)
        async for user in cursor:
            users.append(UserInDB(**user))
            
        # Count total for pagination
        total = await db[self.collection_name].count_documents(filter_query)
        
        return {
            "users": users,
            "meta": {
                "page": page,
                "page_size": page_size,
                "total": total
            }
        }
    
    async def process_oauth_user(self, user_id: str, token_info: dict) -> Optional[UserInDB]:
        """
        Process OAuth user based on token information
        Only returns existing user, does not create new users
        """
        # Check if user exists in the database
        user = await self.get_user(user_id)
        
        # If user doesn't exist in DB, create a transient user object without roles
        if not user:
            return UserInDB(user_id=user_id, roles=[])
        
        return user
    
    async def update_user_roles(self, user_id: str, roles: List[str], admin_user_id: str, admin_user_name: str) -> Optional[UserInDB]:
        """
        Update user roles
        
        Parameters:
        - user_id: ID of the user to update
        - roles: List of role strings to assign
        - admin_user_id: ID of the admin performing the update
        - admin_user_name: Name of the admin performing the update
        
        Returns:
        - Updated user or None if user not found/created
        """
        db = await get_database()
        now = datetime.utcnow()
        
        # Check if user already exists
        user = await self.get_user(user_id)
        
        if user:
            # Update existing user
            update_data = {
                "roles": roles,
                "updated_at": now,
                "updated_by_id": admin_user_id,
                "updated_by_name": admin_user_name
            }
            
            result = await db[self.collection_name].update_one(
                {"user_id": user_id},
                {"$set": update_data}
            )
            
            if result.modified_count > 0 or result.matched_count > 0:
                return await self.get_user(user_id)
        else:
            # Create new user entry if roles are provided
            if roles:
                user_data = {
                    "user_id": user_id,
                    "roles": roles,
                    "created_at": now,
                    "updated_at": now,
                    "created_by_id": admin_user_id,
                    "created_by_name": admin_user_name,
                    "updated_by_id": admin_user_id,
                    "updated_by_name": admin_user_name
                }
                
                result = await db[self.collection_name].insert_one(user_data)
                if result.inserted_id:
                    return await self.get_user(user_id)
        
        # If no roles, and user doesn't exist, just return a transient user
        if not user and not roles:
            return UserInDB(user_id=user_id, roles=[])
            
        return user
    
    async def delete_user_roles(self, user_id: str, admin_user_id: str, admin_user_name: str) -> bool:
        """
        Delete all roles from a user
        
        Parameters:
        - user_id: ID of the user to update
        - admin_user_id: ID of the admin performing the delete
        - admin_user_name: Name of the admin performing the delete
        
        Returns:
        - True if roles were deleted or user didn't exist
        - False if deletion failed
        """
        user = await self.get_user(user_id)
        if not user:
            return True  # Nothing to delete
            
        db = await get_database()
        result = await db[self.collection_name].delete_one({"user_id": user_id})
        
        return result.deleted_count > 0

user_service = UserService() 