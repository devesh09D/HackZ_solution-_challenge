"""
SevAI - Pydantic schemas for all data models.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class NeedType(str, Enum):
    food = "food"
    water = "water"
    shelter = "shelter"
    medical = "medical"
    clothing = "clothing"
    education = "education"
    sanitation = "sanitation"
    rescue = "rescue"
    other = "other"


class Urgency(str, Enum):
    high = "high"
    medium = "medium"
    low = "low"


class TaskStatus(str, Enum):
    pending = "pending"
    active = "active"
    completed = "completed"


class Location(BaseModel):
    lat: Optional[float] = None
    lng: Optional[float] = None
    address: str = ""


class Task(BaseModel):
    id: str
    need_type: str
    location: Location
    urgency: str
    people_affected: int
    description: str
    status: str = "pending"
    created_at: str
    assigned_volunteer_id: Optional[str] = None
    duration_hours: int = 4
    estimated_volunteers: int = 1


class CreateTaskRequest(BaseModel):
    need_type: str
    location: Location
    urgency: str
    people_affected: int
    description: str
    duration_hours: int = 4
    estimated_volunteers: int = 1


class UpdateStatusRequest(BaseModel):
    task_id: str
    status: str
    volunteer_id: Optional[str] = None


class VoiceInputRequest(BaseModel):
    transcript: str
    language: str = "en-IN"


class VolunteerLocation(BaseModel):
    lat: float
    lng: float
    city: str = ""


class Volunteer(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    skills: List[str]
    location: VolunteerLocation
    availability: bool = True
    trust_score: float = 0.8
    tasks_completed: int = 0
    response_rate: float = 0.9
    rating: float = 4.5
    created_at: str
    active_task_id: Optional[str] = None


class MatchRequest(BaseModel):
    task_id: str
    required_skills: Optional[List[str]] = []


class HeatmapPoint(BaseModel):
    lat: float
    lng: float
    intensity: float
    urgency: str
    need_type: str
    task_id: str


class PredictionZone(BaseModel):
    lat: float
    lng: float
    predicted_need: str
    probability: float
    city: str


class AcceptTaskRequest(BaseModel):
    task_id: str
    volunteer_id: str


class FeedbackRequest(BaseModel):
    task_id: str
    volunteer_id: str
    rating: float
    comment: Optional[str] = ""
