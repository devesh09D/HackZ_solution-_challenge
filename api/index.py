"""
Vercel Serverless Entry Point.
Wraps the FastAPI app from backend/ for Vercel's Python runtime.
"""
import sys
import os

# Add the backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

from main import app

# Initialize the data store and ML model on cold start
try:
    from services.firebase_service import init_store
    from ml.prediction_model import load_model
    init_store()
    load_model()
except Exception as e:
    print(f"Warning: Initialization error (non-fatal): {e}")
