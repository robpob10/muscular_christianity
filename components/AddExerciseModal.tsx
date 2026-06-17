'use client'

import { useState } from 'react'

interface Exercise {
  id: number
  name: string
}

interface AddExerciseModalProps {
  onClose: () => void
  onAdded: (exercise: Exercise) => void
}

const GRAD = 'linear-gradient(135deg, #f87171 0%, #fb923c 50%, #A67C52 100%)'
const gradientBorder = {
  background: `linear-gradient(#000, #000) padding-box, ${GRAD} border-box`,
  border: '2px solid transparent',
}

export default function AddExerciseModal({ onClose, onAdded }: AddExerciseModalProps) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) { setError('Please enter an exercise name'); return }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to add exercise')
      }
      onAdded(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add exercise')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={gradientBorder} className="rounded-2xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-white">Add Exercise</h2>
          <button onClick={onClose} className="text-leather-600 hover:text-white transition" aria-label="Close">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cable Rows"
              className="w-full bg-leather-900 border border-leather-700 rounded-xl px-4 py-3 text-white placeholder-leather-600 focus:outline-none focus:border-leather-500 transition text-sm"
              autoFocus
            />
            {error && <p className="mt-2 text-sm text-gym-red">{error}</p>}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 text-leather-500 hover:text-white font-medium py-2.5 rounded-xl transition text-sm border border-leather-800 hover:border-leather-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={gradientBorder}
              className="flex-1 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-xl transition text-sm uppercase tracking-wide"
            >
              {loading ? 'Adding…' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
