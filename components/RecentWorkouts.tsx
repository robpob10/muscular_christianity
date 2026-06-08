'use client'

import { useEffect, useState } from 'react'

interface SetEntry { weight_kg: string; reps: number }

interface RecentGroup {
  user_name: string
  exercise_name: string
  sets: SetEntry[]
}

function capitalize(s: string) {
  return s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export default function RecentWorkouts({ refreshKey }: { refreshKey: number }) {
  const [groups, setGroups] = useState<RecentGroup[]>([])

  useEffect(() => {
    fetch('/api/recent?limit=3')
      .then(r => r.json())
      .then(data => Array.isArray(data) && setGroups(data))
      .catch(() => {})
  }, [refreshKey])

  if (groups.length === 0) return null

  return (
    <div className="mb-6 space-y-1 text-center">
      {groups.map((g, i) => {
        const setsStr = g.sets.map(s => `${parseFloat(s.weight_kg)}kg ×${s.reps}`).join(', ')
        return (
          <div key={i} className="text-sm font-mono text-leather-400">
            {g.user_name} – {capitalize(g.exercise_name)}{'  '}{setsStr}
          </div>
        )
      })}
    </div>
  )
}
