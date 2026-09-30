// Usage (après security-add-owner-token.sql, avant security-rls.sql) :
// SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/claim-existing-events.mjs
// Le script affiche une seule fois les liens d'administration à ouvrir avec le navigateur de l'organisateur.
import { createClient } from '@supabase/supabase-js'
import { createHash, randomBytes } from 'node:crypto'

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) throw new Error('SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.')

const supabase = createClient(url, key, { auth: { persistSession: false } })
const { data: events, error } = await supabase.from('events').select('id,event_name,organizer_name').is('organizer_token_hash', null)
if (error) throw error

for (const event of events || []) {
  const token = randomBytes(32).toString('hex')
  const organizer_token_hash = createHash('sha256').update(token).digest('hex')
  const { error: updateError } = await supabase.from('events').update({ organizer_token_hash }).eq('id', event.id)
  if (updateError) throw updateError
  console.log(`${event.organizer_name} — ${event.event_name}\n${process.env.PLANIFY_ORIGIN || 'https://planify.manoulabs.com'}/event/${event.id}#admin=${token}\n`)
}
