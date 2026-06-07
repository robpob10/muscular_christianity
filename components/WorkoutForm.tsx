'use client'

import { useState } from 'react'

interface User {
  id: number
  name: string
}

interface Exercise {
  id: number
  name: string
}

interface WorkoutFormProps {
  user: User
  exercise: Exercise
  onLogged: () => void
}

function capitalize(str: string): string {
  return str
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export default function WorkoutForm({ user, exercise, onLogged }: WorkoutFormProps) {
  const [weightKg, setWeightKg] = useState('')
  const [reps, setReps] = useState('')
  const [sets, setSets] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const w = parseFloat(weightKg)
    const r = parseInt(reps)
    const s = parseInt(sets)

    if (!weightKg || isNaN(w) || w <= 0) {
      setError('Enter a valid weight')
      return
    }
    if (!reps || isNaN(r) || r <= 0) {
      setError('Enter valid reps')
      return
    }
    if (!sets || isNaN(s) || s <= 0) {
      setError('Enter valid sets')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          exerciseId: exercise.id,
          weightKg: w,
          reps: r,
          sets: s,
        }),
      })

      if (!res.ok) {
        const { error } = await res.json().catch(() => ({}))
        throw new Error(error || 'Failed to log workout')
      }

      setSuccess(true)
      setWeightKg('')
      setReps('')
      setSets('')
      onLogged()

      setTimeout(() => setSuccess(false), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log workout. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
      <h2 className="text-lg font-bold text-white mb-1">
        Log {capitalize(exercise.name)}
      </h2>
      <p className="text-gray-500 text-sm mb-5">
        Logging as{' '}
        <span className="text-orange-400 font-medium">{user.name}</span>
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
              Weight (kg)
            </label>
            <input
              type="number"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              placeholder="80"
              min="0"
              step="0.5"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm transition"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
              Reps / Set
            </label>
            <input
              type="number"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              placeholder="10"
              min="1"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm transition"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
              Sets
            </label>
            <input
              type="number"
              value={sets}
              onChange={(e) => setSets(e.target.value)}
              placeholder="3"
              min="1"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm transition"
            />
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}

        {success && (
          <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Logged!
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-400 disabled:bg-orange-800 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition duration-200 uppercase tracking-wide text-sm"
        >
          {loading ? 'Logging...' : 'Log Workout'}
        </button>
      </form>
    </div>
  )
}
