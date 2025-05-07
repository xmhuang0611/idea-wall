from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi
from core.database import connect_to_mongo, close_mongo_connection
from core.oauth2_config import get_oauth2_settings
from routers import ideas, comments, votes, tags

oauth2_settings = get_oauth2_settings()

app = FastAPI(
    title="Idea Wall API",
    swagger_ui_init_oauth={
        "clientId": oauth2_settings.client_id,
        "usePkceWithAuthorizationCodeGrant": False
    }
)

# Custom OpenAPI documentation to support OAuth2 Implicit flow
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title="Idea Wall API",
        version="1.0.0",
        description="Idea Wall API with OAuth2 Implicit Flow support",
        routes=app.routes,
    )
    
    # Add OAuth2 Implicit flow
    openapi_schema["components"] = openapi_schema.get("components", {})
    openapi_schema["components"]["securitySchemes"] = {
        "oauth2": {
            "type": "oauth2",
            "flows": {
                "implicit": {
                    "authorizationUrl": oauth2_settings.auth_url,
                }
            }
        }
    }
    
    # Set global security configuration
    openapi_schema["security"] = [{"oauth2": ["read", "write"]}]
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

# Event handlers
@app.on_event("startup")
async def startup_event():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_event():
    await close_mongo_connection()

# Include routers
app.include_router(ideas.router, prefix="/api/ideas", tags=["ideas"])
app.include_router(comments.router, prefix="/api/comments", tags=["comments"])
app.include_router(votes.router, prefix="/api/votes", tags=["votes"])
app.include_router(tags.router, prefix="/api/tags", tags=["tags"])

@app.get("/")
async def root():
    return {"message": "Welcome to Idea Wall API"} 