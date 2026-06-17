'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const GRAD = 'linear-gradient(135deg, #f87171 0%, #fb923c 50%, #A67C52 100%)'
const gradientBorder = {
  background: `linear-gradient(#000, #000) padding-box, ${GRAD} border-box`,
  border: '2px solid transparent',
}

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
      if (!res.ok) { setError('Something went wrong — please try again'); return }
      router.push('/dashboard')
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-leather-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-screen bg-black flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-white tracking-tight uppercase mb-4">
            simple-gym.app
          </h1>
          <p className="text-leather-500 text-sm">What is thy name?</p>
        </div>

        <div style={gradientBorder} className="rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. George Williams"
              className="w-full bg-leather-900 border border-leather-700 rounded-xl px-4 py-3 text-white placeholder-leather-600 focus:outline-none focus:border-leather-500 transition text-sm"
              autoFocus
            />
            {error && <p className="text-sm text-gym-red">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              style={gradientBorder}
              className="w-full disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition uppercase tracking-wide text-sm"
            >
              {loading ? 'Saving…' : 'Enter the Gym'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
