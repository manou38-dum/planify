'use client'
import { useEffect } from 'react'
import { getSupabase } from './supabase'

// Refresh only shared data: never reset a guest's form or the organizer's draft.
export function useSharedItems(eventId, setItems, setLists, paused = false) {
  useEffect(() => {
    if (!eventId || paused) return
    let stopped = false
    let busy = false
    const controller = new AbortController()
    async function refresh() {
      if (stopped || busy || document.visibilityState === 'hidden') return
      busy = true
      try {
        const supabase = getSupabase()
        const [items, lists] = await Promise.all([
          supabase.from('items').select('*').eq('event_id', eventId).order('category').abortSignal(controller.signal),
          supabase.from('lists').select('id, behavior').eq('event_id', eventId).abortSignal(controller.signal),
        ])
        if (!stopped) {
          if (!items.error && Array.isArray(items.data)) setItems(items.data)
          if (!lists.error && Array.isArray(lists.data)) setLists(lists.data)
        }
      } catch { /* Keep the last successful list during a temporary outage. */ }
      finally { busy = false }
    }
    const interval = setInterval(refresh, 15000)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    refresh()
    return () => {
      stopped = true
      controller.abort()
      clearInterval(interval)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [eventId, setItems, setLists, paused])
}
