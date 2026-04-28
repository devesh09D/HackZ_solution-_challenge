"""
SevAI - Tasks Routes.
GET  /tasks        → list tasks with optional filters
POST /create-task  → create a new task in Firestore
POST /update-status → update task status
GET  /heatmap-data → lat/lng/intensity data for heatmap
"""
import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from models.schemas import CreateTaskRequest, UpdateStatusRequest
from services import firebase_service as db
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

URGENCY_INTENSITY = {"high": 1.0, "medium": 0.6, "low": 0.3}


@router.get("/tasks", summary="List all tasks with optional filters")
async def get_tasks(
    urgency: Optional[str] = Query(None, description="Filter by urgency: high, medium, low"),
    need_type: Optional[str] = Query(None, description="Filter by need type"),
    status: Optional[str] = Query(None, description="Filter by status: pending, active, completed"),
    city: Optional[str] = Query(None, description="Filter by city name"),
):
    """Return all tasks sorted by urgency. Supports urgency, need_type, status, city filters."""
    tasks = db.get_tasks(urgency=urgency, need_type=need_type, status=status, city=city)
    return {"tasks": tasks, "count": len(tasks)}


@router.post("/create-task", summary="Create a new task")
async def create_task(request: CreateTaskRequest):
    """
    Store a structured task in Firestore.
    Returns the created task with auto-generated ID and timestamp.
    """
    task_id = str(uuid.uuid4())
    task = {
        "id": task_id,
        "need_type": request.need_type,
        "location": request.location.model_dump() if request.location else {"lat": None, "lng": None, "address": "Unknown"},
        "urgency": request.urgency,
        "people_affected": request.people_affected,
        "description": request.description,
        "status": "pending",
        "created_at": datetime.utcnow().isoformat(),
        "assigned_volunteer_id": None,
        "duration_hours": request.duration_hours,
        "estimated_volunteers": request.estimated_volunteers,
    }
    db.create("tasks", task_id, task)
    logger.info(f"Created task {task_id}: {request.need_type} / {request.urgency}")
    return {"success": True, "task": task}


@router.post("/update-status", summary="Update task status")
async def update_status(request: UpdateStatusRequest):
    """
    Update the status of a task (pending → active → completed).
    Optionally assign a volunteer.
    """
    valid_statuses = {"pending", "active", "completed"}
    if request.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {valid_statuses}")

    task = db.get_by_id("tasks", request.task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")

    updates = {"status": request.status}
    if request.volunteer_id:
        updates["assigned_volunteer_id"] = request.volunteer_id

    updated = db.update("tasks", request.task_id, updates)
    return {"success": True, "task": updated}


@router.get("/heatmap-data", summary="Get heatmap data points for the map")
async def get_heatmap_data():
    """
    Returns all tasks as heatmap points with lat, lng, and intensity
    based on urgency level (high=1.0, medium=0.6, low=0.3).
    """
    tasks = db.get_all("tasks")
    points = []
    for task in tasks:
        loc = task.get("location", {})
        if loc.get("lat") and loc.get("lng"):
            points.append({
                "lat": loc["lat"],
                "lng": loc["lng"],
                "intensity": URGENCY_INTENSITY.get(task.get("urgency", "low"), 0.3),
                "urgency": task.get("urgency", "low"),
                "need_type": task.get("need_type", "food"),
                "task_id": task.get("id", ""),
                "people_affected": task.get("people_affected", 0),
                "status": task.get("status", "pending"),
            })
    return {"points": points, "count": len(points)}
