'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const user = localStorage.getItem('gym_user')
    if (user) {
      router.push('/dashboard')
    }
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Please enter your name')
      return
    }

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
    <div className="min-h-screen bg-leather-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-leather-300 mb-6 shadow-lg shadow-leather-300/20">
            <svg className="w-10 h-10 text-leather-900" viewBox="0 0 24 24" fill="currentColor">
              <rect x="10.5" y="2" width="3" height="20" rx="1" />
              <rect x="4" y="7" width="16" height="3" rx="1" />
            </svg>
          </div>
          <h1 className="text-4xl font-black text-leather-100 tracking-tight uppercase">
            Muscular Christianity
          </h1>
          <p className="text-leather-400 mt-2 text-lg">Track your gains</p>
        </div>

        <div className="bg-leather-800 rounded-2xl p-8 border border-leather-600 shadow-2xl">
          <h2 className="text-xl font-bold text-leather-100 mb-6">Enter the Gym</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-leather-400 mb-2">
                Your Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John"
                className="w-full bg-leather-700 border border-leather-600 rounded-lg px-4 py-3 text-leather-100 placeholder-leather-500 focus:outline-none focus:ring-2 focus:ring-leather-300 focus:border-transparent transition"
                autoFocus
              />
              {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gym-yellow hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-leather-900 font-bold py-3 px-6 rounded-lg transition duration-200 uppercase tracking-wide text-sm mt-2"
            >
              {loading ? 'Loading...' : 'Enter the Gym'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
