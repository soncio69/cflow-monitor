from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy.orm import Session
from app.core.config import get_settings
from app.db.database import SessionLocal
from app.services.monitoring_service import MonitoringService
import logging

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()


def run_monitoring_job():
    """Job function that runs the monitoring check"""
    db = SessionLocal()
    try:
        logger.info("Starting scheduled monitoring check...")
        service = MonitoringService(db)
        service.check_all_servers()
        logger.info("Scheduled monitoring check completed")
    except Exception as e:
        logger.error(f"Error in scheduled monitoring: {e}")
    finally:
        db.close()


def start_scheduler():
    """Initialize and start the scheduler"""
    settings = get_settings()

    # Add the monitoring job
    scheduler.add_job(
        run_monitoring_job,
        trigger=IntervalTrigger(seconds=settings.check_interval_seconds),
        id='monitoring_job',
        name='Monitor all servers',
        replace_existing=True
    )

    scheduler.start()
    logger.info(f"Scheduler started with interval: {settings.check_interval_seconds} seconds")

    # Run initial check
    run_monitoring_job()


def stop_scheduler():
    """Stop the scheduler"""
    scheduler.shutdown()
    logger.info("Scheduler stopped")
