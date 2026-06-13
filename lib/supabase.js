import { createClient } from '@supabase/supabase-js'

let _supabase = null

export function getSupabase() {
  if (!_supabase) {
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

    _supabase = createClient(url, key)
  }
  return _supabase
}