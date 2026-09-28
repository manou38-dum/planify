export function invitationMessage(event, origin) {
  const url = `${origin}/invite/${event.invite_link_id}`
  const format = value => new Date(value).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })
  const lines = [`🎉 ${event.organizer_name} t’invite !`, '', `*${event.event_name}*`, `📅 ${format(event.date)}`]
  if (event.location) lines.push(`📍 ${event.location}`)
  if (event.event_options?.surprise) lines.unshift(`🤫 Surprise : ne préviens pas ${event.event_options.pour_qui || 'la personne fêtée'} !`, '')
  // Les notes de calcul sont réservées à l'organisateur, même pour les anciens événements.
  lines.push('', event.mode === 'solo' ? 'Confirme ta présence en quelques secondes 👇' : 'Confirme ta présence et choisis ce que tu apportes 👇')
  if (event.deadline_rsvp) lines.push(`Réponse souhaitée avant le ${format(event.deadline_rsvp)}`)
  lines.push(url)
  return { url, text: lines.join('\n') }
}
