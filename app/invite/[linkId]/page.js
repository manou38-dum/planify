import { getSupabase } from '@/lib/supabase'
import InviteClient from './InviteClient'

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
      weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return ''
  }
}

export async function generateMetadata({ params }) {
  const event = await fetchEvent(params.linkId)

  if (!event) {
    return {
      title: 'Invitation Planify',
      description: 'Tu es invité(e) ! Confirme ta venue avec Planify.',
      openGraph: {
        title: 'Invitation Planify',
        description: 'Tu es invité(e) ! Confirme ta venue avec Planify.',
        type: 'website',
      },
    }
  }

  const title = event.event_name
  const description = `Organisé par ${event.organizer_name} - ${formatDateFr(event.date)}. Confirme ta venue !`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      // Si une photo existe, on la propose en premier ; l'opengraph-image généré reste en fallback
      ...(event.photo_url ? { images: [{ url: event.photo_url }] } : {}),
    },
  }
}

export default function InvitePage({ params }) {
  return <InviteClient linkId={params.linkId} />
}
