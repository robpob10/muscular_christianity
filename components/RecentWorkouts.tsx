'use client'

import { useEffect, useState } from 'react'

interface RecentLog {
  id: number
  weight_kg: string
  reps: number
  sets: number
  user_name: string
  exercise_name: string
}

function capitalize(s: string) {
  return s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export default function RecentWorkouts({ refreshKey }: { refreshKey: number }) {
  const [logs, setLogs] = useState<RecentLog[]>([])

  useEffect(() => {
    fetch('/api/recent?limit=3')
      .then(r => r.json())
      .then(data => Array.isArray(data) && setLogs(data))
      .catch(() => {})
  }, [refreshKey])

  if (logs.length === 0) return null

  return (
    <div className="mb-6 space-y-1 text-center">
      {logs.map(log => (
        <div key={log.id} className="text-sm font-mono text-leather-400">
          {log.user_name} – {capitalize(log.exercise_name)}{'  '}{parseFloat(log.weight_kg)} kg{'  '}{log.sets}×{log.reps}
        </div>
      ))}
    </div>
  )
}
