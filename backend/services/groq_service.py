"""
SevAI - Groq NLP Service.
Converts raw voice transcripts into structured task JSON using Groq's LLM API.
Falls back to a rule-based mock extractor if GROQ_API_KEY is not set.
"""
import os
import re
import json
import logging
import random

logger = logging.getLogger(__name__)


def extract_task_from_transcript(transcript: str, language: str = "en-IN") -> dict:
    """
    Main entry point. Routes to Groq API or mock extractor based on config.
    Returns: {need_type, location, urgency, people_affected, description}
    """
    api_key = os.getenv("GROQ_API_KEY", "")
    if api_key:
        return _groq_extract(transcript, language, api_key)
    else:
        logger.info("ℹ️  GROQ_API_KEY not set — using mock NLP extractor.")
        return _mock_extract(transcript)


def _groq_extract(transcript: str, language: str, api_key: str) -> dict:
    """Use Groq API (llama3-8b-8192) to extract structured data from transcript."""
    try:
        from groq import Groq
        client = Groq(api_key=api_key)

        prompt = f"""You are an AI assistant for an NGO disaster relief platform called SevAI.
Extract structured information from the following field worker voice report.

Voice Report: "{transcript}"

Return a JSON object with exactly these fields:
- need_type: one of [food, water, shelter, medical, clothing, education, sanitation, rescue, other]
- location: {{ "lat": <float>, "lng": <float>, "address": "<city, state>" }}
- urgency: one of [high, medium, low]
- people_affected: <integer>
- description: <1-2 sentence clear description of the situation>

Guidelines:
- If the report is just a greeting or does not mention any actual emergency/need (e.g., "hi this is..."), set need_type to "other", urgency to "low", people_affected to 0, and location to nulls/Unknown. Do NOT hallucinate locations or emergencies.
- If location is not clearly mentioned, set location to {{ "lat": null, "lng": null, "address": "Unknown Location" }}.
- If people_affected is not mentioned, estimate based on context (default 50).
Respond ONLY with valid JSON, no explanation."""

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=400,
        )
        raw = response.choices[0].message.content.strip()
        # Extract JSON from response
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        if match:
            return json.loads(match.group())
        return _mock_extract(transcript)
    except Exception as e:
        logger.warning(f"Groq API error: {e}. Falling back to mock extractor.")
        return _mock_extract(transcript)


def _mock_extract(transcript: str) -> dict:
    """
    Rule-based mock extractor for demo mode.
    Parses keywords from the transcript to produce realistic structured output.
    """
    transcript_lower = transcript.lower()

    # Detect need type — use best-match scoring (most keyword hits wins)
    need_keywords = {
        "food": ["food", "hungry", "meal", "eat", "ration", "starving", "famine", "wheat", "rice", "nutrition"],
        "water": ["water", "drink", "thirst", "dehydr", "well", "tap", "pipeline", "water supply"],
        "shelter": ["shelter", "house", "roof", "tent", "displacement", "homeless", "building", "accommodation"],
        "medical": ["medical", "doctor", "hospital", "injury", "sick", "wound", "blood", "fever", "medicine", "health"],
        "clothing": ["cloth", "blanket", "winter", "wear", "garment", "dress", "uniform"],
        "education": ["school", "education", "learn", "student", "book", "study", "tutor", "class"],
        "sanitation": [
            "sanitation", "toilet", "hygiene", "sewage", "sewer", "disease", "outbreak",
            "drainage", "drain", "drains", "drainage problem", "waterlog", "waterlogged",
            "blocked", "overflow", "overflowing", "pipe", "pipes", "stagnant", "waste water",
            "garbage", "waste", "filth", "dirty water", "open drain",
        ],
        "rescue": ["rescue", "stranded", "trapped", "stuck", "danger", "emergency", "collapse", "missing"],
        "flood": ["flood", "flooding", "inundated", "submerged"],  # maps to water/rescue
    }
    # Score each category by number of keyword hits
    scores = {}
    for nt, keywords in need_keywords.items():
        scores[nt] = sum(1 for kw in keywords if kw in transcript_lower)
    # Pick the category with the highest score; default to "general" if no keywords matched
    best_score = max(scores.values())
    if best_score == 0:
        need_type = "general"  # no keywords matched — report is unclear
    else:
        # Among tied winners, prefer the first in priority order
        priority = ["rescue", "medical", "sanitation", "water", "shelter", "food", "clothing", "education", "flood"]
        winners = [nt for nt in priority if scores.get(nt, 0) == best_score]
        need_type = winners[0] if winners else "food"
    # Remap flood → water since it's not a standalone need_type in the schema
    if need_type == "flood":
        need_type = "water"

    # Detect urgency
    urgency = "medium"
    if any(w in transcript_lower for w in ["urgent", "critical", "immediately", "dying", "emergency", "sos"]):
        urgency = "high"
    elif any(w in transcript_lower for w in ["low", "moderate", "stable", "minor"]):
        urgency = "low"

    # Detect people affected
    import re
    numbers = re.findall(r'\b(\d+)\b', transcript)
    people_affected = int(numbers[0]) if numbers else random.randint(20, 200)

    # Detect city
    cities = {
        "mumbai": (19.0760, 72.8777, "Mumbai, Maharashtra"),
        "dharavi": (19.0376, 72.8540, "Dharavi, Mumbai"),
        "delhi": (28.6139, 77.2090, "Delhi"),
        "bangalore": (12.9716, 77.5946, "Bangalore, Karnataka"),
        "bengaluru": (12.9716, 77.5946, "Bengaluru, Karnataka"),
        "whitefield": (12.9698, 77.7500, "Whitefield, Bangalore"),
        "chennai": (13.0827, 80.2707, "Chennai, Tamil Nadu"),
        "koyambedu": (13.0694, 80.1948, "Koyambedu, Chennai"),
        "velachery": (12.9750, 80.2209, "Velachery, Chennai"),
        "tambaram": (12.9249, 80.1000, "Tambaram, Chennai"),
        "kolkata": (22.5726, 88.3639, "Kolkata, West Bengal"),
        "hyderabad": (17.3850, 78.4867, "Hyderabad, Telangana"),
        "pune": (18.5204, 73.8567, "Pune, Maharashtra"),
        "ahmedabad": (23.0225, 72.5714, "Ahmedabad, Gujarat"),
        "jaipur": (26.9124, 75.7873, "Jaipur, Rajasthan"),
        "lucknow": (26.8467, 80.9462, "Lucknow, Uttar Pradesh"),
        "surat": (21.1702, 72.8311, "Surat, Gujarat"),
        "nagpur": (21.1458, 79.0882, "Nagpur, Maharashtra"),
        "patna": (25.5941, 85.1376, "Patna, Bihar"),
        "bhopal": (23.2599, 77.4126, "Bhopal, Madhya Pradesh"),
    }
    lat, lng, address = None, None, "Unknown Location"
    for city_name, coords in cities.items():
        if city_name in transcript_lower:
            lat, lng, address = coords
            break

    # Build description
    description = (
        f"Field report: {transcript[:200].strip()}"
        if len(transcript) > 10
        else f"Emergency {need_type} assistance required. Approximately {people_affected} people affected."
    )

    location = {"address": address}
    if lat is not None and lng is not None:
        location["lat"] = lat
        location["lng"] = lng

    return {
        "need_type": need_type,
        "location": location,
        "urgency": urgency,
        "people_affected": people_affected,
        "description": description,
    }
