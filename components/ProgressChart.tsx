'use client'

import { useEffect, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

interface User { id: number; name: string }
interface Exercise { id: number; name: string }

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
  currentUser: User | null
}

const COLORS = ['#00d4c8','#60a5fa','#a78bfa','#f472b6','#fb923c','#facc15','#22d3ee','#f87171']

function avgWeightTopReps(sets: { weight: number; reps: number }[], target = 15): number {
  const sorted = [...sets].sort((a, b) => b.reps - a.reps)
  let totalReps = 0
  const picked: number[] = []
  for (const s of sorted) {
    if (totalReps >= target) break
    totalReps += s.reps
    picked.push(s.weight)
  }
  if (picked.length === 0) return 0
  return Math.round((picked.reduce((a, b) => a + b, 0) / picked.length) * 10) / 10
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

interface SetEntry { weight: number; reps: number }

interface TooltipEntry {
  name: string; value: number; color: string
  payload: Record<string, number | string | SetEntry[]>
}

function groupSets(sets: SetEntry[]) {
  const groups: { w: number; reps: number; count: number }[] = []
  for (const s of sets) {
    const last = groups[groups.length - 1]
    if (last && last.w === s.weight && last.reps === s.reps) { last.count++ }
    else { groups.push({ w: s.weight, reps: s.reps, count: 1 }) }
  }
  return groups
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#2f3349', border: '1px solid #484d6e', borderRadius: 6, padding: '10px 14px', fontSize: 13 }}>
      <p style={{ color: '#6d728a', marginBottom: 6 }}>{label}</p>
      {payload.map(entry => {
        const allSets = entry.payload[`${entry.name}__allsets`] as SetEntry[] | undefined
        return (
          <div key={entry.name} style={{ marginBottom: 3 }}>
            <span style={{ color: entry.color, fontWeight: 600 }}>{entry.name}</span>
            <div style={{ marginTop: 3 }}>
              {groupSets(allSets ?? []).map((g, i) => {
                const wStr = g.w > 0 ? `${g.w}kg` : 'BW'
                return (
                  <div key={i} style={{ color: '#d0d4e4', marginLeft: 8 }}>
                    {wStr} ×{g.reps}{g.count > 1 && <span style={{ color: '#6d728a' }}> ×{g.count}</span>}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function ProgressChart({ exercise, refreshKey, currentUser }: ProgressChartProps) {
  const [chartData, setChartData] = useState<Record<string, number | string | { weight: number; reps: number }[]>[]>([])
  const [userNames, setUserNames] = useState<string[]>([])
  const [isBodyweight, setIsBodyweight] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/workouts?exerciseId=${exercise.id}`)
      .then(r => r.json())
      .then((logs: WorkoutLog[]) => {
        if (!Array.isArray(logs) || logs.length === 0) {
          setChartData([]); setUserNames([]); return
        }

        const bw = logs.every(l => parseFloat(l.weight_kg) === 0)
        setIsBodyweight(bw)

        const usersSet = new Set<string>()
        logs.forEach(l => usersSet.add(l.user_name))
        setUserNames(Array.from(usersSet))

        const byDate: Record<string, Record<string, { weight: number; reps: number }[]>> = {}
        logs.forEach(l => {
          const date = formatDate(l.logged_at)
          if (!byDate[date]) byDate[date] = {}
          if (!byDate[date][l.user_name]) byDate[date][l.user_name] = []
          byDate[date][l.user_name].push({ weight: parseFloat(l.weight_kg), reps: l.reps })
        })

        const points = Object.entries(byDate).map(([date, entries]) => {
          const point: Record<string, number | string | { weight: number; reps: number }[]> = { date }
          Object.entries(entries).forEach(([name, sets]) => {
            point[name] = bw
              ? sets.reduce((sum, s) => sum + s.reps, 0)
              : avgWeightTopReps(sets)
            point[`${name}__allsets`] = sets
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
      <p className="text-leather-400 text-sm mb-5">{isBodyweight ? 'Total reps per session' : 'Avg weight (kg) — top 15 reps'}</p>

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
          <LineChart data={chartData} margin={{ top: 16, right: 16, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" />
            <XAxis dataKey="date" tick={{ fill: '#6d728a', fontSize: 11 }} axisLine={{ stroke: '#484d6e' }} tickLine={false} />
            <YAxis tick={{ fill: '#6d728a', fontSize: 11 }} axisLine={{ stroke: '#484d6e' }} tickLine={false} unit={isBodyweight ? '' : ' kg'} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, color: '#6d728a' }} />
            {userNames.map((name, i) => {
              const color = COLORS[i % COLORS.length]
              const isMe = currentUser?.name === name
              return (
                <Line
                  key={name}
                  type="monotone"
                  dataKey={name}
                  stroke={color}
                  strokeWidth={2}
                  dot={{ r: isMe ? 5 : 4, fill: color, strokeWidth: isMe ? 2 : 0, stroke: isMe ? '#fff' : undefined }}
                  activeDot={{ r: 6 }}
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
