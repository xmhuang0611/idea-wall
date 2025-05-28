import os
from pathlib import Path
from jinja2 import Environment, FileSystemLoader, Template
from typing import Dict, Any, Optional
from models.notification import Notification
from models.user import User
from core.config import get_settings
import logging

logger = logging.getLogger(__name__)

class EmailTemplateService:
    def __init__(self):
        self.settings = get_settings()
        # Get the templates directory path
        self.templates_dir = Path(__file__).parent.parent / "templates" / "email"
        
        # Initialize Jinja2 environment
        self.env = Environment(
            loader=FileSystemLoader(str(self.templates_dir)),
            autoescape=True
        )
        
        # Ensure templates directory exists
        self.templates_dir.mkdir(parents=True, exist_ok=True)
        
    def render_notification_email_html(self, notification: Notification, user: User, **kwargs) -> str:
        """Render HTML email template for a notification"""
        try:
            template = self.env.get_template("notification.html")
            
            context = {
                "notification": notification,
                "user_name": user.user_name,
                "subject": self._generate_email_subject(notification),
                "app_url": kwargs.get("app_url", "http://localhost:4200"),
                "header_message": self._generate_header_message(notification),
                **kwargs
            }
            
            return template.render(**context)
            
        except Exception as e:
            logger.error(f"Error rendering HTML email template: {str(e)}")
            # Fallback to simple HTML
            return self._generate_fallback_html(notification, user)
    
    def render_notification_email_text(self, notification: Notification, user: User, **kwargs) -> str:
        """Render plain text email template for a notification"""
        try:
            template = self.env.get_template("notification.txt")
            
            context = {
                "notification": notification,
                "user_name": user.user_name,
                "app_url": kwargs.get("app_url", "http://localhost:4200"),
                **kwargs
            }
            
            return template.render(**context)
            
        except Exception as e:
            logger.error(f"Error rendering text email template: {str(e)}")
            # Fallback to simple text
            return self._generate_fallback_text(notification, user)
    
    def _generate_email_subject(self, notification: Notification) -> str:
        """Generate email subject for a notification"""
        subject_map = {
            "comment": "New comment on your idea - Idea Wall",
            "vote": "Someone liked your idea - Idea Wall", 
            "bookmark": "Someone bookmarked your idea - Idea Wall"
        }
        return subject_map.get(notification.type, "New notification - Idea Wall")
    
    def _generate_header_message(self, notification: Notification) -> str:
        """Generate header message for a notification"""
        message_map = {
            "comment": "Someone commented on your idea!",
            "vote": "Someone liked your idea!",
            "bookmark": "Someone bookmarked your idea!"
        }
        return message_map.get(notification.type, "You have a new notification!")
    
    def _generate_fallback_html(self, notification: Notification, user: User) -> str:
        """Generate fallback HTML when template loading fails"""
        notification_type = notification.type.title()
        
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Notification - Idea Wall</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #007bff;">Idea Wall</h1>
                <h2>Hello {user.user_name}!</h2>
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>{notification_type}</strong></p>
                    <p>{notification.content}</p>
                    <p><small>Time: {notification.created_at.strftime('%Y-%m-%d %H:%M')}</small></p>
                </div>
                <p><a href="http://localhost:4200" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View on Idea Wall</a></p>
            </div>
        </body>
        </html>
        """
    
    def _generate_fallback_text(self, notification: Notification, user: User) -> str:
        """Generate fallback text when template loading fails"""
        notification_type = notification.type.title()
        
        return f"""
Hello {user.user_name}!

You have a new {notification_type}:

{notification.content}

Time: {notification.created_at.strftime('%Y-%m-%d %H:%M')}

Visit Idea Wall: http://localhost:4200
"""

    def _get_base_html_template(self) -> str:
        """Get the base HTML template"""
        return """
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{{ subject }}</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f4f4f4;
                }
                .container {
                    background-color: white;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 0 10px rgba(0,0,0,0.1);
                }
                .header {
                    text-align: center;
                    border-bottom: 2px solid #007bff;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .header h1 {
                    color: #007bff;
                    margin: 0;
                    font-size: 28px;
                }
                .notification-content {
                    background-color: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                    border-left: 4px solid #007bff;
                }
                .notification-type {
                    font-weight: bold;
                    color: #007bff;
                    text-transform: uppercase;
                    font-size: 12px;
                    margin-bottom: 10px;
                }
                .notification-message {
                    font-size: 16px;
                    margin-bottom: 15px;
                }
                .notification-details {
                    font-size: 14px;
                    color: #666;
                }
                .action-button {
                    display: inline-block;
                    background-color: #007bff;
                    color: white;
                    padding: 12px 24px;
                    text-decoration: none;
                    border-radius: 5px;
                    margin: 20px 0;
                    font-weight: bold;
                }
                .action-button:hover {
                    background-color: #0056b3;
                }
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #eee;
                    color: #666;
                    font-size: 12px;
                }
                .unsubscribe {
                    color: #999;
                    font-size: 11px;
                    margin-top: 10px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Idea Wall</h1>
                </div>
                
                <div class="notification-content">
                    <div class="notification-type">{{ notification_type }}</div>
                    <div class="notification-message">{{ message }}</div>
                    <div class="notification-details">{{ details }}</div>
                </div>
                
                <div style="text-align: center;">
                    <a href="{{ app_url }}" class="action-button">View on Idea Wall</a>
                </div>
                
                <div class="footer">
                    <p>This is an automated notification from Idea Wall.</p>
                    <p class="unsubscribe">
                        You received this email because you have notifications enabled for your account.
                    </p>
                </div>
            </div>
        </body>
        </html>
        """

# Create a singleton instance
email_template_service = EmailTemplateService() 