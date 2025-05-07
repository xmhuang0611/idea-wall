from pydantic_settings import BaseSettings
from functools import lru_cache
import os
from dotenv import load_dotenv

load_dotenv()

class OAuth2Settings(BaseSettings):
    client_id: str = os.getenv("OAUTH2_CLIENT_ID", "")
    auth_url: str = os.getenv("OAUTH2_AUTH_URL", "")
    token_url: str = os.getenv("OAUTH2_TOKEN_URL", "")
    redirect_uri: str = os.getenv("OAUTH2_REDIRECT_URI", "")
    scope: str = os.getenv("OAUTH2_SCOPE", "read")
    jwks_uri: str = os.getenv("OAUTH2_JWKS_URI", "")
    issuer: str = os.getenv("OAUTH2_ISSUER", "")
    algorithm: str = os.getenv("OAUTH2_ALGORITHM", "RS256")

@lru_cache()
def get_oauth2_settings() -> OAuth2Settings:
    return OAuth2Settings() 