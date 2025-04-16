from fastapi import FastAPI
from core.database import connect_to_mongo, close_mongo_connection
from routers import users, ideas, comments, votes, tags, auth

app = FastAPI(title="Idea Wall API")

# Event handlers
@app.on_event("startup")
async def startup_event():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_event():
    await close_mongo_connection()

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(ideas.router, prefix="/api/ideas", tags=["ideas"])
app.include_router(comments.router, prefix="/api/ideas/{idea_id}/comments", tags=["comments"])
app.include_router(votes.router, prefix="/api/votes", tags=["votes"])
app.include_router(tags.router, prefix="/api/tags", tags=["tags"])

@app.get("/")
async def root():
    return {"message": "Welcome to Idea Wall API"} 