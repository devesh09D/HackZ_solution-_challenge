import { useState, useEffect, useCallback } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { getTasks, getHeatmapData, getPredictions, matchVolunteers, updateStatus } from '../services/api'
import StatsBar from '../components/StatsBar'
import TaskCard from '../components/TaskCard'
import VolunteerCard from '../components/VolunteerCard'
import { Filter, RefreshCw, Zap, Brain, X, Loader2, Map, List } from 'lucide-react'

const URGENCY_COLOR = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' }
const NEED_ICONS = { food: '🍱', water: '💧', shelter: '🏠', medical: '🏥', clothing: '👕', education: '📚', sanitation: '🚿', rescue: '🚨' }
const INDIA_CENTER = [20.5937, 78.9629]

export default function NGODashboard() {
  const [tasks, setTasks] = useState([])
  const [heatmap, setHeatmap] = useState([])
  const [predictions, setPredictions] = useState([])
  const [matches, setMatches] = useState([])
  const [selectedTask, setSelectedTask] = useState(null)
  const [matchPanel, setMatchPanel] = useState(false)
  const [filters, setFilters] = useState({ urgency: '', need_type: '', status: '', city: '' })
  const [loading, setLoading] = useState(true)
  const [matchLoading, setMatchLoading] = useState(false)
  const [view, setView] = useState('map') // 'map' | 'list'
  const [toast, setToast] = useState(null)
  const [showPredictions, setShowPredictions] = useState(true)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const loadData = useCallback(async () => {
    try {
      const [tasksRes, heatRes, predRes] = await Promise.all([
        getTasks(filters),
        getHeatmapData(),
        getPredictions(),
      ])
      setTasks(tasksRes.tasks || [])
      setHeatmap(heatRes.points || [])
      setPredictions(predRes.predictions || [])
    } catch (e) {
      console.error('Failed to load data:', e.message)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    loadData()
    const id = setInterval(loadData, 30000)
    return () => clearInterval(id)
  }, [loadData])

  const handleAssign = async (task) => {
    setSelectedTask(task)
    setMatchPanel(true)
    setMatchLoading(true)
    setMatches([])
    try {
      const res = await matchVolunteers(task.id, [])
      setMatches(res.matches || [])
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setMatchLoading(false)
    }
  }

  const handleAcceptVolunteer = async (volunteer) => {
    if (!selectedTask) return
    try {
      await updateStatus(selectedTask.id, 'active', volunteer.id)
      showToast(`✅ ${volunteer.name} assigned to task!`)
      setMatchPanel(false)
      loadData()
    } catch (e) {
      showToast(e.message, 'error')
    }
  }

  return (
    <div className="min-h-screen pt-20 pb-8 px-4">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 right-4 z-[9999] px-5 py-3 rounded-xl shadow-xl text-sm font-medium flex items-center gap-2 animate-slide-up max-w-sm ${
          toast.type === 'success' ? 'bg-emerald-900/90 text-emerald-300 border border-emerald-700/50' : 'bg-red-900/90 text-red-300 border border-red-700/50'
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 text-indigo-400 text-sm font-semibold">
              <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
              NGO Admin Dashboard
            </div>
            <h1 className="text-3xl font-black text-white mt-1">
              Live Operations <span className="gradient-text">Center</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {/* View toggle */}
            <div className="glass-light rounded-lg p-1 flex gap-1">
              <button
                onClick={() => setView('map')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-all ${
                  view === 'map' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Map className="w-3.5 h-3.5" /> Map
              </button>
              <button
                onClick={() => setView('list')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-all ${
                  view === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <List className="w-3.5 h-3.5" /> List
              </button>
            </div>
            <button
              onClick={loadData}
              className="glass-light rounded-lg px-4 py-2.5 text-slate-400 hover:text-white text-sm flex items-center gap-2 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats */}
        <StatsBar />

        {/* Filters */}
        <div className="glass rounded-xl p-4 mb-4 flex flex-wrap gap-3 items-center">
          <Filter className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-semibold text-slate-400 mr-1">Filters:</span>

          {[
            { key: 'urgency', opts: ['', 'high', 'medium', 'low'], label: 'Urgency' },
            { key: 'need_type', opts: ['', 'food', 'water', 'shelter', 'medical', 'clothing', 'education', 'sanitation', 'rescue'], label: 'Need Type' },
            { key: 'status', opts: ['', 'pending', 'active', 'completed'], label: 'Status' },
          ].map(({ key, opts, label }) => (
            <select
              key={key}
              value={filters[key]}
              onChange={(e) => setFilters((f) => ({ ...f, [key]: e.target.value }))}
              className="bg-[#0a1628] border border-indigo-900/40 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="">{label}: All</option>
              {opts.slice(1).map((o) => (
                <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>
              ))}
            </select>
          ))}

          {Object.values(filters).some(Boolean) && (
            <button
              onClick={() => setFilters({ urgency: '', need_type: '', status: '', city: '' })}
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
          <span className="ml-auto text-xs text-slate-500">{tasks.length} tasks</span>
        </div>

        {/* Main Layout */}
        <div className="grid lg:grid-cols-[380px,1fr] gap-4">
          {/* Sidebar: Task List */}
          <div className="glass rounded-xl overflow-hidden flex flex-col" style={{ maxHeight: '70vh' }}>
            <div className="p-4 border-b border-indigo-900/20 flex items-center justify-between">
              <h2 className="font-bold text-white text-sm">Task Queue</h2>
              <span className="text-xs text-slate-500">{tasks.length} tasks</span>
            </div>
            <div className="overflow-y-auto flex-1 p-3 space-y-3">
              {loading ? (
                <div className="flex items-center justify-center h-32 text-slate-500">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading...
                </div>
              ) : tasks.length === 0 ? (
                <div className="text-center text-slate-600 py-12">No tasks match filters</div>
              ) : (
                tasks.map((task) => (
                  <TaskCard key={task.id} task={task} onAssign={handleAssign} compact />
                ))
              )}
            </div>
          </div>

          {/* Main Content: Map or List */}
          <div className="flex flex-col gap-4">
            {view === 'map' ? (
              <div className="glass rounded-xl overflow-hidden" style={{ height: '70vh' }}>
                <MapContainer
                  center={INDIA_CENTER}
                  zoom={5}
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={true}
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                  />

                  {/* Task heatmap circles */}
                  {heatmap.map((pt, i) => (
                    <CircleMarker
                      key={`heat-${i}`}
                      center={[pt.lat, pt.lng]}
                      radius={10 + pt.intensity * 14}
                      pathOptions={{
                        color: URGENCY_COLOR[pt.urgency] || '#6366f1',
                        fillColor: URGENCY_COLOR[pt.urgency] || '#6366f1',
                        fillOpacity: 0.35 + pt.intensity * 0.3,
                        weight: 1.5,
                        opacity: 0.8,
                      }}
                    >
                      <Tooltip>
                        <div className="text-xs">
                          <strong>{pt.need_type}</strong> · {pt.urgency}
                          <br />{pt.people_affected} people affected
                        </div>
                      </Tooltip>
                      <Popup>
                        <div style={{ minWidth: 160 }}>
                          <strong>{NEED_ICONS[pt.need_type]} {pt.need_type}</strong>
                          <br />Urgency: <b>{pt.urgency}</b>
                          <br />People: {pt.people_affected}
                          <br />Status: {pt.status}
                        </div>
                      </Popup>
                    </CircleMarker>
                  ))}

                  {/* Prediction zones */}
                  {showPredictions && predictions.map((pred, i) => (
                    <CircleMarker
                      key={`pred-${i}`}
                      center={[pred.lat, pred.lng]}
                      radius={20}
                      pathOptions={{
                        color: '#8b5cf6',
                        fillColor: '#8b5cf6',
                        fillOpacity: 0.12,
                        weight: 2,
                        opacity: 0.5,
                        dashArray: '6,4',
                      }}
                    >
                      <Tooltip>
                        <div className="text-xs">
                          🔮 Predicted: <strong>{pred.predicted_need}</strong><br />
                          {pred.city} · {Math.round(pred.probability * 100)}% confidence
                        </div>
                      </Tooltip>
                    </CircleMarker>
                  ))}
                </MapContainer>
              </div>
            ) : (
              <div className="glass rounded-xl p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <div className="grid sm:grid-cols-2 gap-3">
                  {tasks.map((task) => (
                    <TaskCard key={task.id} task={task} onAssign={handleAssign} />
                  ))}
                </div>
              </div>
            )}

            {/* Map Legend + Prediction Toggle */}
            {view === 'map' && (
              <div className="glass rounded-xl p-4 flex flex-wrap items-center gap-4 justify-between">
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Legend</span>
                  {[['high', '#ef4444', 'High Urgency'], ['medium', '#f59e0b', 'Medium'], ['low', '#22c55e', 'Low']].map(([, clr, lbl]) => (
                    <div key={lbl} className="flex items-center gap-1.5 text-xs text-slate-400">
                      <div className="w-3 h-3 rounded-full" style={{ background: clr, opacity: 0.7 }} />
                      {lbl}
                    </div>
                  ))}
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <div className="w-3 h-3 rounded-full border-2 border-dashed border-purple-500" />
                    Predicted Zone
                  </div>
                </div>
                <button
                  onClick={() => setShowPredictions(!showPredictions)}
                  className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                    showPredictions ? 'bg-purple-900/30 text-purple-300 border border-purple-700/30' : 'glass-light text-slate-500'
                  }`}
                >
                  <Brain className="w-3.5 h-3.5" />
                  {showPredictions ? 'Hide' : 'Show'} Predictions
                </button>
              </div>
            )}

            {/* Prediction Panel */}
            {predictions.length > 0 && (
              <div className="glass rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="w-4 h-4 text-purple-400" />
                  <h3 className="font-bold text-white text-sm">AI Predictions — Next 7 Days</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {predictions.slice(0, 10).map((pred) => (
                    <div key={pred.city} className="glass-light rounded-lg p-3 text-center border border-purple-900/20">
                      <div className="text-lg mb-1">{NEED_ICONS[pred.predicted_need] || '📋'}</div>
                      <div className="text-white text-xs font-semibold">{pred.city}</div>
                      <div className="text-purple-400 text-xs capitalize mt-0.5">{pred.predicted_need}</div>
                      <div className="text-slate-500 text-xs">{Math.round(pred.probability * 100)}%</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Match Panel Modal */}
      {matchPanel && selectedTask && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setMatchPanel(false)}>
          <div className="glass rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto border border-indigo-500/30" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5 text-cyan-400" /> Smart Matching
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  score = 0.4·skill + 0.3·proximity + 0.2·availability + 0.1·trust
                </p>
              </div>
              <button onClick={() => setMatchPanel(false)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Task summary */}
            <div className="glass-light rounded-xl p-3 mb-4 border border-indigo-900/20">
              <p className="text-xs text-slate-500 mb-1">Task</p>
              <p className="text-white font-semibold capitalize">
                {selectedTask.need_type} · {selectedTask.urgency} urgency
              </p>
              <p className="text-slate-400 text-xs">{selectedTask.location?.address}</p>
            </div>

            {matchLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                <p className="text-slate-400 text-sm">Scoring volunteers...</p>
              </div>
            ) : matches.length === 0 ? (
              <div className="text-center py-8 text-slate-500">No volunteers available</div>
            ) : (
              <div className="space-y-3">
                {matches.map((vol, i) => (
                  <div key={vol.id}>
                    <div className="text-xs text-slate-600 mb-1.5 flex items-center gap-1.5">
                      <span className="w-5 h-5 bg-indigo-700/40 rounded-full flex items-center justify-center font-bold text-indigo-300">
                        {i + 1}
                      </span>
                      Match #{i + 1}
                    </div>
                    <VolunteerCard
                      volunteer={vol}
                      matchMetrics={vol.match_metrics}
                      onAccept={handleAcceptVolunteer}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
