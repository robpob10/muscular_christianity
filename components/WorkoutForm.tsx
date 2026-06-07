'use client'

import { useState, useEffect } from 'react'

interface User { id: number; name: string }
interface Exercise { id: number; name: string }
interface WorkoutFormProps { user: User; exercise: Exercise; onLogged: () => void }
interface SetRow { weight: string; reps: string }

function emptyRows(): SetRow[] {
  return Array.from({ length: 5 }, () => ({ weight: '', reps: '' }))
}

export default function WorkoutForm({ user, exercise, onLogged }: WorkoutFormProps) {
  const [rows, setRows] = useState<SetRow[]>(emptyRows())
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  // Auto-fill with the last session's values for this user + exercise
  useEffect(() => {
    fetch(`/api/workouts?userId=${user.id}&exerciseId=${exercise.id}`)
      .then(r => r.json())
      .then((logs: { weight_kg: string; reps: number }[]) => {
        if (!Array.isArray(logs) || logs.length === 0) return
        const last = logs.slice(-5)
        const filled: SetRow[] = last.map(l => ({
          weight: parseFloat(l.weight_kg).toString(),
          reps: l.reps.toString(),
        }))
        // Pad to 5 rows
        while (filled.length < 5) filled.push({ weight: '', reps: '' })
        setRows(filled)
      })
      .catch(() => {})
  }, [user.id, exercise.id])

  function updateRow(i: number, field: 'weight' | 'reps', value: string) {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const filled = rows.filter(r => r.weight && r.reps && parseFloat(r.weight) > 0 && parseInt(r.reps) > 0)
    if (filled.length === 0) { setError('Fill in at least one set'); return }

    setLoading(true)
    setError('')

    try {
      for (const row of filled) {
        const res = await fetch('/api/workouts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id, exerciseId: exercise.id,
            weightKg: parseFloat(row.weight), reps: parseInt(row.reps), sets: 1,
          }),
        })
        if (!res.ok) {
          const { error } = await res.json().catch(() => ({}))
          throw new Error(error || 'Failed to log')
        }
      }
      setSuccess(true)
      onLogged()
      setTimeout(() => setSuccess(false), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log workout.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-leather-800 rounded-2xl p-4 border border-leather-600">
      <form onSubmit={handleSubmit} className="space-y-2">
        {/* Headers */}
        <div className="grid gap-2 text-xs font-medium text-leather-100 uppercase tracking-wide"
          style={{ gridTemplateColumns: '1.25rem 1fr 1fr' }}>
          <div />
          <div className="text-center">kg</div>
          <div className="text-center">reps</div>
        </div>

        {rows.map((row, i) => (
          <div key={i} className="grid gap-2 items-center" style={{ gridTemplateColumns: '1.25rem 1fr 1fr' }}>
            <span className="text-xs text-leather-400 text-right">{i + 1}</span>
            <input
              type="number"
              value={row.weight}
              onChange={e => updateRow(i, 'weight', e.target.value)}
              placeholder="—"
              min="0" step="0.5"
              className="min-w-0 w-full bg-leather-700 border border-leather-600 rounded-lg px-2 py-2 text-leather-100 placeholder-leather-500 focus:outline-none focus:ring-1 focus:ring-leather-300 text-sm text-center transition"
            />
            <input
              type="number"
              value={row.reps}
              onChange={e => updateRow(i, 'reps', e.target.value)}
              placeholder="—"
              min="1"
              className="min-w-0 w-full bg-leather-700 border border-leather-600 rounded-lg px-2 py-2 text-leather-100 placeholder-leather-500 focus:outline-none focus:ring-1 focus:ring-leather-300 text-sm text-center transition"
            />
          </div>
        ))}

        {error && <p className="text-gym-red text-xs pt-1">{error}</p>}

        {success && (
          <div className="flex items-center gap-2 text-leather-300 text-sm font-medium pt-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Logged!
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gym-yellow hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-leather-900 font-bold py-3 rounded-lg transition uppercase tracking-wide text-sm mt-1"
        >
          {loading ? 'Logging...' : 'Spread the Holy Word'}
        </button>
      </form>
    </div>
  )
}
