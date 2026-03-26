'use client'

import { useState, useEffect, useCallback } from 'react'
import { isFirebaseConfigured, db } from '@/lib/firebase'
import type { Friend, FeedItem, LeaderboardEntry } from '@/types'

export interface ScheduleBlock {
  id: string
  startTime: string
  endTime: string
  title: string
  category: string
  status: string
  visible: boolean
}

export interface CurrentUserStats {
  displayName: string
  username: string
  photoURL?: string
  weeklyPoints: number
  streak: number
}

export function useSocial(userId: string | undefined) {
  const [allFriends, setAllFriends] = useState<Friend[]>([])
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [feedLoading, setFeedLoading] = useState(false)
  const [leaderboardLoading, setLeaderboardLoading] = useState(false)

  // Real-time friends listener
  useEffect(() => {
    if (!isFirebaseConfigured || !db || !userId) {
      setLoading(false)
      return
    }

    let unsubscribe: (() => void) | undefined

    const setup = async () => {
      const { collection, onSnapshot } = await import('firebase/firestore')
      unsubscribe = onSnapshot(
        collection(db!, 'users', userId, 'friends'),
        (snap) => {
          const data: Friend[] = snap.docs.map(d => {
            const r = d.data()
            return {
              id: d.id,
              username: r.username ?? '',
              displayName: r.displayName ?? '',
              photoURL: r.photoURL ?? undefined,
              streak: r.streak ?? 0,
              weeklyPoints: r.weeklyPoints ?? 0,
              status: r.status ?? 'accepted',
            }
          })
          setAllFriends(data)
          setLoading(false)
        },
        () => setLoading(false)
      )
    }

    setup()
    return () => { if (unsubscribe) unsubscribe() }
  }, [userId])

  const loadFeed = useCallback(async (acceptedFriends: Friend[]) => {
    if (!isFirebaseConfigured || !db || !userId) return
    if (acceptedFriends.length === 0) { setFeed([]); return }
    setFeedLoading(true)
    try {
      const { collection, getDocs, query, orderBy, limit } = await import('firebase/firestore')
      const allItems: FeedItem[] = []
      await Promise.all(acceptedFriends.map(async (friend) => {
        try {
          const q = query(
            collection(db!, 'users', friend.id, 'feedEvents'),
            orderBy('timestamp', 'desc'),
            limit(10)
          )
          const snap = await getDocs(q)
          snap.docs.forEach(d => {
            const r = d.data()
            allItems.push({
              id: `${friend.id}_${d.id}`,
              eventId: d.id,
              ownerId: friend.id,
              userId: friend.id,
              username: friend.username,
              displayName: friend.displayName,
              photoURL: friend.photoURL,
              type: r.type,
              content: r.content,
              timestamp: r.timestamp?.toDate() ?? new Date(),
              mealPhotoURL: r.photoURL,
              mealName: r.mealName,
              likedBy: r.likedBy ?? [],
              liked: (r.likedBy ?? []).includes(userId),
              likes: r.likes ?? 0,
            })
          })
        } catch { /* skip this friend */ }
      }))
      allItems.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      setFeed(allItems.slice(0, 40))
    } catch {}
    setFeedLoading(false)
  }, [userId])

  const loadLeaderboard = useCallback(async (currentUser: CurrentUserStats, acceptedFriends: Friend[]) => {
    if (!userId) return
    setLeaderboardLoading(true)
    try {
      type FriendEntry = { userId: string; username: string; displayName: string; photoURL?: string; weeklyPoints: number; streak: number }
      let friendData: FriendEntry[] = acceptedFriends.map(f => ({
        userId: f.id, username: f.username, displayName: f.displayName,
        photoURL: f.photoURL, weeklyPoints: f.weeklyPoints, streak: f.streak,
      }))

      if (isFirebaseConfigured && db && acceptedFriends.length > 0) {
        const { doc, getDoc } = await import('firebase/firestore')
        friendData = await Promise.all(
          acceptedFriends.map(async (friend) => {
            try {
              const snap = await getDoc(doc(db!, 'users', friend.id, 'profile', 'data'))
              const r = snap.exists() ? snap.data() : {}
              return {
                userId: friend.id, username: friend.username,
                displayName: friend.displayName, photoURL: friend.photoURL,
                weeklyPoints: r.weeklyPoints ?? friend.weeklyPoints ?? 0,
                streak: r.streak?.current ?? friend.streak ?? 0,
              }
            } catch {
              return {
                userId: friend.id, username: friend.username,
                displayName: friend.displayName, photoURL: friend.photoURL,
                weeklyPoints: friend.weeklyPoints ?? 0, streak: friend.streak ?? 0,
              }
            }
          })
        )
      }

      const all = [
        { userId, username: currentUser.username, displayName: currentUser.displayName,
          photoURL: currentUser.photoURL, weeklyPoints: currentUser.weeklyPoints,
          streak: currentUser.streak, isCurrentUser: true },
        ...friendData,
      ]
      all.sort((a, b) => b.weeklyPoints - a.weeklyPoints)
      setLeaderboard(all.map((e, i) => ({ ...e, rank: i + 1 }) as LeaderboardEntry))
    } catch {}
    setLeaderboardLoading(false)
  }, [userId])

  const sendRequest = useCallback(async (username: string): Promise<void> => {
    if (!isFirebaseConfigured || !db || !userId) throw new Error('Not signed in')
    const trimmed = username.replace(/^@/, '').toLowerCase().trim()
    if (!trimmed) throw new Error('Enter a username')
    const { doc, getDoc, setDoc, serverTimestamp } = await import('firebase/firestore')
    const usernameDoc = await getDoc(doc(db!, 'usernames', trimmed))
    if (!usernameDoc.exists()) throw new Error('User not found')
    const friendUid = usernameDoc.data().uid as string
    if (friendUid === userId) throw new Error("You can't add yourself")
    const existing = await getDoc(doc(db!, 'users', userId, 'friends', friendUid))
    if (existing.exists()) {
      throw new Error(existing.data().status === 'accepted' ? 'Already friends' : 'Request already sent')
    }
    const [mySnap, friendSnap] = await Promise.all([
      getDoc(doc(db!, 'users', userId, 'profile', 'data')),
      getDoc(doc(db!, 'users', friendUid, 'profile', 'data')),
    ])
    const myData = mySnap.data() ?? {}
    const friendData = friendSnap.data() ?? {}
    await Promise.all([
      setDoc(doc(db!, 'users', userId, 'friends', friendUid), {
        uid: friendUid, status: 'pending_sent',
        displayName: friendData.displayName ?? trimmed, username: trimmed,
        photoURL: friendData.photoURL ?? null,
        streak: friendData.streak?.current ?? 0, weeklyPoints: friendData.weeklyPoints ?? 0,
        addedAt: serverTimestamp(),
      }),
      setDoc(doc(db!, 'users', friendUid, 'friends', userId), {
        uid: userId, status: 'pending_received',
        displayName: myData.displayName ?? '', username: myData.username ?? '',
        photoURL: myData.photoURL ?? null,
        streak: myData.streak?.current ?? 0, weeklyPoints: myData.weeklyPoints ?? 0,
        addedAt: serverTimestamp(),
      }),
    ])
  }, [userId])

  const acceptRequest = useCallback(async (friendUid: string): Promise<void> => {
    if (!isFirebaseConfigured || !db || !userId) throw new Error('Not signed in')
    const { doc, updateDoc } = await import('firebase/firestore')
    await Promise.all([
      updateDoc(doc(db!, 'users', userId, 'friends', friendUid), { status: 'accepted' }),
      updateDoc(doc(db!, 'users', friendUid, 'friends', userId), { status: 'accepted' }),
    ])
  }, [userId])

  const removeFriend = useCallback(async (friendUid: string): Promise<void> => {
    if (!isFirebaseConfigured || !db || !userId) throw new Error('Not signed in')
    const { doc, deleteDoc } = await import('firebase/firestore')
    await Promise.all([
      deleteDoc(doc(db!, 'users', userId, 'friends', friendUid)),
      deleteDoc(doc(db!, 'users', friendUid, 'friends', userId)).catch(() => {}),
    ])
  }, [userId])

  const getFriendSchedule = useCallback(async (friendUid: string): Promise<ScheduleBlock[]> => {
    if (!isFirebaseConfigured || !db) return []
    const today = new Date().toISOString().slice(0, 10)
    const { doc, getDoc } = await import('firebase/firestore')
    const [schedSnap, profileSnap] = await Promise.all([
      getDoc(doc(db!, 'users', friendUid, 'schedules', today)),
      getDoc(doc(db!, 'users', friendUid, 'profile', 'data')),
    ])
    if (!schedSnap.exists()) return []
    const blocks: Array<{ id?: string; startTime: string; endTime: string; title: string; category: string; status: string }> = schedSnap.data().blocks ?? []
    const privacy: Record<string, boolean> = profileSnap.data()?.privacy ?? {}
    return blocks.map(b => {
      const visible = privacy[(b.category ?? '').toLowerCase()] !== false
      return { id: b.id ?? '', startTime: b.startTime, endTime: b.endTime,
        title: visible ? b.title : 'Private Block', category: b.category, status: b.status, visible }
    })
  }, [])

  const toggleLike = useCallback(async (ownerId: string, eventId: string, currentlyLiked: boolean): Promise<void> => {
    if (!isFirebaseConfigured || !db || !userId) return
    const { doc, updateDoc, arrayUnion, arrayRemove, increment } = await import('firebase/firestore')
    await updateDoc(doc(db!, 'users', ownerId, 'feedEvents', eventId), {
      likedBy: currentlyLiked ? arrayRemove(userId) : arrayUnion(userId),
      likes: increment(currentlyLiked ? -1 : 1),
    })
    setFeed(prev => prev.map(item =>
      item.ownerId === ownerId && item.eventId === eventId
        ? { ...item, liked: !currentlyLiked }
        : item
    ))
  }, [userId])

  const writeEvent = useCallback(async (type: string, content: string, extra?: Record<string, unknown>): Promise<void> => {
    if (!isFirebaseConfigured || !db || !userId) return
    const { collection, addDoc, serverTimestamp } = await import('firebase/firestore')
    await addDoc(collection(db!, 'users', userId, 'feedEvents'), {
      type, content, timestamp: serverTimestamp(), likedBy: [], likes: 0, ...extra,
    })
  }, [userId])

  return {
    friends: allFriends.filter(f => f.status === 'accepted'),
    pendingIn: allFriends.filter(f => f.status === 'pending_received'),
    pendingOut: allFriends.filter(f => f.status === 'pending_sent'),
    loading,
    feed,
    feedLoading,
    leaderboard,
    leaderboardLoading,
    loadFeed,
    loadLeaderboard,
    sendRequest,
    acceptRequest,
    removeFriend,
    getFriendSchedule,
    toggleLike,
    writeEvent,
  }
}
