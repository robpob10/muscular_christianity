'use client'

import { useState } from 'react'

interface User { id: number; name: string }
interface Exercise { id: number; name: string }
interface WorkoutFormProps { user: User; exercise: Exercise; onLogged: () => void }

interface SetRow { weight: string; reps: string }

const EMPTY_ROWS: SetRow[] = Array.from({ length: 5 }, () => ({ weight: '', reps: '' }))

export default function WorkoutForm({ user, exercise, onLogged }: WorkoutFormProps) {
  const [rows, setRows] = useState<SetRow[]>(EMPTY_ROWS.map(r => ({ ...r })))
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

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
            userId: user.id,
            exerciseId: exercise.id,
            weightKg: parseFloat(row.weight),
            reps: parseInt(row.reps),
            sets: 1,
          }),
        })
        if (!res.ok) {
          const { error } = await res.json().catch(() => ({}))
          throw new Error(error || 'Failed to log workout')
        }
      }

      setSuccess(true)
      setRows(EMPTY_ROWS.map(r => ({ ...r })))
      onLogged()
      setTimeout(() => setSuccess(false), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log workout.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-leather-800 rounded-2xl p-6 border border-leather-600">
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Column headers */}
        <div className="grid grid-cols-[2rem_1fr_1fr] gap-3">
          <div />
          <label className="text-xs font-medium text-leather-100 uppercase tracking-wide">Weight (kg)</label>
          <label className="text-xs font-medium text-leather-100 uppercase tracking-wide">Reps</label>
        </div>

        {rows.map((row, i) => (
          <div key={i} className="grid grid-cols-[2rem_1fr_1fr] gap-3 items-center">
            <span className="text-xs text-leather-400 text-right">{i + 1}</span>
            <input
              type="number"
              value={row.weight}
              onChange={e => updateRow(i, 'weight', e.target.value)}
              placeholder="—"
              min="0"
              step="0.5"
              className="bg-leather-700 border border-leather-600 rounded-lg px-3 py-2 text-leather-100 placeholder-leather-500 focus:outline-none focus:ring-2 focus:ring-leather-300 focus:border-transparent text-sm transition"
            />
            <input
              type="number"
              value={row.reps}
              onChange={e => updateRow(i, 'reps', e.target.value)}
              placeholder="—"
              min="1"
              className="bg-leather-700 border border-leather-600 rounded-lg px-3 py-2 text-leather-100 placeholder-leather-500 focus:outline-none focus:ring-2 focus:ring-leather-300 focus:border-transparent text-sm transition"
            />
          </div>
        ))}

        {error && <p className="text-gym-red text-sm">{error}</p>}

        {success && (
          <div className="flex items-center gap-2 text-leather-300 text-sm font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Logged!
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gym-yellow hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-leather-900 font-bold py-3 px-6 rounded-lg transition duration-200 uppercase tracking-wide text-sm"
        >
          {loading ? 'Logging...' : 'Spread the Holy Word'}
        </button>
      </form>
    </div>
  )
}
