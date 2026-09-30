import { createClient } from '@supabase/supabase-js'
import { takeOrganizerTokenFromHash } from './event-access'

export function getSupabase(access = {}) {
    // Nettoyage défensif : enlève un éventuel /rest/v1/ et les slashs finaux
    const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '')
      .trim()
      .replace(/\/rest\/v1\/?$/, '')
      .replace(/\/+$/, '')
    const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()

    if (!url || !key) {
      throw new Error(
        `[Supabase] Variable manquante au build: ` +
        `${!url ? 'NEXT_PUBLIC_SUPABASE_URL ' : ''}${!key ? 'NEXT_PUBLIC_SUPABASE_ANON_KEY' : ''}`.trim() +
        ` — vérifie Vercel > Environment Variables (scope Production), puis redéploie sans cache.`
      )
    }

  // Les composants existants restent simples : le contexte vient de l'URL courante.
  // Les appels serveur passent toujours leur lien explicitement.
  if (typeof window !== 'undefined' && !access.inviteLinkId && !access.organizerToken) {
    const match = window.location.pathname.match(/^\/invite\/([^/]+)/)
    const eventMatch = window.location.pathname.match(/^\/event\/([^/]+)/)
    if (match) access = { inviteLinkId: decodeURIComponent(match[1]) }
    else if (eventMatch) access = { organizerToken: takeOrganizerTokenFromHash(eventMatch[1]) }
  }
  const headers = {}
  if (access.inviteLinkId) headers['x-planify-invite-link'] = access.inviteLinkId
  if (access.organizerToken) headers['x-planify-organizer-token'] = access.organizerToken
  return createClient(url, key, { global: { headers } })
}
