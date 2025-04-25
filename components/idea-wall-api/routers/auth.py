from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.responses import RedirectResponse, JSONResponse
from core.security import create_access_token
from core.config import get_settings
from core.oauth2_config import get_oauth2_settings
from core.deps import get_current_user_optional
from models.user import User, UserInDB

router = APIRouter()
settings = get_settings()
oauth2_settings = get_oauth2_settings()

@router.get("/authorize")
async def authorize(
    response_type: str,
    client_id: str,
    redirect_uri: str,
    state: str = None,
    scope: str = "read",
):
    """
    OAuth2 authorization endpoint, redirects to third-party OAuth provider for login
    """
    # Validate client_id
    if client_id != oauth2_settings.client_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid client_id"
        )
    
    # Validate response_type
    if response_type != "token":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only token response type is supported"
        )
    
    # Redirect to third-party OAuth provider's authorization page
    auth_url = oauth2_settings.auth_url
    
    if not auth_url:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="OAuth2 authorization URL not configured"
        )
    
    query_params = {
        "response_type": response_type,
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "scope": scope
    }
    
    if state:
        query_params["state"] = state
    
    # Build query parameter string
    query_string = "&".join([f"{k}={v}" for k, v in query_params.items()])
    
    # Redirect to third-party OAuth provider
    return RedirectResponse(
        url=f"{auth_url}?{query_string}",
        status_code=303
    )

@router.get("/callback")
async def oauth_callback(
    code: str = None,
    state: str = None,
    error: str = None,
    access_token: str = None
):
    """
    OAuth2 callback endpoint, for token exchange processing if needed
    In implicit flow, this endpoint is typically not used as token is returned directly to frontend
    Kept for future support of authorization_code flow
    """
    if error:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": error}
        )
    
    # In implicit flow, we don't receive code, but access_token directly in frontend
    # This callback method is mainly for logging or other requirements
    
    return JSONResponse(
        content={"message": "Authentication successful"}
    )

@router.get("/me")
async def get_current_user_info(current_user: User = Depends(get_current_user_optional)):
    """
    Get current logged in user information
    """
    if not current_user:
        return JSONResponse(content={"authenticated": False})
    
    return {
        "authenticated": True,
        "user": {
            "user_id": current_user.user_id,
            "roles": current_user.roles
        }
    } 