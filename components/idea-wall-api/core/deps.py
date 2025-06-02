from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, status, Request
from jose import JWTError
from .config import get_settings
from .security import decode_oauth2_token
from services.user_service import user_service
from models.user import User, UserRole

settings = get_settings()

# Custom OAuth2Bearer for handling Bearer tokens in Authorization header
class OAuth2ImplicitBearer:
    def __init__(self, auto_error: bool = True):
        self.auto_error = auto_error
        
    async def __call__(self, request: Request) -> Optional[str]:
        authorization: str = request.headers.get("Authorization")
        if not authorization:
            if self.auto_error:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Not authenticated",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            return None
            
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            if self.auto_error:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid authentication scheme",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            return None
        return token

# For Implicit flow
oauth2_implicit = OAuth2ImplicitBearer(auto_error=True)

async def get_current_user(
    token: str = Depends(oauth2_implicit)
) -> User:
    """
    Get current user ID and name  from token, requiring valid token
    """
    try:
        # Parse the JWT token
        payload = decode_oauth2_token(token)
        
        # User ID may be stored in different fields depending on the OAuth provider
        # sub is the standard field in JWT for user ID
        user_id: str = payload.get("sub") or payload.get("user_id") or payload.get("userid")
        user_name: str = payload.get("name") or payload.get("username") or payload.get("user_name")
            
        return User(user_id=user_id.lower(), user_name=user_name)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )

# WebSocket authentication
async def get_current_user_websocket(token: str = None) -> Optional[User]:
    """
    Get current user from token for WebSocket connections
    """
    if not token:
        return None
        
    try:
        # Parse the JWT token
        payload = decode_oauth2_token(token)
        
        # User ID may be stored in different fields depending on the OAuth provider
        user_id: str = payload.get("sub") or payload.get("user_id") or payload.get("userid")
        user_name: str = payload.get("name") or payload.get("username") or payload.get("user_name")
            
        return User(user_id=user_id.lower(), user_name=user_name)
    except JWTError:
        return None

# Optional authentication dependency
class OptionalOAuth2ImplicitBearer:
    async def __call__(self, request: Request) -> Optional[str]:
        authorization: str = request.headers.get("Authorization")
        if not authorization:
            return None
            
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            return None
        return token

oauth2_implicit_optional = OptionalOAuth2ImplicitBearer()

async def get_current_user_optional(
    token: str = Depends(oauth2_implicit_optional)
) -> Optional[User]:
    """
    Get current user from token if available, returns None if no valid token
    """
    if not token:
        return None
        
    try:
        # Parse the JWT token
        payload = decode_oauth2_token(token)
        
        # User ID may be stored in different fields depending on the OAuth provider
        user_id: str = payload.get("sub") or payload.get("user_id") or payload.get("userid")
        user_name: str = payload.get("name") or payload.get("username") or payload.get("user_name")
            
        return User(user_id=user_id.lower(), user_name=user_name)
    except JWTError:
        return None

# Role-based access control dependency
def user_has_role(required_role: UserRole):
    async def role_checker(user_info: User = Depends(get_current_user)):
        # Get user roles from database
        user = await user_service.get_user(user_info.user_id)
        
        # Check if user exists and has required role
        if not user or (required_role not in user.roles and "ADMIN" not in user.roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role {required_role} required"
            )
        return user
    return role_checker 