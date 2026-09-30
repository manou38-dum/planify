const STORAGE_KEY = 'planify.organizer-tokens.v1'

export function createOrganizerToken() {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
}

export async function organizerTokenHash(token) {
  const bytes = new TextEncoder().encode(token)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
}

function readStore() {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}') || {} } catch { return {} }
}

export function organizerTokenFor(eventId) {
  return readStore()[eventId] || ''
}

export function organizerTokens() {
  return Object.values(readStore()).filter(token => /^[a-f0-9]{64}$/i.test(token))
}

export function organizerTokenEntries() {
  return Object.entries(readStore()).filter(([, token]) => /^[a-f0-9]{64}$/i.test(token))
}

export function rememberOrganizerToken(eventId, token) {
  if (typeof window === 'undefined' || !eventId || !/^[a-f0-9]{64}$/i.test(token || '')) return
  const next = { ...readStore(), [eventId]: token }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

export function takeOrganizerTokenFromHash(eventId) {
  if (typeof window === 'undefined') return organizerTokenFor(eventId)
  const value = new URLSearchParams(window.location.hash.slice(1)).get('admin') || ''
  if (/^[a-f0-9]{64}$/i.test(value)) {
    rememberOrganizerToken(eventId, value)
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
    return value
  }
  return organizerTokenFor(eventId)
}
