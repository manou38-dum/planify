export function invitationHook(event) {
 return event.event_options?.invitation_hook?.trim() || (event.event_type === 'BBQ' ? 'On allume le barbecue, on partage les bonnes choses… il ne manque plus que toi !' : 'Une occasion de se retrouver et de passer un bon moment ensemble !')
}
export function invitationMessage(event, origin) {
  const url = `${origin}/invite/${event.invite_link_id}`
  const format = value => new Date(value).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })
  const lines = [`${event.organizer_name} t’invite !`, '', invitationHook(event), '', `*${event.event_name}*`, `Quand : ${format(event.date)}`]
  if (event.location) lines.push(`Où : ${event.location}`)
  if (event.event_options?.surprise) lines.unshift(`Surprise : ne préviens pas ${event.event_options.pour_qui || 'la personne fêtée'} !`, '')
  // Les notes de calcul sont réservées à l'organisateur, même pour les anciens événements.
  lines.push('', event.mode === 'solo' ? 'Tu seras des nôtres ? Réponds ici :' : 'Tu viens ? Indique avec qui et choisis ce que tu aimerais apporter :')
  if (event.deadline_rsvp) lines.push(`Réponse souhaitée avant le ${format(event.deadline_rsvp)}`)
  lines.push(url)
  return { url, text: lines.join('\n') }
}
