const EVENT_PHOTO_BUCKET = 'event-photos'

export function retentionCutoff(now = new Date()) {
  const cutoff = new Date(now)
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 1)
  return cutoff
}

export function photoStoragePath(photoUrl) {
  if (typeof photoUrl !== 'string' || !photoUrl.trim()) return null

  try {
    const url = new URL(photoUrl)
    const match = url.pathname.match(/\/storage\/v1\/object\/(?:public|sign)\/event-photos\/(.+)$/)
    return match ? decodeURIComponent(match[1]) : null
  } catch {
    return null
  }
}

async function removeRows(supabase, table, column, ids) {
  if (!ids.length) return
  const { error } = await supabase.from(table).delete().in(column, ids)
  if (error) throw new Error(`Suppression ${table} impossible : ${error.message}`)
}

export async function deleteExpiredEvent(supabase, event) {
  const { data: slots, error: slotsError } = await supabase
    .from('slots')
    .select('id')
    .eq('event_id', event.id)
  if (slotsError) throw new Error(`Lecture des créneaux impossible : ${slotsError.message}`)

  // Ces suppressions explicites protègent aussi les anciennes bases où toutes les
  // contraintes ON DELETE CASCADE n'auraient pas encore été ajoutées.
  await removeRows(supabase, 'slot_signups', 'slot_id', (slots || []).map(({ id }) => id))
  await removeRows(supabase, 'carpool', 'event_id', [event.id])

  const path = photoStoragePath(event.photo_url)
  if (path) {
    const { error: photoError } = await supabase.storage.from(EVENT_PHOTO_BUCKET).remove([path])
    if (photoError) throw new Error(`Suppression de la photo impossible : ${photoError.message}`)
  }

  const { error: eventError } = await supabase.from('events').delete().eq('id', event.id)
  if (eventError) throw new Error(`Suppression de l’événement impossible : ${eventError.message}`)
}
