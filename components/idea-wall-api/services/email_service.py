import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional
from datetime import datetime, timedelta
from jinja2 import Template
from core.config import get_settings
from models.notification import Notification
from models.user import User
import logging

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.settings = get_settings()
        
    async def send_email(self, to_email: str, subject: str, html_content: str, text_content: Optional[str] = None) -> bool:
        """Send an email"""
        if not self.settings.enable_email_notifications:
            logger.info("Email notifications are disabled")
            return False
            
        if not self.settings.smtp_username or not self.settings.smtp_password:
            logger.error("SMTP credentials not configured")
            return False
            
        try:
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = f"{self.settings.email_from_name} <{self.settings.email_from}>"
            message["To"] = to_email
            
            # Add text and HTML parts
            if text_content:
                text_part = MIMEText(text_content, "plain")
                message.attach(text_part)
                
            html_part = MIMEText(html_content, "html")
            message.attach(html_part)
            
            # Create secure connection and send email
            context = ssl.create_default_context()
            with smtplib.SMTP(self.settings.smtp_server, self.settings.smtp_port) as server:
                server.starttls(context=context)
                server.login(self.settings.smtp_username, self.settings.smtp_password)
                server.sendmail(self.settings.email_from, to_email, message.as_string())
                
            logger.info(f"Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False
    
    def generate_notification_email_html(self, user: User, notifications: List[Notification]) -> str:
        """Generate HTML content for notification email"""
        template_str = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Your Daily Notifications - Idea Wall</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #007bff; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background-color: #f8f9fa; padding: 20px; }
                .notification { background-color: white; margin: 10px 0; padding: 15px; border-radius: 5px; border-left: 4px solid #007bff; }
                .notification.comment { border-left-color: #28a745; }
                .notification.vote { border-left-color: #ffc107; }
                .notification-type { font-weight: bold; color: #007bff; font-size: 12px; text-transform: uppercase; }
                .notification-content { margin: 5px 0; }
                .notification-time { color: #6c757d; font-size: 12px; }
                .footer { background-color: #e9ecef; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; }
                .unsubscribe { color: #6c757d; font-size: 12px; }
                .btn { display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>💡 Idea Wall</h1>
                    <p>Your Daily Notifications</p>
                </div>
                
                <div class="content">
                    <h2>Hello {{ user_name }}!</h2>
                    <p>You have {{ notification_count }} unread notification{{ 's' if notification_count != 1 else '' }} from the past day:</p>
                    
                    {% for notification in notifications %}
                    <div class="notification {{ notification.type }}">
                        <div class="notification-type">{{ notification.type.title() }}</div>
                        <div class="notification-content">{{ notification.content }}</div>
                        <div class="notification-time">{{ notification.created_at.strftime('%Y-%m-%d %H:%M') }}</div>
                    </div>
                    {% endfor %}
                    
                    <div style="text-align: center; margin: 20px 0;">
                        <a href="{{ app_url }}" class="btn">View All Notifications</a>
                    </div>
                </div>
                
                <div class="footer">
                    <p class="unsubscribe">
                        You're receiving this email because you have unread notifications on Idea Wall.<br>
                        To manage your notification preferences, please visit your account settings.
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        template = Template(template_str)
        return template.render(
            user_name=user.user_name,
            notifications=notifications,
            notification_count=len(notifications),
            app_url="http://localhost:4200"  # You can make this configurable
        )
    
    def generate_notification_email_text(self, user: User, notifications: List[Notification]) -> str:
        """Generate plain text content for notification email"""
        text_content = f"""
Hello {user.user_name}!

You have {len(notifications)} unread notification{'s' if len(notifications) != 1 else ''} from the past day:

"""
        for notification in notifications:
            text_content += f"""
- {notification.type.title()}: {notification.content}
  Time: {notification.created_at.strftime('%Y-%m-%d %H:%M')}

"""
        
        text_content += """
Visit Idea Wall to view all your notifications: http://localhost:4200

---
You're receiving this email because you have unread notifications on Idea Wall.
To manage your notification preferences, please visit your account settings.
"""
        return text_content

# Create a singleton instance
email_service = EmailService() 