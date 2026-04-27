"""
SevAI - FastAPI Backend Main Application.
Entry point: uvicorn main:app --reload
"""
import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv

load_dotenv()

from routes import voice, tasks, volunteers, predictions
from services.firebase_service import init_store
from ml.prediction_model import load_model

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

# ── FastAPI App ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="SevAI API",
    description="AI-Powered Volunteer Coordination Platform — Convert voice field reports into live task assignments.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — allow React dev server and production origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:4173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(voice.router, prefix="/api", tags=["Voice Input"])
app.include_router(tasks.router, prefix="/api", tags=["Tasks"])
app.include_router(volunteers.router, prefix="/api", tags=["Volunteers"])
app.include_router(predictions.router, prefix="/api", tags=["Predictions"])


# ── Lifecycle ─────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    """Initialize data store with mock data and train the prediction model."""
    logger.info("🚀 Starting SevAI API server...")
    init_store()
    load_model()
    logger.info("✅ SevAI API ready at http://localhost:8000")


# ── Health endpoints ──────────────────────────────────────────────────────────
@app.get("/", summary="Root")
async def root():
    return {"message": "SevAI API v1.0.0", "status": "running", "docs": "/docs"}


@app.get("/health", summary="Health Check")
async def health_check():
    return {"status": "healthy", "service": "SevAI API"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
