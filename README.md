# SevAI - AI-Powered Volunteer Coordination Platform

SevAI is a full-stack platform designed to streamline and automate volunteer coordination. The system converts real-time voice field reports into actionable, categorized tasks using an AI-powered NLP pipeline. This ensures efficient matching of tasks (such as drainage or sanitation issues) with the nearest or most suitable volunteers.

## Features

- **Voice-to-Task Pipeline**: Instantly converts field reports spoken in natural language into structured task data.
- **AI-Powered Keyword Extraction**: Identifies and categorizes issues (e.g., sanitation, drainage) to effectively route the task.
- **Real-Time Task Assignment**: Matches extracted tasks with available volunteers based on location and skills.
- **NGO Dashboard**: A central web interface for organizations to monitor live tasks, view a heatmap of issues, and manage volunteers.
- **Volunteer Mobile-Responsive App**: A streamlined interface for volunteers to receive alerts, view task details, and update the status of their assigned tasks.
- **Predictive Analytics**: Uses machine learning to predict issue hotspots and optimize volunteer deployment.

## Tech Stack

**Backend**
- **Framework:** FastAPI (Python)
- **AI Integration:** Groq API (for advanced NLP capabilities), Custom ML models
- **Database/Store:** Firebase
- **Server:** Uvicorn

**Frontend**
- **Framework:** React 18 with Vite
- **Styling:** Tailwind CSS
- **Maps:** React Leaflet
- **Icons:** Lucide React
- **HTTP Client:** Axios

## Getting Started

### Prerequisites
- Node.js (v20+)
- Python (3.9+)
- Docker & Docker Compose (optional)

### Environment Variables
Create a `.env` file in the `backend` directory (you can use `.env.example` as a template). Ensure you configure the necessary keys:
```
GROQ_API_KEY=your_groq_api_key_here
FIREBASE_CREDENTIALS_PATH=path_to_serviceAccountKey.json
FCM_SERVER_KEY=your_fcm_key
```

### Running Locally (Manual)

#### 1. Start the Backend
Navigate to the `backend` directory, install dependencies, and run the FastAPI server:
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload
```
The backend will be available at `http://localhost:8000`. API documentation can be accessed at `http://localhost:8000/docs`.

#### 2. Start the Frontend
Navigate to the `frontend` directory, install Node modules, and start the development server:
```bash
cd frontend
npm install
npm run dev
```
The frontend will be accessible at `http://localhost:5173`.

### Running with Docker

To run the entire application stack using Docker:
```bash
docker-compose up --build
```

## Architecture overview
- `backend/routes`: API endpoints for tasks, volunteers, voice processing, and predictions.
- `backend/ml`: Machine learning models for task categorization and predictions.
- `backend/services`: Integration with external services (Firebase, Groq).
- `frontend/src/components`: Reusable UI components.
- `frontend/src/pages`: Main application views (Dashboard, Volunteer App).

## License
MIT
