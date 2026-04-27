import { Clock, MapPin, Users, Zap, CheckCircle, Circle, AlertCircle } from 'lucide-react'

const NEED_ICONS = {
  food: '🍱', water: '💧', shelter: '🏠', medical: '🏥',
  clothing: '👕', education: '📚', sanitation: '🚿', rescue: '🚨',
}

const STATUS_CONFIG = {
  pending: { label: 'Pending', cls: 'badge-pending', icon: Circle },
  active: { label: 'Active', cls: 'badge-active', icon: AlertCircle },
  completed: { label: 'Done', cls: 'badge-completed', icon: CheckCircle },
}

const URGENCY_BORDER = {
  high: 'border-l-red-500',
  medium: 'border-l-amber-500',
  low: 'border-l-emerald-500',
}

export default function TaskCard({ task, onAssign, compact = false }) {
  const statusCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending
  const StatusIcon = statusCfg.icon

  const timeAgo = (iso) => {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  return (
    <div
      className={`glass rounded-xl border-l-4 ${URGENCY_BORDER[task.urgency]} card-hover cursor-pointer p-4 ${
        compact ? 'py-3' : ''
      }`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{NEED_ICONS[task.need_type] || '📋'}</span>
          <div>
            <p className="text-white font-semibold text-sm capitalize leading-tight">
              {task.need_type} Assistance
            </p>
            {!compact && (
              <p className="text-slate-400 text-xs mt-0.5 line-clamp-1">
                {task.location?.address}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`badge-${task.urgency} px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide`}>
            {task.urgency}
          </span>
          <span className={`${statusCfg.cls} px-2 py-0.5 rounded-full text-xs flex items-center gap-1`}>
            <StatusIcon className="w-3 h-3" />
            {statusCfg.label}
          </span>
        </div>
      </div>

      {/* Description */}
      {!compact && (
        <p className="text-slate-300 text-xs leading-relaxed mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Meta row */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3 text-cyan-500" />
            {task.people_affected?.toLocaleString()} affected
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-indigo-400" />
            {task.duration_hours}h
          </span>
        </div>
        <span className="text-slate-600">{timeAgo(task.created_at)}</span>
      </div>

      {/* Assign button */}
      {onAssign && task.status === 'pending' && (
        <button
          onClick={(e) => { e.stopPropagation(); onAssign(task) }}
          className="mt-3 w-full btn-primary text-white text-xs font-semibold py-2 px-3 rounded-lg"
        >
          ⚡ Assign Now
        </button>
      )}
    </div>
  )
}
