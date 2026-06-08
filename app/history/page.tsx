'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface User { id: number; name: string }
interface SetEntry { id: number; weight_kg: string; reps: number }
interface SessionGroup {
  exercise_id: number
  exercise_name: string
  workout_date: string
  sets: SetEntry[]
}

function capitalize(s: string) {
  return s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getDate()}/${d.getMonth() + 1}`
}

export default function HistoryPage() {
  const { status } = useSession()
  const [user, setUser] = useState<User | null>(null)
  const [groups, setGroups] = useState<SessionGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingKey, setDeletingKey] = useState<string | null>(null)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [nameLoading, setNameLoading] = useState(false)
  const [nameError, setNameError] = useState('')
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/'); return }
    if (status !== 'authenticated') return
    fetch('/api/me')
      .then(res => res.json())
      .then((u: User | null) => {
        if (!u) { router.push('/setup'); return }
        setUser(u)
        return fetch(`/api/history?userId=${u.id}`)
      })
      .then(r => r?.json())
      .then(data => data && Array.isArray(data) && setGroups(data))
      .catch(() => router.push('/'))
      .finally(() => setLoading(false))
  }, [status, router])

  async function handleNameSave(e: React.FormEvent) {
    e.preventDefault()
    if (!nameInput.trim()) { setNameError('Name cannot be empty'); return }
    setNameLoading(true); setNameError('')
    try {
      const res = await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameInput.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setNameError(data.error || 'Failed to update'); return }
      setUser(data)
      setEditingName(false)
    } catch {
      setNameError('Something went wrong')
    } finally {
      setNameLoading(false)
    }
  }

  async function handleDelete(group: SessionGroup) {
    if (!user) return
    const key = `${group.exercise_id}-${group.workout_date}`
    setDeletingKey(key)
    const ids = group.sets.map(s => s.id).join(',')
    try {
      await fetch(`/api/history?userId=${user.id}&ids=${ids}`, { method: 'DELETE' })
      setGroups(prev => prev.filter(g => !(g.exercise_id === group.exercise_id && g.workout_date === group.workout_date)))
    } catch {
      // ignore
    } finally {
      setDeletingKey(null)
    }
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
          <span className="text-gym-red font-semibold text-sm">{user?.name}</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          {editingName ? (
            <form onSubmit={handleNameSave} className="flex items-center gap-2 flex-1">
              <input
                type="text"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                className="bg-leather-700 border border-leather-600 rounded-lg px-3 py-1.5 text-leather-100 focus:outline-none focus:ring-1 focus:ring-leather-300 text-sm"
                autoFocus
              />
              <button type="submit" disabled={nameLoading}
                className="text-xs bg-gym-yellow text-leather-900 font-bold px-3 py-1.5 rounded-lg disabled:opacity-50 transition">
                {nameLoading ? '…' : 'Save'}
              </button>
              <button type="button" onClick={() => { setEditingName(false); setNameError('') }}
                className="text-xs text-leather-400 hover:text-leather-100 transition">
                Cancel
              </button>
              {nameError && <span className="text-xs text-gym-red">{nameError}</span>}
            </form>
          ) : (
            <>
              <h1 className="text-leather-100 font-bold text-xl">{user?.name ?? 'History'}</h1>
              <button
                onClick={() => { setNameInput(user?.name ?? ''); setEditingName(true) }}
                className="text-leather-600 hover:text-leather-300 transition"
                title="Edit name"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z" />
                </svg>
              </button>
            </>
          )}
        </div>

        {loading ? (
          <p className="text-leather-400 text-sm">Loading...</p>
        ) : groups.length === 0 ? (
          <p className="text-leather-400 text-sm">No workouts logged yet.</p>
        ) : (
          <div className="bg-leather-800 rounded-2xl border border-leather-600 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-leather-600">
                  <th className="text-left px-4 py-3 text-leather-400 font-medium uppercase tracking-wide text-xs w-36">Exercise</th>
                  <th className="text-left px-4 py-3 text-leather-400 font-medium uppercase tracking-wide text-xs">Sets</th>
                  <th className="text-left px-4 py-3 text-leather-400 font-medium uppercase tracking-wide text-xs w-16">Date</th>
                  <th className="px-4 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => {
                  const key = `${group.exercise_id}-${group.workout_date}`
                  const isDeleting = deletingKey === key
                  return group.sets.map((set, si) => (
                    <tr key={`${key}-${si}`} className="border-b border-leather-700/50 last:border-0">
                      {si === 0 && (
                        <td
                          rowSpan={group.sets.length}
                          className="px-4 py-2 text-leather-100 font-medium align-top pt-3"
                        >
                          {capitalize(group.exercise_name)}
                        </td>
                      )}
                      <td className="px-4 py-1.5 text-leather-300 font-mono">
                        {parseFloat(set.weight_kg)}kg ×{set.reps}
                      </td>
                      {si === 0 && (
                        <td rowSpan={group.sets.length} className="px-4 py-2 text-leather-400 align-top pt-3 whitespace-nowrap">
                          {formatDate(group.workout_date)}
                        </td>
                      )}
                      {si === 0 && (
                        <td rowSpan={group.sets.length} className="px-4 py-2 align-top pt-3">
                          <button
                            onClick={() => handleDelete(group)}
                            disabled={isDeleting}
                            className="text-leather-600 hover:text-gym-red disabled:opacity-40 transition"
                            title="Delete session"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
