"""
SevAI - Mock dataset generator.
Generates 50 realistic tasks and 20 volunteers for demo mode.
"""
import random
from datetime import datetime, timedelta
import uuid

# Seed for reproducibility
random.seed(42)

# Indian cities with coordinates
CITIES = [
    {"name": "Mumbai", "lat": 19.0760, "lng": 72.8777, "state": "Maharashtra"},
    {"name": "Delhi", "lat": 28.6139, "lng": 77.2090, "state": "Delhi"},
    {"name": "Bangalore", "lat": 12.9716, "lng": 77.5946, "state": "Karnataka"},
    {"name": "Chennai", "lat": 13.0827, "lng": 80.2707, "state": "Tamil Nadu"},
    {"name": "Kolkata", "lat": 22.5726, "lng": 88.3639, "state": "West Bengal"},
    {"name": "Hyderabad", "lat": 17.3850, "lng": 78.4867, "state": "Telangana"},
    {"name": "Pune", "lat": 18.5204, "lng": 73.8567, "state": "Maharashtra"},
    {"name": "Ahmedabad", "lat": 23.0225, "lng": 72.5714, "state": "Gujarat"},
    {"name": "Jaipur", "lat": 26.9124, "lng": 75.7873, "state": "Rajasthan"},
    {"name": "Lucknow", "lat": 26.8467, "lng": 80.9462, "state": "Uttar Pradesh"},
]

NEED_TYPES = ["food", "water", "shelter", "medical", "clothing", "education", "sanitation", "rescue"]
URGENCIES = ["high", "medium", "low"]
URGENCY_WEIGHTS = [0.3, 0.4, 0.3]  # More medium than high/low
STATUSES = ["pending", "active", "completed"]
STATUS_WEIGHTS = [0.5, 0.3, 0.2]

SKILLS_POOL = [
    "medical", "driving", "cooking", "construction", "teaching",
    "counseling", "first_aid", "logistics", "translation", "technology"
]

VOLUNTEER_NAMES = [
    "Raj Sharma", "Priya Mehta", "Arjun Nair", "Deepika Reddy", "Vikram Singh",
    "Anita Patel", "Suresh Kumar", "Pooja Joshi", "Rohit Verma", "Kavitha Krishnan",
    "Aditya Bose", "Sunita Rao", "Manish Gupta", "Lakshmi Devi", "Raju Tiwari",
    "Meena Pillai", "Sanjay Malhotra", "Geetha Nambiar", "Prakash Iyer", "Divya Choudhary"
]

TASK_DESCRIPTIONS = {
    "food": [
        "Emergency food packets required for flood-affected families unable to cook.",
        "Dry ration kits needed for 200+ displaced families in relief camp.",
        "Hot meal service required for homeless individuals during extreme weather.",
        "Baby food and nutrition supplements urgently needed for infants.",
    ],
    "water": [
        "Clean drinking water shortage — ground contaminated after flooding.",
        "Water purification tablets and clean water supply needed immediately.",
        "Water tanker required for colony with burst municipal pipe.",
        "Dehydration risk high — water distribution needed in heat wave zone.",
    ],
    "shelter": [
        "Temporary tarpaulin shelters needed for families displaced by fire.",
        "Cyclone shelter setup required for coastal village evacuation.",
        "Homeless individuals need emergency shelter during monsoon season.",
        "Transitional housing support needed for earthquake-displaced families.",
    ],
    "medical": [
        "Mobile medical camp needed — diarrhea outbreak in low-income area.",
        "Emergency first aid needed for victims of road accident near highway.",
        "Blood donation camp urgently required — hospital blood bank critically low.",
        "Mental health counselors needed for trauma survivors after flood.",
    ],
    "clothing": [
        "Winter clothing and blankets needed for homeless population.",
        "Children's school uniforms required for displaced student families.",
        "Flood-affected families lost all clothing — immediate donation needed.",
        "Warm clothing distribution required for tribal community in hill area.",
    ],
    "education": [
        "School supplies and books needed for children in relief camp.",
        "Volunteer tutors required for children who missed school due to disaster.",
        "Digital learning devices needed for remote village students.",
        "Skill training volunteers needed for displaced youth community.",
    ],
    "sanitation": [
        "Temporary toilet facilities urgently required at flood relief camp.",
        "Sanitation kits and hygiene supplies needed to prevent disease spread.",
        "Blocked sewage system in slum area — sanitation team required.",
        "Hand sanitizers, masks, and hygiene kits needed for refugee shelter.",
    ],
    "rescue": [
        "Elderly residents stranded on rooftop due to flash flooding.",
        "Landslide trapped villagers — rescue equipment and volunteers needed.",
        "Boat rescue required for families isolated by flood waters.",
        "Search and rescue operation needed after building collapse.",
    ],
}


def generate_task(idx: int) -> dict:
    """Generate a single realistic mock task."""
    city = random.choice(CITIES)
    need_type = random.choice(NEED_TYPES)
    created_dt = datetime.utcnow() - timedelta(
        days=random.randint(0, 30),
        hours=random.randint(0, 23),
        minutes=random.randint(0, 59)
    )
    urgency = random.choices(URGENCIES, URGENCY_WEIGHTS)[0]
    status = random.choices(STATUSES, STATUS_WEIGHTS)[0]

    return {
        "id": str(uuid.uuid4()),
        "need_type": need_type,
        "location": {
            "lat": round(city["lat"] + random.uniform(-0.08, 0.08), 4),
            "lng": round(city["lng"] + random.uniform(-0.08, 0.08), 4),
            "address": f"{city['name']}, {city['state']}"
        },
        "urgency": urgency,
        "people_affected": random.randint(5, 500),
        "description": random.choice(TASK_DESCRIPTIONS[need_type]),
        "status": status,
        "created_at": created_dt.isoformat(),
        "assigned_volunteer_id": None,
        "duration_hours": random.randint(2, 12),
        "estimated_volunteers": random.randint(1, 5),
    }


def generate_volunteer(idx: int) -> dict:
    """Generate a single realistic mock volunteer."""
    city = random.choice(CITIES)
    n_skills = random.randint(2, 5)
    tasks_completed = random.randint(0, 60)
    response_rate = round(random.uniform(0.6, 1.0), 2)
    rating = round(random.uniform(3.5, 5.0), 1)
    # Trust score based on tasks, rating, and response rate
    trust_score = round(
        0.4 * min(tasks_completed / 60, 1.0) +
        0.4 * (rating - 3.5) / 1.5 +
        0.2 * response_rate,
        2
    )

    created_dt = datetime.utcnow() - timedelta(days=random.randint(30, 730))

    return {
        "id": str(uuid.uuid4()),
        "name": VOLUNTEER_NAMES[idx],
        "email": f"volunteer{idx + 1}@sevai.org",
        "phone": f"+91-{random.randint(7000000000, 9999999999)}",
        "skills": random.sample(SKILLS_POOL, n_skills),
        "location": {
            "lat": round(city["lat"] + random.uniform(-0.12, 0.12), 4),
            "lng": round(city["lng"] + random.uniform(-0.12, 0.12), 4),
            "city": city["name"]
        },
        "availability": random.choices([True, False], [0.75, 0.25])[0],
        "trust_score": trust_score,
        "tasks_completed": tasks_completed,
        "response_rate": response_rate,
        "rating": rating,
        "created_at": created_dt.isoformat(),
        "active_task_id": None,
    }


# Generate the full dataset with fixed seed
random.seed(42)
MOCK_TASKS = [generate_task(i) for i in range(50)]
MOCK_VOLUNTEERS = [generate_volunteer(i) for i in range(20)]
