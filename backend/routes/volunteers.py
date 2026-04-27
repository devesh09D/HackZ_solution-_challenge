"""
SevAI - Volunteers Routes.
GET  /volunteers        → list all volunteers
POST /match-volunteers  → smart matching algorithm, returns top 3
POST /accept-task       → volunteer accepts, status → active
"""
import math
from fastapi import APIRouter, HTTPException
from typing import List
from models.schemas import MatchRequest, AcceptTaskRequest, FeedbackRequest
from services import firebase_service as db
from services.firebase_service import send_fcm_notification
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

MAX_DISTANCE_KM = 500.0  # Normalisation reference distance


def _haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate great-circle distance between two points in km."""
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _compute_match_score(volunteer: dict, task: dict, required_skills: List[str]) -> dict:
    """
    Compute composite match score:
        match_score = 0.4 * skill_match + 0.3 * proximity + 0.2 * availability + 0.1 * trust_score
    Returns score (0-1) and distance_km.
    """
    # Skill match: fraction of required skills the volunteer has
    vol_skills = set(volunteer.get("skills", []))
    if required_skills:
        skill_match = len(vol_skills & set(required_skills)) / len(required_skills)
    else:
        skill_match = 0.7  # No specific skills required — generic score

    # Proximity: normalised inverse distance
    task_loc = task.get("location", {})
    vol_loc = volunteer.get("location", {})
    distance_km = _haversine(
        vol_loc.get("lat", 0), vol_loc.get("lng", 0),
        task_loc.get("lat", 0), task_loc.get("lng", 0)
    )
    proximity = max(0.0, 1.0 - distance_km / MAX_DISTANCE_KM)

    # Availability (binary)
    availability = 1.0 if volunteer.get("availability", False) else 0.0

    # Trust score (already 0-1)
    trust_score = float(volunteer.get("trust_score", 0.5))

    score = (
        0.4 * skill_match +
        0.3 * proximity +
        0.2 * availability +
        0.1 * trust_score
    )
    return {
        "score": round(score, 4),
        "skill_match": round(skill_match, 3),
        "proximity": round(proximity, 3),
        "distance_km": round(distance_km, 1),
        "availability": bool(volunteer.get("availability")),
        "trust_score": trust_score,
    }


@router.get("/volunteers", summary="List all volunteers")
async def get_volunteers():
    """Return all registered volunteers."""
    volunteers = db.get_all("volunteers")
    return {"volunteers": volunteers, "count": len(volunteers)}


@router.post("/match-volunteers", summary="Match top 3 volunteers to a task")
async def match_volunteers(request: MatchRequest):
    """
    Smart matching algorithm:
        match_score = 0.4 * skill_match + 0.3 * proximity + 0.2 * availability + 0.1 * trust_score
    Returns top 3 volunteers ranked by match score.
    Sends FCM notifications to top 3.
    """
    task = db.get_by_id("tasks", request.task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")

    volunteers = db.get_all("volunteers")
    if not volunteers:
        raise HTTPException(status_code=404, detail="No volunteers registered.")

    scored = []
    for vol in volunteers:
        metrics = _compute_match_score(vol, task, request.required_skills or [])
        scored.append({**vol, "match_metrics": metrics, "match_score": metrics["score"]})

    # Sort descending by match score
    scored.sort(key=lambda v: v["match_score"], reverse=True)
    top3 = scored[:3]

    # Send FCM notifications to top 3
    for vol in top3:
        send_fcm_notification(
            volunteer_id=vol["id"],
            title=f"New Task: {task['need_type'].title()} ({task['urgency'].upper()})",
            body=f"{task['description'][:100]} — {task['location'].get('address', '')}",
            data={"task_id": task["id"]},
        )

    return {
        "task_id": request.task_id,
        "matches": top3,
        "algorithm": "0.4*skill + 0.3*proximity + 0.2*availability + 0.1*trust",
    }


@router.post("/accept-task", summary="Volunteer accepts a task")
async def accept_task(request: AcceptTaskRequest):
    """
    Volunteer accepts a task → task status becomes 'active',
    volunteer's active_task_id is set.
    """
    task = db.get_by_id("tasks", request.task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")

    volunteer = db.get_by_id("volunteers", request.volunteer_id)
    if not volunteer:
        raise HTTPException(status_code=404, detail="Volunteer not found.")

    # Update task
    db.update("tasks", request.task_id, {
        "status": "active",
        "assigned_volunteer_id": request.volunteer_id,
    })

    # Update volunteer
    db.update("volunteers", request.volunteer_id, {
        "active_task_id": request.task_id,
        "availability": False,
    })

    logger.info(f"Volunteer {volunteer['name']} accepted task {request.task_id}")
    return {
        "success": True,
        "message": f"{volunteer['name']} has accepted the task.",
        "task_id": request.task_id,
        "volunteer_id": request.volunteer_id,
    }


@router.post("/feedback", summary="Submit feedback and update trust score")
async def submit_feedback(request: FeedbackRequest):
    """
    Submit task completion feedback. Updates volunteer trust score dynamically:
        new_trust = 0.7 * old_trust + 0.3 * (rating/5)
        tasks_completed += 1, availability → True
    """
    volunteer = db.get_by_id("volunteers", request.volunteer_id)
    if not volunteer:
        raise HTTPException(status_code=404, detail="Volunteer not found.")

    old_trust = float(volunteer.get("trust_score", 0.5))
    normalized_rating = max(0.0, min(1.0, request.rating / 5.0))
    new_trust = round(0.7 * old_trust + 0.3 * normalized_rating, 3)

    db.update("volunteers", request.volunteer_id, {
        "trust_score": new_trust,
        "tasks_completed": volunteer.get("tasks_completed", 0) + 1,
        "active_task_id": None,
        "availability": True,
        "rating": round((volunteer.get("rating", 4.0) + request.rating) / 2, 1),
    })

    db.update("tasks", request.task_id, {"status": "completed"})

    return {
        "success": True,
        "volunteer_id": request.volunteer_id,
        "old_trust_score": old_trust,
        "new_trust_score": new_trust,
        "tasks_completed": volunteer.get("tasks_completed", 0) + 1,
    }
