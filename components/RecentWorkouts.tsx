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
    <div className="mb-6 flex flex-col items-center gap-1">
      {logs.map(log => (
        <div key={log.id} className="flex gap-8 text-sm font-mono text-leather-400">
          <span className="w-28 truncate">{log.user_name}</span>
          <span className="w-44 truncate">{capitalize(log.exercise_name)}</span>
          <span className="w-16 text-right">{parseFloat(log.weight_kg)} kg</span>
          <span className="w-10 text-right">{log.sets}×{log.reps}</span>
        </div>
      ))}
    </div>
  )
}
