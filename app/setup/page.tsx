'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function SetupPage() {
  const { data: session, status } = useSession()
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/'); return }
    if (status === 'authenticated' && session.user?.name) {
      setName(session.user.name.split(' ')[0])
    }
  }, [status, session, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Please enter a name'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong'); return }
      router.push('/dashboard')
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-leather-900 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-leather-300 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-leather-900 flex items-start justify-center px-4 pt-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gym-yellow mb-6 shadow-lg">
            <svg className="w-10 h-10 text-leather-900" viewBox="0 0 24 24" fill="currentColor">
              <rect x="10.5" y="2" width="3" height="20" rx="1" />
              <rect x="4" y="7" width="16" height="3" rx="1" />
            </svg>
          </div>
          <h1 className="text-4xl font-black text-leather-100 tracking-tight uppercase">
            Muscular Christianity
          </h1>
        </div>

        <div className="bg-leather-800 rounded-2xl p-8 border border-leather-600 shadow-2xl">
          <p className="text-leather-400 text-sm text-center mb-6">
            First time here! What should we call you?
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-leather-400 mb-2">
                Your Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. George Williams"
                className="w-full bg-leather-700 border border-leather-600 rounded-lg px-4 py-3 text-leather-100 placeholder-leather-500 focus:outline-none focus:ring-2 focus:ring-leather-300 focus:border-transparent transition"
                autoFocus
              />
              {error && <p className="mt-2 text-sm text-gym-red">{error}</p>}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gym-yellow hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-leather-900 font-bold py-3 px-6 rounded-lg transition uppercase tracking-wide text-sm"
            >
              {loading ? 'Saving…' : 'Enter the Gymdom of Heaven'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
