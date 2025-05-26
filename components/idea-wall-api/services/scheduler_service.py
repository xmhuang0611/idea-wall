import asyncio
import schedule
import time
from datetime import datetime
from threading import Thread
from services.notification_digest_service import notification_digest_service
from core.config import get_settings
import logging

logger = logging.getLogger(__name__)

class SchedulerService:
    def __init__(self):
        self.settings = get_settings()
        self.running = False
        self.thread = None
    
    def start(self):
        """Start the scheduler in a separate thread"""
        if self.running:
            logger.warning("Scheduler is already running")
            return
            
        self.running = True
        
        # Schedule daily notification digest
        schedule.every().day.at(self.settings.notification_email_time).do(self._run_daily_digest)
        
        # Start scheduler thread
        self.thread = Thread(target=self._run_scheduler, daemon=True)
        self.thread.start()
        
        logger.info(f"Scheduler started. Daily notifications will be sent at {self.settings.notification_email_time}")
    
    def stop(self):
        """Stop the scheduler"""
        self.running = False
        if self.thread:
            self.thread.join()
        logger.info("Scheduler stopped")
    
    def _run_scheduler(self):
        """Run the scheduler loop"""
        while self.running:
            schedule.run_pending()
            time.sleep(60)  # Check every minute
    
    def _run_daily_digest(self):
        """Run the daily notification digest"""
        logger.info("Running daily notification digest")
        try:
            # Run the async function in a new event loop
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            results = loop.run_until_complete(notification_digest_service.send_daily_notification_digest())
            loop.close()
            logger.info(f"Daily digest completed: {results}")
        except Exception as e:
            logger.error(f"Error running daily digest: {str(e)}")

# Create a singleton instance
scheduler_service = SchedulerService() 