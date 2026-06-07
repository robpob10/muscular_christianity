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

interface SelectedEntry {
  id: number
  date: string
  weight: number
  reps: number
  sets: number
  userName: string
}

const COLORS = ['#00d4c8','#60a5fa','#a78bfa','#f472b6','#fb923c','#facc15','#22d3ee','#f87171']

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

interface TooltipEntry {
  name: string; value: number; color: string
  payload: Record<string, number | string>
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#2f3349', border: '1px solid #484d6e', borderRadius: 6, padding: '10px 14px', fontSize: 13 }}>
      <p style={{ color: '#6d728a', marginBottom: 6 }}>{label}</p>
      {payload.map(entry => (
        <div key={entry.name} style={{ color: entry.color, marginBottom: 3 }}>
          <span style={{ fontWeight: 600 }}>{entry.name}</span>{': '}
          <span>{entry.value} kg</span>
          <span style={{ color: '#6d728a', marginLeft: 6 }}>
            {entry.payload[`${entry.name}__sets`]} × {entry.payload[`${entry.name}__reps`]} reps
          </span>
        </div>
      ))}
    </div>
  )
}

export default function ProgressChart({ exercise, refreshKey, currentUser }: ProgressChartProps) {
  const [chartData, setChartData] = useState<Record<string, number | string>[]>([])
  const [userNames, setUserNames] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<SelectedEntry | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/workouts?exerciseId=${exercise.id}`)
      .then(r => r.json())
      .then((logs: WorkoutLog[]) => {
        if (!Array.isArray(logs) || logs.length === 0) {
          setChartData([]); setUserNames([]); return
        }

        const usersSet = new Set<string>()
        logs.forEach(l => usersSet.add(l.user_name))
        setUserNames(Array.from(usersSet))

        const byDate: Record<string, Record<string, { weight: number; reps: number; sets: number; id: number }>> = {}
        logs.forEach(l => {
          const date = formatDate(l.logged_at)
          if (!byDate[date]) byDate[date] = {}
          const w = parseFloat(l.weight_kg)
          const prev = byDate[date][l.user_name]
          if (!prev || w > prev.weight) {
            byDate[date][l.user_name] = { weight: w, reps: l.reps, sets: l.sets, id: l.id }
          }
        })

        const points = Object.entries(byDate).map(([date, entries]) => {
          const point: Record<string, number | string> = { date }
          Object.entries(entries).forEach(([name, { weight, reps, sets, id }]) => {
            point[name] = weight
            point[`${name}__reps`] = reps
            point[`${name}__sets`] = sets
            point[`${name}__id`] = id
          })
          return point
        })
        setChartData(points)
      })
      .catch(() => { setChartData([]); setUserNames([]) })
      .finally(() => setLoading(false))
  }, [exercise.id, refreshKey])

  async function handleDelete() {
    if (!selected || !currentUser) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/workouts?id=${selected.id}&userId=${currentUser.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setSelected(null)
      // Trigger refresh by re-fetching — parent will handle via refreshKey
      // For now just remove the point locally and let parent eventually refresh
      setChartData(prev => prev.map(point => {
        const updated = { ...point }
        if (updated[`${selected.userName}__id`] === selected.id) {
          delete updated[selected.userName]
          delete updated[`${selected.userName}__reps`]
          delete updated[`${selected.userName}__sets`]
          delete updated[`${selected.userName}__id`]
        }
        return updated
      }).filter(point => Object.keys(point).some(k => !k.includes('__') && k !== 'date')))
    } catch {
      // ignore
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="bg-leather-800 rounded-2xl p-6 border border-leather-600 relative">
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
          <LineChart data={chartData} margin={{ top: 16, right: 16, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" />
            <XAxis dataKey="date" tick={{ fill: '#6d728a', fontSize: 11 }} axisLine={{ stroke: '#484d6e' }} tickLine={false} />
            <YAxis tick={{ fill: '#6d728a', fontSize: 11 }} axisLine={{ stroke: '#484d6e' }} tickLine={false} unit=" kg" />
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
                  dot={(props: { cx: number; cy: number; payload: Record<string, number | string>; index: number }) => {
                    const { cx, cy, payload } = props
                    const logId = payload[`${name}__id`] as number
                    return (
                      <circle
                        key={`dot-${name}-${cx}-${cy}`}
                        cx={cx} cy={cy} r={isMe ? 5 : 4}
                        fill={color}
                        strokeWidth={isMe ? 2 : 0}
                        stroke={isMe ? '#fff' : undefined}
                        style={{ cursor: isMe ? 'pointer' : 'default' }}
                        onClick={() => {
                          if (!isMe || !logId) return
                          setSelected({
                            id: logId,
                            date: payload.date as string,
                            weight: payload[name] as number,
                            reps: payload[`${name}__reps`] as number,
                            sets: payload[`${name}__sets`] as number,
                            userName: name,
                          })
                        }}
                      />
                    )
                  }}
                  activeDot={{ r: 6 }}
                  connectNulls
                />
              )
            })}
          </LineChart>
        </ResponsiveContainer>
      )}

      {/* Delete confirmation */}
      {selected && (
        <div className="absolute inset-0 bg-leather-900/80 rounded-2xl flex items-center justify-center p-6">
          <div className="bg-leather-800 border border-leather-600 rounded-xl p-5 w-full max-w-xs space-y-3">
            <p className="text-leather-100 font-semibold text-sm">Delete this entry?</p>
            <p className="text-leather-400 text-sm">
              {selected.date} · {selected.weight} kg · {selected.sets}×{selected.reps} reps
            </p>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setSelected(null)}
                className="flex-1 py-2 text-sm rounded-lg bg-leather-700 text-leather-100 hover:bg-leather-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2 text-sm rounded-lg bg-gym-red text-white font-semibold hover:opacity-90 disabled:opacity-50 transition"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
