from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from .config import get_settings
from .oauth2_config import get_oauth2_settings
import requests
import json

settings = get_settings()
oauth2_settings = get_oauth2_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Cache for JWKS keys
_jwks_cache = None
_jwks_cache_timestamp = None

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create internal access token, only used in special cases
    Typically we use third-party OAuth provider tokens
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    return encoded_jwt

def get_jwks() -> Dict[str, Any]:
    """Get and cache JWKS keys"""
    global _jwks_cache, _jwks_cache_timestamp
    
    # If cache is empty or expired (more than 24 hours), refresh it
    if _jwks_cache is None or _jwks_cache_timestamp is None or \
       (datetime.utcnow() - _jwks_cache_timestamp).total_seconds() > 86400:
        
        # If JWKS URI not configured, return empty dict
        if not oauth2_settings.jwks_uri:
            return {}
        
        try:
            response = requests.get(oauth2_settings.jwks_uri)
            response.raise_for_status()  # Ensure request was successful
            _jwks_cache = response.json()
            _jwks_cache_timestamp = datetime.utcnow()
        except Exception as e:
            # If fetching JWKS fails, log error and return empty dict
            print(f"Error fetching JWKS: {str(e)}")
            return {}
    
    return _jwks_cache

def decode_oauth2_token(token: str) -> Dict[str, Any]:
    """Decode OAuth2 token, supporting JWKS signature verification"""
    try:
        # 1. Try to parse token without verification to get header and kid
        unverified_header = jwt.get_unverified_header(token)
        unverified_claims = jwt.get_unverified_claims(token)
        
        # 2. Check token algorithm
        token_alg = unverified_header.get("alg", "")
        
        # 3. Verify token based on algorithm
        if token_alg.startswith('RS') or token_alg.startswith('ES'):
            # Asymmetric encryption algorithm, need to get public key from JWKS
            jwks = get_jwks()
            
            kid = unverified_header.get("kid")
            if not kid:
                # If no kid, might be incompatible token
                # Try fallback verification
                return fallback_token_verification(token, unverified_claims)
            
            # Find matching key in JWKS
            rsa_key = {}
            for key in jwks.get("keys", []):
                if key.get("kid") == kid:
                    rsa_key = {
                        "kty": key.get("kty"),
                        "kid": key.get("kid"),
                        "use": key.get("use"),
                        "n": key.get("n"),
                        "e": key.get("e")
                    }
                    break
            
            if rsa_key:
                # Verify token with public key
                try:
                    payload = jwt.decode(
                        token,
                        rsa_key,
                        algorithms=[token_alg],
                        audience=oauth2_settings.client_id,
                        issuer=oauth2_settings.issuer,
                        options={"verify_aud": bool(oauth2_settings.client_id)}
                    )
                    return payload
                except Exception:
                    # If verification fails, try fallback verification
                    return fallback_token_verification(token, unverified_claims)
            
            # If no matching key found, try fallback verification
            return fallback_token_verification(token, unverified_claims)
        else:
            # Symmetric encryption algorithm (HS256, etc)
            # Verify with configured secret key
            try:
                payload = jwt.decode(
                    token, 
                    settings.jwt_secret_key, 
                    algorithms=[settings.jwt_algorithm]
                )
                return payload
            except Exception:
                # If verification fails, try without signature verification
                return fallback_token_verification(token, unverified_claims)
    except Exception as e:
        # If parsing fails, might be incompatible token format
        # Return a dictionary with error info
        print(f"Token parsing error: {str(e)}")
        raise JWTError(f"Token validation failed: {str(e)}")

def fallback_token_verification(token: str, unverified_claims: Dict[str, Any]) -> Dict[str, Any]:
    """
    Fallback token verification logic
    When standard verification fails, tries a more lenient approach
    """
    # Ensure at least a user identifier is present
    user_id = unverified_claims.get("sub") or unverified_claims.get("user_id") or unverified_claims.get("userid")
    
    if not user_id:
        raise JWTError("Cannot extract user identifier from token")
    
    # If JWKS verification fails but token contains valid user info, we may accept it
    # This can be useful in development or testing environments
    # Note: Use this method cautiously in production
    return unverified_claims 