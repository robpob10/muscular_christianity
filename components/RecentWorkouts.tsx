'use client'

import { useEffect, useState } from 'react'

interface SetEntry { weight_kg: string; reps: number }
interface Reaction { reactor_user_id: number; reactor_name: string; stars: number; comment: string | null }
interface FeedItem {
  user_id: number
  user_name: string
  exercise_id: number
  exercise_name: string
  workout_date: string
  last_logged_at: string
  sets: SetEntry[]
  reactions: Reaction[]
}

interface Props {
  refreshKey: number
  currentUser: { id: number; name: string } | null
}

function capitalize(s: string) {
  return s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getDate()}/${d.getMonth() + 1}`
}

function StarDisplay({ count }: { count: number }) {
  return (
    <span>
      <span className="text-gym-yellow">{'★'.repeat(count)}</span>
      <span className="text-leather-600">{'★'.repeat(5 - count)}</span>
    </span>
  )
}

export default function RecentWorkouts({ refreshKey, currentUser }: Props) {
  const [items, setItems] = useState<FeedItem[]>([])
  const [expanded, setExpanded] = useState(false)
  const [localRefresh, setLocalRefresh] = useState(0)
  const [reactingKey, setReactingKey] = useState<string | null>(null)
  const [starValue, setStarValue] = useState(5)
  const [commentValue, setCommentValue] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function itemKey(item: FeedItem) {
    return `${item.user_id}-${item.exercise_id}-${item.workout_date}`
  }

  useEffect(() => {
    const limit = expanded ? 50 : 3
    fetch(`/api/recent?limit=${limit}`)
      .then(r => r.json())
      .then(data => Array.isArray(data) && setItems(data))
      .catch(() => {})
  }, [refreshKey, expanded, localRefresh])

  async function handleReact(item: FeedItem) {
    setSubmitting(true)
    try {
      await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_user_id: item.user_id,
          exercise_id: item.exercise_id,
          workout_date: item.workout_date,
          stars: starValue,
          comment: commentValue.trim() || null,
        }),
      })
      setReactingKey(null)
      setCommentValue('')
      setStarValue(5)
      setLocalRefresh(k => k + 1)
    } catch {}
    setSubmitting(false)
  }

  function openReactForm(item: FeedItem) {
    const key = itemKey(item)
    const existing = item.reactions?.find(r => r.reactor_user_id === currentUser?.id)
    setReactingKey(key)
    setStarValue(existing?.stars ?? 5)
    setCommentValue(existing?.comment ?? '')
  }

  function cancelReact() {
    setReactingKey(null)
    setCommentValue('')
    setStarValue(5)
  }

  if (items.length === 0) return null

  return (
    <div className="mb-8">
      <h2 className="text-leather-400 text-xs uppercase tracking-widest font-semibold mb-3">Recent</h2>

      <div className="space-y-2">
        {items.map(item => {
          const key = itemKey(item)
          const isOwn = currentUser?.id === item.user_id
          const myReaction = item.reactions?.find(r => r.reactor_user_id === currentUser?.id)
          const isReacting = reactingKey === key

          return (
            <div key={key} className="bg-leather-800 rounded-xl border border-leather-700 px-4 py-3">
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <div className="flex items-baseline gap-2 min-w-0">
                  <span className="text-gym-red font-semibold text-sm truncate">{item.user_name}</span>
                  <span className="text-leather-500 text-xs">·</span>
                  <span className="text-leather-300 text-sm truncate">{capitalize(item.exercise_name)}</span>
                </div>
                <span className="text-leather-500 text-xs shrink-0">{formatDate(item.workout_date)}</span>
              </div>

              <div className="text-leather-400 text-xs font-mono mb-2">
                {item.sets.map((s, i) => (
                  <span key={i}>{i > 0 && ', '}{parseFloat(s.weight_kg)}kg ×{s.reps}</span>
                ))}
              </div>

              {item.reactions?.length > 0 && (
                <div className="space-y-0.5 mb-2">
                  {item.reactions.map((r, i) => (
                    <div key={i} className="text-xs text-leather-400 flex flex-wrap gap-x-1.5 items-baseline">
                      <StarDisplay count={r.stars} />
                      <span className="text-leather-500">{r.reactor_name}</span>
                      {r.comment && <span className="text-leather-300">"{r.comment}"</span>}
                    </div>
                  ))}
                </div>
              )}

              {!isOwn && currentUser && (
                isReacting ? (
                  <div className="mt-2 pt-2 border-t border-leather-700">
                    <div className="flex gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button
                          key={n}
                          onClick={() => setStarValue(n)}
                          className={`text-xl leading-none transition ${n <= starValue ? 'text-gym-yellow' : 'text-leather-600'}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={commentValue}
                      onChange={e => setCommentValue(e.target.value)}
                      placeholder="Comment (optional)"
                      className="w-full bg-leather-700 border border-leather-600 rounded px-2 py-1 text-leather-100 placeholder-leather-500 text-xs focus:outline-none focus:ring-1 focus:ring-leather-400 mb-2"
                    />
                    <div className="flex gap-2 items-center">
                      <button
                        onClick={() => handleReact(item)}
                        disabled={submitting}
                        className="text-xs bg-gym-yellow text-leather-900 font-bold px-3 py-1 rounded disabled:opacity-50 transition"
                      >
                        {submitting ? '…' : (myReaction ? 'Update' : 'Send')}
                      </button>
                      <button
                        onClick={cancelReact}
                        className="text-xs text-leather-400 hover:text-leather-100 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => openReactForm(item)}
                    className="text-leather-600 hover:text-leather-300 text-xs transition mt-1"
                  >
                    {myReaction ? `★ Edit reaction` : '★ React'}
                  </button>
                )
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-3 text-center">
        {!expanded ? (
          items.length >= 3 && (
            <button
              onClick={() => setExpanded(true)}
              className="text-leather-500 hover:text-leather-300 text-xs transition"
            >
              Show more
            </button>
          )
        ) : (
          <button
            onClick={() => setExpanded(false)}
            className="text-leather-500 hover:text-leather-300 text-xs transition"
          >
            Show less
          </button>
        )}
      </div>
    </div>
  )
}
