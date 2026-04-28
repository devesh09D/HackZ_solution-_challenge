"""
SevAI - In-memory data store (Firebase Firestore compatible interface).
Falls back to in-memory storage when Firebase credentials are not configured.
When FIREBASE_CREDENTIALS_PATH is set in .env, real Firestore is used.
"""
import os
import copy
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime

logger = logging.getLogger(__name__)

# ── In-memory store ─────────────────────────────────────────────────────────
_store: Dict[str, Dict[str, Any]] = {
    "tasks": {},
    "volunteers": {},
    "feedback": {},
}

_firebase_initialized = False


def init_store():
    """Initialize the data store. Tries Firebase first, falls back to in-memory."""
    global _firebase_initialized

    creds_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "")
    if creds_path and os.path.exists(creds_path):
        try:
            import firebase_admin
            from firebase_admin import credentials, firestore

            # Avoid re-initializing if already done (hot-reload safety)
            if not firebase_admin._apps:
                cred = credentials.Certificate(creds_path)
                firebase_admin.initialize_app(cred)

            _firebase_initialized = True
            logger.info("✅ Firebase Firestore initialized.")

            # Seed Firestore if collections are empty (first-time setup)
            _seed_firestore_if_empty()

        except Exception as e:
            logger.warning(f"Firebase init failed: {e}. Using in-memory store.")
            _seed_in_memory()
    else:
        logger.info("ℹ️  No Firebase credentials — using in-memory store with mock data.")
        _seed_in_memory()


def _seed_firestore_if_empty():
    """Seed Firestore with mock data only if collections are empty."""
    from firebase_admin import firestore
    from data.seed_data import MOCK_TASKS, MOCK_VOLUNTEERS

    db = firestore.client()

    # Check if tasks collection already has data
    existing = db.collection("tasks").limit(1).get()
    if list(existing):
        logger.info("ℹ️  Firestore already has data — skipping seed.")
        return

    logger.info("🌱 Seeding Firestore with mock data (first-time setup)...")

    # Batch write tasks (Firestore batch max = 500)
    batch = db.batch()
    for i, task in enumerate(MOCK_TASKS):
        ref = db.collection("tasks").document(task["id"])
        batch.set(ref, task)
        if (i + 1) % 490 == 0:      # flush before hitting the 500 limit
            batch.commit()
            batch = db.batch()

    for vol in MOCK_VOLUNTEERS:
        ref = db.collection("volunteers").document(vol["id"])
        batch.set(ref, vol)

    batch.commit()
    logger.info(f"✅ Seeded {len(MOCK_TASKS)} tasks and {len(MOCK_VOLUNTEERS)} volunteers into Firestore.")


def _seed_in_memory():
    """Seed the in-memory store with mock data."""
    from data.seed_data import MOCK_TASKS, MOCK_VOLUNTEERS
    if not _store["tasks"]:
        for task in MOCK_TASKS:
            _store["tasks"][task["id"]] = copy.deepcopy(task)
    if not _store["volunteers"]:
        for vol in MOCK_VOLUNTEERS:
            _store["volunteers"][vol["id"]] = copy.deepcopy(vol)
    logger.info(f"✅ Seeded in-memory store with {len(MOCK_TASKS)} tasks and {len(MOCK_VOLUNTEERS)} volunteers.")


# ── Generic CRUD ─────────────────────────────────────────────────────────────

def get_all(collection: str) -> List[dict]:
    """Return all documents from a collection."""
    if _firebase_initialized:
        from firebase_admin import firestore
        db = firestore.client()
        docs = db.collection(collection).stream()
        return [doc.to_dict() for doc in docs]
    return list(_store.get(collection, {}).values())


def get_by_id(collection: str, doc_id: str) -> Optional[dict]:
    """Return a single document by ID."""
    if _firebase_initialized:
        from firebase_admin import firestore
        db = firestore.client()
        doc = db.collection(collection).document(doc_id).get()
        return doc.to_dict() if doc.exists else None
    return _store.get(collection, {}).get(doc_id)


def create(collection: str, doc_id: str, data: dict) -> dict:
    """Create a new document."""
    if _firebase_initialized:
        from firebase_admin import firestore
        db = firestore.client()
        db.collection(collection).document(doc_id).set(data)
        return data
    _store.setdefault(collection, {})[doc_id] = copy.deepcopy(data)
    return data


def update(collection: str, doc_id: str, updates: dict) -> Optional[dict]:
    """Update fields of an existing document."""
    if _firebase_initialized:
        from firebase_admin import firestore
        db = firestore.client()
        db.collection(collection).document(doc_id).update(updates)
        doc = db.collection(collection).document(doc_id).get()
        return doc.to_dict()
    if doc_id in _store.get(collection, {}):
        _store[collection][doc_id].update(updates)
        return _store[collection][doc_id]
    return None


def query(collection: str, filters: Dict[str, Any]) -> List[dict]:
    """Simple equality-filter query."""
    if _firebase_initialized:
        from firebase_admin import firestore
        db = firestore.client()
        ref = db.collection(collection)
        for key, val in filters.items():
            ref = ref.where(key, "==", val)
        return [doc.to_dict() for doc in ref.stream()]
    # In-memory filter
    results = []
    for doc in _store.get(collection, {}).values():
        if all(doc.get(k) == v for k, v in filters.items()):
            results.append(doc)
    return results


def get_tasks(urgency: Optional[str] = None,
              need_type: Optional[str] = None,
              status: Optional[str] = None,
              city: Optional[str] = None) -> List[dict]:
    """Fetch tasks with optional filters."""
    tasks = get_all("tasks")
    if urgency:
        tasks = [t for t in tasks if t.get("urgency") == urgency]
    if need_type:
        tasks = [t for t in tasks if t.get("need_type") == need_type]
    if status:
        tasks = [t for t in tasks if t.get("status") == status]
    if city:
        tasks = [t for t in tasks if city.lower() in t.get("location", {}).get("address", "").lower()]
    # Sort by urgency (high → medium → low) then created_at descending
    urgency_order = {"high": 0, "medium": 1, "low": 2}
    tasks.sort(key=lambda t: (urgency_order.get(t.get("urgency", "low"), 2), t.get("created_at", "")))
    return tasks


def _get_fcm_access_token(creds_path: str) -> tuple[str, str]:
    """
    Generate a short-lived OAuth 2.0 Bearer token and read project_id
    from the Firebase service account JSON file.
    Returns: (access_token, project_id)
    """
    try:
        from google.oauth2 import service_account
        import google.auth.transport.requests

        credentials = service_account.Credentials.from_service_account_file(
            creds_path,
            scopes=["https://www.googleapis.com/auth/firebase.messaging"],
        )
        request = google.auth.transport.requests.Request()
        credentials.refresh(request)

        # Read project_id directly from the service account JSON
        import json as _json
        with open(creds_path) as f:
            sa = _json.load(f)
        project_id = sa.get("project_id", "")

        return credentials.token, project_id
    except Exception as e:
        logger.warning(f"Failed to generate FCM OAuth token: {e}")
        return "", ""


def send_fcm_notification(volunteer_id: str, title: str, body: str, data: dict = {}):
    """
    Send push notification via Firebase Cloud Messaging HTTP v1 API.
    Uses OAuth 2.0 Bearer token generated from serviceAccountKey.json.
    Falls back to console log if credentials are not configured.
    """
    creds_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "")
    if not creds_path or not os.path.exists(creds_path):
        logger.info(f"📲 [MOCK] FCM → {volunteer_id}: {title} — {body}")
        return

    try:
        import httpx
        access_token, project_id = _get_fcm_access_token(creds_path)
        if not access_token or not project_id:
            logger.warning("FCM: Could not obtain access token or project_id.")
            return

        url = f"https://fcm.googleapis.com/v1/projects/{project_id}/messages:send"
        payload = {
            "message": {
                "token": volunteer_id,   # volunteer's FCM device registration token
                "notification": {"title": title, "body": body},
                "data": {k: str(v) for k, v in data.items()},
            }
        }
        response = httpx.post(
            url,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=8.0,
        )
        response.raise_for_status()
        logger.info(f"✅ FCM sent to {volunteer_id}: {response.status_code}")
    except Exception as e:
        logger.warning(f"FCM send failed: {e}")
