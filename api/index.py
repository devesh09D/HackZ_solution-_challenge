"""
Vercel Serverless Entry Point.
Wraps the FastAPI app from backend/ for Vercel's Python runtime.
"""
import sys
import os

# Add the backend directory to the Python path
backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'backend')
sys.path.insert(0, backend_dir)

# Change working directory to backend so relative paths work
os.chdir(backend_dir)

from dotenv import load_dotenv
load_dotenv(os.path.join(backend_dir, '.env'))

from main import app

# Initialize the data store and ML model on cold start
try:
    from services.firebase_service import init_store
    from ml.prediction_model import load_model
    init_store()
    load_model()
except Exception as e:
    print(f"Warning: Initialization error (non-fatal): {e}")

# Vercel looks for the `app` variable — this is it
handler = app
