'use client'

import React, { useState } from 'react'
import {
  Users,
  Trophy,
  Rss,
  UtensilsCrossed,
  UserPlus,
  Search,
  X,
  Heart,
  CalendarDays,
  Flame,
  Star,
  CheckCircle,
  Clock,
  ChevronRight,
  Medal,
  Camera,
} from 'lucide-react'
import type { Friend, FeedItem, LeaderboardEntry } from '@/types'

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_FRIENDS: Friend[] = [
  { id: '1', username: 'alexkim', displayName: 'Alex Kim', streak: 12, weeklyPoints: 480, status: 'accepted' },
  { id: '2', username: 'sarahchen', displayName: 'Sarah Chen', streak: 5, weeklyPoints: 360, status: 'accepted' },
  { id: '3', username: 'marcusj', displayName: 'Marcus J', streak: 3, weeklyPoints: 290, status: 'accepted' },
  { id: '4', username: 'emmaw', displayName: 'Emma W', streak: 7, weeklyPoints: 410, status: 'accepted' },
  { id: '5', username: 'ryanp', displayName: 'Ryan P', streak: 0, weeklyPoints: 140, status: 'pending_received' },
  { id: '6', username: 'pryank', displayName: 'Pryan K', streak: 1, weeklyPoints: 80, status: 'pending_sent' },
]

const NOW = new Date()
const mins = (n: number) => new Date(NOW.getTime() - n * 60 * 1000)

const MOCK_FEED: FeedItem[] = [
  { id: 'f1', userId: '1', username: 'alexkim', displayName: 'Alex Kim', type: 'streak', content: 'is on a 12-day streak', timestamp: mins(8) },
  { id: 'f2', userId: '4', username: 'emmaw', displayName: 'Emma W', type: 'completed', content: 'completed Morning Run', timestamp: mins(22) },
  { id: 'f3', userId: '2', username: 'sarahchen', displayName: 'Sarah Chen', type: 'meal_photo', content: 'shared a meal photo', timestamp: mins(47), mealName: 'Grilled salmon & veggies', mealPhotoURL: '' },
  { id: 'f4', userId: '1', username: 'alexkim', displayName: 'Alex Kim', type: 'goal', content: 'hit their study goal for the week!', timestamp: mins(95) },
  { id: 'f5', userId: '3', username: 'marcusj', displayName: 'Marcus J', type: 'completed', content: 'completed Chest & Triceps', timestamp: mins(180) },
  { id: 'f6', userId: '4', username: 'emmaw', displayName: 'Emma W', type: 'completed', content: 'completed COMM 1AA3 Lecture', timestamp: mins(260) },
  { id: 'f7', userId: '2', username: 'sarahchen', displayName: 'Sarah Chen', type: 'streak', content: 'started a new streak! Keep it up', timestamp: mins(420) },
]

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, userId: '1', username: 'alexkim', displayName: 'Alex Kim', weeklyPoints: 480, streak: 12 },
  { rank: 2, userId: 'me', username: 'you', displayName: 'You', weeklyPoints: 445, streak: 1, isCurrentUser: true },
  { rank: 3, userId: '4', username: 'emmaw', displayName: 'Emma W', weeklyPoints: 410, streak: 7 },
  { rank: 4, userId: '2', username: 'sarahchen', displayName: 'Sarah Chen', weeklyPoints: 360, streak: 5 },
  { rank: 5, userId: '3', username: 'marcusj', displayName: 'Marcus J', weeklyPoints: 290, streak: 3 },
]

const MOCK_MEAL_PHOTOS: { id: string; userId: string; displayName: string; mealName: string; timestamp: Date; likes: number; liked: boolean }[] = [
  { id: 'm1', userId: '2', displayName: 'Sarah Chen', mealName: 'Grilled salmon & veggies', timestamp: mins(47), likes: 3, liked: false },
  { id: 'm2', userId: '1', displayName: 'Alex Kim', mealName: 'Oatmeal & berries', timestamp: mins(380), likes: 5, liked: true },
  { id: 'm3', userId: '4', displayName: 'Emma W', mealName: 'Chicken stir fry', timestamp: mins(720), likes: 2, liked: false },
  { id: 'm4', userId: '3', displayName: 'Marcus J', mealName: 'Protein shake + banana', timestamp: mins(960), likes: 1, liked: false },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function Avatar({ name, size = 36, photoURL }: { name: string; size?: number; photoURL?: string }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const colors = ['#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#EF4444']
  const color = colors[name.charCodeAt(0) % colors.length]
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

function FriendScheduleModal({ friend, onClose }: { friend: Friend; onClose: () => void }) {
  const mockBlocks = [
    { time: '9:00 AM', title: 'PSYCH 1X03', type: 'class', visible: true, status: 'completed' },
    { time: '11:00 AM', title: 'Private Block', type: 'private', visible: false, status: 'upcoming' },
    { time: '12:30 PM', title: 'Lunch', type: 'meal', visible: true, status: 'completed' },
    { time: '2:00 PM', title: 'Study Session', type: 'study', visible: true, status: 'in-progress' },
    { time: '4:30 PM', title: 'Private Block', type: 'private', visible: false, status: 'upcoming' },
    { time: '6:00 PM', title: 'Gym', type: 'gym', visible: true, status: 'upcoming' },
  ]
  const catColors: Record<string, string> = { class: '#3B82F6', study: '#8B5CF6', meal: '#10B981', gym: '#F59E0B', private: '#9CA3AF' }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-[2px]" onClick={onClose}>
      <div className="bg-white dark:bg-[#1C1C1E] w-full max-w-lg rounded-t-3xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 dark:bg-[#48484A] rounded-full" />
        </div>
        <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 dark:border-[#38383A]">
          <Avatar name={friend.displayName} size={36} />
          <div className="flex-1">
            <p className="font-bold text-gray-900 dark:text-gray-50 text-sm">{friend.displayName}</p>
            <p className="text-xs text-gray-400">Today's schedule</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#3A3A3C] text-gray-400 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-4 space-y-2 max-h-80 overflow-y-auto pb-8">
          {mockBlocks.map((block, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs text-gray-400 dark:text-gray-500 w-16 shrink-0">{block.time}</span>
              <div className="flex-1 rounded-xl px-3 py-2 flex items-center gap-2"
                style={{ backgroundColor: catColors[block.type] + '18', borderLeft: `3px solid ${catColors[block.type]}` }}>
                <span className={`text-sm font-medium flex-1 ${block.visible ? 'text-gray-800 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500 italic'}`}>
                  {block.title}
                </span>
                {block.status === 'completed' && <CheckCircle size={13} className="text-green-500 shrink-0" />}
                {block.status === 'in-progress' && <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Activity Feed ────────────────────────────────────────────────────────────

function ActivityFeed() {
  return (
    <div className="space-y-0 divide-y divide-gray-100 dark:divide-[#38383A]">
      {MOCK_FEED.map(item => (
        <div key={item.id} className="flex items-start gap-3 px-4 py-3.5">
          <Avatar name={item.displayName} size={36} />
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
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{timeAgo(item.timestamp)}</p>
          </div>
          {item.type === 'streak' && <Flame size={16} className="text-orange-400 shrink-0 mt-1" />}
          {item.type === 'goal' && <Star size={16} className="text-yellow-400 shrink-0 mt-1" />}
          {item.type === 'completed' && <CheckCircle size={16} className="text-green-400 shrink-0 mt-1" />}
        </div>
      ))}
    </div>
  )
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

const RANK_STYLES: Record<number, { bg: string; text: string; icon: React.ReactNode }> = {
  1: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-600 dark:text-yellow-400', icon: <Medal size={16} className="text-yellow-500" /> },
  2: { bg: 'bg-gray-50 dark:bg-[#2C2C2E]', text: 'text-gray-500 dark:text-gray-400', icon: <Medal size={16} className="text-gray-400" /> },
  3: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-500 dark:text-orange-400', icon: <Medal size={16} className="text-orange-400" /> },
}

function LeaderboardView() {
  const weekLabel = (() => {
    const now = new Date()
    const start = new Date(now)
    start.setDate(now.getDate() - now.getDay() + 1)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    return `${start.toLocaleDateString('en', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en', { month: 'short', day: 'numeric' })}`
  })()

  return (
    <div>
      <div className="px-4 pt-4 pb-3">
        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Week of {weekLabel}</p>
      </div>
      <div className="space-y-2 px-3 pb-4">
        {MOCK_LEADERBOARD.map(entry => {
          const style = RANK_STYLES[entry.rank]
          return (
            <div
              key={entry.userId}
              className={[
                'flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors',
                style?.bg ?? 'bg-white dark:bg-[#1C1C1E]',
                entry.isCurrentUser ? 'ring-2 ring-blue-400 dark:ring-blue-500' : '',
              ].join(' ')}
            >
              <div className="w-7 flex items-center justify-center shrink-0">
                {style?.icon ?? <span className={`text-sm font-bold ${style?.text ?? 'text-gray-400'}`}>{entry.rank}</span>}
              </div>
              <Avatar name={entry.displayName} size={36} />
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

function FriendsListView() {
  const [friends, setFriends] = useState(MOCK_FRIENDS)
  const [search, setSearch] = useState('')
  const [addSearch, setAddSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [viewingFriend, setViewingFriend] = useState<Friend | null>(null)

  const accepted = friends.filter(f => f.status === 'accepted')
  const pendingIn = friends.filter(f => f.status === 'pending_received')
  const pendingOut = friends.filter(f => f.status === 'pending_sent')

  const filtered = accepted.filter(f =>
    f.displayName.toLowerCase().includes(search.toLowerCase()) ||
    f.username.toLowerCase().includes(search.toLowerCase())
  )

  const acceptFriend = (id: string) => setFriends(f => f.map(fr => fr.id === id ? { ...fr, status: 'accepted' } : fr))
  const removeFriend = (id: string) => setFriends(f => f.filter(fr => fr.id !== id))

  return (
    <div className="pb-4">
      {/* Pending requests */}
      {pendingIn.length > 0 && (
        <div className="px-4 pt-4 pb-2">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Requests ({pendingIn.length})</p>
          <div className="space-y-2">
            {pendingIn.map(f => (
              <div key={f.id} className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl px-3 py-2.5">
                <Avatar name={f.displayName} size={36} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-50 truncate">{f.displayName}</p>
                  <p className="text-xs text-gray-400">@{f.username}</p>
                </div>
                <button onClick={() => acceptFriend(f.id)}
                  className="text-xs font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-lg px-3 py-1.5 transition-colors">
                  Accept
                </button>
                <button onClick={() => removeFriend(f.id)}
                  className="text-xs font-semibold text-gray-400 hover:text-red-500 bg-gray-100 dark:bg-[#3A3A3C] rounded-lg px-2 py-1.5 transition-colors">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add friend bar */}
      <div className="px-4 pt-3 pb-2 flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 bg-gray-100 dark:bg-[#2C2C2E] rounded-xl px-3 py-2">
          <Search size={14} className="text-gray-400 shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search friends..."
            className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 outline-none"
          />
        </div>
        <button
          onClick={() => setShowAdd(v => !v)}
          className="w-9 h-9 bg-blue-500 hover:bg-blue-600 text-white rounded-xl flex items-center justify-center transition-colors shrink-0"
        >
          <UserPlus size={16} />
        </button>
      </div>

      {/* Add friend panel */}
      {showAdd && (
        <div className="mx-4 mb-3 bg-white dark:bg-[#1C1C1E] border border-gray-100 dark:border-[#38383A] rounded-2xl p-4 space-y-3">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Add by username</p>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-gray-100 dark:bg-[#2C2C2E] rounded-xl px-3 py-2">
              <span className="text-gray-400 text-sm">@</span>
              <input
                value={addSearch}
                onChange={e => setAddSearch(e.target.value)}
                placeholder="username"
                className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 outline-none"
              />
            </div>
            <button
              onClick={() => { setAddSearch(''); setShowAdd(false) }}
              className="text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-xl px-4 transition-colors"
            >
              Send
            </button>
          </div>
          {pendingOut.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-1.5">Pending sent</p>
              {pendingOut.map(f => (
                <div key={f.id} className="flex items-center gap-2 py-1">
                  <Avatar name={f.displayName} size={24} />
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex-1">@{f.username}</span>
                  <span className="text-[10px] text-gray-300 dark:text-gray-600 font-medium uppercase">Pending</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Friends list */}
      <div className="px-3 space-y-1.5">
        {filtered.length === 0 ? (
          <div className="text-center py-10">
            <Users size={32} className="text-gray-200 dark:text-gray-700 mx-auto mb-2" />
            <p className="text-sm text-gray-400">{search ? 'No friends match' : 'No friends yet — add some!'}</p>
          </div>
        ) : filtered.map(f => (
          <div key={f.id} className="flex items-center gap-3 bg-white dark:bg-[#1C1C1E] rounded-2xl px-3 py-2.5 border border-gray-100 dark:border-[#38383A]">
            <Avatar name={f.displayName} size={38} />
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
            <button
              onClick={() => setViewingFriend(f)}
              className="flex items-center gap-1 text-xs font-medium text-blue-500 hover:text-blue-600 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-xl px-2.5 py-1.5 transition-colors"
            >
              <CalendarDays size={12} />
              Today
            </button>
            <button
              onClick={() => removeFriend(f.id)}
              className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-red-400 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {viewingFriend && <FriendScheduleModal friend={viewingFriend} onClose={() => setViewingFriend(null)} />}
    </div>
  )
}

// ─── Meal Photo Feed ──────────────────────────────────────────────────────────

function MealPhotoFeed() {
  const [photos, setPhotos] = useState(MOCK_MEAL_PHOTOS)

  const toggleLike = (id: string) => {
    setPhotos(p => p.map(photo =>
      photo.id === id
        ? { ...photo, liked: !photo.liked, likes: photo.liked ? photo.likes - 1 : photo.likes + 1 }
        : photo
    ))
  }

  return (
    <div className="px-3 py-3 grid grid-cols-2 gap-3 pb-6">
      {photos.map(photo => (
        <div key={photo.id} className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-100 dark:border-[#38383A] overflow-hidden">
          {/* Photo placeholder */}
          <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-[#2C2C2E] dark:to-[#3A3A3C] flex items-center justify-center">
            <Camera size={28} className="text-gray-300 dark:text-gray-600" />
          </div>
          <div className="p-2.5">
            <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">{photo.mealName}</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{photo.displayName} · {timeAgo(photo.timestamp)}</p>
            <button
              onClick={() => toggleLike(photo.id)}
              className={`flex items-center gap-1 mt-2 text-xs font-medium transition-colors ${photo.liked ? 'text-red-500' : 'text-gray-300 dark:text-gray-600 hover:text-red-400'}`}
            >
              <Heart size={14} fill={photo.liked ? 'currentColor' : 'none'} />
              {photo.likes}
            </button>
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

export function SocialView() {
  const [tab, setTab] = useState<SocialTab>('feed')

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Tab bar */}
      <div className="shrink-0 bg-white dark:bg-[#1C1C1E] border-b border-gray-100 dark:border-[#38383A] flex px-4 gap-1 pt-2">
        {SOCIAL_TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={[
              'flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg border-b-2 -mb-px transition-colors',
              tab === id
                ? 'text-blue-600 dark:text-blue-400 border-blue-500'
                : 'text-gray-400 dark:text-gray-500 border-transparent hover:text-gray-600 dark:hover:text-gray-300',
            ].join(' ')}
          >
            <Icon size={14} />
            {label}
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
            <ActivityFeed />
          </div>
        )}
        {tab === 'friends' && <FriendsListView />}
        {tab === 'leaderboard' && <LeaderboardView />}
        {tab === 'meals' && (
          <div>
            <div className="px-4 pt-4 pb-1">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Friends' meals</p>
            </div>
            <MealPhotoFeed />
          </div>
        )}
      </div>

      {/* Coming soon banner */}
      <div className="shrink-0 mx-4 mb-3 mt-1 bg-blue-50 dark:bg-blue-900/20 rounded-2xl px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800/40 rounded-full flex items-center justify-center shrink-0">
          <Clock size={15} className="text-blue-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">Social features coming soon</p>
          <p className="text-[11px] text-blue-500 dark:text-blue-400 leading-snug">Live sync, real friends & activity are in progress</p>
        </div>
      </div>
    </div>
  )
}
