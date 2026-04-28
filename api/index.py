"""
Vercel Serverless Entry Point.
Wraps the FastAPI app from backend/ for Vercel's @vercel/python runtime.
"""
import sys
import os

# Add the backend directory to the Python path so imports work
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

from main import app

# Initialize the data store and ML model on cold start
from services.firebase_service import init_store
from ml.prediction_model import load_model

init_store()
load_model()
