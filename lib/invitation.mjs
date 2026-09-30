// Textes partagés avec les invités (voir docs/maquettes/ORGANISATEUR_V3.md).
// Règles : courts, tutoiement, une question qui appelle une réponse, aucun émoji (caractères cassés
// dans certains envois), aucune promesse de fonction absente (pas de SMS automatique, paiement,
// cagnotte ni rappel automatique).

// Accroche par défaut selon le type d'événement. L'accroche écrite par l'organisateur reste prioritaire.
function defaultHook(event) {
  const options = event.event_options || {}
  const pourQui = options.pour_qui?.trim()
  const activite = options.activite?.trim()
  switch (event.event_type) {
    case 'BBQ': return 'Le barbecue chauffe, il ne manque plus que toi. Tu viens ?'
    case 'Apero': return 'Un verre, de quoi grignoter et le plaisir de se voir. Tu passes ?'
    case 'Anniversaire': return pourQui
      ? `On fête ${pourQui}, et ce sera bien plus beau avec toi. Tu es des nôtres ?`
      : 'Un anniversaire à fêter, et ce sera bien plus beau avec toi. Tu es des nôtres ?'
    case 'Soirée': return 'Bonne musique, bonne compagnie : la soirée sera meilleure avec toi. Tu viens ?'
    case 'Randonnée': return sortieHook(activite)
    case 'Match/Tournoi': return 'Joueur, supporter ou bénévole : il y a une place pour toi. Tu viens ?'
    default: return 'Une bonne occasion de se retrouver. Tu en es ?'
  }
}
// Activité saisie librement (« RANDONNEE », « vtt », « Rando ») : casse normale, sigles gardés, pas de « sortie randonnée ».
function sortieHook(activite) {
  const brut = String(activite || '').trim()
  if (!brut) return 'Une belle sortie au grand air, à faire ensemble. Tu nous accompagnes ?'
  const plie = brut.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  if (/^(randonnee|rando|marche|balade)$/.test(plie)) return 'Une randonnée au grand air, à faire ensemble. Tu nous accompagnes ?'
  const nom = brut.length <= 4 && brut === brut.toUpperCase() ? brut : brut.toLowerCase()
  return `Une sortie ${nom} au grand air, à faire ensemble. Tu nous accompagnes ?`
}
export function invitationHook(event) {
  return event.event_options?.invitation_hook?.trim() || defaultHook(event)
}

// Phrase d'appel à répondre, adaptée à ce que l'invité peut faire sur la page.
function callToAction(event) {
  const options = event.event_options || {}
  if (event.event_type === 'Match/Tournoi') return 'Dis-nous si tu viens et à combien :'
  if (options.anniv_type === 'enfant') return 'Dis-nous si vous venez et à combien :'
  if (event.mode === 'solo') return 'Dis-nous si tu viens et à combien :'
  if (event.event_type === 'Randonnée') {
    const listes = options.selected_lists || {}
    if (listes.checklist && !listes.menu) return 'Dis-nous si tu viens et à combien, et coche ton matériel :'
    if (!listes.checklist && !listes.menu) return 'Dis-nous si tu viens et à combien :'
  }
  return 'Dis-nous si tu viens, avec qui, et choisis ce que tu apportes :'
}

// Message partagé (WhatsApp, SMS, e-mail) : sans émoji et avec le lien Planify en dernier,
// pour que WhatsApp affiche l'aperçu de l'invitation.
export function invitationMessage(event, origin) {
  const url = `${origin}/invite/${event.invite_link_id}`
  const format = value => new Date(value).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })
  const lines = [`${event.organizer_name} t’invite : *${event.event_name}*`, invitationHook(event), '', `Quand : ${format(event.date)}`]
  if (event.location) lines.push(`Où : ${event.location}`)
  if (event.event_options?.surprise) lines.unshift(`Chut, c’est une surprise : n’en parle pas à ${event.event_options.pour_qui || 'la personne fêtée'} !`, '')
  // Les notes de calcul sont réservées à l'organisateur, même pour les anciens événements.
  lines.push('')
  if (event.deadline_rsvp) lines.push(`Réponse idéalement avant le ${new Date(event.deadline_rsvp).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Paris' })}.`)
  lines.push(callToAction(event), url)
  return { url, text: lines.join('\n') }
}

// Texte de l'aperçu du lien (WhatsApp, SMS) : le titre et l'image montrent déjà le nom, la date et le lieu,
// donc on dit seulement ce que l'invité peut faire en ouvrant le lien.
export function invitationPreviewText(event) {
  const cta = callToAction(event).replace(/\s*:$/, '.').replace(/^Dis-nous/, 'Dis-nous en un instant')
  return `${event.organizer_name} t’invite. ${cta}`
}

// Liste lisible des manques : au plus 4 éléments, puis « et N autres ».
export function listeManques(manques, max = 4) {
  if (manques.length <= max) return manques.join(', ')
  const reste = manques.length - max
  return `${manques.slice(0, max).join(', ')} et ${reste} autre${reste > 1 ? 's' : ''}`
}
