"""
AI Health Care Platform - 2026 Edition
Simplified with new Gemini SDK
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import sys
from datetime import datetime

from config.settings import GEMINI_API_KEY, LOG_LEVEL, LOG_FILE, APP_NAME, APP_VERSION, allow_origin
from database.connection import db, create_indexes, close_connection
from services.gemini_service import initialize_gemini
from services.ml_service import load_models, are_models_loaded

# Import ALL routers
from routes.gemini import router as gemini_router
from routes.auth import router as auth_router
from routes.prediction import router as prediction_router
from routes.profile import router as profile_router              
from routes.appointments import router as appointments_router    
from routes.predictions_history import router as history_router  
from routes.files import router as files_router                  
from routes.contact import router as contact_router              
from routes.dashboard import router as dashboard_router          

#  FIX: UTF-8 Logging Handler for Windows
class UTF8StreamHandler(logging.StreamHandler):
    """Custom handler to ensure UTF-8 encoding on Windows"""
    def __init__(self):
        super().__init__()
        if sys.platform == 'win32':
            self.stream = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1, closefd=False)

# Logging with UTF-8 support
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        UTF8StreamHandler(),
        logging.FileHandler(LOG_FILE, encoding='utf-8')
    ]
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown"""
    logger.info(f"[START] {APP_NAME} v{APP_VERSION}")
    
    # Initialize Gemini with new 2026 SDK
    if initialize_gemini(GEMINI_API_KEY):
        logger.info("[OK] Gemini initialized (google-genai)")
    else:
        logger.warning("[WARN] Gemini disabled")
    
    # Load ML models
    await load_models()
    
    # Create database indexes
    await create_indexes()
    
    logger.info("[READY] Application started successfully")
    
    yield
    
    logger.info("[SHUTDOWN] Closing application")
    close_connection()


app = FastAPI(
    title=APP_NAME,
    description="Healthcare platform with Gemini 2026 SDK and complete API",
    version=APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        *allow_origin
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include ALL routers
app.include_router(auth_router)                 # Authentication
app.include_router(gemini_router)               # Gemini AI
app.include_router(prediction_router)           # Disease predictions
app.include_router(profile_router)              # User profile
app.include_router(appointments_router)         #  Appointments
app.include_router(history_router)              # Prediction history
app.include_router(files_router)                #  File uploads
app.include_router(contact_router)              #  Contact form
app.include_router(dashboard_router)            #  Health dashboard


@app.get("/", tags=["General"])
async def home():
    """API Home - Welcome endpoint"""
    return {
        "success": True,
        "message": f"Welcome to {APP_NAME}",
        "data": {
            "version": APP_VERSION,
            "sdk": "google-genai (2026)",
            "model": "gemini-2.0-flash",
            "status": "running",
            "endpoints": {
                "docs": "/docs",
                "health": "/health",
                "auth": "/auth/*",
                "gemini": "/gemini/*",
                "predictions": "/predict/*",
                "profile": "/profile",
                "appointments": "/appointments",
                "history": "/predictions/history",
                "files": "/files",
                "contact": "/contact",
                "dashboard": "/health/dashboard"
            }
        }
    }


@app.get("/health", tags=["General"])
async def health_check():
    """Health check endpoint"""
    try:
        await db.store.find_one({})
        from services.gemini_service import is_gemini_available
        
        return {
            "success": True,
            "message": "Service is healthy",
            "data": {
                "database": "connected",
                "ml_models": "loaded" if are_models_loaded() else "not loaded",
                "gemini": "enabled" if is_gemini_available() else "disabled",
                "timestamp": datetime.utcnow().isoformat(),
                "routes_loaded": len(app.routes)
            }
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail="Service unhealthy")


if __name__ == "__main__":
    import uvicorn
    import os
    
    port = int(os.getenv("PORT", 8000))
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        log_level="info"
    )



