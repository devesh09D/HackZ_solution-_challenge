import { useState, useEffect, useCallback } from 'react'
import { MapContainer, TileLayer, CircleMarker, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getTasks, getVolunteers, acceptTask, submitFeedback, updateStatus } from '../services/api'
import { Bell, Star, CheckCircle, Clock, MapPin, Zap, X, Loader2, Trophy, TrendingUp } from 'lucide-react'

// Fix default Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const NEED_ICONS = { food: '🍱', water: '💧', shelter: '🏠', medical: '🏥', clothing: '👕', education: '📚', sanitation: '🚿', rescue: '🚨' }
const URGENCY_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' }
const URGENCY_TEXT = { high: 'text-red-400', medium: 'text-amber-400', low: 'text-emerald-400' }
const URGENCY_BG = { high: 'bg-red-900/20 border-red-700/30', medium: 'bg-amber-900/20 border-amber-700/30', low: 'bg-emerald-900/20 border-emerald-700/30' }

// Demo volunteer persona (would come from auth in production)
const MY_VOLUNTEER_ID = null // null = show all tasks; in prod this would be from auth

export default function VolunteerApp() {
  const [tasks, setTasks] = useState([])
  const [volunteers, setVolunteers] = useState([])
  const [myVolunteer, setMyVolunteer] = useState(null)
  const [activeTab, setActiveTab] = useState('available') // 'available' | 'active' | 'completed'
  const [selectedTask, setSelectedTask] = useState(null)
  const [feedbackModal, setFeedbackModal] = useState(null)
  const [rating, setRating] = useState(5)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const INDIA_CENTER = [20.5937, 78.9629]

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const load = useCallback(async () => {
    try {
      const [tasksRes, volsRes] = await Promise.all([getTasks(), getVolunteers()])
      const allTasks = tasksRes.tasks || []
      const vols = volsRes.volunteers || []
      setTasks(allTasks)
      setVolunteers(vols)
      // Use first volunteer as "me" for demo
      if (vols.length > 0 && !myVolunteer) setMyVolunteer(vols[0])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(load, 30000)
    return () => clearInterval(id)
  }, [load])

  const filteredTasks = tasks.filter((t) => {
    if (activeTab === 'available') return t.status === 'pending'
    if (activeTab === 'active') return t.status === 'active'
    if (activeTab === 'completed') return t.status === 'completed'
    return true
  })

  const handleAccept = async (task) => {
    if (!myVolunteer) return
    try {
      await acceptTask(task.id, myVolunteer.id)
      showToast(`✅ You accepted the ${task.need_type} task!`)
      setSelectedTask(null)
      load()
    } catch (e) {
      showToast(e.message, 'error')
    }
  }

  const handleReject = (task) => {
    setSelectedTask(null)
    showToast('Task declined.', 'info')
  }

  const handleComplete = async (task) => {
    setFeedbackModal(task)
  }

  const submitFeedbackForm = async () => {
    if (!feedbackModal || !myVolunteer) return
    try {
      await submitFeedback(feedbackModal.id, myVolunteer.id, rating)
      showToast('🏆 Task completed! Trust score updated.')
      setFeedbackModal(null)
      load()
    } catch (e) {
      showToast(e.message, 'error')
    }
  }

  const trustPct = myVolunteer ? Math.round((myVolunteer.trust_score || 0) * 100) : 0
  const trustColor = trustPct >= 80 ? '#34d399' : trustPct >= 60 ? '#fbbf24' : '#ef4444'

  return (
    <div className="min-h-screen pt-20 pb-12 px-4">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 right-4 z-[9999] px-5 py-3 rounded-xl shadow-xl text-sm font-medium flex items-center gap-2 animate-slide-up ${
          toast.type === 'success' ? 'bg-emerald-900/90 text-emerald-300 border border-emerald-700/50' : 'bg-red-900/90 text-red-300 border border-red-700/50'
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Header + Profile */}
        <div className="grid lg:grid-cols-[1fr,300px] gap-6 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 text-purple-400 text-sm font-semibold mb-2">
              <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
              Volunteer Portal
            </div>
            <h1 className="text-4xl font-black text-white">
              My Tasks <span className="gradient-text">Dashboard</span>
            </h1>
            <p className="text-slate-400 mt-2">Accept tasks, track progress, and build your trust score.</p>
          </div>

          {/* Volunteer Profile Card */}
          {myVolunteer && (
            <div className="glass rounded-2xl p-5 border border-purple-900/20">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-white font-black text-xl flex-shrink-0">
                  {myVolunteer.name?.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-bold">{myVolunteer.name}</p>
                  <p className="text-slate-500 text-xs">{myVolunteer.location?.city}</p>
                  <p className={`text-xs font-medium mt-0.5 ${myVolunteer.availability ? 'text-emerald-400' : 'text-red-400'}`}>
                    {myVolunteer.availability ? '● Available' : '○ On Task'}
                  </p>
                </div>
              </div>

              {/* Trust Score Ring */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Trust Score</p>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-black" style={{ color: trustColor }}>{trustPct}%</span>
                    <TrendingUp className="w-4 h-4" style={{ color: trustColor }} />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Tasks Done</p>
                  <p className="text-2xl font-black text-cyan-400">{myVolunteer.tasks_completed}</p>
                </div>
              </div>

              {/* Trust bar */}
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${trustPct}%`, background: `linear-gradient(90deg, ${trustColor}99, ${trustColor})` }}
                />
              </div>

              {/* Skills */}
              <div className="flex flex-wrap gap-1 mt-3">
                {(myVolunteer.skills || []).map((s) => (
                  <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-indigo-900/40 text-indigo-300 border border-indigo-700/30 capitalize">
                    {s.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Layout */}
        <div className="grid lg:grid-cols-[1fr,380px] gap-6">
          {/* Left: Task List */}
          <div>
            {/* Tabs */}
            <div className="glass rounded-xl p-1 flex gap-1 mb-4">
              {[
                { id: 'available', label: '🔔 Available', count: tasks.filter(t => t.status === 'pending').length },
                { id: 'active', label: '⚡ Active', count: tasks.filter(t => t.status === 'active').length },
                { id: 'completed', label: '✅ Completed', count: tasks.filter(t => t.status === 'completed').length },
              ].map(({ id, label, count }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                    activeTab === id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {label}
                  <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                    activeTab === id ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-500'
                  }`}>
                    {count}
                  </span>
                </button>
              ))}
            </div>

            {/* Task Cards */}
            {loading ? (
              <div className="flex items-center justify-center h-48 text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading tasks...
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="glass rounded-xl p-12 text-center text-slate-500">
                <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No {activeTab} tasks</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`glass rounded-xl border ${URGENCY_BG[task.urgency]} cursor-pointer card-hover overflow-hidden`}
                    onClick={() => setSelectedTask(task)}
                  >
                    {/* Urgency accent */}
                    <div className="h-1 w-full" style={{ background: URGENCY_COLORS[task.urgency] }} />

                    <div className="p-4">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                            style={{ background: `${URGENCY_COLORS[task.urgency]}20` }}
                          >
                            {NEED_ICONS[task.need_type] || '📋'}
                          </div>
                          <div>
                            <h3 className="text-white font-bold capitalize">{task.need_type} Assistance</h3>
                            <p className="text-slate-400 text-xs mt-0.5">{task.location?.address}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <span className={`badge-${task.urgency} px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider`}>
                            {task.urgency}
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-slate-300 text-sm leading-relaxed mb-3 line-clamp-2">{task.description}</p>

                      {/* Meta */}
                      <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-indigo-400" />{task.duration_hours}h</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-cyan-400" />{task.location?.address?.split(',')[0]}</span>
                        <span className="flex items-center gap-1">👥 {task.people_affected?.toLocaleString()}</span>
                      </div>

                      {/* Action buttons */}
                      {task.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleAccept(task) }}
                            className="flex-1 btn-success text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-1.5"
                          >
                            <Zap className="w-4 h-4" /> Accept Task
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleReject(task) }}
                            className="px-4 btn-danger text-white font-semibold py-2 rounded-xl text-sm"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                      {task.status === 'active' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleComplete(task) }}
                          className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                        >
                          <CheckCircle className="w-4 h-4" /> Mark as Completed
                        </button>
                      )}
                      {task.status === 'completed' && (
                        <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm font-semibold py-1">
                          <Trophy className="w-4 h-4" /> Completed
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Map */}
          <div className="space-y-4">
            <div className="glass rounded-xl overflow-hidden" style={{ height: '400px' }}>
              <MapContainer center={INDIA_CENTER} zoom={5} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                />
                {tasks.filter(t => t.status === 'pending').map((task, i) => (
                  <CircleMarker
                    key={task.id}
                    center={[task.location?.lat || 20, task.location?.lng || 78]}
                    radius={8}
                    pathOptions={{
                      color: URGENCY_COLORS[task.urgency],
                      fillColor: URGENCY_COLORS[task.urgency],
                      fillOpacity: 0.6,
                      weight: 2,
                    }}
                    eventHandlers={{ click: () => setSelectedTask(task) }}
                  >
                    <Popup>
                      <div style={{ minWidth: 140 }}>
                        <strong>{NEED_ICONS[task.need_type]} {task.need_type}</strong>
                        <br />{task.location?.address}
                        <br />Urgency: <b>{task.urgency}</b>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            </div>

            {/* Leaderboard */}
            <div className="glass rounded-xl p-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-2 mb-3">
                <Trophy className="w-4 h-4 text-amber-400" /> Top Volunteers
              </h3>
              <div className="space-y-2">
                {[...volunteers]
                  .sort((a, b) => (b.trust_score || 0) - (a.trust_score || 0))
                  .slice(0, 5)
                  .map((vol, i) => (
                    <div key={vol.id} className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2.5">
                        <span className={`text-sm font-bold w-5 text-center ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-orange-500' : 'text-slate-600'}`}>
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                        </span>
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white text-xs font-bold">
                          {vol.name?.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white text-xs font-medium">{vol.name}</p>
                          <p className="text-slate-600 text-xs">{vol.tasks_completed} tasks</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm" style={{ color: vol.trust_score >= 0.8 ? '#34d399' : '#fbbf24' }}>
                          {Math.round((vol.trust_score || 0) * 100)}%
                        </p>
                        <div className="flex items-center gap-0.5 justify-end">
                          <Star className="w-3 h-3 text-amber-400 fill-current" />
                          <span className="text-slate-500 text-xs">{vol.rating?.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      {feedbackModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass rounded-2xl p-6 max-w-sm w-full border border-emerald-500/20">
            <h3 className="text-white font-bold text-lg mb-1">Task Complete! 🎉</h3>
            <p className="text-slate-400 text-sm mb-5">Rate your experience for this task to update your trust score.</p>

            <div className="flex gap-2 justify-center mb-6">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setRating(s)}
                  className="transition-transform hover:scale-110"
                >
                  <Star className={`w-8 h-8 ${s <= rating ? 'text-amber-400 fill-current' : 'text-slate-700'}`} />
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setFeedbackModal(null)} className="flex-1 glass-light text-slate-400 py-2.5 rounded-xl text-sm">
                Skip
              </button>
              <button onClick={submitFeedbackForm} className="flex-1 btn-success text-white font-bold py-2.5 rounded-xl text-sm">
                Submit ({rating}★)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
