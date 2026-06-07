'use client'

import { useEffect, useState } from 'react'

interface RecentLog {
  id: number
  weight_kg: string
  reps: number
  sets: number
  passed: boolean
  logged_at: string
  user_name: string
  exercise_name: string
}

function capitalize(s: string) {
  return s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function formatDay(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)

  if (d.toDateString() === now.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
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
    <div className="mb-6 space-y-1">
      {logs.map(log => (
        <div
          key={log.id}
          className="flex items-center gap-3 text-sm font-mono px-1 py-0.5"
        >
          <span className="text-leather-400 w-20 shrink-0 text-xs">{formatDay(log.logged_at)}</span>
          <span className="text-leather-100 flex-1">{capitalize(log.exercise_name)}</span>
          <span style={{ color: '#00d4c8' }} className="font-semibold w-20 shrink-0">{log.user_name}</span>
          <span className="text-leather-100 w-20 shrink-0 text-right">{parseFloat(log.weight_kg)} kg</span>
          <span className="text-leather-400 w-14 shrink-0 text-right">{log.sets}×{log.reps}</span>
          <span className={`w-4 shrink-0 text-right ${log.passed ? 'text-[#00d4c8]' : 'text-gym-red'}`}>
            {log.passed ? '✓' : '✗'}
          </span>
        </div>
      ))}
    </div>
  )
}
