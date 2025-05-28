from pydantic_settings import BaseSettings
from functools import lru_cache
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    app_name: str = "Idea Wall API"
    # mongodb_url: str = os.getenv("MONGODB_URL", "mongodb+srv://idea-wall:Ur9idQTkrRl8yLac@idea-wall.1wvgtc4.mongodb.net/?retryWrites=true&w=majority&appName=idea-wall")
    mongodb_url: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    database_name: str = os.getenv("DATABASE_NAME", "idea-wall")
    
    # Email settings - Updated for better QQ mail compatibility
    smtp_server: str = os.getenv("SMTP_SERVER", "smtp.qq.com")
    smtp_port: int = int(os.getenv("SMTP_PORT", "465"))
    smtp_username: str = os.getenv("SMTP_USERNAME", "785654593@qq.com")
    smtp_password: str = os.getenv("SMTP_PASSWORD", "")
    email_from: str = os.getenv("EMAIL_FROM", "idea-wall@qq.com")
    email_from_name: str = os.getenv("EMAIL_FROM_NAME", "Idea Wall")
    
    # Email notification settings
    enable_email_notifications: bool = os.getenv("ENABLE_EMAIL_NOTIFICATIONS", "false").lower() == "true"

@lru_cache()
def get_settings() -> Settings:
    return Settings() 