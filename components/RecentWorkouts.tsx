'use client'

import { useEffect, useState, useRef, useCallback } from 'react'

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
  currentUserImage?: string | null
}

const PAGE_SIZE = 15

const AVATAR_PALETTE = ['#f87171','#00d4c8','#60a5fa','#a78bfa','#fb923c','#f472b6','#22d3ee','#34d399']

function avatarBg(userId: number) { return AVATAR_PALETTE[userId % AVATAR_PALETTE.length] }

function groupSets(sets: SetEntry[]) {
  const groups: { w: number; reps: number; count: number }[] = []
  for (const s of sets) {
    const w = parseFloat(s.weight_kg)
    const last = groups[groups.length - 1]
    if (last && last.w === w && last.reps === s.reps) { last.count++ }
    else { groups.push({ w, reps: s.reps, count: 1 }) }
  }
  return groups
}

function capitalize(s: string) {
  return s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'today'
  if (diffDays === 1) return '1d ago'
  if (diffDays < 7) return `${diffDays}d ago`
  return `${d.getDate()}/${d.getMonth() + 1}`
}

function UserAvatar({ userId, name, size, imageUrl }: {
  userId: number; name: string; size: number; imageUrl?: string | null
}) {
  if (imageUrl) {
    return (
      <img src={imageUrl} alt={name} referrerPolicy="no-referrer"
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: avatarBg(userId),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.38, color: '#191c2d', flexShrink: 0,
    }}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

const STORY_GRADIENT = 'linear-gradient(135deg, #f87171 0%, #fb923c 60%, #A67C52 100%)'

function StoryBubble({ userId, name, isOwn, imageUrl }: {
  userId: number; name: string; isOwn: boolean; imageUrl?: string | null
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 flex-shrink-0" style={{ width: 64 }}>
      <div style={{ padding: 2, borderRadius: '50%', background: isOwn ? '#484d6e' : STORY_GRADIENT }}>
        <div style={{ padding: 2, borderRadius: '50%', background: '#000' }}>
          <UserAvatar userId={userId} name={name} size={46} imageUrl={isOwn ? imageUrl : undefined} />
        </div>
      </div>
      <span className="text-leather-400 text-xs truncate w-full text-center leading-none">
        {isOwn ? 'You' : name.split(' ')[0]}
      </span>
    </div>
  )
}

function StoriesRow({ items, currentUser, currentUserImage }: {
  items: FeedItem[]
  currentUser: Props['currentUser']
  currentUserImage?: string | null
}) {
  const seen = new Set<number>()
  const users: { id: number; name: string }[] = []
  if (currentUser) { seen.add(currentUser.id); users.push(currentUser) }
  for (const item of items) {
    if (!seen.has(item.user_id)) { seen.add(item.user_id); users.push({ id: item.user_id, name: item.user_name }) }
  }
  if (users.length === 0) return null
  return (
    <div className="-mx-4 px-4 overflow-x-auto border-b border-leather-800 pb-4 mb-0"
      style={{ scrollbarWidth: 'none' }}>
      <div className="flex gap-4 w-max">
        {users.map((u) => (
          <StoryBubble
            key={u.id}
            userId={u.id}
            name={u.name}
            isOwn={currentUser?.id === u.id}
            imageUrl={currentUser?.id === u.id ? currentUserImage : undefined}
          />
        ))}
      </div>
    </div>
  )
}

function SetsPill({ group }: { group: { w: number; reps: number; count: number } }) {
  const wStr = group.w > 0 ? `${group.w}kg` : 'BW'
  return (
    <div className="flex items-baseline gap-1">
      <span className="text-leather-100 font-semibold text-sm">{wStr}</span>
      <span className="text-leather-400 text-xs">×{group.reps}</span>
      {group.count > 1 && (
        <span className="text-leather-600 text-xs">×{group.count}</span>
      )}
    </div>
  )
}

export default function RecentWorkouts({ refreshKey, currentUser, currentUserImage }: Props) {
  const [items, setItems] = useState<FeedItem[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState(false)
  const [localRefresh, setLocalRefresh] = useState(0)
  const [reactingKey, setReactingKey] = useState<string | null>(null)
  const [starValue, setStarValue] = useState(5)
  const [commentValue, setCommentValue] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const offsetRef = useRef(0)
  const loadingRef = useRef(false)

  function itemKey(item: FeedItem) {
    return `${item.user_id}-${item.exercise_id}-${item.workout_date}`
  }

  const loadPage = useCallback(async (currentOffset: number, replace: boolean) => {
    if (loadingRef.current) return
    loadingRef.current = true
    setLoading(true)
    try {
      const res = await fetch(`/api/recent?limit=${PAGE_SIZE}&offset=${currentOffset}`)
      const data = await res.json()
      if (!Array.isArray(data)) { setFetchError(true); return }
      if (replace) { setItems(data) } else { setItems(prev => [...prev, ...data]) }
      const newOffset = currentOffset + data.length
      offsetRef.current = newOffset
      setHasMore(data.length === PAGE_SIZE)
    } catch { setFetchError(true) }
    finally { loadingRef.current = false; setLoading(false) }
  }, [])

  useEffect(() => {
    setFetchError(false)
    setItems([])
    offsetRef.current = 0
    setHasMore(true)
    loadPage(0, true)
  }, [refreshKey, localRefresh, loadPage])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !loadingRef.current) {
        setHasMore(prev => { if (prev) loadPage(offsetRef.current, false); return prev })
      }
    }, { rootMargin: '200px' })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadPage])

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
    const existing = item.reactions?.find(r => r.reactor_user_id === currentUser?.id)
    setReactingKey(itemKey(item))
    setStarValue(existing?.stars ?? 5)
    setCommentValue(existing?.comment ?? '')
  }

  function cancelReact() { setReactingKey(null); setCommentValue(''); setStarValue(5) }

  if (fetchError) {
    return (
      <div className="mb-8 px-1">
        <p className="text-leather-600 text-xs">Could not load feed — try refreshing.</p>
      </div>
    )
  }

  return (
    <div className="mb-4">
      <StoriesRow items={items} currentUser={currentUser} currentUserImage={currentUserImage} />

      <div>
        {items.map(item => {
          const key = itemKey(item)
          const isOwn = currentUser?.id === item.user_id
          const myReaction = item.reactions?.find(r => r.reactor_user_id === currentUser?.id)
          const isReacting = reactingKey === key
          const groups = groupSets(item.sets)

          return (
            <div key={key} className="border-b border-leather-800 py-2.5">
              {/* Post header */}
              <div className="flex items-center gap-2.5 mb-1.5">
                <UserAvatar userId={item.user_id} name={item.user_name} size={34} />
                <div className="flex-1 min-w-0">
                  <span className="text-leather-100 font-semibold text-sm">{item.user_name}</span>
                  <span className="text-leather-500 text-xs ml-1.5">{capitalize(item.exercise_name)}</span>
                </div>
                <span className="text-leather-600 text-xs shrink-0">{formatDate(item.workout_date)}</span>
              </div>

              {/* Sets content */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 mb-1.5 pl-[42px]">
                {groups.map((g, i) => <SetsPill key={i} group={g} />)}
              </div>

              {/* Action row */}
              <div className="flex items-center gap-3 pl-[42px]">
                {!isOwn && currentUser && (
                  <button onClick={() => openReactForm(item)} className="flex items-center gap-1 group">
                    <span className={`text-2xl leading-none transition-transform group-active:scale-125 ${myReaction ? 'text-gym-yellow' : 'text-leather-700'}`}>
                      {myReaction ? '★' : '☆'}
                    </span>
                  </button>
                )}
                {item.reactions?.length > 0 && (
                  <span className="text-leather-400 text-xs">
                    {item.reactions.length === 1
                      ? `${item.reactions[0].reactor_name} starred this`
                      : `${item.reactions[0].reactor_name} and ${item.reactions.length - 1} other${item.reactions.length > 2 ? 's' : ''}`}
                  </span>
                )}
              </div>

              {/* Reaction detail — like IG comments */}
              {item.reactions?.length > 0 && (
                <div className="mt-2 pl-[42px] space-y-1">
                  {item.reactions.map((r, i) => (
                    <div key={i} className="flex items-baseline gap-1.5 text-xs">
                      <span className="text-leather-300 font-semibold">{r.reactor_name}</span>
                      <span className="text-gym-yellow tracking-tight">{'★'.repeat(r.stars)}<span className="text-leather-700">{'★'.repeat(5 - r.stars)}</span></span>
                      {r.comment && <span className="text-leather-400">{r.comment}</span>}
                    </div>
                  ))}
                </div>
              )}

              {/* React / edit form */}
              {isReacting && (
                <div className="mt-3 pl-[42px] border-t border-leather-800 pt-3">
                  <div className="flex gap-1 mb-2">
                    {[1,2,3,4,5].map(n => (
                      <button key={n} onClick={() => setStarValue(n)}
                        className={`text-xl leading-none transition ${n <= starValue ? 'text-gym-yellow' : 'text-leather-700'}`}>
                        ★
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={commentValue}
                      onChange={e => setCommentValue(e.target.value)}
                      placeholder="Add a comment…"
                      className="flex-1 bg-transparent border-b border-leather-700 focus:border-leather-400 pb-1 text-leather-100 placeholder-leather-600 text-sm focus:outline-none transition"
                    />
                    <button onClick={() => handleReact(item)} disabled={submitting}
                      className="text-gym-yellow font-semibold text-sm disabled:opacity-40 transition">
                      {submitting ? '…' : (myReaction ? 'Update' : 'Post')}
                    </button>
                    <button onClick={cancelReact} className="text-leather-600 hover:text-leather-300 text-sm transition">
                      ✕
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div ref={sentinelRef} className="py-3 text-center">
        {loading && <span className="text-leather-600 text-xs">·  ·  ·</span>}
      </div>
    </div>
  )
}
