'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, X, Circle, CheckCircle2, ChevronDown, ChevronRight } from 'lucide-react'

interface ListItem {
  id: string
  text: string
  done: boolean
}

interface UserList {
  id: string
  name: string
  emoji: string
  items: ListItem[]
  collapsed: boolean
}

const STORAGE_KEY = 'daycal_lists'

function loadLists(): UserList[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveLists(lists: UserList[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lists))
}

const LIST_EMOJIS = ['📝', '🛒', '✅', '📚', '💼', '🏠', '🎯', '🍽️', '💪', '🎮', '🎵', '🌿', '💊', '✈️', '🎁']

export function ListsView() {
  const [lists, setLists] = useState<UserList[]>([])
  const [newListName, setNewListName] = useState('')
  const [newListEmoji, setNewListEmoji] = useState('📝')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [addingList, setAddingList] = useState(false)
  const [draftItems, setDraftItems] = useState<Record<string, string>>({})
  const newListInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setLists(loadLists())
  }, [])

  const update = (next: UserList[]) => {
    setLists(next)
    saveLists(next)
  }

  const createList = () => {
    const name = newListName.trim()
    if (!name) return
    update([
      ...lists,
      { id: Date.now().toString(), name, emoji: newListEmoji, items: [], collapsed: false },
    ])
    setNewListName('')
    setNewListEmoji('📝')
    setAddingList(false)
  }

  const deleteList = (id: string) => {
    update(lists.filter((l) => l.id !== id))
  }

  const toggleCollapse = (id: string) => {
    update(lists.map((l) => l.id === id ? { ...l, collapsed: !l.collapsed } : l))
  }

  const addItem = (listId: string) => {
    const text = (draftItems[listId] ?? '').trim()
    if (!text) return
    update(lists.map((l) =>
      l.id === listId
        ? { ...l, items: [...l.items, { id: Date.now().toString(), text, done: false }] }
        : l
    ))
    setDraftItems((d) => ({ ...d, [listId]: '' }))
  }

  const toggleItem = (listId: string, itemId: string) => {
    update(lists.map((l) =>
      l.id === listId
        ? { ...l, items: l.items.map((i) => i.id === itemId ? { ...i, done: !i.done } : i) }
        : l
    ))
  }

  const deleteItem = (listId: string, itemId: string) => {
    update(lists.map((l) =>
      l.id === listId ? { ...l, items: l.items.filter((i) => i.id !== itemId) } : l
    ))
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* Header + new list */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-50">Lists</h1>
            <p className="text-xs text-gray-400 dark:text-gray-500">Shopping, to-dos, anything</p>
          </div>
          {!addingList && (
            <button
              onClick={() => { setAddingList(true); setTimeout(() => newListInputRef.current?.focus(), 50) }}
              className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-xl px-4 py-2 transition-colors"
            >
              <Plus size={15} />
              New list
            </button>
          )}
        </div>

        {/* New list form */}
        {addingList && (
          <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-blue-200 dark:border-blue-800 p-4 space-y-3">
            <div className="flex items-center gap-2">
              {/* Emoji picker */}
              <div className="relative">
                <button
                  onClick={() => setShowEmojiPicker((v) => !v)}
                  className="w-10 h-10 text-xl flex items-center justify-center bg-gray-50 dark:bg-[#2C2C2E] rounded-xl border border-gray-200 dark:border-[#38383A] hover:bg-gray-100 dark:hover:bg-[#3A3A3C] transition-colors"
                >
                  {newListEmoji}
                </button>
                {showEmojiPicker && (
                  <div className="absolute top-12 left-0 bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-[#38383A] rounded-2xl p-2 z-20 shadow-xl grid grid-cols-5 gap-1 w-44">
                    {LIST_EMOJIS.map((e) => (
                      <button
                        key={e}
                        onClick={() => { setNewListEmoji(e); setShowEmojiPicker(false) }}
                        className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-100 dark:hover:bg-[#3A3A3C] rounded-lg transition-colors"
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <input
                ref={newListInputRef}
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') createList(); if (e.key === 'Escape') setAddingList(false) }}
                placeholder="List name…"
                className="flex-1 bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-[#38383A] rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-gray-50 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-400 transition"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={createList} disabled={!newListName.trim()} className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl py-2 transition-colors">
                Create
              </button>
              <button onClick={() => setAddingList(false)} className="flex-1 bg-gray-100 dark:bg-[#2C2C2E] text-gray-700 dark:text-gray-200 text-sm font-semibold rounded-xl py-2 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {lists.length === 0 && !addingList && (
          <div className="text-center py-16">
            <p className="text-3xl mb-3">📝</p>
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">No lists yet</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Create a shopping list, to-do, or anything else</p>
          </div>
        )}

        {/* Lists */}
        {lists.map((list) => {
          const activeItems = list.items.filter((i) => !i.done)
          const doneItems = list.items.filter((i) => i.done)
          return (
            <div key={list.id} className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-100 dark:border-[#38383A] overflow-hidden">
              {/* List header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-[#38383A]">
                <span className="text-xl">{list.emoji}</span>
                <span className="flex-1 font-semibold text-gray-900 dark:text-gray-50 text-sm">{list.name}</span>
                {list.items.length > 0 && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">{activeItems.length}/{list.items.length}</span>
                )}
                <button
                  onClick={() => toggleCollapse(list.id)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1"
                >
                  {list.collapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
                </button>
                <button
                  onClick={() => deleteList(list.id)}
                  className="text-gray-300 dark:text-gray-600 hover:text-red-400 transition-colors p-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {!list.collapsed && (
                <>
                  {/* Items */}
                  <div className="divide-y divide-gray-50 dark:divide-[#2C2C2E]">
                    {activeItems.map((item) => (
                      <div key={item.id} className="group flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-[#2C2C2E] transition-colors">
                        <button onClick={() => toggleItem(list.id, item.id)} className="shrink-0 text-gray-300 dark:text-gray-600 hover:text-blue-500 transition-colors">
                          <Circle size={16} />
                        </button>
                        <span className="flex-1 text-sm text-gray-800 dark:text-gray-100">{item.text}</span>
                        <button onClick={() => deleteItem(list.id, item.id)} className="shrink-0 opacity-0 group-hover:opacity-100 text-gray-300 dark:text-gray-600 hover:text-red-400 transition-all">
                          <X size={13} />
                        </button>
                      </div>
                    ))}

                    {doneItems.length > 0 && (
                      doneItems.map((item) => (
                        <div key={item.id} className="group flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-[#2C2C2E] transition-colors opacity-40">
                          <button onClick={() => toggleItem(list.id, item.id)} className="shrink-0 text-green-500 transition-colors">
                            <CheckCircle2 size={16} />
                          </button>
                          <span className="flex-1 text-sm text-gray-400 dark:text-gray-500 line-through">{item.text}</span>
                          <button onClick={() => deleteItem(list.id, item.id)} className="shrink-0 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all">
                            <X size={13} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add item */}
                  <div className="px-4 py-2.5 flex items-center gap-3 border-t border-gray-50 dark:border-[#2C2C2E]">
                    <div className="w-4 h-4 shrink-0" />
                    <input
                      value={draftItems[list.id] ?? ''}
                      onChange={(e) => setDraftItems((d) => ({ ...d, [list.id]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === 'Enter') addItem(list.id) }}
                      placeholder="Add item…"
                      className="flex-1 text-sm text-gray-600 dark:text-gray-300 placeholder-gray-300 dark:placeholder-gray-600 bg-transparent outline-none"
                    />
                    <button
                      onClick={() => addItem(list.id)}
                      disabled={!(draftItems[list.id] ?? '').trim()}
                      className="text-blue-400 hover:text-blue-500 disabled:text-gray-200 dark:disabled:text-gray-700 transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
