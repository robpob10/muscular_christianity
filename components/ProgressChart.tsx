'use client'

import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface Exercise {
  id: number
  name: string
}

interface WorkoutLog {
  id: number
  weight_kg: string
  reps: number
  sets: number
  logged_at: string
  user_id: number
  user_name: string
}

interface ProgressChartProps {
  exercise: Exercise
  refreshKey: number
}

const COLORS = [
  '#00d4c8',
  '#60a5fa',
  '#a78bfa',
  '#f472b6',
  '#fb923c',
  '#facc15',
  '#22d3ee',
  '#f87171',
]

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

interface TooltipPayloadEntry {
  name: string
  value: number
  color: string
  payload: Record<string, number | string>
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadEntry[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#383c56', border: '1px solid #484d6e', borderRadius: 6, padding: '10px 14px', fontSize: 13 }}>
      <p style={{ color: '#6d728a', marginBottom: 6 }}>{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} style={{ color: entry.color, marginBottom: 3 }}>
          <span style={{ fontWeight: 600 }}>{entry.name}</span>
          {': '}
          <span>{entry.value} kg</span>
          <span style={{ color: '#6d728a', marginLeft: 6 }}>
            {entry.payload[`${entry.name}__sets`]} × {entry.payload[`${entry.name}__reps`]} reps
          </span>
        </div>
      ))}
    </div>
  )
}

export default function ProgressChart({ exercise, refreshKey }: ProgressChartProps) {
  const [chartData, setChartData] = useState<Record<string, number | string>[]>([])
  const [userNames, setUserNames] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/workouts?exerciseId=${exercise.id}`)
      .then((r) => r.json())
      .then((logs: WorkoutLog[]) => {
        if (!Array.isArray(logs) || logs.length === 0) {
          setChartData([])
          setUserNames([])
          return
        }

        const usersSet = new Set<string>()
        logs.forEach((l) => usersSet.add(l.user_name))
        setUserNames(Array.from(usersSet))

        const byDate: Record<string, Record<string, { weight: number; reps: number; sets: number }>> = {}
        logs.forEach((l) => {
          const date = formatDate(l.logged_at)
          if (!byDate[date]) byDate[date] = {}
          const w = parseFloat(l.weight_kg)
          const prev = byDate[date][l.user_name]
          if (!prev || w > prev.weight) {
            byDate[date][l.user_name] = { weight: w, reps: l.reps, sets: l.sets }
          }
        })

        const points = Object.entries(byDate).map(([date, userEntries]) => {
          const point: Record<string, number | string> = { date }
          Object.entries(userEntries).forEach(([userName, { weight, reps, sets }]) => {
            point[userName] = weight
            point[`${userName}__reps`] = reps
            point[`${userName}__sets`] = sets
          })
          return point
        })

        setChartData(points)
      })
      .catch(() => { setChartData([]); setUserNames([]) })
      .finally(() => setLoading(false))
  }, [exercise.id, refreshKey])

  return (
    <div className="bg-leather-800 rounded-2xl p-6 border border-leather-600">
      <h2 className="text-lg font-bold text-leather-100 mb-1">Progress</h2>
      <p className="text-leather-400 text-sm mb-5">Max weight (kg) per session</p>

      {loading ? (
        <div className="h-56 flex items-center justify-center text-leather-400 text-sm">Loading...</div>
      ) : chartData.length === 0 ? (
        <div className="h-56 flex flex-col items-center justify-center text-leather-400 text-sm gap-2">
          <svg className="w-8 h-8 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.5l4.5-4.5 3 3 4-5 4 4" />
          </svg>
          No data yet — log your first set!
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" />
            <XAxis dataKey="date" tick={{ fill: '#6d728a', fontSize: 11 }} axisLine={{ stroke: '#484d6e' }} tickLine={false} />
            <YAxis tick={{ fill: '#6d728a', fontSize: 11 }} axisLine={{ stroke: '#484d6e' }} tickLine={false} unit=" kg" />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, color: '#6d728a' }} />
            {userNames.map((name, i) => (
              <Line
                key={name}
                type="monotone"
                dataKey={name}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 0, fill: COLORS[i % COLORS.length] }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
