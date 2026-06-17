'use client'

import { useState, useEffect } from 'react'

interface User { id: number; name: string }
interface Exercise { id: number; name: string }
interface WorkoutFormProps { user: User; exercise: Exercise; onLogged: () => void }

function todayString() {
  return new Date().toISOString().slice(0, 10)
}

const inputCls = 'min-w-0 w-full bg-leather-900 border border-leather-700 rounded-xl px-2 py-2 text-white placeholder-leather-600 focus:outline-none focus:border-leather-500 text-sm text-center transition'

const CATCHPHRASES = [
  'Let he who is without grip it cast the first rip it!',
  'And then Onan spilled his protein shake on the ground',
  'Jesus, king of the Juiced',
  'On the 7th day god rested. Rest day is important',
]

export default function WorkoutForm({ user, exercise, onLogged }: WorkoutFormProps) {
  const [reps, setReps] = useState('')
  const [weight, setWeight] = useState('')
  const [date, setDate] = useState(todayString())
  const [loading, setLoading] = useState(false)
  const [catchphrase, setCatchphrase] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setReps('')
    setWeight('')
    setError('')

    fetch(`/api/workouts?userId=${user.id}&exerciseId=${exercise.id}`)
      .then(r => r.json())
      .then((logs: { weight_kg: string; reps: number; logged_at: string }[]) => {
        if (!Array.isArray(logs) || logs.length === 0) return
        const last = logs[logs.length - 1]
        setReps(last.reps.toString())
        const w = parseFloat(last.weight_kg)
        setWeight(w > 0 ? w.toString() : '')
      })
      .catch(() => {})
  }, [user.id, exercise.id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const parsedReps = parseInt(reps)
    if (!parsedReps || parsedReps <= 0) { setError('Enter reps'); return }
    const weightKg = weight ? parseFloat(weight) : 0

    setLoading(true)
    try {
      const res = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id, exerciseId: exercise.id,
          weightKg, reps: parsedReps, sets: 1,
          loggedAt: date,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to log')
      }
      setCatchphrase(CATCHPHRASES[Math.floor(Math.random() * CATCHPHRASES.length)])
      onLogged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log workout.')
    } finally {
      setLoading(false)
    }
  }

  const GRAD = 'linear-gradient(135deg, #f87171 0%, #fb923c 50%, #A67C52 100%)'

  return (
    <div className="px-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-3 text-xs font-medium text-leather-400 uppercase tracking-wide"
          style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="text-center">Reps</div>
          <div className="text-center">kg</div>
        </div>
        <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <input type="number" value={reps} onChange={e => setReps(e.target.value)}
            placeholder="—" min="1" className={inputCls} />
          <input type="number" value={weight} onChange={e => setWeight(e.target.value)}
            placeholder="BW" min="0" step="0.5" className={inputCls} />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-leather-400 uppercase tracking-wide shrink-0">Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="bg-leather-900 border border-leather-700 rounded-xl px-2 py-1.5 text-white focus:outline-none focus:border-leather-500 text-sm transition" />
        </div>

        {error && <p className="text-gym-red text-xs pt-1">{error}</p>}

        <button type="submit" disabled={loading}
          style={{
            background: `linear-gradient(#000, #000) padding-box, ${GRAD} border-box`,
            border: '2px solid transparent',
          }}
          className="w-full disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition uppercase tracking-wide text-sm mt-1 hover:opacity-80">
          {loading ? 'Logging...' : 'Spread the Holy Word'}
        </button>
      </form>

      {catchphrase && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-leather-900/80"
          onClick={() => setCatchphrase(null)}
        >
          <div className="bg-leather-800 border border-leather-600 rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="w-10 h-10 rounded-full bg-gym-yellow flex items-center justify-center mx-auto mb-5">
              <svg className="w-5 h-5 text-leather-900" viewBox="0 0 24 24" fill="currentColor">
                <rect x="10.5" y="2" width="3" height="20" rx="1" />
                <rect x="4" y="7" width="16" height="3" rx="1" />
              </svg>
            </div>
            <p className="text-leather-100 text-base leading-relaxed break-words">{catchphrase}</p>
            <button
              onClick={() => setCatchphrase(null)}
              className="mt-6 text-xs text-leather-400 hover:text-leather-100 uppercase tracking-widest transition"
            >
              Amen
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
