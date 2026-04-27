import { Link } from 'react-router-dom'
import { Mic, Map, Users, Zap, Shield, Bell, ArrowRight, Activity, Globe, Brain } from 'lucide-react'

const roles = [
  {
    to: '/field-worker',
    icon: Mic,
    title: 'Field Worker',
    subtitle: 'Voice-to-Task Reporter',
    desc: 'Record voice reports from the field. AI converts speech into structured emergency tasks in any language.',
    gradient: 'from-red-600 to-orange-500',
    glow: '#ef4444',
    features: ['🎙️ Voice recording', '🌐 Multi-language', '⚡ AI processing'],
  },
  {
    to: '/ngo-dashboard',
    icon: Map,
    title: 'NGO Admin',
    subtitle: 'Live Coordination Dashboard',
    desc: 'Real-time heatmap of active needs. Manage tasks, match volunteers, and track operations across India.',
    gradient: 'from-indigo-600 to-cyan-500',
    glow: '#6366f1',
    features: ['🗺️ Live heatmap', '📊 Analytics', '🤖 AI matching'],
  },
  {
    to: '/volunteer',
    icon: Users,
    title: 'Volunteer',
    subtitle: 'Task Acceptance Interface',
    desc: 'Receive smart-matched tasks based on your skills and proximity. Track your impact and trust score.',
    gradient: 'from-purple-600 to-pink-500',
    glow: '#8b5cf6',
    features: ['🔔 Push alerts', '📍 Map routing', '⭐ Trust score'],
  },
]

const features = [
  { icon: Mic, title: 'Voice-to-Task AI', desc: 'Field workers record voice reports that are instantly parsed into structured tasks.' },
  { icon: Brain, title: 'Smart Matching', desc: 'Volunteers scored on skills, proximity, availability, and trust score.' },
  { icon: Globe, title: 'Prediction Engine', desc: 'RandomForest model predicts upcoming need zones based on historical patterns.' },
  { icon: Bell, title: 'Push Notifications', desc: 'Top 3 matched volunteers receive instant FCM notifications for every new task.' },
  { icon: Shield, title: 'Trust System', desc: 'Dynamic trust scores update after each task based on rating and response time.' },
  { icon: Activity, title: 'Real-time Updates', desc: 'Firebase Firestore listeners propagate task status changes across all dashboards.' },
]

export default function Home() {
  return (
    <div className="min-h-screen pt-16">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-24 sm:py-32 text-center">
        {/* Background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
          <div className="absolute -top-16 -right-16 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-64 bg-purple-600/8 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-light text-sm font-medium text-cyan-400 mb-8 border border-cyan-500/20">
            <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            AI-Powered · Real-time · Voice-first
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-7xl font-black text-white mb-6 leading-[1.05] tracking-tight">
            Coordinate Relief
            <br />
            <span className="gradient-text">at the Speed of Voice</span>
          </h1>

          <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            SevAI transforms field voice reports into structured tasks, predicts future needs,
            and matches the right volunteers — all in real time.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/field-worker"
              className="btn-primary text-white font-bold px-8 py-4 rounded-xl flex items-center gap-2 text-base"
            >
              <Mic className="w-5 h-5" /> Start Recording
            </Link>
            <Link
              to="/ngo-dashboard"
              className="glass-light text-white font-semibold px-8 py-4 rounded-xl flex items-center gap-2 text-base border border-white/10 hover:border-white/20 transition-all"
            >
              <Map className="w-5 h-5" /> View Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Role Cards */}
      <section className="px-4 py-12 max-w-6xl mx-auto">
        <h2 className="text-center text-3xl font-bold text-white mb-2">Choose Your Role</h2>
        <p className="text-center text-slate-500 mb-10">Three tailored interfaces for every stakeholder</p>

        <div className="grid md:grid-cols-3 gap-6">
          {roles.map(({ to, icon: Icon, title, subtitle, desc, gradient, glow, features: f }) => (
            <Link
              key={to}
              to={to}
              className="glass rounded-2xl p-6 card-hover group border border-transparent hover:border-indigo-500/30 transition-all duration-300"
              style={{ boxShadow: `0 0 0 0 ${glow}` }}
            >
              {/* Icon */}
              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform`}
                style={{ boxShadow: `0 0 24px ${glow}40` }}
              >
                <Icon className="w-7 h-7 text-white" />
              </div>

              <div className="mb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">{subtitle}</div>
              <h3 className="text-white text-xl font-bold mb-3">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-5">{desc}</p>

              <div className="space-y-1.5 mb-5">
                {f.map((ft) => (
                  <div key={ft} className="flex items-center gap-2 text-slate-300 text-sm">{ft}</div>
                ))}
              </div>

              <div className="flex items-center gap-2 text-sm font-semibold text-white group-hover:gap-3 transition-all">
                Open {title} <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-16 max-w-6xl mx-auto">
        <h2 className="text-center text-3xl font-bold text-white mb-2">How SevAI Works</h2>
        <p className="text-center text-slate-500 mb-12">End-to-end from voice to completed task</p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 flex-wrap">
          {[
            { step: 1, label: 'Voice Report', emoji: '🎙️', color: '#ef4444' },
            { step: 2, label: 'Speech → Text', emoji: '📝', color: '#f59e0b' },
            { step: 3, label: 'AI Structuring', emoji: '🧠', color: '#8b5cf6' },
            { step: 4, label: 'Task Created', emoji: '✅', color: '#06b6d4' },
            { step: 5, label: 'Volunteer Matched', emoji: '🤝', color: '#6366f1' },
            { step: 6, label: 'Task Completed', emoji: '🏆', color: '#34d399' },
          ].map(({ step, label, emoji, color }, i, arr) => (
            <div key={step} className="flex items-center gap-2">
              <div className="text-center">
                <div
                  className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center glass border text-lg mb-1"
                  style={{ borderColor: `${color}30`, background: `${color}10` }}
                >
                  {emoji}
                </div>
                <p className="text-xs text-slate-400 w-16 text-center leading-tight">{label}</p>
              </div>
              {i < arr.length - 1 && (
                <ArrowRight className="w-4 h-4 text-slate-700 flex-shrink-0 mb-5" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-4 py-16 max-w-6xl mx-auto">
        <h2 className="text-center text-3xl font-bold text-white mb-2">Platform Features</h2>
        <p className="text-center text-slate-500 mb-12">Everything you need for effective volunteer coordination</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass rounded-xl p-5 card-hover border border-indigo-900/20">
              <div className="w-10 h-10 rounded-lg bg-indigo-600/15 border border-indigo-500/20 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-indigo-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-indigo-900/20 py-8 text-center text-slate-600 text-sm">
        <p>SevAI — AI-Powered Volunteer Coordination Platform · Built with FastAPI + React + Groq</p>
      </footer>
    </div>
  )
}
