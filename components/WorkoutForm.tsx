'use client'

import { useState, useEffect } from 'react'

interface User { id: number; name: string }
interface Exercise { id: number; name: string }
interface WorkoutFormProps { user: User; exercise: Exercise; onLogged: () => void }
interface SetRow { weight: string; reps: string }

function todayString() {
  return new Date().toISOString().slice(0, 10)
}

function emptyRows(n = 3): SetRow[] {
  return Array.from({ length: n }, () => ({ weight: '', reps: '' }))
}

const inputCls = 'min-w-0 w-full bg-leather-700 border border-leather-600 rounded-lg px-2 py-2 text-leather-100 placeholder-leather-500 focus:outline-none focus:ring-1 focus:ring-leather-300 text-sm text-center transition'

const CATCHPHRASES = [
  'Let he who is without grip it cast the first rip it!',
  'And then Onan spilled his protein shake on the ground',
  'Jesus, king of the Juiced',
  'On the 7th day god rested. Rest day is important',

]

export default function WorkoutForm({ user, exercise, onLogged }: WorkoutFormProps) {
  const [advanced, setAdvanced] = useState(false)
  const [simpleReps, setSimpleReps] = useState('')
  const [simpleWeight, setSimpleWeight] = useState('')
  const [simpleSets, setSimpleSets] = useState('1')
  const [rows, setRows] = useState<SetRow[]>(emptyRows())
  const [date, setDate] = useState(todayString())
  const [loading, setLoading] = useState(false)
  const [catchphrase, setCatchphrase] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setSimpleReps('')
    setSimpleWeight('')
    setSimpleSets('1')
    setRows(emptyRows())
    setError('')

    fetch(`/api/workouts?userId=${user.id}&exerciseId=${exercise.id}`)
      .then(r => r.json())
      .then((logs: { weight_kg: string; reps: number; logged_at: string }[]) => {
        if (!Array.isArray(logs) || logs.length === 0) return
        // Only prefill from the most recent session (same date as last log)
        const lastDate = new Date(logs[logs.length - 1].logged_at).toDateString()
        const session = logs.filter(l => new Date(l.logged_at).toDateString() === lastDate)
        const last = session[session.length - 1]
        const lastWeight = parseFloat(last.weight_kg)
        setSimpleReps(last.reps.toString())
        setSimpleWeight(lastWeight > 0 ? lastWeight.toString() : '')
        setSimpleSets(session.length.toString())
        const advRows: SetRow[] = session.map(l => ({
          weight: parseFloat(l.weight_kg) > 0 ? parseFloat(l.weight_kg).toString() : '',
          reps: l.reps.toString(),
        }))
        setRows([...advRows, { weight: '', reps: '' }])
      })
      .catch(() => {})
  }, [user.id, exercise.id])

  function updateRow(i: number, field: 'weight' | 'reps', value: string) {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    let toLog: { weightKg: number; reps: number }[]

    if (!advanced) {
      const reps = parseInt(simpleReps)
      const sets = parseInt(simpleSets) || 1
      const weight = simpleWeight ? parseFloat(simpleWeight) : 0
      if (!reps || reps <= 0) { setError('Enter reps'); return }
      toLog = Array.from({ length: sets }, () => ({ weightKg: weight, reps }))
    } else {
      const filled = rows.filter(r => parseInt(r.reps) > 0)
      if (filled.length === 0) { setError('Fill in at least one set'); return }
      toLog = filled.map(r => ({
        weightKg: r.weight ? parseFloat(r.weight) : 0,
        reps: parseInt(r.reps),
      }))
    }

    setLoading(true)
    try {
      for (const entry of toLog) {
        const res = await fetch('/api/workouts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id, exerciseId: exercise.id,
            weightKg: entry.weightKg, reps: entry.reps, sets: 1,
            loggedAt: date,
          }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || 'Failed to log')
        }
      }
      setCatchphrase(CATCHPHRASES[Math.floor(Math.random() * CATCHPHRASES.length)])
      onLogged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log workout.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-leather-800 rounded-2xl p-4 border border-leather-600">
      <form onSubmit={handleSubmit} className="space-y-2">

        {!advanced ? (
          <>
            <div className="grid gap-2 text-xs font-medium text-leather-400 uppercase tracking-wide"
              style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
              <div className="text-center">Reps</div>
              <div className="text-center">kg</div>
              <div className="text-center">Sets</div>
            </div>
            <div className="grid gap-2" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
              <input type="number" value={simpleReps} onChange={e => setSimpleReps(e.target.value)}
                placeholder="—" min="1" className={inputCls} />
              <input type="number" value={simpleWeight} onChange={e => setSimpleWeight(e.target.value)}
                placeholder="BW" min="0" step="0.5" className={inputCls} />
              <input type="number" value={simpleSets} onChange={e => setSimpleSets(e.target.value)}
                placeholder="1" min="1" className={inputCls} />
            </div>
          </>
        ) : (
          <>
            <div className="grid gap-2 text-xs font-medium text-leather-400 uppercase tracking-wide"
              style={{ gridTemplateColumns: '1.25rem 1fr 1fr' }}>
              <div />
              <div className="text-center">Reps</div>
              <div className="text-center">kg</div>
            </div>
            {rows.map((row, i) => (
              <div key={i} className="grid gap-2 items-center" style={{ gridTemplateColumns: '1.25rem 1fr 1fr' }}>
                <span className="text-xs text-leather-400 text-right">{i + 1}</span>
                <input type="number" value={row.reps} onChange={e => updateRow(i, 'reps', e.target.value)}
                  placeholder="—" min="1" className={inputCls} />
                <input type="number" value={row.weight} onChange={e => updateRow(i, 'weight', e.target.value)}
                  placeholder="BW" min="0" step="0.5" className={inputCls} />
              </div>
            ))}
            <button type="button" onClick={() => setRows(r => [...r, { weight: '', reps: '' }])}
              className="text-xs text-leather-500 hover:text-leather-300 transition w-full text-center py-0.5">
              + Add set
            </button>
          </>
        )}

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <label className="text-xs text-leather-400 uppercase tracking-wide shrink-0">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="bg-leather-700 border border-leather-600 rounded-lg px-2 py-1.5 text-leather-100 focus:outline-none focus:ring-1 focus:ring-leather-300 text-sm transition" />
          </div>
          <button type="button" onClick={() => setAdvanced(a => !a)}
            className="text-xs text-leather-500 hover:text-leather-300 transition">
            {advanced ? '− Basic' : '+ Advanced'}
          </button>
        </div>

        {error && <p className="text-gym-red text-xs pt-1">{error}</p>}

        <button type="submit" disabled={loading}
          className="w-full bg-gym-yellow hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-leather-900 font-bold py-3 rounded-lg transition uppercase tracking-wide text-sm mt-1">
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
