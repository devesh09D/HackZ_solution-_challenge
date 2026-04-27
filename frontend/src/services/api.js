import axios from 'axios'

/** Base URL — uses Vite proxy in dev, direct URL in prod */
const BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor ──────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
)

// ── Response interceptor ─────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.detail || error.message || 'Request failed'
    return Promise.reject(new Error(message))
  }
)

// ── API Methods ───────────────────────────────────────────────────────────────

/** POST /voice-input — process transcript via Groq NLP */
export const processVoiceInput = (transcript, language = 'en-IN') =>
  api.post('/voice-input', { transcript, language })

/** POST /create-task — create a new task */
export const createTask = (taskData) =>
  api.post('/create-task', taskData)

/** GET /tasks — fetch tasks with optional filters */
export const getTasks = (filters = {}) => {
  const params = {}
  if (filters.urgency) params.urgency = filters.urgency
  if (filters.need_type) params.need_type = filters.need_type
  if (filters.status) params.status = filters.status
  if (filters.city) params.city = filters.city
  return api.get('/tasks', { params })
}

/** GET /heatmap-data — heatmap points */
export const getHeatmapData = () =>
  api.get('/heatmap-data')

/** GET /volunteers — fetch all volunteers */
export const getVolunteers = () =>
  api.get('/volunteers')

/** POST /match-volunteers — smart matching */
export const matchVolunteers = (task_id, required_skills = []) =>
  api.post('/match-volunteers', { task_id, required_skills })

/** POST /accept-task — volunteer accepts a task */
export const acceptTask = (task_id, volunteer_id) =>
  api.post('/accept-task', { task_id, volunteer_id })

/** POST /update-status — update task status */
export const updateStatus = (task_id, status, volunteer_id = null) =>
  api.post('/update-status', { task_id, status, volunteer_id })

/** GET /predictions — ML predictions */
export const getPredictions = () =>
  api.get('/predictions')

/** POST /feedback — submit feedback & update trust score */
export const submitFeedback = (task_id, volunteer_id, rating, comment = '') =>
  api.post('/feedback', { task_id, volunteer_id, rating, comment })

export default api
