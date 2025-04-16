from motor.motor_asyncio import AsyncIOMotorClient
from .config import get_settings

settings = get_settings()

class Database:
    client: AsyncIOMotorClient = None
    db = None

db = Database()

async def get_database():
    return db.db

async def connect_to_mongo():
    db.client = AsyncIOMotorClient(settings.mongodb_url)
    db.db = db.client[settings.database_name]

async def close_mongo_connection():
    if db.client:
        db.client.close() 