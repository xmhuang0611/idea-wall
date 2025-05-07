from typing import Optional
from core.database import get_database
from models.user import User

class UserService:
    def __init__(self):
        self.collection_name = "users"

    async def get_user(self, user_id: str) -> Optional[User]:
        """
        Get a user by ID
        """
        db = await get_database()
        user_dict = await db[self.collection_name].find_one({"user_id": user_id})
        if user_dict:
            return User(**user_dict)
        return None

# Create a singleton instance
user_service = UserService() 