import { Star, CheckCircle, Zap, MapPin } from 'lucide-react'

const SKILL_COLORS = {
  medical: 'bg-red-900/40 text-red-300 border-red-700/40',
  driving: 'bg-blue-900/40 text-blue-300 border-blue-700/40',
  cooking: 'bg-orange-900/40 text-orange-300 border-orange-700/40',
  construction: 'bg-stone-900/40 text-stone-300 border-stone-700/40',
  teaching: 'bg-purple-900/40 text-purple-300 border-purple-700/40',
  counseling: 'bg-pink-900/40 text-pink-300 border-pink-700/40',
  first_aid: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/40',
  logistics: 'bg-cyan-900/40 text-cyan-300 border-cyan-700/40',
  translation: 'bg-indigo-900/40 text-indigo-300 border-indigo-700/40',
  technology: 'bg-violet-900/40 text-violet-300 border-violet-700/40',
}

export default function VolunteerCard({ volunteer, matchMetrics, onAccept, onReject }) {
  const trustPct = Math.round((volunteer.trust_score || 0) * 100)
  const trustColor =
    trustPct >= 80 ? 'text-emerald-400' : trustPct >= 60 ? 'text-amber-400' : 'text-red-400'
  const trustRing =
    trustPct >= 80 ? '#34d399' : trustPct >= 60 ? '#fbbf24' : '#f87171'

  return (
    <div className="glass rounded-xl p-4 card-hover border border-indigo-900/20">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-600 to-indigo-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {volunteer.name?.slice(0, 2).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm">{volunteer.name}</p>
          <div className="flex items-center gap-1 text-slate-400 text-xs mt-0.5">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{volunteer.location?.city}</span>
            {matchMetrics?.distance_km !== undefined && (
              <span className="text-cyan-400 font-medium ml-1">
                · {matchMetrics.distance_km} km
              </span>
            )}
          </div>
        </div>

        {/* Trust score ring */}
        <div className="text-center flex-shrink-0">
          <div
            className={`text-lg font-bold stat-value ${trustColor}`}
            style={{ textShadow: `0 0 12px ${trustRing}40` }}
          >
            {trustPct}%
          </div>
          <div className="text-slate-500 text-xs">trust</div>
        </div>
      </div>

      {/* Skills */}
      <div className="flex flex-wrap gap-1 mb-3">
        {(volunteer.skills || []).slice(0, 4).map((skill) => (
          <span
            key={skill}
            className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${
              SKILL_COLORS[skill] || 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            {skill.replace('_', ' ')}
          </span>
        ))}
      </div>

      {/* Match metrics */}
      {matchMetrics && (
        <div className="grid grid-cols-4 gap-1 mb-3">
          {[
            { label: 'Match', value: `${Math.round(matchMetrics.score * 100)}%`, color: 'text-indigo-400' },
            { label: 'Skill', value: `${Math.round(matchMetrics.skill_match * 100)}%`, color: 'text-cyan-400' },
            { label: 'Nearby', value: `${Math.round(matchMetrics.proximity * 100)}%`, color: 'text-purple-400' },
            { label: 'Avail', value: matchMetrics.availability ? '✓' : '✗', color: matchMetrics.availability ? 'text-emerald-400' : 'text-red-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center glass-light rounded-lg p-1.5">
              <div className={`font-bold text-sm ${color}`}>{value}</div>
              <div className="text-slate-500 text-xs">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Stats row */}
      <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
        <span className="flex items-center gap-1">
          <CheckCircle className="w-3 h-3 text-emerald-400" />
          {volunteer.tasks_completed} tasks done
        </span>
        <span className="flex items-center gap-1">
          <Star className="w-3 h-3 text-amber-400 fill-current" />
          {volunteer.rating?.toFixed(1)}
        </span>
        <span className={volunteer.availability ? 'text-emerald-400' : 'text-red-400'}>
          {volunteer.availability ? '● Available' : '○ Busy'}
        </span>
      </div>

      {/* Action buttons */}
      {(onAccept || onReject) && (
        <div className="flex gap-2 mt-1">
          {onAccept && (
            <button
              onClick={() => onAccept(volunteer)}
              className="flex-1 btn-success text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1"
            >
              <Zap className="w-3.5 h-3.5" /> Accept
            </button>
          )}
          {onReject && (
            <button
              onClick={() => onReject(volunteer)}
              className="flex-1 btn-danger text-white text-xs font-bold py-2 rounded-lg"
            >
              Decline
            </button>
          )}
        </div>
      )}
    </div>
  )
}
