"""
SevAI - Voice Input Route.
POST /voice-input  → processes transcript via Groq NLP → returns structured task JSON.
"""
from fastapi import APIRouter, HTTPException
from models.schemas import VoiceInputRequest
from services.groq_service import extract_task_from_transcript
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/voice-input", summary="Process voice transcript into structured task")
async def voice_input(request: VoiceInputRequest):
    """
    Accepts a voice transcript (already converted to text by the frontend
    Web Speech API or Google Cloud STT) and uses Groq LLM to extract
    structured task data.

    Returns: {need_type, location, urgency, people_affected, description}
    """
    if not request.transcript or len(request.transcript.strip()) < 3:
        raise HTTPException(status_code=400, detail="Transcript is too short or empty.")

    logger.info(f"Processing transcript ({len(request.transcript)} chars, lang={request.language})")

    try:
        structured = extract_task_from_transcript(request.transcript, request.language)
        return {
            "success": True,
            "transcript": request.transcript,
            "language": request.language,
            "structured": structured,
        }
    except Exception as e:
        logger.error(f"Voice processing error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process transcript: {str(e)}")
