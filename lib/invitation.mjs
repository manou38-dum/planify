// Accroche par défaut selon le type d'événement. L'accroche écrite par l'organisateur reste prioritaire.
function defaultHook(event) {
  const pourQui = event.event_options?.pour_qui?.trim()
  switch (event.event_type) {
    case 'BBQ': return 'On allume le barbecue, chacun apporte un petit quelque chose… il ne manque plus que toi !'
    case 'Apero': return 'Un verre, quelques bonnes choses à grignoter et du temps ensemble. Tu en es ?'
    case 'Anniversaire': return pourQui ? `On fête ${pourQui} et ce sera encore mieux avec toi !` : 'Un anniversaire à fêter, et ce sera encore mieux avec toi !'
    case 'Soirée': return 'Musique, bonne humeur et belles retrouvailles : la soirée n’attend plus que toi.'
    case 'Randonnée': return 'Une belle sortie à partager. Dis-nous si tu viens pour qu’on s’organise ensemble.'
    case 'Match/Tournoi': return 'Une journée de jeu et de retrouvailles. Viens jouer, encourager ou donner un coup de main !'
    default: return 'Une occasion de se retrouver et de passer un bon moment ensemble !'
  }
}
export function invitationHook(event) {
  return event.event_options?.invitation_hook?.trim() || defaultHook(event)
}
// Message partagé (WhatsApp, SMS, e-mail) : sans émoji (caractères cassés) et avec le lien Planify en dernier,
// pour que WhatsApp affiche l'aperçu de l'invitation.
export function invitationMessage(event, origin) {
  const url = `${origin}/invite/${event.invite_link_id}`
  const format = value => new Date(value).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })
  const lines = [`${event.organizer_name} t’invite !`, '', invitationHook(event), '', `*${event.event_name}*`, `Quand : ${format(event.date)}`]
  if (event.location) lines.push(`Où : ${event.location}`)
  if (event.event_options?.surprise) lines.unshift(`Surprise : ne préviens pas ${event.event_options.pour_qui || 'la personne fêtée'} !`, '')
  // Les notes de calcul sont réservées à l'organisateur, même pour les anciens événements.
  const sansApports = event.mode === 'solo' || event.event_type === 'Match/Tournoi' || event.event_options?.anniv_type === 'enfant'
  lines.push('', sansApports ? 'Dis-nous si tu viens et à combien :' : 'Dis-nous si tu viens, avec qui, et choisis ce que tu aimerais apporter.')
  if (event.deadline_rsvp) lines.push(`Réponse souhaitée avant le ${new Date(event.deadline_rsvp).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Paris' })}.`)
  lines.push(url)
  return { url, text: lines.join('\n') }
}
