import asyncio
import sys
import os
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import random

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
        "role": "IDEA_SESSION_PANEL_REVIEWER",
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
    },
    # New users
    {
        "user_id": "david_user",
        "role": "USER",
        "hashed_password": get_password_hash("user123"),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    },
    {
        "user_id": "emma_reviewer",
        "role": "IDEA_SESSION_PANEL_REVIEWER",
        "hashed_password": get_password_hash("reviewer456"),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
]

# Existing tag IDs: 1 (Innovation), 2 (Technology), 3 (Process Improvement)
test_tags = [
    {
        "tag_id": 4,
        "tag": "User Experience",
        "parent_id": 0,
        "created_at": datetime.utcnow(),
        "created_by": "john_admin",
        "updated_at": datetime.utcnow(),
        "updated_by": "john_admin"
    },
    {
        "tag_id": 5,
        "tag": "Security",
        "parent_id": 2,  # Parent tag is Technology
        "created_at": datetime.utcnow(),
        "created_by": "john_admin",
        "updated_at": datetime.utcnow(),
        "updated_by": "john_admin"
    },
    {
        "tag_id": 6,
        "tag": "Cost Reduction",
        "parent_id": 1,  # Parent tag is Innovation
        "created_at": datetime.utcnow(),
        "created_by": "john_admin",
        "updated_at": datetime.utcnow(),
        "updated_by": "john_admin"
    },
    {
        "tag_id": 7,
        "tag": "Employee Satisfaction",
        "parent_id": 0,
        "created_at": datetime.utcnow(),
        "created_by": "john_admin",
        "updated_at": datetime.utcnow(),
        "updated_by": "john_admin"
    }
]

def generate_random_date(start_date, end_date):
    time_between = end_date - start_date
    days_between = time_between.days
    random_days = random.randrange(days_between)
    return start_date + timedelta(days=random_days)

# New idea data
new_test_ideas = [
    {
        "title": "Improve Remote Work Experience",
        "description": "Introduce new collaboration tools and virtual team-building activities to enhance remote work efficiency and team cohesion.",
        "category": "Idea",
        "feeling": 9,
        "tags": [4, 7],
        "total_votes": 0,
        "created_by": "emma_reviewer",
        "updated_by": "emma_reviewer"
    },
    {
        "title": "Cybersecurity Awareness Training Program",
        "description": "Develop an interactive security training platform to improve employees' cybersecurity awareness through gamification.",
        "category": "Idea",
        "feeling": 8,
        "tags": [2, 5],
        "total_votes": 0,
        "created_by": "david_user",
        "updated_by": "david_user"
    },
    {
        "title": "Slow System Response Speed",
        "description": "Users report that the system is slow when processing large amounts of data, requiring optimization of database queries and caching strategies.",
        "category": "Pain",
        "feeling": 4,
        "tags": [2, 3],
        "total_votes": 0,
        "created_by": "alice_reviewer",
        "updated_by": "alice_reviewer"
    },
    {
        "title": "Automated Workflow Optimization",
        "description": "Utilize machine learning technology to automatically identify and optimize repetitive workflows, improving work efficiency.",
        "category": "Idea",
        "feeling": 7,
        "tags": [1, 2, 3],
        "total_votes": 0,
        "created_by": "bob_incubator",
        "updated_by": "bob_incubator"
    },
    {
        "title": "Cost Optimization Proposal",
        "description": "Analyze current expenditures to identify areas for optimization, expecting to save 20% of operational costs.",
        "category": "Idea",
        "feeling": 6,
        "tags": [1, 6],
        "total_votes": 0,
        "created_by": "david_user",
        "updated_by": "david_user"
    },
    {
        "title": "Employee Benefits Improvement",
        "description": "Propose to increase flexible working hours and health care plans to enhance employee satisfaction and work efficiency.",
        "category": "Thought",
        "feeling": 8,
        "tags": [7],
        "total_votes": 0,
        "created_by": "emma_reviewer",
        "updated_by": "emma_reviewer"
    }
]

async def insert_test_data():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    try:
        # 获取现有数据以避免重复
        existing_users = await db.users.distinct("user_id")
        existing_tags = await db.tags.distinct("tag_id")
        
        # 过滤掉已存在的用户
        new_users = [user for user in test_users if user["user_id"] not in existing_users]
        if new_users:
            await db.users.insert_many(new_users)
            print(f"{len(new_users)} new users created successfully")
        
        # 过滤掉已存在的标签
        new_tags = [tag for tag in test_tags if tag["tag_id"] not in existing_tags]
        if new_tags:
            await db.tags.insert_many(new_tags)
            print(f"{len(new_tags)} new tags created successfully")
        
        # 为新想法设置随机创建时间
        start_date = datetime.utcnow() - timedelta(days=30)
        end_date = datetime.utcnow()
        
        for idea in new_test_ideas:
            created_at = generate_random_date(start_date, end_date)
            idea["created_at"] = created_at
            idea["updated_at"] = created_at
        
        # 插入新想法
        idea_results = await db.ideas.insert_many(new_test_ideas)
        idea_ids = idea_results.inserted_ids
        print(f"{len(new_test_ideas)} new ideas created successfully")
        
        # 为每个新想法创建评论
        test_comments = []
        comment_users = ["alice_reviewer", "bob_incubator", "david_user", "emma_reviewer"]
        
        for idea_id in idea_ids:
            # 为每个想法随机生成1-3条评论
            num_comments = random.randint(1, 3)
            for _ in range(num_comments):
                commenter = random.choice(comment_users)
                comment_date = generate_random_date(start_date, end_date)
                comment = {
                    "idea_id": str(idea_id),
                    "description": random.choice([
                        "这是一个很有价值的想法，建议优先考虑。",
                        "实施成本可能需要进一步评估。",
                        "已经有类似的项目在进行中，建议整合资源。",
                        "这个想法很有创意，但需要更详细的实施计划。",
                        "完全同意，这将带来显著的改进。"
                    ]),
                    "parent_id": None,
                    "votes": 0,
                    "created_at": comment_date,
                    "created_by": commenter,
                    "updated_at": comment_date,
                    "updated_by": commenter
                }
                test_comments.append(comment)
        
        if test_comments:
            await db.comments.insert_many(test_comments)
            print(f"{len(test_comments)} new comments created successfully")
        
        # 为每个想法添加随机数量的投票
        test_votes = []
        for idea_id in idea_ids:
            # 随机生成2-5个投票
            num_votes = random.randint(2, 5)
            vote_users = random.sample(comment_users, num_votes)
            vote_date = generate_random_date(start_date, end_date)
            
            for voter in vote_users:
                vote = {
                    "vote_status": random.choice([1, -1]),  # 随机上下投票
                    "target_id": str(idea_id),
                    "target_type": "Idea",
                    "created_at": vote_date,
                    "created_by": voter,
                    "updated_at": vote_date,
                    "updated_by": voter
                }
                test_votes.append(vote)
            
            # 更新想法的总投票数
            total_votes = sum(vote["vote_status"] for vote in test_votes if vote["target_id"] == str(idea_id))
            await db.ideas.update_one(
                {"_id": idea_id},
                {"$set": {"total_votes": total_votes}}
            )
        
        if test_votes:
            await db.votes.insert_many(test_votes)
            print(f"{len(test_votes)} new votes created successfully")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        client.close()
        print("Additional test data generation completed!")

if __name__ == "__main__":
    asyncio.run(insert_test_data()) 