'use client'

import { useSyncExternalStore } from 'react'

import { MAX_QUANTITY } from '@/lib/publications/format'

/**
 * Bookshop cart kept in localStorage so it survives navigating between the
 * shop and a product page. Holds publication ids and quantities only.
 */

type Cart = Record<string, number>

const KEY = 'dmrc-bookshop-cart'
const listeners = new Set<() => void>()
let snapshot: Cart = {}
let loaded = false

const read = (): Cart => {
  try {
    const raw = window.localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Cart) : {}
  } catch {
    return {}
  }
}

const write = (next: Cart) => {
  snapshot = next
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // Storage may be unavailable (private mode); the cart still works for this page view.
  }
  listeners.forEach((listener) => listener())
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const getSnapshot = () => {
  if (!loaded) {
    snapshot = read()
    loaded = true
  }
  return snapshot
}

const empty: Cart = {}

export const cartActions = {
  add(id: string, quantity = 1) {
    const current = getSnapshot()[id] ?? 0
    write({ ...getSnapshot(), [id]: Math.min(MAX_QUANTITY, current + quantity) })
  },
  set(id: string, quantity: number) {
    const { [id]: _removed, ...rest } = getSnapshot()
    write(quantity > 0 ? { ...rest, [id]: Math.min(MAX_QUANTITY, quantity) } : rest)
  },
  clear() {
    write({})
  },
}

export const useCart = () => useSyncExternalStore(subscribe, getSnapshot, () => empty)
