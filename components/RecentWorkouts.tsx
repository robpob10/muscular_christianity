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

function avgWeightTopReps(sets: SetEntry[], target = 15): string {
  const sorted = [...sets].sort((a, b) => b.reps - a.reps)
  let totalReps = 0
  const picked: number[] = []
  for (const s of sorted) {
    if (totalReps >= target) break
    totalReps += s.reps
    picked.push(parseFloat(s.weight_kg))
  }
  if (picked.length === 0) return '—'
  const avg = picked.reduce((a, b) => a + b, 0) / picked.length
  return `${parseFloat(avg.toFixed(1))}kg`
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
      {groups.map((g, i) => (
        <div key={i} className="text-sm font-mono text-leather-400">
          {g.user_name} – {capitalize(g.exercise_name)}{'  '}{avgWeightTopReps(g.sets)}
        </div>
      ))}
    </div>
  )
}
