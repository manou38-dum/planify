import { ImageResponse } from 'next/og'
import { getSupabase } from '@/lib/supabase'

export const runtime = 'nodejs'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Invitation'

// Dégradé d'arrière-plan selon le type d'événement
const GRADIENTS = {
  'BBQ': 'linear-gradient(135deg, #fb923c 0%, #ea580c 55%, #9a3412 100%)',
  'Anniversaire': 'linear-gradient(135deg, #f472b6 0%, #d946ef 55%, #7c3aed 100%)',
  'Randonnée': 'linear-gradient(135deg, #34d399 0%, #16a34a 55%, #15803d 100%)',
  'Soirée': 'linear-gradient(135deg, #818cf8 0%, #6d28d9 55%, #4c1d95 100%)',
  'Match/Tournoi': 'linear-gradient(135deg, #60a5fa 0%, #2563eb 55%, #1e3a8a 100%)',
}
const DEFAULT_GRADIENT = 'linear-gradient(135deg, #60a5fa 0%, #2563eb 55%, #1e3a8a 100%)'

async function fetchEvent(linkId) {
  try {
    const supabase = getSupabase()
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('invite_link_id', linkId)
      .single()
    return data || null
  } catch {
    return null
  }
}

function formatDateFr(date) {
  try {
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris',
    })
  } catch {
    return ''
  }
}

// Vérifie que la photo est chargeable, sinon on retombe sur le dégradé
async function loadPhoto(url) {
  if (!url) return null
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const type = res.headers.get('content-type') || ''
    if (!type.startsWith('image/')) return null
    return url
  } catch {
    return null
  }
}

export default async function Image({ params }) {
  const event = await fetchEvent(params.linkId)

  const background = event ? (GRADIENTS[event.event_type] || DEFAULT_GRADIENT) : DEFAULT_GRADIENT
  const eventName = event ? event.event_name : 'Invitation'
  const dateStr = event ? formatDateFr(event.date) : ''
  const location = event && event.location ? event.location : ''
  const organizer = event ? event.organizer_name : ''
  const photoUrl = event ? await loadPhoto(event.photo_url) : null

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background,
          position: 'relative',
          fontFamily: 'sans-serif',
          padding: '70px',
        }}
      >
        {/* Photo de fond + overlay sombre (si fournie) */}
        {photoUrl && (
          <>
            <img
              src={photoUrl}
              width={1200}
              height={630}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex' }} />
          </>
        )}

        {/* Formes décoratives en arrière-plan (uniquement sans photo) */}
        {!photoUrl && (
          <>
            <div style={{ position: 'absolute', top: -120, left: -120, width: 360, height: 360, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', display: 'flex' }} />
            <div style={{ position: 'absolute', bottom: -160, right: -100, width: 440, height: 440, borderRadius: '50%', background: 'rgba(255,255,255,0.10)', display: 'flex' }} />
            <div style={{ position: 'absolute', top: 80, right: 120, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.10)', display: 'flex' }} />
            <div style={{ position: 'absolute', bottom: 120, left: 90, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.14)', display: 'flex' }} />
          </>
        )}

        {/* Nom de l'événement */}
        <div
          style={{
            display: 'flex',
            textAlign: 'center',
            fontSize: 68,
            fontWeight: 800,
            color: '#ffffff',
            lineHeight: 1.1,
            maxWidth: 1000,
            textShadow: '0 4px 20px rgba(0,0,0,0.25)',
          }}
        >
          {eventName}
        </div>

        {/* Date + lieu */}
        {(dateStr || location) && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginTop: 32,
            }}
          >
            {dateStr && (
              <div style={{ display: 'flex', fontSize: 34, color: 'rgba(255,255,255,0.95)' }}>{dateStr}</div>
            )}
            {location && (
              <div style={{ display: 'flex', fontSize: 30, color: 'rgba(255,255,255,0.8)', marginTop: 10 }}>{location}</div>
            )}
          </div>
        )}

        {/* Pied : organisateur + Planify */}
        <div
          style={{
            position: 'absolute',
            bottom: 50,
            left: 0,
            right: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 70px',
          }}
        >
          <div style={{ display: 'flex', fontSize: 28, color: 'rgba(255,255,255,0.85)' }}>
            {organizer ? `Organisé par ${organizer}` : ''}
          </div>
          <div style={{ display: 'flex', fontSize: 26, fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: 2 }}>
            Planify
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
