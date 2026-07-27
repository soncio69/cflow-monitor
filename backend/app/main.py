from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.db.database import init_db
from app.api import servers, monitoring, settings, auth
from app.scheduler.scheduler import start_scheduler, stop_scheduler

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="C-Flow Monitoring API",
    description="Backend API for C-Flow server monitoring",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(servers.router)
app.include_router(monitoring.router)
app.include_router(settings.router)


@app.on_event("startup")
async def startup_event():
    """Initialize database and start scheduler on startup"""
    logger.info("Starting C-Flow Monitoring API...")
    init_db()
    logger.info("Database initialized")
    start_scheduler()
    logger.info("Application started successfully")


@app.on_event("shutdown")
async def shutdown_event():
    """Stop scheduler on shutdown"""
    logger.info("Shutting down C-Flow Monitoring API...")
    stop_scheduler()
    logger.info("Application shutdown complete")


@app.get("/")
def root():
    """Root endpoint"""
    return {"message": "C-Flow Monitoring API", "status": "running"}


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}
