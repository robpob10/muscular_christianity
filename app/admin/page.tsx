'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const ADMIN_EMAIL = 'robpob10@gmail.com'

interface AdminUser {
  id: number
  name: string
  email: string
  created_at: string
  workout_count: string
  last_workout: string | null
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated' || session?.user?.email !== ADMIN_EMAIL) {
      router.push('/dashboard')
      return
    }
    fetch('/api/admin')
      .then(r => r.json())
      .then(data => Array.isArray(data) && setUsers(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [status, session, router])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-leather-900 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-leather-300 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-leather-900">
      <header className="bg-leather-900 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-leather-400 hover:text-leather-100 transition text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
          <span className="text-leather-400 text-xs">Admin</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <h1 className="text-leather-100 font-bold text-xl mb-6">
          Users <span className="text-leather-400 font-normal text-sm ml-2">{users.length} total</span>
        </h1>

        <div className="space-y-3">
          {users.map(u => (
            <div key={u.id} className="bg-leather-800 rounded-xl border border-leather-600 px-4 py-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-leather-100 font-semibold">{u.name}</span>
                <span className="text-leather-300 text-sm font-mono">{u.workout_count} workout{u.workout_count !== '1' ? 's' : ''}</span>
              </div>
              <div className="text-leather-400 text-xs font-mono mb-2">{u.email}</div>
              <div className="flex gap-4 text-xs text-leather-400">
                <span>Last: {formatDate(u.last_workout)}</span>
                <span>Joined: {formatDate(u.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
