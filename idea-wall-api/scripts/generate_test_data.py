import asyncio
import sys
import os
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient

# Add parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.security import get_password_hash

# MongoDB connection settings
MONGODB_URL = "mongodb://localhost:27017"
DATABASE_NAME = "idea-wall"

# Test data
test_users = [
    {
        "user_id": "john_admin",
        "role": "ADMIN",
        "hashed_password": get_password_hash("admin123"),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    },
    {
        "user_id": "alice_reviewer",
        "role": "IDEA_SESSION_PANNEL_REVIEWER",
        "hashed_password": get_password_hash("reviewer123"),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    },
    {
        "user_id": "bob_incubator",
        "role": "IDEA_INCUBATOR_REVIEWER",
        "hashed_password": get_password_hash("incubator123"),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
]

test_tags = [
    {
        "tag_id": 1,
        "tag": "Innovation",
        "parent_id": 0,
        "created_at": datetime.utcnow(),
        "created_by": "john_admin",
        "updated_at": datetime.utcnow(),
        "updated_by": "john_admin"
    },
    {
        "tag_id": 2,
        "tag": "Technology",
        "parent_id": 0,
        "created_at": datetime.utcnow(),
        "created_by": "john_admin",
        "updated_at": datetime.utcnow(),
        "updated_by": "john_admin"
    },
    {
        "tag_id": 3,
        "tag": "Process Improvement",
        "parent_id": 1,
        "created_at": datetime.utcnow(),
        "created_by": "john_admin",
        "updated_at": datetime.utcnow(),
        "updated_by": "john_admin"
    }
]

test_ideas = [
    {
        "title": "AI-Powered Customer Support System",
        "description": "Implement an AI chatbot system to handle basic customer inquiries and support requests. This will improve response times and reduce workload on human support staff.",
        "category": "Idea",
        "feeling": 8,
        "tags": [1, 2],
        "total_votes": 0,
        "created_at": datetime.utcnow(),
        "created_by": "alice_reviewer",
        "updated_at": datetime.utcnow(),
        "updated_by": "alice_reviewer"
    },
    {
        "title": "Slow Application Performance",
        "description": "Users are experiencing significant delays when accessing the dashboard during peak hours. This affects productivity and user satisfaction.",
        "category": "Pain",
        "feeling": 3,
        "tags": [2],
        "total_votes": 0,
        "created_at": datetime.utcnow(),
        "created_by": "bob_incubator",
        "updated_at": datetime.utcnow(),
        "updated_by": "bob_incubator"
    },
    {
        "title": "Automated Code Review Process",
        "description": "Implement automated code review tools to improve code quality and reduce manual review time. This will help catch common issues early in development.",
        "category": "Idea",
        "feeling": 7,
        "tags": [2, 3],
        "total_votes": 0,
        "created_at": datetime.utcnow(),
        "created_by": "john_admin",
        "updated_at": datetime.utcnow(),
        "updated_by": "john_admin"
    }
]

async def insert_test_data():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    try:
        # Clear existing data
        await db.users.delete_many({})
        await db.tags.delete_many({})
        await db.ideas.delete_many({})
        await db.comments.delete_many({})
        await db.votes.delete_many({})
        
        # Insert users
        await db.users.insert_many(test_users)
        print("Users created successfully")
        
        # Insert tags
        await db.tags.insert_many(test_tags)
        print("Tags created successfully")
        
        # Insert ideas
        idea_results = await db.ideas.insert_many(test_ideas)
        idea_ids = idea_results.inserted_ids
        print("Ideas created successfully")
        
        # Create comments for each idea
        test_comments = []
        for idx, idea_id in enumerate(idea_ids):
            comments = [
                {
                    "idea_id": str(idea_id),
                    "description": f"This is a great suggestion! We should prioritize this.",
                    "parent_id": None,
                    "votes": 0,
                    "created_at": datetime.utcnow(),
                    "created_by": "alice_reviewer",
                    "updated_at": datetime.utcnow(),
                    "updated_by": "alice_reviewer"
                },
                {
                    "idea_id": str(idea_id),
                    "description": f"I agree, but we need to consider the implementation costs and timeline.",
                    "parent_id": None,
                    "votes": 0,
                    "created_at": datetime.utcnow(),
                    "created_by": "bob_incubator",
                    "updated_at": datetime.utcnow(),
                    "updated_by": "bob_incubator"
                }
            ]
            test_comments.extend(comments)
        
        comment_results = await db.comments.insert_many(test_comments)
        print("Comments created successfully")
        
        # Create votes
        test_votes = []
        for idea_id in idea_ids:
            votes = [
                {
                    "vote_status": 1,
                    "target_id": str(idea_id),
                    "target_type": "Idea",
                    "created_at": datetime.utcnow(),
                    "created_by": "alice_reviewer",
                    "updated_at": datetime.utcnow(),
                    "updated_by": "alice_reviewer"
                },
                {
                    "vote_status": 1,
                    "target_id": str(idea_id),
                    "target_type": "Idea",
                    "created_at": datetime.utcnow(),
                    "created_by": "bob_incubator",
                    "updated_at": datetime.utcnow(),
                    "updated_by": "bob_incubator"
                }
            ]
            test_votes.extend(votes)
            # Update idea vote count
            await db.ideas.update_one(
                {"_id": idea_id},
                {"$set": {"total_votes": 2}}
            )
        
        await db.votes.insert_many(test_votes)
        print("Votes created successfully")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        client.close()
        print("Test data generation completed!")

if __name__ == "__main__":
    asyncio.run(insert_test_data()) 