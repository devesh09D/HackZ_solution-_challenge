import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Send, RefreshCw, Globe, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { processVoiceInput, createTask } from '../services/api'

const LANGUAGES = [
  { code: 'en-IN', label: 'English (India)' },
  { code: 'hi-IN', label: 'हिंदी (Hindi)' },
  { code: 'ta-IN', label: 'தமிழ் (Tamil)' },
  { code: 'te-IN', label: 'తెలుగు (Telugu)' },
  { code: 'bn-IN', label: 'বাংলা (Bengali)' },
  { code: 'mr-IN', label: 'मराठी (Marathi)' },
  { code: 'gu-IN', label: 'ગુજરાતી (Gujarati)' },
  { code: 'kn-IN', label: 'ಕನ್ನಡ (Kannada)' },
  { code: 'ml-IN', label: 'മലയാളം (Malayalam)' },
  { code: 'pa-IN', label: 'ਪੰਜਾਬੀ (Punjabi)' },
]

const NEED_TYPE_ICONS = {
  food: '🍱', water: '💧', shelter: '🏠', medical: '🏥',
  clothing: '👕', education: '📚', sanitation: '🚿', rescue: '🚨',
}

const URGENCY_COLORS = { high: 'text-red-400', medium: 'text-amber-400', low: 'text-emerald-400' }

export default function FieldWorker() {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [language, setLanguage] = useState('en-IN')
  const [structured, setStructured] = useState(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState(null)
  const [error, setError] = useState(null)
  const recognitionRef = useRef(null)
  const interimRef = useRef('')

  // Show toast notification
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Start browser-native speech recognition
  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser. Please use Chrome or Edge.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = language
    recognition.continuous = true
    recognition.interimResults = true
    recognitionRef.current = recognition

    recognition.onstart = () => setIsRecording(true)

    recognition.onresult = (e) => {
      let interim = '', final = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) final += t
        else interim += t
      }
      interimRef.current = interim
      setTranscript((prev) => prev + final)
    }

    recognition.onend = () => {
      setIsRecording(false)
      interimRef.current = ''
    }

    recognition.onerror = (e) => {
      setIsRecording(false)
      if (e.error !== 'no-speech') setError(`Recording error: ${e.error}`)
    }

    setTranscript('')
    setStructured(null)
    setError(null)
    recognition.start()
  }

  const stopRecording = () => {
    recognitionRef.current?.stop()
    setIsRecording(false)
  }

  const toggleRecording = () => {
    if (isRecording) stopRecording()
    else startRecording()
  }

  // Process transcript via AI
  const processTranscript = async () => {
    if (!transcript.trim()) { setError('No transcript to process. Please record first.'); return }
    setLoading(true)
    setError(null)
    try {
      const result = await processVoiceInput(transcript, language)
      setStructured(result.structured)
      showToast('AI processing complete!', 'success')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // Submit structured task to backend
  const submitTask = async () => {
    if (!structured) return
    setSubmitting(true)
    try {
      await createTask({ ...structured, duration_hours: 4, estimated_volunteers: 2 })
      showToast('✅ Task created and live on dashboard!', 'success')
      setTranscript('')
      setStructured(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Load a demo transcript for testing without mic
  const loadDemo = () => {
    setTranscript('There is a serious flood situation in Mumbai near Dharavi area. About 300 families are stranded without food and clean water. Situation is very critical and we need urgent rescue and food assistance immediately.')
    setStructured(null)
  }

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 max-w-4xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 right-4 z-50 px-5 py-3 rounded-xl shadow-xl text-sm font-medium flex items-center gap-2 animate-slide-up ${
          toast.type === 'success' ? 'bg-emerald-900/90 text-emerald-300 border border-emerald-700/50' : 'bg-red-900/90 text-red-300 border border-red-700/50'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-light border border-red-500/20 text-red-400 text-sm font-medium mb-4">
          <Mic className="w-4 h-4" /> Field Worker Portal
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-white mb-3">
          Voice-to-Task
          <span className="gradient-text"> Reporter</span>
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto">
          Press the microphone, describe the situation in any language, and AI converts it to a structured emergency task.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Recording Panel */}
        <div className="space-y-4">
          {/* Language selector */}
          <div className="glass rounded-xl p-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-3">
              <Globe className="w-4 h-4 text-cyan-400" /> Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full bg-[#0a1628] border border-indigo-900/40 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </div>

          {/* Microphone Button */}
          <div className="glass rounded-2xl p-8 flex flex-col items-center gap-6">
            {/* Big mic button */}
            <div className="relative">
              <button
                onClick={toggleRecording}
                className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isRecording
                    ? 'bg-red-600 mic-recording glow-red scale-110'
                    : 'bg-gradient-to-br from-cyan-600 to-indigo-700 hover:scale-105 glow-indigo'
                }`}
                title={isRecording ? 'Stop recording' : 'Start recording'}
              >
                {isRecording ? (
                  <MicOff className="w-14 h-14 text-white" />
                ) : (
                  <Mic className="w-14 h-14 text-white" />
                )}
              </button>
              {isRecording && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                  REC
                </span>
              )}
            </div>

            {/* Waveform animation */}
            {isRecording ? (
              <div className="flex items-center gap-1.5 h-8">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-gradient-to-t from-red-500 to-orange-400 rounded-full wave-bar"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm text-center">
                {transcript ? 'Recording complete. Process it →' : 'Tap to start recording your report'}
              </p>
            )}

            <p className="text-slate-600 text-xs text-center">
              Uses browser Web Speech API · Chrome/Edge recommended
            </p>
          </div>

          {/* Demo button */}
          <button
            onClick={loadDemo}
            className="w-full glass-light rounded-xl py-3 px-4 text-slate-400 text-sm font-medium flex items-center justify-center gap-2 hover:text-white hover:border-indigo-500/30 transition-all border border-transparent"
          >
            <RefreshCw className="w-4 h-4" /> Load Demo Transcript
          </button>
        </div>

        {/* Right: Transcript + Structured Output */}
        <div className="space-y-4">
          {/* Transcript Display */}
          <div className="glass rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-slate-300">📝 Transcript</label>
              {transcript && (
                <button onClick={() => { setTranscript(''); setStructured(null) }} className="text-xs text-slate-600 hover:text-red-400 transition-colors">
                  Clear
                </button>
              )}
            </div>
            <div className="min-h-[100px] bg-[#060e1c] rounded-lg p-3 text-slate-300 text-sm leading-relaxed border border-indigo-900/20">
              {transcript || (
                <span className="text-slate-600 italic">
                  Transcript will appear here as you speak...
                </span>
              )}
              {isRecording && interimRef.current && (
                <span className="text-slate-500 italic"> {interimRef.current}</span>
              )}
            </div>

            {/* Process button */}
            {transcript && !structured && (
              <button
                onClick={processTranscript}
                disabled={loading}
                className="mt-3 w-full btn-primary text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {loading ? 'Processing with AI...' : '🧠 Process with AI'}
              </button>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="glass rounded-xl p-3 border border-red-500/30 text-red-400 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Structured Output Preview */}
          {structured && (
            <div className="glass rounded-xl p-5 border border-indigo-500/20 animate-fade-in">
              <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                Structured Task Preview
              </h3>

              <div className="space-y-3">
                <PreviewRow label="Need Type" value={`${NEED_TYPE_ICONS[structured.need_type] || '📋'} ${structured.need_type}`} />
                <PreviewRow
                  label="Urgency"
                  value={structured.urgency}
                  valueClass={`font-bold uppercase ${URGENCY_COLORS[structured.urgency]}`}
                />
                <PreviewRow label="Location" value={structured.location?.address} />
                <PreviewRow
                  label="Coordinates"
                  value={`${structured.location?.lat?.toFixed(4)}, ${structured.location?.lng?.toFixed(4)}`}
                />
                <PreviewRow label="People Affected" value={`~${structured.people_affected?.toLocaleString()}`} />
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Description</span>
                  <p className="text-slate-300 text-sm leading-relaxed bg-[#060e1c] rounded-lg p-3 border border-indigo-900/20">
                    {structured.description}
                  </p>
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={submitTask}
                disabled={submitting}
                className="mt-5 w-full btn-success text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60 text-base"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                {submitting ? 'Creating Task...' : '🚀 Submit Task to Dashboard'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function PreviewRow({ label, value, valueClass = 'text-white' }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs text-slate-500 uppercase tracking-wider flex-shrink-0 mt-0.5">{label}</span>
      <span className={`text-sm ${valueClass} text-right capitalize`}>{value}</span>
    </div>
  )
}
