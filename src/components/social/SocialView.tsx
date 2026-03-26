'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Users, Trophy, Rss, UtensilsCrossed, UserPlus, Search, X,
  Heart, CalendarDays, Flame, Star, ChevronRight, Medal, Camera,
} from 'lucide-react'
import { useSocial } from '@/hooks/useSocial'
import type { Friend, FeedItem, LeaderboardEntry } from '@/types'
import type { ScheduleBlock, CurrentUserStats } from '@/hooks/useSocial'
import { getCategoryMeta } from '@/utils/constants'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function Avatar({ name, size = 36, photoURL }: { name: string; size?: number; photoURL?: string }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
  const colors = ['#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#EF4444']
  const color = colors[(name.charCodeAt(0) || 0) % colors.length]
  if (photoURL) {
    return <img src={photoURL} alt={name} className="rounded-full object-cover shrink-0" style={{ width: size, height: size }} />
  }
  return (
    <div className="rounded-full flex items-center justify-center shrink-0 text-white font-bold"
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.36 }}>
      {initials}
    </div>
  )
}

// ─── Friend Schedule Modal ────────────────────────────────────────────────────

function FriendScheduleModal({
  friend, onClose, getFriendSchedule,
}: {
  friend: Friend
  onClose: () => void
  getFriendSchedule: (uid: string) => Promise<ScheduleBlock[]>
}) {
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([])
  const [schedLoading, setSchedLoading] = useState(true)

  useEffect(() => {
    getFriendSchedule(friend.id).then(b => { setBlocks(b); setSchedLoading(false) })
  }, [friend.id, getFriendSchedule])

  function fmt(t: string) {
    const [h, m] = t.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-[2px]" onClick={onClose}>
      <div className="bg-white dark:bg-[#1C1C1E] w-full max-w-lg rounded-t-3xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 dark:bg-[#48484A] rounded-full" />
        </div>
        <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 dark:border-[#38383A]">
          <Avatar name={friend.displayName} size={36} photoURL={friend.photoURL} />
          <div className="flex-1">
            <p className="font-bold text-gray-900 dark:text-gray-50 text-sm">{friend.displayName}</p>
            <p className="text-xs text-gray-400">Today's schedule</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#3A3A3C] text-gray-400 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-4 space-y-2 max-h-80 overflow-y-auto pb-8">
          {schedLoading ? (
            <div className="py-8 text-center text-sm text-gray-400">Loading…</div>
          ) : blocks.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">Nothing scheduled today</div>
          ) : blocks.map((block, i) => {
            const meta = getCategoryMeta(block.category)
            return (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 dark:text-gray-500 w-16 shrink-0">{fmt(block.startTime)}</span>
                <div className="flex-1 rounded-xl px-3 py-2 flex items-center gap-2"
                  style={{ backgroundColor: meta.color + '18', borderLeft: `3px solid ${meta.color}` }}>
                  <span className={`text-sm font-medium flex-1 ${block.visible ? 'text-gray-800 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500 italic'}`}>
                    {block.title}
                  </span>
                  {block.status === 'in-progress' && <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0" />}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Activity Feed ────────────────────────────────────────────────────────────

function ActivityFeed({
  items, loading, userId, onToggleLike,
}: {
  items: FeedItem[]
  loading: boolean
  userId?: string
  onToggleLike: (ownerId: string, eventId: string, liked: boolean) => void
}) {
  if (loading) return <div className="py-16 text-center text-sm text-gray-400">Loading feed…</div>
  if (items.length === 0) return (
    <div className="py-16 text-center px-6">
      <Rss size={32} className="text-gray-200 dark:text-gray-700 mx-auto mb-3" />
      <p className="text-sm font-semibold text-gray-400">No activity yet</p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Add friends to see their activity here</p>
    </div>
  )

  return (
    <div className="space-y-0 divide-y divide-gray-100 dark:divide-[#38383A]">
      {items.map(item => (
        <div key={item.id} className="flex items-start gap-3 px-4 py-3.5">
          <Avatar name={item.displayName} size={36} photoURL={item.photoURL} />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-800 dark:text-gray-100 leading-snug">
              <span className="font-semibold">{item.displayName}</span>{' '}
              <span className="text-gray-600 dark:text-gray-300">{item.content}</span>
            </p>
            {item.type === 'meal_photo' && item.mealName && (
              <div className="mt-2 rounded-xl overflow-hidden bg-gray-100 dark:bg-[#2C2C2E] flex items-center gap-2 px-3 py-2">
                <Camera size={14} className="text-gray-400 shrink-0" />
                <span className="text-xs text-gray-500 dark:text-gray-400">{item.mealName}</span>
              </div>
            )}
            <div className="flex items-center gap-3 mt-1">
              <p className="text-xs text-gray-400 dark:text-gray-500">{timeAgo(item.timestamp)}</p>
              {item.eventId && item.ownerId && (
                <button
                  onClick={() => onToggleLike(item.ownerId!, item.eventId!, !!item.liked)}
                  className={`flex items-center gap-1 text-xs transition-colors ${item.liked ? 'text-red-500' : 'text-gray-300 dark:text-gray-600 hover:text-red-400'}`}
                >
                  <Heart size={12} fill={item.liked ? 'currentColor' : 'none'} />
                  {(item.likes ?? 0) > 0 && <span>{item.likes}</span>}
                </button>
              )}
            </div>
          </div>
          {item.type === 'streak' && <Flame size={16} className="text-orange-400 shrink-0 mt-1" />}
          {item.type === 'goal' && <Star size={16} className="text-yellow-400 shrink-0 mt-1" />}
        </div>
      ))}
    </div>
  )
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

const RANK_STYLES: Record<number, { bg: string; icon: React.ReactNode }> = {
  1: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', icon: <Medal size={16} className="text-yellow-500" /> },
  2: { bg: 'bg-gray-50 dark:bg-[#2C2C2E]', icon: <Medal size={16} className="text-gray-400" /> },
  3: { bg: 'bg-orange-50 dark:bg-orange-900/20', icon: <Medal size={16} className="text-orange-400" /> },
}

function LeaderboardView({ entries, loading }: { entries: LeaderboardEntry[]; loading: boolean }) {
  const weekLabel = (() => {
    const now = new Date()
    const start = new Date(now); start.setDate(now.getDate() - now.getDay() + 1)
    const end = new Date(start); end.setDate(start.getDate() + 6)
    return `${start.toLocaleDateString('en', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en', { month: 'short', day: 'numeric' })}`
  })()

  if (loading) return <div className="py-16 text-center text-sm text-gray-400">Loading leaderboard…</div>
  if (entries.length === 0) return (
    <div className="py-16 text-center px-6">
      <Trophy size={32} className="text-gray-200 dark:text-gray-700 mx-auto mb-3" />
      <p className="text-sm font-semibold text-gray-400">No one to compete with yet</p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Add friends to see the leaderboard</p>
    </div>
  )

  return (
    <div>
      <div className="px-4 pt-4 pb-3">
        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Week of {weekLabel}</p>
      </div>
      <div className="space-y-2 px-3 pb-4">
        {entries.map(entry => {
          const style = RANK_STYLES[entry.rank]
          return (
            <div key={entry.userId}
              className={['flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors',
                style?.bg ?? 'bg-white dark:bg-[#1C1C1E]',
                entry.isCurrentUser ? 'ring-2 ring-blue-400 dark:ring-blue-500' : '',
              ].join(' ')}
            >
              <div className="w-7 flex items-center justify-center shrink-0">
                {style?.icon ?? <span className="text-sm font-bold text-gray-400">{entry.rank}</span>}
              </div>
              <Avatar name={entry.displayName} size={36} photoURL={entry.photoURL} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${entry.isCurrentUser ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-50'}`}>
                  {entry.isCurrentUser ? 'You' : entry.displayName}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Flame size={11} className="text-orange-400" />
                  <span className="text-xs text-gray-400 dark:text-gray-500">{entry.streak}-day streak</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-gray-900 dark:text-gray-50">{entry.weeklyPoints}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">pts</p>
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-center text-xs text-gray-300 dark:text-gray-600 pb-4">Resets every Monday</p>
    </div>
  )
}

// ─── Friends List ─────────────────────────────────────────────────────────────

function FriendsListView({
  friends, pendingIn, pendingOut, loading,
  onSendRequest, onAcceptRequest, onRemoveFriend, onViewSchedule,
}: {
  friends: Friend[]
  pendingIn: Friend[]
  pendingOut: Friend[]
  loading: boolean
  onSendRequest: (username: string) => Promise<void>
  onAcceptRequest: (uid: string) => Promise<void>
  onRemoveFriend: (uid: string) => Promise<void>
  onViewSchedule: (uid: string) => Promise<ScheduleBlock[]>
}) {
  const [search, setSearch] = useState('')
  const [addSearch, setAddSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [sendError, setSendError] = useState('')
  const [sending, setSending] = useState(false)
  const [viewingFriend, setViewingFriend] = useState<Friend | null>(null)

  const filtered = friends.filter(f =>
    f.displayName.toLowerCase().includes(search.toLowerCase()) ||
    f.username.toLowerCase().includes(search.toLowerCase())
  )

  const handleSend = async () => {
    if (!addSearch.trim()) return
    setSending(true); setSendError('')
    try {
      await onSendRequest(addSearch.trim())
      setAddSearch(''); setShowAdd(false)
    } catch (e: unknown) {
      setSendError((e as Error).message ?? 'Something went wrong')
    }
    setSending(false)
  }

  return (
    <div className="pb-4">
      {/* Pending incoming requests */}
      {pendingIn.length > 0 && (
        <div className="px-4 pt-4 pb-2">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Requests ({pendingIn.length})</p>
          <div className="space-y-2">
            {pendingIn.map(f => (
              <div key={f.id} className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl px-3 py-2.5">
                <Avatar name={f.displayName} size={36} photoURL={f.photoURL} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-50 truncate">{f.displayName}</p>
                  <p className="text-xs text-gray-400">@{f.username}</p>
                </div>
                <button onClick={() => onAcceptRequest(f.id)}
                  className="text-xs font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-lg px-3 py-1.5 transition-colors">
                  Accept
                </button>
                <button onClick={() => onRemoveFriend(f.id)}
                  className="text-xs text-gray-400 hover:text-red-500 bg-gray-100 dark:bg-[#3A3A3C] rounded-lg p-1.5 transition-colors">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search + add */}
      <div className="px-4 pt-3 pb-2 flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 bg-gray-100 dark:bg-[#2C2C2E] rounded-xl px-3 py-2">
          <Search size={14} className="text-gray-400 shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search friends…"
            className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 outline-none" />
        </div>
        <button onClick={() => { setShowAdd(v => !v); setSendError('') }}
          className="w-9 h-9 bg-blue-500 hover:bg-blue-600 text-white rounded-xl flex items-center justify-center transition-colors shrink-0">
          <UserPlus size={16} />
        </button>
      </div>

      {/* Add friend panel */}
      {showAdd && (
        <div className="mx-4 mb-3 bg-white dark:bg-[#1C1C1E] border border-gray-100 dark:border-[#38383A] rounded-2xl p-4 space-y-3">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Add by username</p>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-1.5 bg-gray-100 dark:bg-[#2C2C2E] rounded-xl px-3 py-2">
              <span className="text-gray-400 text-sm">@</span>
              <input value={addSearch} onChange={e => setAddSearch(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                onKeyDown={e => { if (e.key === 'Enter') handleSend() }}
                placeholder="username"
                className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 outline-none" />
            </div>
            <button onClick={handleSend} disabled={sending || !addSearch.trim()}
              className="text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50 rounded-xl px-4 transition-colors">
              {sending ? '…' : 'Send'}
            </button>
          </div>
          {sendError && <p className="text-xs text-red-500">{sendError}</p>}
          {pendingOut.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-1.5">Pending sent</p>
              {pendingOut.map(f => (
                <div key={f.id} className="flex items-center gap-2 py-1">
                  <Avatar name={f.displayName} size={24} photoURL={f.photoURL} />
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex-1">@{f.username}</span>
                  <button onClick={() => onRemoveFriend(f.id)} className="text-[10px] text-gray-400 hover:text-red-500 transition-colors">Cancel</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Friends list */}
      {loading ? (
        <div className="py-10 text-center text-sm text-gray-400">Loading…</div>
      ) : (
        <div className="px-3 space-y-1.5">
          {filtered.length === 0 ? (
            <div className="text-center py-10">
              <Users size={32} className="text-gray-200 dark:text-gray-700 mx-auto mb-2" />
              <p className="text-sm text-gray-400">{search ? 'No friends match' : 'No friends yet — add some!'}</p>
            </div>
          ) : filtered.map(f => (
            <div key={f.id} className="flex items-center gap-3 bg-white dark:bg-[#1C1C1E] rounded-2xl px-3 py-2.5 border border-gray-100 dark:border-[#38383A]">
              <Avatar name={f.displayName} size={38} photoURL={f.photoURL} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-50 truncate">{f.displayName}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <div className="flex items-center gap-1">
                    <Flame size={11} className="text-orange-400" />
                    <span className="text-xs text-gray-400 dark:text-gray-500">{f.streak}d</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star size={11} className="text-yellow-400" />
                    <span className="text-xs text-gray-400 dark:text-gray-500">{f.weeklyPoints} pts</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setViewingFriend(f)}
                className="flex items-center gap-1 text-xs font-medium text-blue-500 hover:text-blue-600 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-xl px-2.5 py-1.5 transition-colors">
                <CalendarDays size={12} />
                Today
              </button>
              <button onClick={() => onRemoveFriend(f.id)} className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-red-400 transition-colors">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {viewingFriend && (
        <FriendScheduleModal
          friend={viewingFriend}
          onClose={() => setViewingFriend(null)}
          getFriendSchedule={onViewSchedule}
        />
      )}
    </div>
  )
}

// ─── Meal Photo Feed ──────────────────────────────────────────────────────────

function MealPhotoFeed({
  items, userId, onToggleLike,
}: {
  items: FeedItem[]
  userId?: string
  onToggleLike: (ownerId: string, eventId: string, liked: boolean) => void
}) {
  if (items.length === 0) return (
    <div className="py-16 text-center px-6">
      <Camera size={32} className="text-gray-200 dark:text-gray-700 mx-auto mb-3" />
      <p className="text-sm font-semibold text-gray-400">No meal photos yet</p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Your friends haven't shared any meals</p>
    </div>
  )

  return (
    <div className="px-3 py-3 grid grid-cols-2 gap-3 pb-6">
      {items.map(photo => (
        <div key={photo.id} className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-100 dark:border-[#38383A] overflow-hidden">
          {photo.mealPhotoURL ? (
            <img src={photo.mealPhotoURL} alt={photo.mealName} className="aspect-square w-full object-cover" />
          ) : (
            <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-[#2C2C2E] dark:to-[#3A3A3C] flex items-center justify-center">
              <Camera size={28} className="text-gray-300 dark:text-gray-600" />
            </div>
          )}
          <div className="p-2.5">
            <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">{photo.mealName ?? 'Meal'}</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{photo.displayName} · {timeAgo(photo.timestamp)}</p>
            {photo.eventId && photo.ownerId && (
              <button
                onClick={() => onToggleLike(photo.ownerId!, photo.eventId!, !!photo.liked)}
                className={`flex items-center gap-1 mt-2 text-xs font-medium transition-colors ${photo.liked ? 'text-red-500' : 'text-gray-300 dark:text-gray-600 hover:text-red-400'}`}
              >
                <Heart size={14} fill={photo.liked ? 'currentColor' : 'none'} />
                {photo.likes ?? 0}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main SocialView ──────────────────────────────────────────────────────────

type SocialTab = 'feed' | 'friends' | 'leaderboard' | 'meals'

const SOCIAL_TABS: { id: SocialTab; label: string; icon: React.ElementType }[] = [
  { id: 'feed', label: 'Feed', icon: Rss },
  { id: 'friends', label: 'Friends', icon: Users },
  { id: 'leaderboard', label: 'Top', icon: Trophy },
  { id: 'meals', label: 'Meals', icon: UtensilsCrossed },
]

interface SocialViewProps {
  userId: string | undefined
  currentUser: CurrentUserStats
}

export function SocialView({ userId, currentUser }: SocialViewProps) {
  const {
    friends, pendingIn, pendingOut, loading,
    feed, feedLoading, leaderboard, leaderboardLoading,
    loadFeed, loadLeaderboard,
    sendRequest, acceptRequest, removeFriend, getFriendSchedule, toggleLike,
  } = useSocial(userId)

  const [tab, setTab] = useState<SocialTab>('feed')
  const friendIds = friends.map(f => f.id).sort().join(',')

  useEffect(() => {
    if (tab === 'feed' || tab === 'meals') loadFeed(friends)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, friendIds])

  useEffect(() => {
    if (tab === 'leaderboard') loadLeaderboard(currentUser, friends)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, friendIds, currentUser.weeklyPoints, currentUser.streak])

  const pendingCount = pendingIn.length

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Tab bar */}
      <div className="shrink-0 bg-white dark:bg-[#1C1C1E] border-b border-gray-100 dark:border-[#38383A] flex px-4 gap-1 pt-2">
        {SOCIAL_TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={['flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg border-b-2 -mb-px transition-colors relative',
              tab === id ? 'text-blue-600 dark:text-blue-400 border-blue-500' : 'text-gray-400 dark:text-gray-500 border-transparent hover:text-gray-600 dark:hover:text-gray-300',
            ].join(' ')}
          >
            <Icon size={14} />
            {label}
            {id === 'friends' && pendingCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'feed' && (
          <div>
            <div className="px-4 pt-4 pb-2">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Friends' activity</p>
            </div>
            <ActivityFeed items={feed} loading={feedLoading} userId={userId} onToggleLike={toggleLike} />
          </div>
        )}
        {tab === 'friends' && (
          <FriendsListView
            friends={friends} pendingIn={pendingIn} pendingOut={pendingOut} loading={loading}
            onSendRequest={sendRequest} onAcceptRequest={acceptRequest} onRemoveFriend={removeFriend}
            onViewSchedule={getFriendSchedule}
          />
        )}
        {tab === 'leaderboard' && <LeaderboardView entries={leaderboard} loading={leaderboardLoading} />}
        {tab === 'meals' && (
          <div>
            <div className="px-4 pt-4 pb-1">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Friends' meals</p>
            </div>
            <MealPhotoFeed
              items={feed.filter(f => f.type === 'meal_photo')}
              userId={userId}
              onToggleLike={toggleLike}
            />
          </div>
        )}
      </div>
    </div>
  )
}
