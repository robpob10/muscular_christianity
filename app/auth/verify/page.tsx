'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function VerifyInner() {
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) { setError('No token provided.'); return }

    fetch(`/api/auth/verify?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); return }
        localStorage.setItem('gym_user', JSON.stringify({ ...data.user, sessionToken: data.sessionToken }))
        router.replace('/dashboard')
      })
      .catch(() => setError('Something went wrong. Please try again.'))
  }, [router, searchParams])

  if (error) {
    return (
      <>
        <p className="text-gym-red font-semibold">{error}</p>
        <a href="/" className="text-leather-300 text-sm hover:underline block">← Back to login</a>
      </>
    )
  }

  return (
    <>
      <div className="inline-block w-8 h-8 border-2 border-leather-300 border-t-transparent rounded-full animate-spin" />
      <p className="text-leather-400 text-sm">Verifying your link…</p>
    </>
  )
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-leather-900 flex items-center justify-center px-4">
      <div className="text-center space-y-4">
        <Suspense fallback={
          <div className="inline-block w-8 h-8 border-2 border-leather-300 border-t-transparent rounded-full animate-spin" />
        }>
          <VerifyInner />
        </Suspense>
      </div>
    </div>
  )
}
