import { useEffect, useState } from 'react'
import { getTasks, getVolunteers } from '../services/api'
import { Activity, Users, AlertTriangle, CheckCircle } from 'lucide-react'

function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const step = Math.ceil(value / 40)
    let cur = 0
    const timer = setInterval(() => {
      cur = Math.min(cur + step, value)
      setDisplay(cur)
      if (cur >= value) clearInterval(timer)
    }, 30)
    return () => clearInterval(timer)
  }, [value])
  return <span className="stat-value">{display}</span>
}

export default function StatsBar() {
  const [stats, setStats] = useState({ total: 0, high: 0, active: 0, volunteers: 0 })

  const load = async () => {
    try {
      const [tasks, vols] = await Promise.all([getTasks(), getVolunteers()])
      const t = tasks.tasks || []
      const v = vols.volunteers || []
      setStats({
        total: t.length,
        high: t.filter((x) => x.urgency === 'high').length,
        active: t.filter((x) => x.status === 'active').length,
        volunteers: v.filter((x) => x.availability).length,
      })
    } catch { /* silent */ }
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 30000)
    return () => clearInterval(id)
  }, [])

  const items = [
    { label: 'Total Tasks', value: stats.total, icon: Activity, color: 'text-cyan-400', glow: '#06b6d4' },
    { label: 'High Urgency', value: stats.high, icon: AlertTriangle, color: 'text-red-400', glow: '#ef4444' },
    { label: 'Active Tasks', value: stats.active, icon: CheckCircle, color: 'text-indigo-400', glow: '#6366f1' },
    { label: 'Available Vols', value: stats.volunteers, icon: Users, color: 'text-emerald-400', glow: '#34d399' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {items.map(({ label, value, icon: Icon, color, glow }) => (
        <div
          key={label}
          className="glass rounded-xl p-4 flex items-center gap-3 card-hover"
          style={{ boxShadow: `0 0 16px ${glow}15` }}
        >
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: `${glow}15`, border: `1px solid ${glow}30` }}
          >
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
          <div>
            <p className={`text-2xl font-bold ${color}`}>
              <AnimatedNumber value={value} />
            </p>
            <p className="text-slate-500 text-xs mt-0.5">{label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
