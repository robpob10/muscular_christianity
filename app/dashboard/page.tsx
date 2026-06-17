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
  const [showFeed, setShowFeed] = useState(false)
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
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-leather-300 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-black">
      <header className="bg-black px-4 py-3 shrink-0">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button
            onClick={() => setShowFeed(f => !f)}
            className={`text-xs border rounded px-3 py-1.5 transition ${showFeed ? 'text-leather-100 border-leather-400' : 'text-leather-400 border-leather-600'}`}
          >
            Feed
          </button>
          <div className="flex items-center gap-3">
            <Link href="/history" className="hover:opacity-80 transition">
              {session?.user?.image ? (
                <img src={session.user.image} alt={user.name} referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gym-red flex items-center justify-center text-xs font-bold text-white">
                  {user.name.charAt(0)}
                </div>
              )}
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-xs text-leather-400 hover:text-leather-100 border border-leather-600 hover:border-leather-400 rounded px-3 py-1.5 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0 flex flex-col max-w-5xl mx-auto w-full px-4 pt-2">
        {showFeed && (
          <div className="flex-1 min-h-0 overflow-y-auto">
            <RecentWorkouts refreshKey={refreshKey} currentUser={user} currentUserImage={session?.user?.image} />
          </div>
        )}

        {!showFeed && (exercises.length === 0 ? (
          <div className="text-center text-leather-400 py-20">Loading exercises...</div>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="shrink-0">
              <ExerciseTabs
                exercises={exercises}
                activeExercise={activeExercise}
                onSelect={setActiveExercise}
                onAddClick={() => setShowAddModal(true)}
              />
            </div>
            {activeExercise && (
              <div className="flex-1 min-h-0 flex flex-col mt-3 gap-4">
                <div className="flex-1 min-h-0">
                  <ProgressChart exercise={activeExercise} refreshKey={refreshKey} currentUser={user} />
                </div>
                <div className="shrink-0">
                  <WorkoutForm user={user} exercise={activeExercise} onLogged={handleWorkoutLogged} />
                </div>
              </div>
            )}
          </div>
        ))}
      </main>

      {showAddModal && (
        <AddExerciseModal onClose={() => setShowAddModal(false)} onAdded={handleExerciseAdded} />
      )}
    </div>
  )
}
