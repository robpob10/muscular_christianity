'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const PHRASES = [
  'Our Father, full of grace,\nhallowed be his gains',
  'Let he without grip it be the first to rip it',
  'King of the Juiced',
]

export default function LoginPage() {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [phrase] = useState(() => PHRASES[Math.floor(Math.random() * PHRASES.length)])
  const router = useRouter()

  useEffect(() => {
    const user = localStorage.getItem('gym_user')
    if (user) router.push('/dashboard')
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) { setError('Please enter your name'); return }

    setLoading(true)
    setError('')

    try {
      const initRes = await fetch('/api/init')
      if (!initRes.ok) {
        const { error } = await initRes.json().catch(() => ({}))
        throw new Error(error || 'Database not reachable — check Vercel Postgres is connected')
      }

      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      })

      if (!res.ok) {
        const { error } = await res.json().catch(() => ({}))
        throw new Error(error || 'Failed to log in')
      }

      const user = await res.json()
      localStorage.setItem('gym_user', JSON.stringify(user))
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-leather-900">
      <header className="bg-leather-900 px-4 py-3">
        <div className="max-w-5xl mx-auto">
          <div className="w-7 h-7 rounded-full bg-gym-red flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-leather-900" viewBox="0 0 24 24" fill="currentColor">
              <rect x="10.5" y="2" width="3" height="20" rx="1" />
              <rect x="4" y="7" width="16" height="3" rx="1" />
            </svg>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="mb-6 rounded-lg px-6 py-4 bg-leather-800">
          <p className="italic text-center font-medium text-base whitespace-pre-line" style={{ color: '#fbbf24' }}>
            {phrase}
          </p>
        </div>

        <div className="max-w-sm mx-auto bg-leather-800 rounded-2xl p-6 border border-leather-600">
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. George Williams"
              className="w-full bg-leather-700 border border-leather-600 rounded-lg px-3 py-2.5 text-leather-100 placeholder-leather-400 focus:outline-none focus:ring-2 focus:ring-leather-300 focus:border-transparent transition text-sm"
              autoFocus
            />
            {error && <p className="text-xs text-gym-red">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gym-yellow hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-leather-900 font-bold py-3 rounded-lg transition uppercase tracking-wide text-sm"
            >
              {loading ? 'Loading...' : 'Enter the Gymdom of Heaven'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
