import { createClient } from '@supabase/supabase-js'
import { deleteExpiredEvent, retentionCutoff } from '../../../../lib/event-retention.mjs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function serverSupabase() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '')
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
  if (!url || !serviceRoleKey) throw new Error('Configuration Supabase serveur incomplète')

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function GET(request) {
  const secret = process.env.CRON_SECRET
  if (!secret) return Response.json({ error: 'Tâche planifiée non configurée' }, { status: 503 })
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const supabase = serverSupabase()
    const cutoff = retentionCutoff()
    const { data: events, error } = await supabase
      .from('events')
      .select('id, photo_url')
      .lt('date', cutoff.toISOString())

    if (error) throw new Error(`Lecture des événements impossible : ${error.message}`)

    let deleted = 0
    const failures = []
    for (const event of events || []) {
      try {
        await deleteExpiredEvent(supabase, event)
        deleted += 1
      } catch (eventError) {
        console.error('Échec de la suppression automatique d’un événement expiré', eventError)
        failures.push(event.id)
      }
    }

    return Response.json({ deleted, failed: failures.length }, { status: failures.length ? 207 : 200 })
  } catch (error) {
    console.error('Échec de la tâche de suppression automatique', error)
    return Response.json({ error: 'Échec de la suppression automatique' }, { status: 500 })
  }
}
