'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import ExerciseTabs from '@/components/ExerciseTabs'
import WorkoutForm from '@/components/WorkoutForm'
import ProgressChart from '@/components/ProgressChart'
import AddExerciseModal from '@/components/AddExerciseModal'

interface User {
  id: number
  name: string
}

interface Exercise {
  id: number
  name: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [refreshChart, setRefreshChart] = useState(0)
  const router = useRouter()

  const fetchExercises = useCallback(async () => {
    try {
      const res = await fetch('/api/exercises')
      if (res.ok) {
        const data = await res.json()
        setExercises(data)
        if (data.length > 0 && !activeExercise) {
          setActiveExercise(data[0])
        }
      }
    } catch {
      // ignore
    }
  }, [activeExercise])

  useEffect(() => {
    // Initialize DB
    fetch('/api/init').catch(() => {})

    // Check auth
    const stored = localStorage.getItem('gym_user')
    if (!stored) {
      router.push('/')
      return
    }
    try {
      const parsed = JSON.parse(stored) as User
      setUser(parsed)
    } catch {
      localStorage.removeItem('gym_user')
      router.push('/')
    }
  }, [router])

  useEffect(() => {
    if (user) {
      fetchExercises()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  function handleLogout() {
    localStorage.removeItem('gym_user')
    router.push('/')
  }

  function handleWorkoutLogged() {
    setRefreshChart((n) => n + 1)
  }

  function handleExerciseAdded(exercise: Exercise) {
    setExercises((prev) => {
      // Re-fetch to get proper ordering; for now just append
      const updated = [...prev, exercise]
      return updated
    })
    setActiveExercise(exercise)
    setShowAddModal(false)
    // Refetch to get proper ordering
    fetchExercises()
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                />
              </svg>
            </div>
            <span className="font-black text-white uppercase tracking-tight">
              Muscular Christianity
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-sm">
              Welcome,{' '}
              <span className="text-orange-400 font-semibold">{user.name}</span>
            </span>
            <button
              onClick={handleLogout}
              className="text-xs text-gray-500 hover:text-white border border-zinc-700 hover:border-zinc-500 rounded px-3 py-1.5 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {exercises.length === 0 ? (
          <div className="text-center text-gray-500 py-20">
            Loading exercises...
          </div>
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
                <WorkoutForm
                  user={user}
                  exercise={activeExercise}
                  onLogged={handleWorkoutLogged}
                />
                <ProgressChart
                  exercise={activeExercise}
                  refreshKey={refreshChart}
                />
              </div>
            )}
          </>
        )}
      </main>

      {showAddModal && (
        <AddExerciseModal
          onClose={() => setShowAddModal(false)}
          onAdded={handleExerciseAdded}
        />
      )}
    </div>
  )
}
