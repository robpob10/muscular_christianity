'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Step = 'email' | 'name' | 'sent'

export default function LoginPage() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const user = localStorage.getItem('gym_user')
    if (user) router.push('/dashboard')
  }, [router])

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = email.trim().toLowerCase()
    if (!trimmed || !trimmed.includes('@')) { setError('Please enter a valid email'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      })
      const data = await res.json()
      if (data.status === 'needs_name') { setStep('name') }
      else if (data.status === 'sent') { setStep('sent') }
      else throw new Error(data.error || 'Something went wrong')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) { setError('Please enter your name'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), name: trimmedName }),
      })
      const data = await res.json()
      if (data.status === 'sent') { setStep('sent') }
      else if (data.status === 'name_taken') { setError('That name is already taken — choose another') }
      else throw new Error(data.error || 'Something went wrong')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
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
          {step === 'email' && (
            <>
              <p className="text-center italic font-medium text-gym-yellow whitespace-pre-line mb-6">
                {"Our Father\nFull of grace\nHallowed be his gains"}
              </p>
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-leather-400 mb-2">Email</label>
                  <input
                    id="email" type="email" value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-leather-700 border border-leather-600 rounded-lg px-4 py-3 text-leather-100 placeholder-leather-500 focus:outline-none focus:ring-2 focus:ring-leather-300 focus:border-transparent transition"
                    autoFocus
                  />
                  {error && <p className="mt-2 text-sm text-gym-red">{error}</p>}
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-gym-yellow hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-leather-900 font-bold py-3 px-6 rounded-lg transition uppercase tracking-wide text-sm">
                  {loading ? 'Checking…' : 'Enter the Gymdom of Heaven'}
                </button>
              </form>
            </>
          )}

          {step === 'name' && (
            <>
              <p className="text-leather-400 text-sm text-center mb-1">First time here!</p>
              <p className="text-leather-100 text-sm text-center mb-6 font-medium">{email}</p>
              <form onSubmit={handleNameSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-leather-400 mb-2">Your Name</label>
                  <input
                    id="name" type="text" value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. George Williams"
                    className="w-full bg-leather-700 border border-leather-600 rounded-lg px-4 py-3 text-leather-100 placeholder-leather-500 focus:outline-none focus:ring-2 focus:ring-leather-300 focus:border-transparent transition"
                    autoFocus
                  />
                  {error && <p className="mt-2 text-sm text-gym-red">{error}</p>}
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-gym-yellow hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-leather-900 font-bold py-3 px-6 rounded-lg transition uppercase tracking-wide text-sm">
                  {loading ? 'Sending…' : 'Send Login Link'}
                </button>
                <button type="button" onClick={() => { setStep('email'); setError('') }}
                  className="w-full text-leather-400 text-sm hover:text-leather-100 transition pt-1">
                  ← Back
                </button>
              </form>
            </>
          )}

          {step === 'sent' && (
            <div className="text-center space-y-3 py-4">
              <p className="text-3xl">✉️</p>
              <p className="text-leather-100 font-semibold">Check your email</p>
              <p className="text-leather-400 text-sm">
                We sent a login link to{' '}
                <span className="text-leather-100">{email}</span>.
                <br />It expires in 24 hours.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
