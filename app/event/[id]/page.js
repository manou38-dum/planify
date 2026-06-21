'use client'
import { useState, useEffect } from 'react'
import { getSupabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'

// Le commentaire peut être un JSON { accompagnants:[], commentaire:"" } ou du texte brut
function parseCommentaire(raw) {
  if (!raw) return { accompagnants: [], commentaire: '' }
  if (raw.trim().startsWith('{')) {
    try {
      const p = JSON.parse(raw)
      return {
        accompagnants: Array.isArray(p.accompagnants) ? p.accompagnants : [],
        commentaire: typeof p.commentaire === 'string' ? p.commentaire : '',
        repas: typeof p.repas === 'string' ? p.repas : '',
      }
    } catch { /* texte brut */ }
  }
  return { accompagnants: [], commentaire: raw, repas: '' }
}

export default function EventDashboard() {
  const { id } = useParams()
  const router = useRouter()
  const [event, setEvent] = useState(null)
  const [participants, setParticipants] = useState([])
  const [items, setItems] = useState([])
  const [lists, setLists] = useState([])
  const [slots, setSlots] = useState([])
  const [signups, setSignups] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [shareNotice, setShareNotice] = useState('')
  const [showAllMissing, setShowAllMissing] = useState(false)
  const [showAllParticipants, setShowAllParticipants] = useState(false)

  // Message à partager (relance ou récap final) : { title, text }
  const [shareMsg, setShareMsg] = useState(null)
  const [msgCopied, setMsgCopied] = useState(false)

  // Edition items
  const [editMode, setEditMode] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [newItem, setNewItem] = useState({ item_name: '', quantity: '', unit: '', estimated_price: '', category: 'Nourriture' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadAll()
  }, [id])

  async function loadAll() {
    const supabase = getSupabase()
    const [evtRes, partRes, itemRes, listRes, slotRes] = await Promise.all([
      supabase.from('events').select('*').eq('id', id).single(),
      supabase.from('participants').select('*').eq('event_id', id),
      supabase.from('items').select('*').eq('event_id', id).order('category'),
      supabase.from('lists').select('id, behavior').eq('event_id', id),
      supabase.from('slots').select('*').eq('event_id', id).order('slot_date'),
    ])
    setEvent(evtRes.data)
    setParticipants(partRes.data || [])
    setItems(itemRes.data || [])
    setLists(listRes.data || [])
    const slts = slotRes.data || []
    setSlots(slts)

    const slotIds = slts.map(s => s.id)
    if (slotIds.length > 0) {
      const { data: sus } = await supabase.from('slot_signups').select('*').in('slot_id', slotIds)
      setSignups(sus || [])
    } else {
      setSignups([])
    }
    setLoading(false)
  }

  // Annule la participation : libère ses items, supprime le participant, recharge
  async function deleteParticipant(p) {
    const prenom = p.participant_name || 'ce participant'
    if (!window.confirm(`Annuler la participation de ${prenom} ?`)) return
    const supabase = getSupabase()
    await supabase
      .from('items')
      .update({ status: 'Disponible', assigned_to: null, assigned_participant_id: null })
      .eq('assigned_participant_id', p.id)
    await supabase.from('participants').delete().eq('id', p.id)
    await loadAll()
  }

  // === CRUD Items ===
  async function deleteItem(itemId) {
    const supabase = getSupabase()
    await supabase.from('items').delete().eq('id', itemId)
    setItems(prev => prev.filter(i => i.id !== itemId))
  }

  async function addItem(e) {
    e.preventDefault()
    if (!newItem.item_name) return
    setSaving(true)
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('items')
      .insert({
        event_id: id,
        item_name: newItem.item_name,
        quantity: parseFloat(newItem.quantity) || 1,
        unit: newItem.unit || 'pcs',
        estimated_price: parseFloat(newItem.estimated_price) || 0,
        category: newItem.category,
        status: 'Disponible',
        ai_generated: false,
      })
      .select()
      .single()
    if (data) setItems(prev => [...prev, data])
    setNewItem({ item_name: '', quantity: '', unit: '', estimated_price: '', category: 'Nourriture' })
    setSaving(false)
  }

  async function saveEditItem() {
    if (!editingItem) return
    setSaving(true)
    const supabase = getSupabase()
    const { error } = await supabase
      .from('items')
      .update({
        item_name: editingItem.item_name,
        quantity: parseFloat(editingItem.quantity) || 1,
        unit: editingItem.unit,
        estimated_price: parseFloat(editingItem.estimated_price) || 0,
        category: editingItem.category,
      })
      .eq('id', editingItem.id)
    if (!error) {
      setItems(prev => prev.map(i => i.id === editingItem.id ? { ...i, ...editingItem } : i))
    }
    setEditingItem(null)
    setSaving(false)
  }

  function copyInviteLink() {
    if (!event) return
    const url = `${window.location.origin}/invite/${event.invite_link_id}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Construit le texte d'invitation partagé (WhatsApp, SMS, Email)
  // Sans emoji (caractères cassés) et SANS autre lien que le lien Planify final,
  // pour que WhatsApp génère l'aperçu de l'invitation (pas Google Maps).
  function buildInvitation() {
    const url = `${window.location.origin}/invite/${event.invite_link_id}`
    const d = new Date(event.date)
    const dateStr = d.toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
    })

    const menuResume = event.event_options?.menu_resume
    const deadlineStr = event.deadline_rsvp
      ? new Date(event.deadline_rsvp).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
      : null

    const lines = []
    if (event.event_options?.surprise) {
      lines.push(`🤫 SURPRISE — ne préviens pas ${event.event_options?.pour_qui || 'la personne fêtée'} !`, ``)
    }
    lines.push(
      `${event.organizer_name} t'invite !`,
      ``,
      `*${event.event_name}*`,
      `Quand : ${dateStr}`,
    )
    if (event.location) lines.push(`Où : ${event.location}`)
    if (menuResume) lines.push(`Au menu : ${menuResume}`)
    if (deadlineStr) lines.push(`Réponse souhaitée avant le ${deadlineStr}`)
    lines.push(``, `Confirme ta venue ici :`, url)

    return { url, text: lines.join('\n') }
  }

  // Messages de partage dédiés au Tournoi (familles vs bénévoles) — même lien d'invitation
  function buildInviteFamilies() {
    const url = `${window.location.origin}/invite/${event.invite_link_id}`
    const dateStr = new Date(event.date).toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
    })
    const lieu = event.location ? ` à ${event.location}` : ''
    return `Bonjour ! On organise ${event.event_name} le ${dateStr}${lieu}. Viens nombreux ! Dis-nous si tu viens et à combien : ${url}`
  }
  function buildMobilizeVolunteers() {
    const url = `${window.location.origin}/invite/${event.invite_link_id}`
    return `On a besoin de bras pour ${event.event_name} ! Inscris-toi sur un poste (arbitrage, buvette, montage…) : ${url}`
  }

  function shareWhatsApp() {
    if (!event) return
    const { text } = buildInvitation()
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  // Sur desktop, sms:/mailto: peuvent ne rien faire. Si la page n'a pas perdu
  // le focus 1s après, on copie le texte d'invitation dans le presse-papier.
  function openWithFallback(url, text) {
    let left = false
    const onHide = () => { left = true }
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('blur', onHide)
    window.location.href = url
    setTimeout(() => {
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('blur', onHide)
      if (!left && !document.hidden) {
        navigator.clipboard?.writeText(text)
        setShareNotice('Sur ordinateur ? Le texte a été copié, colle-le dans ton SMS ou email.')
        setTimeout(() => setShareNotice(''), 6000)
      }
    }, 1000)
  }

  function shareSMS() {
    if (!event) return
    const { text } = buildInvitation()
    openWithFallback(`sms:?&body=${encodeURIComponent(text)}`, text)
  }

  function shareEmail() {
    if (!event) return
    const { text } = buildInvitation()
    const subject = `Invitation ${event.event_name}`
    openWithFallback(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`, text)
  }

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-400 text-sm mt-3">Chargement...</p>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-slate-400">Evenement non trouve</p>
        <button onClick={() => router.push('/')} className="text-blue-500 text-sm mt-2 underline">Retour</button>
      </div>
    )
  }

  const confirmed = participants.filter(p => p.rsvp_status === 'Confirmé')
  const refused = participants.filter(p => p.rsvp_status === 'Refusé')
  const pending = participants.filter(p => p.rsvp_status === 'En attente' || p.rsvp_status === 'Peut-être')
  const totalPersonnes = confirmed.reduce((sum, p) => sum + (p.nb_personnes || 1), 0)
  const totalInvites = confirmed.length + refused.length + pending.length

  // Séparation apports / cadeaux via le behavior des listes
  const listBehavior = {}
  lists.forEach(l => { listBehavior[l.id] = l.behavior })
  const apportItems = items.filter(i => listBehavior[i.list_id] !== 'cadeau')
  const giftItems = items.filter(i => listBehavior[i.list_id] === 'cadeau')

  const disponibles = apportItems.filter(i => i.status === 'Disponible')
  const reserves = apportItems.filter(i => i.status === 'Réservé')
  const giftReserves = giftItems.filter(i => i.status === 'Réservé')
  const totalManquant = disponibles.reduce((sum, i) => sum + (i.estimated_price || 0), 0)
  const totalCouvert = reserves.reduce((sum, i) => sum + (i.estimated_price || 0), 0)
  const totalBudget = totalManquant + totalCouvert
  const pctCouvert = apportItems.length > 0 ? Math.round((reserves.length / apportItems.length) * 100) : 0

  const missingNames = disponibles.map(i => i.item_name)
  const categories = ['Nourriture', 'Boissons', 'Matériel', 'Décoration', 'Service']

  // Emoji du type d'événement (pour l'en-tête résumé)
  const TYPE_EMOJIS = { 'BBQ': '🔥', 'Anniversaire': '🎂', 'Mariage': '💍', 'Randonnée': '🥾', 'Soirée': '🎶', 'Match/Tournoi': '⚽', 'Autre': '✨' }
  const typeEmoji = TYPE_EMOJIS[event.event_type] || '🎉'

  // Date limite valable jusqu'à la FIN de la journée (même logique que côté invité)
  const dl = event.deadline_rsvp ? new Date(event.deadline_rsvp) : null
  const deadlineEnd = dl ? new Date(dl.getFullYear(), dl.getMonth(), dl.getDate(), 23, 59, 59) : null
  const isExpired = deadlineEnd ? deadlineEnd < new Date() : false

  // Jauge atteinte : autant (ou plus) de personnes confirmées que de convives attendus
  const isFull = event.nb_participants > 0 && totalPersonnes >= event.nb_participants
  // Inscriptions fermées : soit complet, soit date limite dépassée
  const isClosed = isFull || isExpired

  // Créneaux d'aide non complets (pour le récap de fin)
  const slotStatuses = slots.map(s => {
    const inscrits = signups.filter(su => su.slot_id === s.id).length
    const max = s.max_participants || 4
    return { slot_name: s.slot_name, inscrits, max, manque: Math.max(0, max - inscrits) }
  })

  // Apports réservés par un participant (hors cadeaux), triés par catégorie
  function getItemsForParticipant(p) {
    return items
      .filter(i =>
        i.status === 'Réservé' &&
        listBehavior[i.list_id] !== 'cadeau' &&
        (i.assigned_participant_id === p.id || i.assigned_to === p.participant_name)
      )
      .sort((a, b) => (a.category || '').localeCompare(b.category || ''))
  }

  // Cadeaux réservés par un participant (listes behavior 'cadeau')
  function getGiftsForParticipant(p) {
    return items
      .filter(i =>
        i.status === 'Réservé' &&
        listBehavior[i.list_id] === 'cadeau' &&
        (i.assigned_participant_id === p.id || i.assigned_to === p.participant_name)
      )
      .sort((a, b) => (a.item_name || '').localeCompare(b.item_name || ''))
  }

  // Unités de mesure : on affiche la quantité même à 1 (ex: "0,5 kg"), sinon on
  // masque le "1 pots / 1 bouteilles / 1 unités" peu lisible.
  const MESURES = ['kg', 'g', 'l', 'cl', 'ml']
  function formatApport(item) {
    const unit = (item.unit || '').trim()
    const isMesure = MESURES.includes(unit.toLowerCase())
    const showQty = (Number(item.quantity) > 1) || isMesure
    return showQty ? `${item.item_name} ${item.quantity} ${unit}`.trim() : item.item_name
  }

  // Tri : confirmés d'abord, puis peut-être / en attente, puis refusés
  const rsvpRank = (s) => (s === 'Confirmé' ? 0 : s === 'Refusé' ? 2 : 1)
  const sortedParticipants = [...participants].sort(
    (a, b) => rsvpRank(a.rsvp_status) - rsvpRank(b.rsvp_status)
  )

  // ─── Indicateur de santé : ce qui manque encore ───
  const giftDispo = giftItems.filter(i => i.status === 'Disponible')
  const slotsIncomplets = slotStatuses.filter(s => s.manque > 0)
  const reponsesManque = pending.length // réponses encore "peut-être" / en attente
  const hasMissing = disponibles.length > 0 || giftDispo.length > 0 || slotsIncomplets.length > 0 || reponsesManque > 0
  const allCovered = !hasMissing

  // Message de relance (avant la date limite) : ciblé sur le manque réel
  function buildRelance() {
    const url = `${window.location.origin}/invite/${event.invite_link_id}`
    const manques = [
      ...disponibles.map(i => i.item_name),
      ...giftDispo.map(i => i.item_name),
      ...slotsIncomplets.map(s => `${s.manque} personne${s.manque > 1 ? 's' : ''} pour ${s.slot_name}`),
    ]
    const lines = [`Salut ! Plus que quelques jours avant ${event.event_name} 🎉`, ``]
    if (manques.length > 0) {
      lines.push(`Il manque encore : ${manques.join(', ')}`)
    } else if (reponsesManque > 0) {
      lines.push(`On attend encore quelques réponses 🙏`)
    }
    lines.push(``, `Si tu peux aider : ${url}`, `Merci 🙌`)
    return { url, text: lines.join('\n') }
  }

  // Message de récap final (date limite atteinte) : confirmation de l'événement
  function buildRecapFinal() {
    const url = `${window.location.origin}/invite/${event.invite_link_id}`
    const d = new Date(event.date)
    const dateStr = d.toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
    })
    const jourStr = d.toLocaleDateString('fr-FR', { weekday: 'long' })
    const lines = [
      `C'est confirmé pour ${event.event_name}, le ${dateStr}${event.location ? ` à ${event.location}` : ''} ! ${typeEmoji}`,
    ]
    if (apportItems.length > 0) lines.push(`Pense à apporter ce que tu as réservé.`)
    lines.push(`Liste complète et qui apporte quoi : ${url}`, `À ${jourStr} !`)
    return { url, text: lines.join('\n') }
  }

  function copyShareMsg() {
    if (!shareMsg) return
    navigator.clipboard?.writeText(shareMsg.text)
    setMsgCopied(true)
    setTimeout(() => setMsgCopied(false), 2000)
  }
  function shareMsgWhatsApp() {
    if (!shareMsg) return
    window.open(`https://wa.me/?text=${encodeURIComponent(shareMsg.text)}`, '_blank')
  }

  // ─── Bilan rédigé en phrases, toujours visible, évolue au fil des réponses ───
  const bilanLines = []
  {
    const bilanDate = new Date(event.date).toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
    })
    const annivPart = (event.event_type === 'Anniversaire' && event.event_options?.pour_qui)
      ? ` pour ${event.event_options.pour_qui}` : ''
    const lieuPart = event.location ? ` à ${event.location}` : ''
    bilanLines.push(`Tu organises ${event.event_name}${annivPart}, le ${bilanDate}${lieuPart}.`)
    bilanLines.push(
      isFull ? "C'est complet, les inscriptions sont closes."
        : isExpired ? 'Les inscriptions sont closes, voici le bilan final.'
        : 'Les inscriptions sont ouvertes.'
    )
    bilanLines.push(`${totalPersonnes} personne${totalPersonnes > 1 ? 's' : ''} sur ${event.nb_participants} ont confirmé${
      totalPersonnes >= event.nb_participants ? ", c'est complet ✅." : ', il reste de la place.'
    }`)
    if (apportItems.length > 0) {
      if (reserves.length === apportItems.length) {
        bilanLines.push('Côté apports : tout est couvert ✅.')
      } else {
        const reste = apportItems.length - reserves.length
        const noms = disponibles.slice(0, 3).map(i => i.item_name).join(', ')
        bilanLines.push(`Côté apports : il reste ${reste} chose${reste > 1 ? 's' : ''} à apporter (${noms}).`)
      }
    }
    if (giftItems.length > 0) {
      if (giftReserves.length === giftItems.length) {
        bilanLines.push('🎁 Liste de cadeaux complète, tout a été réservé ✅.')
      } else {
        const reste = giftItems.length - giftReserves.length
        bilanLines.push(`🎁 Il reste ${reste} cadeau${reste > 1 ? 'x' : ''} disponible${reste > 1 ? 's' : ''}.`)
      }
    }
    if (slots.length > 0) {
      const incomplets = slotStatuses.filter(s => s.manque > 0)
      if (incomplets.length === 0) {
        bilanLines.push('🙌 Tous les créneaux de bénévolat sont couverts ✅.')
      } else {
        incomplets.forEach(s => bilanLines.push(`🙌 ${s.slot_name} : il manque ${s.manque} personne${s.manque > 1 ? 's' : ''}.`))
      }
    }
    // Vivier de bénévoles (tournois uniquement)
    if (event.event_type === 'Match/Tournoi') {
      const vols = participants.filter(p => p.is_volunteer)
      if (vols.length > 0) {
        const noms = vols.map(p => p.participant_name).filter(Boolean).join(', ')
        bilanLines.push(`🙋 ${vols.length} ${vols.length > 1 ? 'personnes prêtes' : 'personne prête'} à aider : ${noms}`)
      }
    }
    // Décompte des votes repas (si l'organisateur a proposé des choix)
    const mealChoices = Array.isArray(event.event_options?.meal_choices) ? event.event_options.meal_choices : []
    if (mealChoices.length > 0) {
      const counts = {}
      participants.forEach(p => {
        if (p.rsvp_status !== 'Confirmé') return
        const r = parseCommentaire(p.commentaire).repas
        if (r) counts[r] = (counts[r] || 0) + 1
      })
      const totalVotes = Object.values(counts).reduce((s, n) => s + n, 0)
      if (totalVotes > 0) {
        const detail = mealChoices.filter(c => counts[c]).map(c => `${c} ${counts[c]}`).join(' · ')
        if (detail) bilanLines.push(`🍽 Repas : ${detail}`)
      }
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6 pb-12">
      {/* Retour */}
      <button
        onClick={() => router.push('/')}
        className="text-slate-400 hover:text-slate-600 text-sm mb-4 flex items-center gap-1 transition-colors"
      >
        ← Mes evenements
      </button>

      {/* === EN-TÊTE RÉSUMÉ === */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-4">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-xl font-extrabold text-slate-900 leading-tight flex items-center gap-2">
            <span>{typeEmoji}</span>
            <span>{event.event_name}</span>
          </h1>
          <span className={`shrink-0 text-xs font-semibold px-3 py-1 rounded-full ${
            isExpired ? 'bg-slate-100 text-slate-500'
              : isFull ? 'bg-emerald-500 text-white'
              : 'bg-emerald-100 text-emerald-700'
          }`}>
            {isExpired ? 'Inscriptions terminées' : isFull ? 'Complet' : 'Inscriptions ouvertes'}
          </span>
        </div>
        <div className="mt-2 space-y-1 text-sm text-slate-600">
          <p className="flex items-center gap-2">
            📅 {new Date(event.date).toLocaleDateString('fr-FR', {
              weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
            })}
          </p>
          {event.location && <p className="flex items-center gap-2">📍 {event.location}</p>}
          {event.event_type === 'Anniversaire' && (event.event_options?.pour_qui || event.event_options?.surprise) && (
            <p className="flex items-center gap-2">
              {event.event_options?.pour_qui && <span>🎉 Pour {event.event_options.pour_qui}</span>}
              {event.event_options?.surprise && (
                <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-0.5 rounded-full">🤫 Surprise</span>
              )}
            </p>
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center bg-blue-100 text-blue-700 text-sm font-bold px-3 py-1.5 rounded-full">
            {totalPersonnes} / {event.nb_participants}
            <span className="font-normal text-xs ml-1.5">confirmés / attendus</span>
          </span>
          <span className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full ${
            allCovered ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
          }`}>
            {allCovered ? '🟢 Tout est prêt' : '🟠 Il manque des choses'}
          </span>
        </div>

        {/* Relance ciblée : seulement tant que les inscriptions sont ouvertes et s'il manque quelque chose */}
        {!isClosed && hasMissing && (
          <button
            onClick={() => setShareMsg({ title: 'Relancer les invités', text: buildRelance().text })}
            className="mt-3 w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
          >
            📣 Relancer les invités
          </button>
        )}
      </div>

      {/* === BILAN (rédigé, toujours visible) — coloré selon l'état === */}
      <div className={`rounded-2xl shadow-sm border p-5 mb-4 ${
        allCovered ? 'bg-emerald-50 border-emerald-200' : 'bg-orange-50 border-orange-200'
      }`}>
        <h2 className="text-sm font-bold text-slate-800 mb-3">📋 Bilan</h2>
        <div className="space-y-2 text-sm text-slate-600 leading-relaxed">
          {bilanLines.map((line, idx) => <p key={idx}>{line}</p>)}
        </div>

        {isClosed && (
          <button
            onClick={() => setShareMsg({ title: 'Récap final', text: buildRecapFinal().text })}
            className="mt-4 w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
          >
            ✅ Envoyer le récap final
          </button>
        )}
      </div>

      {/* === CARTE PRINCIPALE === */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-5 pt-5 pb-4">
          <div className="flex justify-between items-start">
            <h1 className="text-2xl font-extrabold text-slate-900 leading-tight tracking-tight">{event.event_name}</h1>
            <span className="bg-emerald-500 text-white text-xs px-3 py-1 rounded-full font-semibold shadow-sm">
              {event.status}
            </span>
          </div>
          <p className="text-slate-600 text-sm mt-2">
            {new Date(event.date).toLocaleDateString('fr-FR', {
              weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
            })}
          </p>
          {event.location && <p className="text-slate-500 text-sm">{event.location}</p>}
          {event.deadline_rsvp && (
            <p className="text-xs text-orange-600 mt-2 bg-orange-100 inline-block px-3 py-1 rounded-full font-medium">
              Reponses avant le {new Date(event.deadline_rsvp).toLocaleDateString('fr-FR', {
                weekday: 'short', day: 'numeric', month: 'short',
              })}
            </p>
          )}
        </div>

        {/* Stats pastilles */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100">
          <span className="flex items-center gap-1.5 bg-blue-100 text-blue-700 text-sm font-bold px-3 py-1.5 rounded-full">
            {confirmed.length}/{totalInvites || '?'}
            <span className="font-normal text-xs">Confirmes</span>
          </span>
          <span className="flex items-center gap-1.5 bg-red-100 text-red-600 text-sm font-bold px-3 py-1.5 rounded-full">
            {refused.length}
            <span className="font-normal text-xs">Refuses</span>
          </span>
          <span className="flex items-center gap-1.5 bg-amber-100 text-amber-600 text-sm font-bold px-3 py-1.5 rounded-full">
            {pending.length}
            <span className="font-normal text-xs">En attente</span>
          </span>
          {totalPersonnes > 0 && (
            <span className="text-xs text-slate-400 ml-auto">{totalPersonnes} pers.</span>
          )}
        </div>

        {/* Barre orange "Manque" (non-edit mode, masquée en mode solo) */}
        {event.mode !== 'solo' && disponibles.length > 0 && !editMode && (
          <div className="mx-4 my-3 bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-xl px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">
                  Manque : {missingNames.slice(0, 3).join(', ')}{missingNames.length > 3 ? '...' : ''}
                </p>
                <p className="text-amber-100 text-xs mt-0.5">
                  {disponibles.length} articles - {totalManquant.toFixed(0)} € a couvrir
                </p>
              </div>
              <button
                onClick={() => setShowAllMissing(!showAllMissing)}
                className="bg-white/20 hover:bg-white/30 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ml-3 shrink-0"
              >
                {showAllMissing ? 'Reduire' : 'Voir tout'}
              </button>
            </div>

            {showAllMissing && (
              <div className="mt-3 pt-3 border-t border-amber-300/50 space-y-1.5">
                {disponibles.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <span>
                      {item.item_name}{' '}
                      <span className="text-amber-100 text-xs">{item.quantity} {item.unit}</span>
                    </span>
                    <span className="font-semibold">{item.estimated_price} €</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Barre de progression budget (masquée en mode solo et sans apports) */}
        {event.mode !== 'solo' && apportItems.length > 0 && (
          <div className="px-5 py-3">
            <div className="flex justify-between items-center text-xs text-slate-500 mb-1.5">
              <span>{reserves.length}/{apportItems.length} articles couverts</span>
              <span className="font-semibold text-slate-700">
                {totalCouvert.toFixed(0)} € / {totalBudget.toFixed(0)} €
              </span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${pctCouvert}%`,
                  background: pctCouvert === 100 ? '#10b981' : pctCouvert > 50 ? '#3b82f6' : '#f59e0b',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* === BOUTON MODIFIER LA LISTE (masqué en mode solo) === */}
      {event.mode !== 'solo' && (
        <button
          onClick={() => setEditMode(!editMode)}
          className={`w-full mb-4 py-3 rounded-xl font-semibold text-sm transition-all border ${
            editMode
              ? 'bg-slate-100 text-slate-600 border-slate-200'
              : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'
          }`}
        >
          {editMode ? 'Terminer les modifications' : 'Modifier la liste de courses'}
        </button>
      )}

      {/* === MODE EDITION === */}
      {editMode && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-4">
          <div className="px-5 py-3 border-b border-slate-100 bg-blue-50">
            <h3 className="text-sm font-bold text-blue-800">Liste de courses</h3>
            <p className="text-xs text-blue-500">Supprime, modifie ou ajoute des articles</p>
          </div>

          {/* Items existants */}
          <div className="divide-y divide-slate-50">
            {items.map((item) => (
              <div key={item.id} className="px-4 py-3">
                {editingItem && editingItem.id === item.id ? (
                  // Mode edition inline
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editingItem.item_name}
                      onChange={(e) => setEditingItem({...editingItem, item_name: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg border border-blue-200 text-sm focus:outline-none focus:border-blue-400"
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={editingItem.quantity}
                        onChange={(e) => setEditingItem({...editingItem, quantity: e.target.value})}
                        className="w-20 px-2 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none"
                        placeholder="Qte"
                      />
                      <input
                        type="text"
                        value={editingItem.unit}
                        onChange={(e) => setEditingItem({...editingItem, unit: e.target.value})}
                        className="w-24 px-2 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none"
                        placeholder="Unite"
                      />
                      <input
                        type="number"
                        value={editingItem.estimated_price}
                        onChange={(e) => setEditingItem({...editingItem, estimated_price: e.target.value})}
                        className="w-20 px-2 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none"
                        placeholder="Prix"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={saveEditItem}
                        disabled={saving}
                        className="px-4 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-600"
                      >
                        {saving ? '...' : 'Enregistrer'}
                      </button>
                      <button
                        onClick={() => setEditingItem(null)}
                        className="px-4 py-1.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-200"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  // Affichage normal avec boutons edit/delete
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-slate-700">{item.item_name}</span>
                      <span className="text-xs text-slate-400 ml-2">{item.quantity} {item.unit}</span>
                      {item.assigned_to && (
                        <span className="text-xs bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full ml-2">
                          {item.assigned_to}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <span className="text-sm text-slate-500 mr-2">{item.estimated_price} €</span>
                      {item.status === 'Disponible' && (
                        <>
                          <button
                            onClick={() => setEditingItem({...item})}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blue-50 text-blue-400 hover:text-blue-600 transition-colors"
                            title="Modifier"
                          >
                            ✎
                          </button>
                          <button
                            onClick={() => deleteItem(item.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-300 hover:text-red-500 transition-colors"
                            title="Supprimer"
                          >
                            ✕
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Ajouter un article */}
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 mb-2">Ajouter un article</p>
            <form onSubmit={addItem} className="space-y-2">
              <input
                type="text"
                value={newItem.item_name}
                onChange={(e) => setNewItem({...newItem, item_name: e.target.value})}
                placeholder="Nom de l'article"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-400"
                required
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({...newItem, quantity: e.target.value})}
                  placeholder="Qte"
                  className="w-20 px-2 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none"
                />
                <input
                  type="text"
                  value={newItem.unit}
                  onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
                  placeholder="Unite (kg, packs...)"
                  className="flex-1 px-2 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none"
                />
                <input
                  type="number"
                  value={newItem.estimated_price}
                  onChange={(e) => setNewItem({...newItem, estimated_price: e.target.value})}
                  placeholder="Prix €"
                  className="w-20 px-2 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none"
                />
              </div>
              <div className="flex gap-2 items-center">
                <select
                  value={newItem.category}
                  onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                  className="flex-1 px-2 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none bg-white"
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button
                  type="submit"
                  disabled={saving || !newItem.item_name}
                  className="px-5 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  {saving ? '...' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* === PARTAGE CIBLÉ TOURNOI : familles vs bénévoles === */}
      {event.event_type === 'Match/Tournoi' && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={() => setShareMsg({ title: 'Inviter les familles', text: buildInviteFamilies() })}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            📣 Inviter les familles
          </button>
          <button
            onClick={() => setShareMsg({ title: 'Mobiliser les bénévoles', text: buildMobilizeVolunteers() })}
            className="bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            🙋 Mobiliser les bénévoles
          </button>
        </div>
      )}

      {/* === BOUTONS ACTION / PARTAGE === */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-4">
        <button
          onClick={copyInviteLink}
          className="flex flex-col items-center gap-1 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 font-medium py-3 rounded-xl transition-all text-xs"
        >
          <span className="text-lg">🔗</span>
          {copied ? 'Copié !' : 'Copier'}
        </button>
        <button
          onClick={shareWhatsApp}
          className="flex flex-col items-center gap-1 bg-green-500 hover:bg-green-600 text-white font-medium py-3 rounded-xl transition-all text-xs shadow-sm"
        >
          <span className="text-lg">💬</span>
          WhatsApp
        </button>
        <button
          onClick={shareSMS}
          className="flex flex-col items-center gap-1 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 font-medium py-3 rounded-xl transition-all text-xs"
        >
          <span className="text-lg">📱</span>
          SMS
        </button>
        <button
          onClick={shareEmail}
          className="flex flex-col items-center gap-1 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 font-medium py-3 rounded-xl transition-all text-xs"
        >
          <span className="text-lg">✉️</span>
          Email
        </button>
        <button
          onClick={() => setShowQR(true)}
          className="flex flex-col items-center gap-1 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 font-medium py-3 rounded-xl transition-all text-xs"
        >
          <span className="text-lg">🔲</span>
          QR Code
        </button>
      </div>

      {shareNotice && (
        <p className="text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 mt-2 text-center">
          {shareNotice}
        </p>
      )}

      {/* === MODAL MESSAGE À PARTAGER (relance / récap) === */}
      {shareMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => setShareMsg(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800 mb-1">{shareMsg.title}</h3>
            <p className="text-xs text-slate-400 mb-3">Tu rédiges, tu envoies toi-même. Rien n'est envoyé automatiquement.</p>
            <textarea
              readOnly
              value={shareMsg.text}
              rows={8}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 bg-slate-50 resize-none focus:outline-none"
            />
            <div className="grid grid-cols-2 gap-2 mt-3">
              <button
                onClick={copyShareMsg}
                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-2.5 rounded-xl transition-colors text-sm"
              >
                {msgCopied ? 'Copié !' : '🔗 Copier'}
              </button>
              <button
                onClick={shareMsgWhatsApp}
                className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
              >
                💬 WhatsApp
              </button>
            </div>
            <button
              onClick={() => setShareMsg(null)}
              className="mt-3 w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl transition-colors text-sm"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* === MODAL QR CODE === */}
      {showQR && event && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => setShowQR(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-xs w-full text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800 mb-1">Scanne pour rejoindre l'événement</h3>
            <p className="text-xs text-slate-400 mb-4">{event.event_name}</p>
            <div className="inline-block bg-white p-4 rounded-lg border border-slate-100 mx-auto">
              <QRCodeSVG
                value={`${window.location.origin}/invite/${event.invite_link_id}`}
                size={220}
                level="H"
                bgColor="#ffffff"
              />
            </div>
            <p className="text-xs text-slate-700 break-all bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 mt-3 mb-2">
              {`${window.location.origin}/invite/${event.invite_link_id}`}
            </p>
            <button
              onClick={copyInviteLink}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
            >
              {copied ? 'Copié !' : 'Copier le lien'}
            </button>
            <button
              onClick={() => setShowQR(false)}
              className="mt-4 w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl transition-colors text-sm"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* === PARTICIPANTS === */}
      {participants.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">Participants</h3>
            <span className="text-xs text-slate-400">{totalPersonnes} personnes ({participants.length} reponses)</span>
          </div>
          <div className="divide-y divide-slate-50">
            {(showAllParticipants ? sortedParticipants : sortedParticipants.slice(0, 5)).map((p) => {
              const c = parseCommentaire(p.commentaire)
              const apporte = getItemsForParticipant(p)
              const offre = getGiftsForParticipant(p)
              return (
                <div key={p.id} className="flex items-start justify-between px-5 py-2.5">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      p.rsvp_status === 'Confirmé' ? 'bg-blue-100 text-blue-600' :
                      p.rsvp_status === 'Refusé' ? 'bg-red-100 text-red-500' :
                      'bg-amber-100 text-amber-600'
                    }`}>
                      {(p.participant_name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate flex items-center gap-1.5">
                        <span className="truncate">{p.participant_name}</span>
                        {p.nb_personnes > 1 && (
                          <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs font-semibold shrink-0">+ {p.nb_personnes - 1}</span>
                        )}
                      </p>
                      {c.accompagnants.length > 0 && (
                        <p className="text-xs text-blue-500 truncate">avec {c.accompagnants.join(', ')}</p>
                      )}
                      {p.restriction_alimentaire && (
                        <span className="inline-block text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full mt-0.5">
                          {p.restriction_alimentaire}
                        </span>
                      )}
                      {c.commentaire && (
                        <p className="text-xs text-slate-400 italic truncate">{c.commentaire}</p>
                      )}
                      {apporte.length > 0 && (
                        <div className="mt-1">
                          <p className="text-xs text-slate-400 mb-1">
                            <span className="text-emerald-500">●</span> apporte :
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {apporte.map(i => (
                              <span
                                key={i.id}
                                className="inline-block text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full"
                              >
                                {formatApport(i)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {offre.length > 0 && (
                        <div className="mt-1">
                          <p className="text-xs text-slate-400 mb-1">🎁 offre :</p>
                          <div className="flex flex-wrap gap-1">
                            {offre.map(i => (
                              <span
                                key={i.id}
                                className="inline-block text-xs bg-pink-50 text-pink-700 border border-pink-100 px-2 py-0.5 rounded-full"
                              >
                                {i.item_name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      p.rsvp_status === 'Confirmé' ? 'bg-emerald-100 text-emerald-700' :
                      p.rsvp_status === 'Refusé' ? 'bg-red-100 text-red-600' :
                      'bg-amber-100 text-amber-600'
                    }`}>
                      {p.rsvp_status === 'Confirmé' ? 'Oui' : p.rsvp_status === 'Refusé' ? 'Non' : 'Peut-etre'}
                    </span>
                    <button
                      onClick={() => deleteParticipant(p)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                      title="Annuler la participation"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600">Total</span>
            <span className="text-sm font-bold text-slate-800">{totalPersonnes} personnes confirmees</span>
          </div>
          {participants.length > 5 && (
            <button
              onClick={() => setShowAllParticipants(!showAllParticipants)}
              className="w-full text-center text-sm text-blue-500 hover:text-blue-600 py-2.5 border-t border-slate-100 transition-colors"
            >
              {showAllParticipants ? 'Reduire' : `Voir les ${participants.length - 5} autres`}
            </button>
          )}
        </div>
      )}

      {/* === PLANNING D'AIDE === */}
      {slots.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-4">
          <div className="px-5 py-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">Planning d'aide</h3>
            <p className="text-xs text-slate-400 mt-0.5">Qui aide et quand. Les invités s'inscrivent eux-mêmes depuis leur invitation.</p>
          </div>
          <div className="divide-y divide-slate-50">
            {slots.map((s) => {
              const inscrits = signups.filter(su => su.slot_id === s.id)
              const max = s.max_participants || 4
              const complet = inscrits.length >= max
              const heure = new Date(s.slot_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
              return (
                <div key={s.id} className="px-5 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-700">
                        {s.slot_name} <span className="text-slate-400 font-normal">{heure} · {s.duration_minutes || 60} min</span>
                      </p>
                      {inscrits.length > 0 ? (
                        <div className="mt-0.5 space-y-0.5">
                          {inscrits.map(i => (
                            <div key={i.id} className="text-sm text-slate-500">
                              {i.participant_name}
                              {i.comment && (
                                <span className="text-xs text-slate-400 italic"> — {i.comment}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-300 italic mt-0.5">Personne inscrit pour l'instant</p>
                      )}
                    </div>
                    <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${
                      complet ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-600'
                    }`}>
                      {complet ? 'Complet' : `${inscrits.length}/${max}`}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Si personne n'a repondu */}
      {participants.length === 0 && (
        <div className="bg-slate-50 rounded-2xl p-6 text-center">
          <p className="text-slate-500 text-sm mb-1">Personne n'a encore repondu</p>
          <p className="text-slate-400 text-xs">Partage le lien pour lancer les reponses</p>
        </div>
      )}
    </div>
  )
}
