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
    const stored = localStorage.getItem('gym_user')
    if (!stored) {
      router.push('/')
      return
    }
    let parsed: User
    try {
      parsed = JSON.parse(stored) as User
    } catch {
      localStorage.removeItem('gym_user')
      router.push('/')
      return
    }

    fetch('/api/init')
      .then(() =>
        fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: parsed.name }),
        })
      )
      .then((res) => res.json())
      .then((freshUser: User) => {
        localStorage.setItem('gym_user', JSON.stringify(freshUser))
        setUser(freshUser)
      })
      .catch(() => {
        setUser(parsed)
      })
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
    fetchExercises()
  }

  function handleExerciseAdded(exercise: Exercise) {
    setActiveExercise(exercise)
    setShowAddModal(false)
    fetchExercises()
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-leather-900 flex items-center justify-center">
        <div className="text-leather-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-leather-900">
      <header className="bg-leather-800 border-b border-leather-600 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-leather-300 flex items-center justify-center">
              <svg className="w-4 h-4 text-leather-900" viewBox="0 0 24 24" fill="currentColor">
                <rect x="10.5" y="2" width="3" height="20" rx="1" />
                <rect x="4" y="7" width="16" height="3" rx="1" />
              </svg>
            </div>
            <span className="font-black text-leather-100 uppercase tracking-tight">
              Muscular Christianity
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-leather-400 text-sm">
              Welcome,{' '}
              <span className="text-leather-300 font-semibold">{user.name}</span>
            </span>
            <button
              onClick={handleLogout}
              className="text-xs text-leather-400 hover:text-leather-100 border border-leather-600 hover:border-leather-400 rounded px-3 py-1.5 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {exercises.length === 0 ? (
          <div className="text-center text-leather-400 py-20">
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
