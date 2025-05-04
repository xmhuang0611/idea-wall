import asyncio
import sys
import os
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import random

# Add parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


# MongoDB connection settings
MONGODB_URL = "mongodb://localhost:27017"
DATABASE_NAME = "idea-wall"

# User name mapping for audit fields
user_name_map = {
    "john_admin": "John Admin",
    "alice_reviewer": "Alice Reviewer",
    "bob_incubator": "Bob Incubator",
    "david_user": "David User",
    "emma_reviewer": "Emma Reviewer",
    "frank_user": "Frank User",
    "grace_admin": "Grace Admin",
    "helen_panel": "Helen Panel",
    "ian_incubator": "Ian Incubator",
    "jane_user": "Jane User"
}

# Test users
# roles should be an array
# Add audit fields
now = datetime.utcnow()

# Generate more users
user_roles = [
    ("john_admin", ["ADMIN"]),
    ("grace_admin", ["ADMIN"]),
    ("alice_reviewer", ["IDEA_SESSION_PANNEL_REVIEWER"]),
    ("emma_reviewer", ["IDEA_SESSION_PANNEL_REVIEWER"]),
    ("helen_panel", ["IDEA_SESSION_PANNEL_REVIEWER"]),
    ("bob_incubator", ["IDEA_INCUBATOR_REVIEWER"]),
    ("ian_incubator", ["IDEA_INCUBATOR_REVIEWER"]),
    ("david_user", ["USER"]),
    ("frank_user", ["USER"]),
    ("jane_user", ["USER"])
]
test_users = [
    {
        "user_id": uid,
        "roles": roles,
        "created_at": now,
        "creator_id": uid,
        "creator_name": user_name_map.get(uid, uid),
        "updated_at": now,
        "updater_id": uid,
        "updater_name": user_name_map.get(uid, uid)
    }
    for uid, roles in user_roles
]

# Existing tag IDs: 1 (Innovation), 2 (Technology), 3 (Process Improvement)
# More tags
base_tags = [
    (1, "Innovation", 0),
    (2, "Technology", 0),
    (3, "Process Improvement", 0),
    (4, "User Experience", 0),
    (5, "Security", 2),
    (6, "Cost Reduction", 1),
    (7, "Employee Satisfaction", 0),
    (8, "Sustainability", 0),
    (9, "Automation", 2),
    (10, "Customer Service", 0)
]
test_tags = [
    {
        "tag_id": tag_id,
        "tag": tag_name,
        "parent_id": parent_id,
        "created_at": now,
        "creator_id": "john_admin",
        "creator_name": "John Admin",
        "updated_at": now,
        "updater_id": "john_admin",
        "updater_name": "John Admin"
    }
    for tag_id, tag_name, parent_id in base_tags
]

def generate_random_date(start_date, end_date):
    time_between = end_date - start_date
    days_between = time_between.days
    random_days = random.randrange(days_between)
    return start_date + timedelta(days=random_days)

# New idea data
# Generate more ideas
idea_categories = ["Idea", "Pain", "Thought"]
idea_titles = [
    "Improve Remote Work Experience",
    "Cybersecurity Awareness Training Program",
    "Slow System Response Speed",
    "Automated Workflow Optimization",
    "Cost Optimization Proposal",
    "Employee Benefits Improvement",
    "Enhance Customer Service Portal",
    "Green Office Initiative",
    "AI-powered Data Analysis",
    "Mobile App Redesign",
    "Cloud Migration Plan",
    "Legacy System Replacement",
    "Employee Onboarding Automation",
    "Flexible Work Policy",
    "Knowledge Sharing Platform",
    "Real-time Feedback System",
    "Paperless Office Drive",
    "Smart Meeting Scheduler",
    "Cross-team Collaboration Tool",
    "Data Privacy Enhancement"
]
idea_descs = [
    "Introduce new collaboration tools and virtual team-building activities to enhance remote work efficiency and team cohesion. This would include setting up dedicated virtual spaces for casual interactions, implementing advanced project management software with better visibility features, and organizing monthly virtual team-building events. Expected outcomes include a 20% increase in team productivity and improved employee satisfaction scores.",
    
    "Develop a comprehensive interactive security training platform that uses gamification techniques to improve employees' cybersecurity awareness. The platform would include simulated phishing attacks, reward systems for completing training modules, monthly security challenges, and real-time security alert simulations. This initiative aims to reduce security incidents by 40% within the first year of implementation.",
    
    "Our current system experiences significant slowdowns when processing large data sets, with response times exceeding 10 seconds for complex queries. This affects user experience and productivity across all departments. Technical investigation suggests optimization of database queries, implementation of caching strategies, and potential infrastructure upgrades could address these issues. We should prioritize this as system usage is expected to increase by 30% next quarter.",
    
    "Implement an AI-powered system to analyze and optimize workflow patterns across departments. The solution would monitor existing processes, identify bottlenecks and repetitive tasks, and suggest automation opportunities. Phase one would target the finance, HR, and operations departments, with expected efficiency gains of 15-25% for administrative tasks. Implementation would include API integrations with existing systems, machine learning models for pattern recognition, and a dashboard for monitoring improvements.",
    
    "Based on a detailed analysis of our current operational expenditures, we've identified potential cost-saving opportunities across multiple departments. The proposal includes renegotiating vendor contracts (estimated 10% savings), optimizing cloud resource usage (estimated 15% savings), implementing smart energy management systems (5% reduction in utility costs), and streamlining procurement processes. With strategic implementation over 6 months, we project total operational cost savings of approximately 20%.",
    
    "Enhance our employee benefits package by introducing more flexible working hours, expanding mental health resources, and improving healthcare coverage options. Research indicates these improvements would address the top three concerns mentioned in our recent employee satisfaction survey. Implementation would include a 4-day work week pilot in selected departments, partnership with mental health service providers for 24/7 support, and negotiation of improved healthcare plans. Expected outcomes include reduced turnover rates and improved productivity metrics.",
    
    "Redesign our customer service portal to improve user experience, reduce support ticket volume, and increase self-service capabilities. The new design would feature an intuitive interface with AI-powered search functionality, guided troubleshooting workflows, video tutorials for common issues, and improved accessibility features. User testing indicates potential reduction in support calls by 30% and increased customer satisfaction ratings. Implementation would require 3 months with phased rollout to minimize disruption.",
    
    "Launch a comprehensive sustainability initiative across all office locations to reduce our environmental footprint and operational costs. The program would include transitioning to energy-efficient lighting systems, implementing smart climate control, reducing single-use plastics, expanding recycling programs, and incentivizing eco-friendly commuting options. Initial investment is estimated at $75,000 with projected annual savings of $45,000 and carbon footprint reduction of 25% within the first year.",
    
    "Develop an advanced analytics platform leveraging AI to transform how we process and utilize our data assets. The system would provide predictive insights, identify emerging trends, automate report generation, and enable more informed decision-making across departments. Technical components include machine learning models for pattern recognition, natural language processing for unstructured data analysis, and interactive visualization tools. Implementation timeline is estimated at 6-8 months with ROI expected within 14 months through efficiency gains and improved strategic decisions.",
    
    "Completely redesign our mobile application to address user feedback, improve engagement metrics, and incorporate modern design principles. The project would include user journey mapping, prototype testing with focus groups, accessibility improvements, offline functionality enhancements, and performance optimizations. Key metrics targeted for improvement include user retention (20% increase), session duration (15% increase), and conversion rates (25% increase). Development timeline is estimated at 4 months with a phased rollout approach.",
    
    "Develop a comprehensive plan to migrate our on-premises infrastructure to cloud-based solutions over the next 12 months. The strategy includes detailed assessment of current workloads, selection of appropriate cloud services (hybrid approach using AWS and Azure), security and compliance considerations, data migration procedures, staff training requirements, and cost projections. Expected benefits include 30% reduction in infrastructure costs, improved scalability, enhanced disaster recovery capabilities, and reduced maintenance overhead.",
    
    "Replace our legacy ERP system that currently causes significant operational inefficiencies and lacks modern integration capabilities. The project would include requirements gathering across all affected departments, vendor evaluation, data migration planning, customization specifications, user training programs, and a phased implementation approach to minimize business disruption. Expected benefits include process efficiency improvements of 25%, enhanced reporting capabilities, improved data security, and elimination of approximately $150,000 in annual maintenance costs for the legacy system.",
    
    "Implement an automated employee onboarding system to streamline the process for new hires and reduce HR workload. The solution would include digital document signing, automated equipment provisioning, interactive training modules, structured feedback collection, and integration with existing HR systems. Benefits include reducing onboarding time from 5 days to 2 days, ensuring 100% compliance with required training, improving new hire satisfaction scores, and freeing up approximately 15 hours of HR time per new employee.",
    
    "Develop and implement a comprehensive flexible work policy that balances employee preferences with business requirements. The policy would include clear guidelines for remote work eligibility, core hour requirements, performance measurement frameworks, communication protocols, and necessary technology infrastructure investments. Implementation would be preceded by department-level assessments and pilot programs. Expected outcomes include improved employee retention rates, expanded talent recruitment pool, and potential office space cost savings of 20-30%.",
    
    "Create an enterprise-wide knowledge sharing platform to capture, organize, and leverage institutional knowledge across the organization. Features would include searchable document repositories, expertise directories, communities of practice, integration with communication tools, gamification elements to encourage participation, and analytics to measure engagement and value. Implementation would involve departmental champions, content migration strategies, and a comprehensive communication plan. Expected benefits include reduced knowledge loss during employee transitions, faster problem-solving, and improved innovation metrics.",
    
    "Implement a real-time feedback system for collecting and analyzing customer and employee input. The platform would enable immediate response collection across multiple channels (app, website, in-product, SMS), sentiment analysis, trend identification, and integration with existing CRM systems. The implementation plan includes a phased rollout starting with customer-facing applications, followed by internal processes. Anticipated outcomes include a 40% increase in feedback volume, reduced time to address issues (from days to hours), and measurable improvements in satisfaction scores.",
    
    "Launch a comprehensive initiative to transform our office operations into a paperless environment. The project would include digitizing existing paper documents (approximately 25,000 pages), implementing digital signature solutions, reconfiguring workflows that currently require paper documentation, upgrading printer policies, and providing necessary training. Expected benefits include annual savings of $45,000 in paper and printing costs, 15% reduction in storage space requirements, enhanced document security, and alignment with our sustainability goals.",
    
    "Develop an intelligent meeting scheduling system that optimizes calendar management and meeting effectiveness. The AI-powered tool would analyze meeting patterns, suggest optimal timing based on participant preferences and energy levels, recommend meeting duration based on agenda complexity, identify redundant meetings, and provide digital facilitation assistance. Implementation would be cloud-based with integration into existing calendar systems. Expected benefits include 25% reduction in meeting time, improved meeting satisfaction scores, and recovery of approximately 3 hours per employee per week.",
    
    "Implement a dedicated cross-team collaboration platform to break down departmental silos and enhance project coordination. The solution would provide virtual workspace for cross-functional teams, visualize project dependencies, standardize communication protocols, integrate with existing productivity tools, and include analytics to measure collaboration effectiveness. Implementation would include pilot programs in 2-3 key cross-functional areas before company-wide rollout. Expected outcomes include 30% faster project completion times, improved innovation metrics, and enhanced employee satisfaction with cross-team interactions.",
    
    "Enhance our data privacy framework to exceed regulatory requirements and build customer trust. The comprehensive approach would include data mapping and classification, enhanced encryption protocols, privacy-by-design principles in product development, automated compliance monitoring, regular penetration testing, and expanded employee training. Implementation would be phased over 8 months with priority given to high-risk data systems. Benefits include reduction in privacy incidents, improved regulatory compliance posture, and enhanced brand reputation as demonstrated through customer trust metrics."
]
idea_users = list(user_name_map.keys())
new_test_ideas = []
for i in range(20):
    user = random.choice(idea_users)
    title = idea_titles[i % len(idea_titles)]
    desc = idea_descs[i % len(idea_descs)]
    category = random.choice(idea_categories)
    feeling = random.randint(3, 10)
    tags = random.sample([t[0] for t in base_tags], random.randint(1, 3))
    new_test_ideas.append({
        "title": title,
        "description": desc,
        "category": category,
        "feeling": feeling,
        "tags": tags,
        "total_votes": 0,
        "created_by": user,
        "updated_by": user
    })

async def insert_test_data():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    try:
        # Get existing data to avoid duplicates
        existing_users = await db.users.distinct("user_id")
        existing_tags = await db.tags.distinct("tag_id")

        # Insert users
        new_users = [user for user in test_users if user["user_id"] not in existing_users]
        if new_users:
            await db.users.insert_many(new_users)
            print(f"{len(new_users)} new users created successfully")

        # Insert tags
        new_tags = [tag for tag in test_tags if tag["tag_id"] not in existing_tags]
        if new_tags:
            await db.tags.insert_many(new_tags)
            print(f"{len(new_tags)} new tags created successfully")

        # Prepare ideas with audit fields
        start_date = datetime.utcnow() - timedelta(days=30)
        end_date = datetime.utcnow()
        prepared_ideas = []
        for idea in new_test_ideas:
            created_at = generate_random_date(start_date, end_date)
            user_id = idea["created_by"]
            user_name = user_name_map.get(user_id, user_id)
            prepared_ideas.append({
                "title": idea["title"],
                "description": idea["description"],
                "category": idea["category"],
                "feeling": idea["feeling"],
                "tags": idea["tags"],
                "total_votes": 0,
                "created_at": created_at,
                "creator_id": user_id,
                "creator_name": user_name,
                "updated_at": created_at,
                "updater_id": user_id,
                "updater_name": user_name
            })
        idea_results = await db.ideas.insert_many(prepared_ideas)
        idea_ids = idea_results.inserted_ids
        print(f"{len(prepared_ideas)} new ideas created successfully")

        # Prepare comments (in English, with audit fields)
        test_comments = []
        comment_users = idea_users
        comment_texts = [
            "This is a valuable idea, should be prioritized.",
            "Implementation cost may need further evaluation.",
            "There is a similar project ongoing, consider resource integration.",
            "Creative idea, but needs a more detailed implementation plan.",
            "Totally agree, this will bring significant improvement.",
            "Interesting perspective, worth exploring.",
            "Potential impact is high.",
            "Needs more data to support the proposal.",
            "Could be challenging to implement.",
            "Great alignment with company goals."
        ]
        for idea_id in idea_ids:
            num_comments = random.randint(2, 6)
            for _ in range(num_comments):
                commenter = random.choice(comment_users)
                comment_date = generate_random_date(start_date, end_date)
                test_comments.append({
                    "idea_id": idea_id,
                    "description": random.choice(comment_texts),
                    "parent_id": None,
                    "votes": 0,
                    "created_at": comment_date,
                    "creator_id": commenter,
                    "creator_name": user_name_map.get(commenter, commenter),
                    "updated_at": comment_date,
                    "updater_id": commenter,
                    "updater_name": user_name_map.get(commenter, commenter)
                })
        if test_comments:
            await db.comments.insert_many(test_comments)
            print(f"{len(test_comments)} new comments created successfully")

        # Prepare votes (vote_status: 0 or 1, with audit fields)
        test_votes = []
        for idea_id in idea_ids:
            num_votes = random.randint(4, 10)
            vote_users = random.sample(comment_users, min(num_votes, len(comment_users)))
            vote_date = generate_random_date(start_date, end_date)
            for voter in vote_users:
                vote_status = random.choice([0, 1])
                test_votes.append({
                    "vote_status": vote_status,
                    "target_id": idea_id,
                    "target_type": "Idea",
                    "created_at": vote_date,
                    "creator_id": voter,
                    "creator_name": user_name_map.get(voter, voter),
                    "updated_at": vote_date,
                    "updater_id": voter,
                    "updater_name": user_name_map.get(voter, voter)
                })
            # Update total_votes for the idea
            total_votes = sum(v["vote_status"] for v in test_votes if v["target_id"] == idea_id)
            await db.ideas.update_one({"_id": idea_id}, {"$set": {"total_votes": total_votes}})
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