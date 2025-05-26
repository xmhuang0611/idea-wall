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
    
    # Email settings
    smtp_server: str = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port: int = int(os.getenv("SMTP_PORT", "587"))
    smtp_username: str = os.getenv("SMTP_USERNAME", "")
    smtp_password: str = os.getenv("SMTP_PASSWORD", "")
    email_from: str = os.getenv("EMAIL_FROM", "noreply@ideawall.com")
    email_from_name: str = os.getenv("EMAIL_FROM_NAME", "Idea Wall")
    
    # Email notification settings
    enable_email_notifications: bool = os.getenv("ENABLE_EMAIL_NOTIFICATIONS", "false").lower() == "true"
    notification_email_time: str = os.getenv("NOTIFICATION_EMAIL_TIME", "09:00")  # Daily send time

@lru_cache()
def get_settings() -> Settings:
    return Settings() 