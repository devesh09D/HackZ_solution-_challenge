<div align="center">
  <h1>🚀 SevAI - AI-Powered Disaster Relief & Volunteer Coordination</h1>
  <p><i>Empowering NGOs and First Responders with Real-Time AI Task Routing</i></p>
</div>

---

## 💡 The Problem
During natural disasters and humanitarian crises (floods, earthquakes, fires), communication networks are chaotic. Field workers and distressed individuals struggle to fill out complex forms, leading to miscommunication. NGOs face severe bottlenecks trying to manually parse distress signals, map them, and deploy the right volunteers with the necessary skills to the correct locations.

## 🛠️ Our Solution: SevAI
**SevAI** is a comprehensive, full-stack platform that completely automates crisis response coordination. 

Instead of typing, field workers simply tap a button and **speak** into their device. Our pipeline uses the browser's native **Web Speech API** for instant, free transcription. The transcribed text is sent to our Python backend, where an **NLP engine (powered by Groq/LLama3)** extracts critical structured data (Need Type, Urgency, Location, People Affected). A **Machine Learning model (Random Forest)** predicts task completion duration, and the system instantly assigns the optimal volunteer based on real-time location and skill matching.

---

## ✨ Key Features

🎤 **Zero-Friction Voice Reporting**
- Uses native Browser Web Speech API for instant Voice-to-Text.
- No typing required—field workers just speak naturally in an emergency.

🧠 **AI-Powered NLP Pipeline**
- Extracts structured intelligence from unstructured voice transcripts.
- Integration with **Groq LLM** for ultra-fast intelligence parsing.
- Built-in deterministic **rule-based fallback** algorithm for offline or zero-config environments.

🗺️ **NGO Command Center & Heatmaps**
- Live React Leaflet map showing real-time clustering of disaster reports.
- Advanced predictive analytics using **Scikit-learn** to forecast issue hotspots and allocate resources pre-emptively.

🧑‍🤝‍🧑 **Smart Volunteer Matching Algorithm**
- Dynamically matches incoming tasks to volunteers based on geo-location proximity, skill tags (e.g., medical, rescue), and trust scores.
- Dedicated mobile-responsive Volunteer App interface.

⚡ **Frictionless "Zero-Config" Local Mode**
- If API keys (Firebase/Groq) are missing, the system gracefully falls back to a locally-seeded **In-Memory Data Store** and **Rule-Based NLP**, allowing judges to test the app instantly without setting up cloud accounts!

---

## 💻 Tech Stack

**Backend**
- **Framework:** FastAPI (Python)
- **AI/NLP:** Groq API (Llama3) + Deterministic Fallback 
- **Machine Learning:** Scikit-Learn, Pandas, Numpy (Random Forest Prediction)
- **Database/Store:** Firebase Firestore (with auto-fallback to In-Memory Mock Store)

**Frontend**
- **Framework:** React 18 + Vite
- **Styling:** Tailwind CSS, Framer Motion
- **Maps:** React Leaflet
- **Voice API:** Native Web Speech API
- **Icons:** Lucide React

---

## 🚀 Getting Started (Run it in 2 minutes!)

We've designed SevAI to be incredibly easy for hackathon judges to evaluate. You do **not** need API keys to test the core functionality!

### Prerequisites
- Node.js (v18+)
- Python (3.9+)

### 1. Start the Backend
Navigate to the `backend` directory, install dependencies, and run the FastAPI server:
```bash
cd backend
python -m venv venv
# Windows: .\venv\Scripts\activate
# Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn main:app --reload
```
*The backend will be available at `http://localhost:8000`. You can test the API at `http://localhost:8000/docs`.*

### 2. Start the Frontend
In a new terminal, navigate to the `frontend` directory:
```bash
cd frontend
npm install
npm run dev
```
*The frontend will be accessible at `http://localhost:5173`.*

---

## ⚙️ Advanced Configuration (Optional)
To unlock the full power of SevAI (Groq LLM parsing & Real Firebase Sync), create a `.env` file in the `backend` directory (use `.env.example` as a template):

```env
GROQ_API_KEY=your_groq_api_key_here
FIREBASE_CREDENTIALS_PATH=path_to_serviceAccountKey.json
```

## 🏗️ Architecture Overview
- `backend/main.py`: FastAPI entry point.
- `backend/routes/`: API endpoints for tasks, volunteers, voice processing, and predictions.
- `backend/ml/`: Scikit-learn models for task categorization and time predictions.
- `backend/services/`: Integration with external services (Firebase, Groq) and fallback engines.
- `frontend/src/pages/`: Core application views (Field Worker Voice App, NGO Dashboard, Volunteer App).

---
<div align="center">
  <i>Built with ❤️ for the Hackathon</i>
</div>
