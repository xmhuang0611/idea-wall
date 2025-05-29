import smtplib
import ssl
import traceback
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, Dict, Any
from core.config import get_settings
import logging
import socket

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.settings = get_settings()
        
    async def send_email(self, to_email: str, subject: str, html_content: str, text_content: Optional[str] = None) -> bool:
        """Send an email with improved error handling for mail"""
        
        # Log email attempt
        logger.info(f"Attempting to send email to: {to_email}")
        logger.info(f"Email subject: {subject}")
        
        # Check if email notifications are enabled
        if not self.settings.enable_email_notifications:
            logger.warning("Email notifications are disabled in settings")
            return False
        
        # Validate email configuration
        validation_result = self._validate_email_config()
        if not validation_result["valid"]:
            logger.error(f"Email configuration validation failed: {validation_result['error']}")
            return False
        
        # Validate email address format
        if not self._is_valid_email(to_email):
            logger.error(f"Invalid email address format: {to_email}")
            return False
        
        try:
            # Create message
            logger.info("Creating email message...")
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = f"{self.settings.email_from_name} <{self.settings.email_from}>"
            message["To"] = to_email
            
            # Add text and HTML parts
            if text_content:
                logger.info("Adding text content to email")
                text_part = MIMEText(text_content, "plain", "utf-8")
                message.attach(text_part)
                
            logger.info("Adding HTML content to email")
            html_part = MIMEText(html_content, "html", "utf-8")
            message.attach(html_part)
            
            # Test network connectivity first
            logger.info(f"Testing network connectivity to {self.settings.smtp_server}:{self.settings.smtp_port}")
            if not self._test_network_connectivity():
                logger.error("Network connectivity test failed")
                return False
            
            # Create secure connection and send email
            logger.info(f"Connecting to SMTP server: {self.settings.smtp_server}:{self.settings.smtp_port}")
            
            # Use SSL connection for port 465 (mail preferred method)
            if self.settings.smtp_port == 465:
                logger.info("Using SSL connection (port 465)")
                return await self._send_with_ssl_safe(message, to_email)
            else:
                # STARTTLS connection for port 587 or 25
                logger.info(f"Using STARTTLS connection (port {self.settings.smtp_port})")
                return await self._send_with_starttls_safe(message, to_email)
                    
        except Exception as e:
            logger.error(f"Unexpected error in email service: {str(e)}")
            return False
    
    async def _send_with_ssl_safe(self, message, to_email: str) -> bool:
        """Send email using SSL connection with mail specific error handling"""
        server = None
        email_sent = False
        
        try:
            context = ssl.create_default_context()
            server = smtplib.SMTP_SSL(self.settings.smtp_server, self.settings.smtp_port, context=context, timeout=30)
            
            # Disable debug output
            server.set_debuglevel(0)
            
            logger.info("Authenticating with SMTP server")
            server.login(self.settings.smtp_username, self.settings.smtp_key)
            
            logger.info(f"Sending email from {self.settings.email_from} to {to_email}")
            server.sendmail(self.settings.email_from, to_email, message.as_string())
            
            # Mark email as sent successfully
            email_sent = True
            logger.info(f"Email sent successfully to {to_email}")
            
            return True
            
        except smtplib.SMTPAuthenticationError as e:
            logger.error(f"SMTP Authentication failed: {str(e)}")
            logger.error("For mail, make sure you're using the authorization code, not your login password")
            return False
            
        except smtplib.SMTPRecipientsRefused as e:
            logger.error(f"SMTP Recipients refused: {str(e)}")
            return False
            
        except smtplib.SMTPSenderRefused as e:
            logger.error(f"SMTP Sender refused: {str(e)}")
            return False
            
        except smtplib.SMTPDataError as e:
            logger.error(f"SMTP Data error: {str(e)}")
            return False
            
        except smtplib.SMTPConnectError as e:
            logger.error(f"SMTP Connection error: {str(e)}")
            return False
            
        except smtplib.SMTPServerDisconnected as e:
            if email_sent:
                logger.warning(f"Email sent successfully, but server disconnected during cleanup: {str(e)}")
                return True
            logger.error(f"SMTP Server disconnected: {str(e)}")
            return False
            
        except smtplib.SMTPResponseException as e:
            # This is the specific error we're seeing with mail
            if email_sent and e.smtp_code == -1:
                logger.warning(f"Email sent successfully, but mail server returned connection close error (this is normal): {str(e)}")
                return True
            logger.error(f"SMTP Response Exception: {str(e)}")
            return False
            
        except ssl.SSLError as e:
            logger.error(f"SSL Error: {str(e)}")
            return False
            
        except socket.timeout as e:
            logger.error(f"Connection timeout: {str(e)}")
            return False
            
        except Exception as e:
            if email_sent:
                logger.warning(f"Email sent successfully, but error during cleanup: {str(e)}")
                return True
            logger.error(f"Error in SSL email sending: {str(e)}")
            return False
            
        finally:
            # Safely close the connection
            if server:
                try:
                    # Try to quit gracefully first
                    server.quit()
                except Exception as quit_error:
                    # mail often fails here, but email was already sent
                    if email_sent:
                        logger.debug(f"Expected mail quit error (email was sent successfully): {quit_error}")
                    else:
                        logger.warning(f"Error during SMTP quit: {quit_error}")
                    
                    # Force close the connection
                    try:
                        server.close()
                    except Exception:
                        pass  # Ignore close errors
    
    async def _send_with_starttls_safe(self, message, to_email: str) -> bool:
        """Send email using STARTTLS connection with mail specific error handling"""
        server = None
        email_sent = False
        
        try:
            server = smtplib.SMTP(self.settings.smtp_server, self.settings.smtp_port, timeout=30)
            
            # Disable debug output
            server.set_debuglevel(0)
            
            logger.info("Starting TLS...")
            context = ssl.create_default_context()
            server.starttls(context=context)
            
            logger.info("Authenticating with SMTP server")
            server.login(self.settings.smtp_username, self.settings.smtp_key)
            
            logger.info(f"Sending email from {self.settings.email_from} to {to_email}")
            server.sendmail(self.settings.email_from, to_email, message.as_string())
            
            # Mark email as sent successfully
            email_sent = True
            logger.info(f"Email sent successfully to {to_email}")
            
            return True
            
        except smtplib.SMTPAuthenticationError as e:
            logger.error(f"SMTP Authentication failed: {str(e)}")
            return False
            
        except smtplib.SMTPRecipientsRefused as e:
            logger.error(f"SMTP Recipients refused: {str(e)}")
            return False
            
        except smtplib.SMTPSenderRefused as e:
            logger.error(f"SMTP Sender refused: {str(e)}")
            return False
            
        except smtplib.SMTPDataError as e:
            logger.error(f"SMTP Data error: {str(e)}")
            return False
            
        except smtplib.SMTPConnectError as e:
            logger.error(f"SMTP Connection error: {str(e)}")
            return False
            
        except smtplib.SMTPServerDisconnected as e:
            if email_sent:
                logger.warning(f"Email sent successfully, but server disconnected during cleanup: {str(e)}")
                return True
            logger.error(f"SMTP Server disconnected: {str(e)}")
            return False
            
        except smtplib.SMTPResponseException as e:
            if email_sent and e.smtp_code == -1:
                logger.warning(f"Email sent successfully, but mail server returned connection close error (this is normal): {str(e)}")
                return True
            logger.error(f"SMTP Response Exception: {str(e)}")
            return False
            
        except ssl.SSLError as e:
            logger.error(f"SSL Error: {str(e)}")
            return False
            
        except socket.timeout as e:
            logger.error(f"Connection timeout: {str(e)}")
            return False
            
        except Exception as e:
            if email_sent:
                logger.warning(f"Email sent successfully, but error during cleanup: {str(e)}")
                return True
            logger.error(f"Error in STARTTLS email sending: {str(e)}")
            return False
            
        finally:
            # Safely close the connection
            if server:
                try:
                    server.quit()
                except Exception as quit_error:
                    if email_sent:
                        logger.debug(f"Expected mail quit error (email was sent successfully): {quit_error}")
                    else:
                        logger.warning(f"Error during SMTP quit: {quit_error}")
                    
                    try:
                        server.close()
                    except Exception:
                        pass
    
    def _test_network_connectivity(self) -> bool:
        """Test basic network connectivity to SMTP server"""
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(10)
            result = sock.connect_ex((self.settings.smtp_server, self.settings.smtp_port))
            sock.close()
            
            if result == 0:
                logger.info("Network connectivity test passed")
                return True
            else:
                logger.error(f"Network connectivity test failed: {result}")
                return False
                
        except Exception as e:
            logger.error(f"Network connectivity test error: {str(e)}")
            return False
    
    def _validate_email_config(self) -> Dict[str, Any]:
        """Validate email configuration"""
        if not self.settings.smtp_username:
            return {"valid": False, "error": "SMTP_USERNAME not configured"}
        
        if not self.settings.smtp_key:
            return {"valid": False, "error": "SMTP_KEY not configured"}
        
        if not self.settings.smtp_server:
            return {"valid": False, "error": "SMTP_SERVER not configured"}
        
        if not self.settings.smtp_port:
            return {"valid": False, "error": "SMTP_PORT not configured"}
        
        if not self.settings.email_from:
            return {"valid": False, "error": "EMAIL_FROM not configured"}
        
        return {"valid": True, "error": None}
    
    def _is_valid_email(self, email: str) -> bool:
        """Basic email validation"""
        import re
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    async def test_email_connection(self) -> Dict[str, Any]:
        """Test email connection and configuration"""
        logger.info("Testing email connection...")
        
        # Validate configuration
        validation_result = self._validate_email_config()
        if not validation_result["valid"]:
            return {
                "success": False,
                "error": f"Configuration error: {validation_result['error']}",
                "details": self._get_config_details()
            }
        
        # Test network connectivity first
        if not self._test_network_connectivity():
            return {
                "success": False,
                "error": "Network connectivity test failed",
                "details": self._get_config_details()
            }
        
        # Try SSL connection test
        try:
            logger.info("Testing SSL connection...")
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(self.settings.smtp_server, 465, context=context, timeout=30) as server:
                server.login(self.settings.smtp_username, self.settings.smtp_key)
                
                logger.info("Email connection test successful using SSL")
                return {
                    "success": True,
                    "message": "Email connection test successful using SSL",
                    "method": "SSL (port 465)",
                    "details": self._get_config_details()
                }
                        
        except Exception as e:
            logger.warning(f"SSL connection test failed: {str(e)}")
            return {
                "success": False,
                "error": f"Connection test failed: {str(e)}",
                "details": self._get_config_details()
            }
    
    def _get_config_details(self) -> Dict[str, Any]:
        """Get email configuration details (without sensitive info)"""
        return {
            "smtp_server": self.settings.smtp_server,
            "smtp_port": self.settings.smtp_port,
            "smtp_username": self.settings.smtp_username,
            "email_from": self.settings.email_from,
            "email_from_name": self.settings.email_from_name,
            "enable_email_notifications": self.settings.enable_email_notifications,
            "smtp_key_configured": bool(self.settings.smtp_key)
        }

# Create a singleton instance
email_service = EmailService() 