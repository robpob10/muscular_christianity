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
  passed: boolean
  logged_at: string
  user_id: number
  user_name: string
}

interface ProgressChartProps {
  exercise: Exercise
  refreshKey: number
}

const COLORS = [
  '#34d399', // emerald (leather-300)
  '#60a5fa', // blue
  '#a78bfa', // violet
  '#f472b6', // pink
  '#fb923c', // orange
  '#facc15', // yellow
  '#22d3ee', // cyan
  '#f87171', // red
]

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

interface TooltipPayloadEntry {
  name: string
  value: number
  color: string
  payload: Record<string, number | string | boolean>
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadEntry[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#0d201a', border: '1px solid #1e4a36', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
      <p style={{ color: '#6db38a', marginBottom: 6 }}>{label}</p>
      {payload.map((entry) => {
        const didPass = entry.payload[`${entry.name}__passed`] !== false
        return (
          <div key={entry.name} style={{ color: entry.color, marginBottom: 3 }}>
            <span style={{ fontWeight: 600 }}>{entry.name}</span>
            {': '}
            <span>{entry.value} kg</span>
            <span style={{ color: '#6db38a', marginLeft: 6 }}>
              {entry.payload[`${entry.name}__sets`]} × {entry.payload[`${entry.name}__reps`]} reps
            </span>
            <span style={{ marginLeft: 6, color: didPass ? '#22c55e' : '#ef4444', fontSize: 11 }}>
              {didPass ? '✓' : '✗'}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function XDot({ cx, cy, color }: { cx: number; cy: number; color: string }) {
  const h = 5
  return (
    <g>
      <line x1={cx - h} y1={cy - h} x2={cx + h} y2={cy + h} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={cx + h} y1={cy - h} x2={cx - h} y2={cy + h} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    </g>
  )
}

export default function ProgressChart({ exercise, refreshKey }: ProgressChartProps) {
  const [chartData, setChartData] = useState<Record<string, number | string | boolean>[]>([])
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
        const users = Array.from(usersSet)
        setUserNames(users)

        // Group by date; per user keep the entry with the highest weight that day
        const byDate: Record<string, Record<string, { weight: number; reps: number; sets: number; passed: boolean }>> = {}
        logs.forEach((l) => {
          const date = formatDate(l.logged_at)
          if (!byDate[date]) byDate[date] = {}
          const w = parseFloat(l.weight_kg)
          const prev = byDate[date][l.user_name]
          if (!prev || w > prev.weight) {
            byDate[date][l.user_name] = { weight: w, reps: l.reps, sets: l.sets, passed: l.passed }
          }
        })

        const points = Object.entries(byDate).map(([date, userEntries]) => {
          const point: Record<string, number | string | boolean> = { date }
          Object.entries(userEntries).forEach(([userName, { weight, reps, sets, passed }]) => {
            point[userName] = weight
            point[`${userName}__reps`] = reps
            point[`${userName}__sets`] = sets
            point[`${userName}__passed`] = passed
          })
          return point
        })

        setChartData(points)
      })
      .catch(() => {
        setChartData([])
        setUserNames([])
      })
      .finally(() => setLoading(false))
  }, [exercise.id, refreshKey])

  return (
    <div className="bg-leather-800 rounded-2xl p-6 border border-leather-600">
      <h2 className="text-lg font-bold text-leather-100 mb-1">Progress</h2>
      <p className="text-leather-400 text-sm mb-5">Max weight (kg) per session</p>

      {loading ? (
        <div className="h-56 flex items-center justify-center text-leather-500 text-sm">
          Loading...
        </div>
      ) : chartData.length === 0 ? (
        <div className="h-56 flex flex-col items-center justify-center text-leather-500 text-sm gap-2">
          <svg className="w-8 h-8 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.5l4.5-4.5 3 3 4-5 4 4" />
          </svg>
          No data yet — log your first set!
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#132b22" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#6db38a', fontSize: 11 }}
              axisLine={{ stroke: '#1e4a36' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#6db38a', fontSize: 11 }}
              axisLine={{ stroke: '#1e4a36' }}
              tickLine={false}
              unit=" kg"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, color: '#9a7550' }} />
            {userNames.map((name, i) => {
              const color = COLORS[i % COLORS.length]
              return (
                <Line
                  key={name}
                  type="monotone"
                  dataKey={name}
                  stroke={color}
                  strokeWidth={2}
                  dot={(props: { cx: number; cy: number; payload: Record<string, number | string | boolean> }) => {
                    const { cx, cy, payload } = props
                    const didPass = payload[`${name}__passed`] !== false
                    if (!didPass) {
                      return <XDot key={`${cx}-${cy}`} cx={cx} cy={cy} color="#ef4444" />
                    }
                    return <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={4} fill={color} strokeWidth={0} />
                  }}
                  activeDot={{ r: 5 }}
                  connectNulls
                />
              )
            })}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
