from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, status, Request
from jose import JWTError
from .config import get_settings
from .security import decode_oauth2_token
from services.user_service import user_service
from models.user import User

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
) -> str:
    """
    Get current user ID from token, requiring valid token
    """
    try:
        # Parse the JWT token
        payload = decode_oauth2_token(token)
        
        # User ID may be stored in different fields depending on the OAuth provider
        # sub is the standard field in JWT for user ID
        user_id: str = payload.get("sub") or payload.get("user_id") or payload.get("userid")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: user ID not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        return user_id
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )

# Role-based access control dependency
def has_role(required_role: str):
    async def role_checker(user_id: str = Depends(get_current_user_id)):
        # Get user roles from database
        user = await user_service.get_user_by_id(user_id)
        
        # Check if user exists and has required role
        if not user or (required_role not in user.roles and "ADMIN" not in user.roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role {required_role} required"
            )
        return User(
            user_id=user.user_id,
            roles=user.roles
        )
    return role_checker 