from typing import Optional, Union
from fastapi import Depends, HTTPException, status, Request
from jose import JWTError
from .config import get_settings
from .security import decode_oauth2_token
from services.user_service import user_service
from models.user import User, UserInDB

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
oauth2_implicit = OAuth2ImplicitBearer(auto_error=False)

async def get_current_user_optional(
    token: Optional[str] = Depends(oauth2_implicit)
) -> Optional[UserInDB]:
    """
    Get current user without requiring authentication
    """
    if not token:
        return None
        
    try:
        # Parse the JWT token
        payload = decode_oauth2_token(token)
        
        # User ID may be stored in different fields depending on the OAuth provider
        # sub is the standard field in JWT for user ID
        user_id: str = payload.get("sub") or payload.get("user_id") or payload.get("userid")
        if user_id is None:
            return None
            
        # Process OAuth user and return it
        return await user_service.process_oauth_user(user_id, payload)
    except JWTError:
        return None

async def get_current_user(
    current_user: Optional[UserInDB] = Depends(get_current_user_optional)
) -> UserInDB:
    """
    Get current user, requiring authentication
    """
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return current_user

async def get_current_active_user(
    current_user: UserInDB = Depends(get_current_user)
) -> User:
    """
    Get current active user
    """
    return User(
        user_id=current_user.user_id,
        roles=current_user.roles
    )

# Role-based access control dependency
def has_role(required_role: str):
    async def role_checker(current_user: User = Depends(get_current_active_user)):
        if required_role not in current_user.roles and "ADMIN" not in current_user.roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role {required_role} required"
            )
        return current_user
    return role_checker 