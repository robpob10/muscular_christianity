'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import ExerciseTabs from '@/components/ExerciseTabs'
import WorkoutForm from '@/components/WorkoutForm'
import ProgressChart from '@/components/ProgressChart'
import AddExerciseModal from '@/components/AddExerciseModal'
import RecentWorkouts from '@/components/RecentWorkouts'

interface User { id: number; name: string }
interface Exercise { id: number; name: string }

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<User | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const router = useRouter()

  const fetchExercises = useCallback(async () => {
    try {
      const res = await fetch('/api/exercises')
      if (res.ok) {
        const data = await res.json()
        setExercises(data)
        if (data.length > 0 && !activeExercise) setActiveExercise(data[0])
      }
    } catch { /* ignore */ }
  }, [activeExercise])

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/'); return }
    if (status !== 'authenticated') return

    fetch('/api/init')
      .then(() => fetch('/api/me'))
      .then(res => res.json())
      .then((gymUser: User | null) => {
        if (!gymUser) { router.push('/setup'); return }
        setUser(gymUser)
      })
      .catch(() => router.push('/'))
  }, [status, router])

  useEffect(() => {
    if (user) fetchExercises()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  function handleWorkoutLogged() {
    setRefreshKey(n => n + 1)
    fetchExercises()
  }

  function handleExerciseAdded(exercise: Exercise) {
    setActiveExercise(exercise)
    setShowAddModal(false)
    fetchExercises()
  }

  if (status === 'loading' || !user) {
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
          <div className="w-7 h-7 rounded-full bg-gym-yellow flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-leather-900" viewBox="0 0 24 24" fill="currentColor">
              <rect x="10.5" y="2" width="3" height="20" rx="1" />
              <rect x="4" y="7" width="16" height="3" rx="1" />
            </svg>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/history" className="text-gym-red font-semibold text-sm hover:opacity-80 transition">{user.name}</Link>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-xs text-leather-400 hover:text-leather-100 border border-leather-600 hover:border-leather-400 rounded px-3 py-1.5 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <RecentWorkouts refreshKey={refreshKey} />

        {exercises.length === 0 ? (
          <div className="text-center text-leather-400 py-20">Loading exercises...</div>
        ) : (
          <>
            <ExerciseTabs
              exercises={exercises}
              activeExercise={activeExercise}
              onSelect={setActiveExercise}
              onAddClick={() => setShowAddModal(true)}
            />
            {activeExercise && (
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <WorkoutForm user={user} exercise={activeExercise} onLogged={handleWorkoutLogged} />
                <ProgressChart exercise={activeExercise} refreshKey={refreshKey} currentUser={user} />
              </div>
            )}
          </>
        )}
      </main>

      {showAddModal && (
        <AddExerciseModal onClose={() => setShowAddModal(false)} onAdded={handleExerciseAdded} />
      )}
    </div>
  )
}
