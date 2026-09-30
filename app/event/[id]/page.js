'use client'
import { quantityReview } from '@/lib/quantity-review.mjs'
import { invitationMessage, listeManques } from '@/lib/invitation.mjs'
import { eventTheme, formatQuantity } from '@/lib/ui-theme.mjs'
import { useState, useEffect } from 'react'
import { useSharedItems } from '@/lib/use-shared-items'
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
        checklist: Array.isArray(p.checklist) ? p.checklist : [],
      }
    } catch { /* texte brut */ }
  }
  return { accompagnants: [], commentaire: raw, repas: '', checklist: [] }
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
  const [showAllParticipants, setShowAllParticipants] = useState(false)

  // Message à partager (relance ou récap final) : { title, text }
  const [shareMsg, setShareMsg] = useState(null)
  const [msgCopied, setMsgCopied] = useState(false)

  // Équipement : participants dont le détail de checklist est déplié
  const [expandedEquip, setExpandedEquip] = useState({})

  // Temps 2 de l'apéro : génération de la liste de courses calée sur le budget
  const [generatingApero, setGeneratingApero] = useState(false)

  // Temps 2 du tournoi : préparation du planning bénévole par l'organisateur
  const [preparingPlanning, setPreparingPlanning] = useState(false)
  const [draftSlots, setDraftSlots] = useState(null) // null = pas encore généré ; [] = en cours d'édition
  const [savingPlanning, setSavingPlanning] = useState(false)

  // Recalcul des quantités après modification manuelle de la liste
  const [recalculating, setRecalculating] = useState(false)
  const [recalcNotice, setRecalcNotice] = useState('')

  // Edition items
  const [editMode, setEditMode] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [newItem, setNewItem] = useState({ item_name: '', quantity: '', unit: '', estimated_price: '', category: 'Nourriture' })
  const [saving, setSaving] = useState(false)

  useSharedItems(event?.id, setItems, setLists, saving || recalculating || !!editingItem)

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

  // ── Temps 2 du tournoi : préparer le planning bénévole ──
  // Nombre de présents confirmés (invité + accompagnants)
  function countConfirmed() {
    return participants
      .filter(p => p.rsvp_status === 'Confirmé')
      .reduce((s, p) => s + (p.nb_personnes || 1), 0)
  }

  // Appelle l'IA pour des postes adaptés au sport / nb d'équipes / nb de confirmés,
  // puis les propose en cartes éditables avant insertion comme slots.
  async function runPlanningGeneration(confirmedCount) {
    setPreparingPlanning(true)
    try {
      const res = await fetch('/api/generate-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: event.event_type,
          event_name: event.event_name,
          nb_participants: confirmedCount || event.nb_participants,
          event_options: event.event_options || {},
          location: event.location,
          date: event.date,
          selected_lists: { planning: true },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Génération impossible')
      const postes = (data.planning || []).map(p => ({
        slot_name: p.slot_name || '',
        start_time: p.start_time || '',
        duration_minutes: p.duration_minutes ?? 60,
        max_participants: p.max_participants ?? 4,
        description: p.description || '',
      }))
      setDraftSlots(postes)
    } catch (err) {
      alert('Erreur IA: ' + err.message)
    }
    setPreparingPlanning(false)
  }

  // Clic sur "Préparer le planning" : garde-fou si moins de 50% de réponses
  function prepareVolunteerPlanning() {
    const confirmedCount = countConfirmed()
    const attendus = event.nb_participants || 0
    if (attendus > 0 && confirmedCount < attendus * 0.5) {
      const ok = window.confirm(
        `Tu n'as que ${confirmedCount} réponses sur ${attendus}. Le planning sera dimensionné pour ${confirmedCount} présents. Générer quand même, ou attendre plus de réponses ?`
      )
      if (!ok) return
    }
    runPlanningGeneration(confirmedCount)
  }

  // Régénère le planning : supprime postes + inscriptions existants puis relance la génération
  async function regenerateVolunteerPlanning() {
    const confirmedCount = countConfirmed()
    const ok = window.confirm(
      `Régénérer va recréer les postes selon les ${confirmedCount} réponses actuelles et SUPPRIMER les inscriptions bénévoles déjà enregistrées. Continuer ?`
    )
    if (!ok) return
    try {
      const supabase = getSupabase()
      const slotIds = slots.map(s => s.id)
      if (slotIds.length > 0) {
        await supabase.from('slot_signups').delete().in('slot_id', slotIds)
        await supabase.from('slots').delete().eq('event_id', event.id)
      }
      await loadAll()
      await runPlanningGeneration(confirmedCount)
    } catch (err) {
      alert('Erreur: ' + err.message)
    }
  }
  function updateDraftSlot(idx, field, value) {
    setDraftSlots(prev => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)))
  }
  function deleteDraftSlot(idx) {
    setDraftSlots(prev => prev.filter((_, i) => i !== idx))
  }
  function addDraftSlot() {
    setDraftSlots(prev => [...(prev || []), { slot_name: '', start_time: '', duration_minutes: 60, max_participants: 4, description: '' }])
  }
  // Insère les postes édités comme slots de l'événement (heure absolue le jour de l'événement)
  async function saveVolunteerPlanning() {
    const valid = (draftSlots || []).filter(s => (s.slot_name || '').trim())
    if (valid.length === 0) { alert('Ajoute au moins un poste avant d\'enregistrer.'); return }
    setSavingPlanning(true)
    try {
      const supabase = getSupabase()
      const dayPart = (event.date || '').slice(0, 10)
      const rows = valid.map(s => {
        let slotDate
        if (s.start_time && dayPart) slotDate = new Date(`${dayPart}T${s.start_time}`).toISOString()
        else if (event.date) slotDate = new Date(event.date).toISOString()
        else slotDate = new Date().toISOString()
        return {
          event_id: event.id,
          slot_name: s.slot_name || 'Poste',
          slot_date: slotDate,
          duration_minutes: Number(s.duration_minutes) || 60,
          max_participants: Number(s.max_participants) || 4,
          description: s.description || null,
        }
      })
      const { error } = await supabase.from('slots').insert(rows)
      if (error) throw error
      setDraftSlots(null)
      await loadAll()
    } catch (err) {
      alert('Erreur: ' + err.message)
    }
    setSavingPlanning(false)
  }

  // ── Temps 2 de l'apéro : générer la liste de courses calée sur le budget ──
  async function generateAperoList() {
    setGeneratingApero(true)
    try {
      const supabase = getSupabase()
      const partants = participants
        .filter(p => p.rsvp_status === 'Confirmé')
        .reduce((s, p) => s + (p.nb_personnes || 1), 0)
      const amount = Number(event.contribution_amount || event.event_options?.contribution_amount || 0)
      const budget = Math.round(partants * amount)
      const res = await fetch('/api/generate-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'Apero',
          event_name: event.event_name,
          nb_participants: partants,
          event_options: { ...(event.event_options || {}), contribution_amount: amount, budget_total: budget },
          location: event.location,
          date: event.date,
          selected_lists: { menu: true },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Génération impossible')
      const L = (data.lists || [])[0]
      if (L) {
        const { data: list, error: lErr } = await supabase
          .from('lists')
          .insert({
            event_id: event.id,
            behavior: 'apport',
            list_name: L.list_name || 'Liste de courses apéro',
            icon: L.icon || '🛒',
            description: L.description || null,
            sort_order: 0,
          })
          .select()
          .single()
        if (lErr) throw lErr
        const itemsToInsert = (L.items || [])
          .filter(it => (it.item_name || '').trim())
          .map(it => ({
            event_id: event.id,
            list_id: list.id,
            item_name: it.item_name,
            category: it.category || null,
            quantity: it.quantity ?? null,
            unit: it.unit || null,
            estimated_price: it.estimated_price ?? null,
            status: 'Disponible',
            ai_generated: true,
          }))
        if (itemsToInsert.length) {
          const { error: iErr } = await supabase.from('items').insert(itemsToInsert)
          if (iErr) throw iErr
        }
      }
      await loadAll()
    } catch (err) {
      alert('Erreur IA: ' + err.message)
    }
    setGeneratingApero(false)
  }
  // Message invitant les partants à se répartir les achats
  function buildAperoShareList() {
    const url = `${window.location.origin}/invite/${event.invite_link_id}`
    return `🛒 La liste de courses pour ${event.event_name} est prête ! Choisis ce que tu prends en charge (chacun avance sa part, l'orga équilibre) : ${url}`
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

  // Recalcule les quantités des articles d'apport RESTANTS pour le nombre de personnes.
  // Utile après que l'organisateur a supprimé des articles (ex : ne garde qu'1 viande
  // sur 3) : l'IA réajuste chaque quantité restante aux ratios habituels.
  // On ne touche QUE la quantité — jamais le statut ni les réservations des invités.
  async function recalculateQuantities() {
    const behavior = {}
    lists.forEach(l => { behavior[l.id] = l.behavior })
    const toRecalc = items.filter(i => behavior[i.list_id] !== 'cadeau' && behavior[i.list_id] !== 'checklist')
    if (toRecalc.length === 0) return
    const partants = participants
      .filter(p => p.rsvp_status === 'Confirmé')
      .reduce((s, p) => s + (p.nb_personnes || 1), 0)
    const nb = event.event_type === 'Apero' ? partants : (event.nb_participants || partants)
    if (!nb || nb < 1) { alert('Nombre de personnes inconnu pour le recalcul.'); return }
    setRecalculating(true)
    try {
      const res = await fetch('/api/recalculate-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: event.event_type,
          nb_participants: nb,
          event_options: event.event_options || {},
          items: toRecalc.map(i => ({ item_name: i.item_name, unit: i.unit || '', category: i.category || '', quantity: i.quantity })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Recalcul impossible')
      const updated = Array.isArray(data.items) ? data.items : []
      const norm = s => (s || '').toString().trim().toLowerCase()
      // id de l'item → nouvelle quantité (priorité au même ordre, repli sur le nom)
      // + nouveau prix proportionnel (prix unitaire constant)
      const newQty = {}
      const newPrice = {}
      toRecalc.forEach((it, idx) => {
        const cand = (updated[idx] && norm(updated[idx].item_name) === norm(it.item_name))
          ? updated[idx]
          : updated.find(u => norm(u.item_name) === norm(it.item_name))
        const q = cand ? Number(cand.quantity) : NaN
        if (!Number.isFinite(q) || q <= 0) return
        newQty[it.id] = q
        // Prix proportionnel : prix unitaire = prix actuel / quantité actuelle.
        // Si quantité actuelle 0/null ou prix absent/0, on garde le prix existant.
        const oldQty = Number(it.quantity)
        const oldPrice = Number(it.estimated_price)
        if (Number.isFinite(oldQty) && oldQty > 0 && Number.isFinite(oldPrice) && oldPrice > 0) {
          newPrice[it.id] = Math.round((oldPrice / oldQty) * q)
        }
      })
      const supabase = getSupabase()
      for (const it of toRecalc) {
        if (!(it.id in newQty) || newQty[it.id] === Number(it.quantity)) continue
        const patch = { quantity: newQty[it.id] }
        if (it.id in newPrice) patch.estimated_price = newPrice[it.id]
        await supabase.from('items').update(patch).eq('id', it.id)
      }
      setItems(prev => prev.map(i => {
        if (!(i.id in newQty)) return i
        const next = { ...i, quantity: newQty[i.id] }
        if (i.id in newPrice) next.estimated_price = newPrice[i.id]
        return next
      }))
      setRecalcNotice(`Quantités mises à jour pour ${nb} personnes`)
      setTimeout(() => setRecalcNotice(''), 5000)
    } catch (err) {
      alert('Erreur: ' + err.message)
    }
    setRecalculating(false)
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
    return invitationMessage(event, window.location.origin)
  }

  // Messages de partage dédiés au Tournoi (familles vs bénévoles) — même lien d'invitation
  function buildInviteFamilies() {
    const url = `${window.location.origin}/invite/${event.invite_link_id}`
    const dateStr = new Date(event.date).toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
    })
    const lieu = event.location ? `, ${event.location}` : ''
    const repas = Array.isArray(event.event_options?.meal_choices) && event.event_options.meal_choices.length > 0
      ? '\nUn repas est prévu : tu choisis ton menu en répondant.' : ''
    return `Salut ! *${event.event_name}*, ${dateStr}${lieu}.\nOn vient jouer ou encourager, en famille ou entre amis.${repas}\nDis-nous si tu viens et à combien :\n${url}`
  }
  function buildMobilizeVolunteers() {
    const url = `${window.location.origin}/invite/${event.invite_link_id}`
    return `Un coup de main pour *${event.event_name}* ?\nChaque poste compte, même pour une heure. Choisis celui qui te va :\n${url}`
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
        setShareNotice('Sur mobile, ton app Messages devrait s\'ouvrir ; sinon le texte est copié, colle-le.')
        setTimeout(() => setShareNotice(''), 6000)
      }
    }, 1000)
  }

  function shareSMS() {
    if (!event) return
    const { text } = buildInvitation()
    openWithFallback(`sms:?body=${encodeURIComponent(text)}`, text)
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

  // Séparation apports / cadeaux / checklist via le behavior des listes
  const listBehavior = {}
  lists.forEach(l => { listBehavior[l.id] = l.behavior })
  const giftItems = items.filter(i => listBehavior[i.list_id] === 'cadeau')
  const checklistItems = items.filter(i => listBehavior[i.list_id] === 'checklist')
  const apportItems = items.filter(i => listBehavior[i.list_id] !== 'cadeau' && listBehavior[i.list_id] !== 'checklist')

  const disponibles = apportItems.filter(i => i.status === 'Disponible')
  const reserves = apportItems.filter(i => i.status === 'Réservé')
  const giftReserves = giftItems.filter(i => i.status === 'Réservé')
  const totalManquant = disponibles.reduce((sum, i) => sum + (i.estimated_price || 0), 0)
  const totalCouvert = reserves.reduce((sum, i) => sum + (i.estimated_price || 0), 0)
  const totalBudget = totalManquant + totalCouvert
  const pctCouvert = apportItems.length > 0 ? Math.round((reserves.length / apportItems.length) * 100) : 0

  const missingNames = disponibles.map(i => i.item_name)
  const categories = ['Nourriture', 'Boissons', 'Matériel', 'Décoration', 'Service']

  // Recalcul des quantités : seulement pour les types où les quantités dépendent
  // du nombre de personnes (pas les listes cadeaux/checklist, traitées à part).
  const QTY_SCALE_TYPES = ['BBQ', 'Soirée', 'Apero', 'Anniversaire', 'Mariage', 'Randonnée', 'Autre']
  const quantityCheck = quantityReview(event, participants, items)
  const recalcPeople = event.event_type === 'Apero' ? totalPersonnes : (event.nb_participants || totalPersonnes)
  const canRecalc = event.event_type !== 'BBQ' && QTY_SCALE_TYPES.includes(event.event_type) && apportItems.length > 0

  // Emoji du type d'événement (pour l'en-tête résumé)
  const TYPE_EMOJIS = { 'BBQ': '🔥', 'Anniversaire': '🎂', 'Mariage': '💍', 'Randonnée': '🧭', 'Soirée': '🎶', 'Match/Tournoi': '⚽', 'Apero': '🥂', 'Autre': '✨' }
  const typeEmoji = TYPE_EMOJIS[event.event_type] || '🎉'

  // Date limite valable jusqu'à la FIN de la journée (même logique que côté invité)
  const dl = event.deadline_rsvp ? new Date(event.deadline_rsvp) : null
  const deadlineEnd = dl ? new Date(dl.getFullYear(), dl.getMonth(), dl.getDate(), 23, 59, 59) : null
  const isExpired = deadlineEnd ? deadlineEnd < new Date() : false

  // Jauge atteinte : autant (ou plus) de personnes confirmées que de convives attendus
  const isFull = !event.event_options?.allow_extra_guests && event.nb_participants > 0 && totalPersonnes >= event.nb_participants
  // Inscriptions fermées : soit complet, soit date limite dépassée
  const isClosed = isFull || isExpired

  // Apéro participatif : nb de partants + budget estimé (l'argent ne transite jamais par l'app)
  const isApero = event.event_type === 'Apero'
  const aperoAmount = Number(event.contribution_amount || event.event_options?.contribution_amount || 0)
  const aperoBudget = Math.round(totalPersonnes * aperoAmount)

  // Proximité de l'événement (rappel J-2) : nombre de jours calendaires jusqu'au jour J
  const eventStart = new Date(event.date)
  const nowDate = new Date()
  const startDay = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate())
  const todayDay = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate())
  const daysUntilEvent = Math.round((startDay - todayDay) / 86400000)
  const eventPassed = eventStart < nowDate
  const showReminderBanner = !eventPassed && daysUntilEvent >= 0 && daysUntilEvent <= 2
  const reminderDelai = daysUntilEvent === 0 ? "aujourd'hui" : `dans ${daysUntilEvent} jour${daysUntilEvent > 1 ? 's' : ''}`

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
    return showQty ? `${item.item_name} ${formatQuantity(item.quantity)} ${unit}`.trim() : item.item_name
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
    const lines = [`Salut ! *${event.event_name}* approche.`, ``]
    if (manques.length > 0) {
      lines.push(`Il manque encore : ${listeManques(manques)}.`)
      lines.push(`Si tu peux t’en charger, réserve-le ici, ça évite les doublons :`)
    } else {
      lines.push(`Si tu n’as pas encore répondu, un oui ou un non nous aide beaucoup à tout prévoir :`)
    }
    lines.push(url)
    return { url, text: lines.join('\n') }
  }

  // Message de récap final (date limite atteinte) : confirmation de l'événement
  function buildRecapFinal() {
    const url = `${window.location.origin}/invite/${event.invite_link_id}?recap=1`
    const d = new Date(event.date)
    const dateStr = d.toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
    })
    const jourStr = d.toLocaleDateString('fr-FR', { weekday: 'long' })
    const lines = [
      `C’est bouclé pour *${event.event_name}* ! Merci à tous.`,
      `Rendez-vous ${dateStr}${event.location ? `, ${event.location}` : ''}.`,
    ]
    if (apportItems.length > 0) lines.push(`N’oublie pas ce que tu as réservé.`)
    lines.push(`À ${jourStr} ! Qui apporte quoi, en un coup d’œil :`, url)
    return { url, text: lines.join('\n') }
  }

  // Message de rappel J-2 : l'app le prépare, l'organisateur l'envoie (WhatsApp/SMS)
  function buildReminder() {
    const url = `${window.location.origin}/invite/${event.invite_link_id}?recap=1`
    const dateStr = new Date(event.date).toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
    })
    const mealChoices = Array.isArray(event.event_options?.meal_choices) ? event.event_options.meal_choices : []
    const lines = [
      `Plus que quelques jours avant *${event.event_name}* !`,
      `Quand : ${dateStr}${event.location ? ` · Où : ${event.location}` : ''}`,
    ]
    if (apportItems.length > 0) lines.push(`Pense à ce que tu as réservé.`)
    if (slots.length > 0) lines.push(`Et à ton créneau d’aide si tu en as pris un.`)
    if (mealChoices.length > 0) lines.push(`Ton repas n’est pas encore choisi ? C’est le moment.`)
    lines.push(`À très vite ! Les dernières infos sont ici :`, url)
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
  function shareMsgSMS() {
    if (!shareMsg) return
    openWithFallback(`sms:?body=${encodeURIComponent(shareMsg.text)}`, shareMsg.text)
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
    if (isApero) {
      bilanLines.push(`${totalPersonnes} personne${totalPersonnes > 1 ? 's' : ''} partante${totalPersonnes > 1 ? 's' : ''}${aperoAmount > 0 ? ` · budget estimé ${aperoBudget} €` : ''}.`)
    } else {
      bilanLines.push(`${totalPersonnes} personne${totalPersonnes > 1 ? 's' : ''} sur ${event.nb_participants} ont confirmé${
        isFull ? ", c'est complet ✅." : ', il reste de la place.'
      }`)
    }
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
        // Chaque participant compte pour son groupe entier (lui + accompagnants)
        if (r) counts[r] = (counts[r] || 0) + (p.nb_personnes || 1)
      })
      const totalVotes = Object.values(counts).reduce((s, n) => s + n, 0)
      if (totalVotes > 0) {
        const detail = mealChoices.filter(c => counts[c]).map(c => `${c} ${counts[c]}`).join(' · ')
        if (detail) bilanLines.push(`🍽 Repas : ${detail}`)
      }
    }
  }

  return (
    <div className="min-h-screen bg-cream text-stone-900">
    <div className="max-w-md mx-auto px-4 py-6 pb-32">
      {/* Retour */}
      <button
        onClick={() => router.push('/')}
        className="text-stone-600 hover:text-stone-900 text-sm font-semibold mb-4 flex items-center gap-1 transition-colors min-h-[32px]"
      >
        ← Mes événements
      </button>

      {/* === BANDEAU RAPPEL J-2 === */}
      {showReminderBanner && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
          <p className="text-sm font-semibold text-amber-900">
            ⏰ Ton événement est {reminderDelai}. Tu peux préparer un rappel pour tes invités.
          </p>
          <button
            onClick={() => setShareMsg({ title: 'Rappel aux invités', text: buildReminder().text })}
            className="mt-3 w-full min-h-[48px] bg-amber-700 hover:bg-amber-800 text-white font-semibold rounded-2xl transition-colors"
          >
            📣 Préparer le rappel
          </button>
        </div>
      )}

      {/* === EN-TÊTE (maquette v3) === */}
      <div className={`rounded-3xl px-5 py-4 mb-4 ${eventTheme(event.event_type).hero}`}>
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-extrabold text-stone-900 leading-tight tracking-tight text-balance min-w-0">{event.event_name}</h1>
          <span aria-hidden="true" className="text-4xl leading-none shrink-0">{typeEmoji}</span>
        </div>
        <p className="text-sm text-stone-800 mt-1 first-letter:uppercase">
          {new Date(event.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
          {event.location ? ` · ${event.location}` : ''}
        </p>
        {event.event_type === 'Anniversaire' && (event.event_options?.pour_qui || event.event_options?.surprise) && (
          <p className="text-sm text-stone-800 mt-1 flex flex-wrap items-center gap-2">
            {event.event_options?.pour_qui && <span>Pour {event.event_options.pour_qui}</span>}
            {event.event_options?.surprise && <span className="bg-white/80 text-amber-900 text-xs font-semibold px-2 py-0.5 rounded-full">Surprise</span>}
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="bg-white/80 text-stone-900 text-xs font-semibold px-3 py-1 rounded-full">
            {isExpired ? 'Inscriptions terminées' : isFull ? 'Complet' : 'Inscriptions ouvertes'}
          </span>
          {event.deadline_rsvp && (
            <span className="bg-white/80 text-stone-900 text-xs font-semibold px-3 py-1 rounded-full">
              Réponses avant le {new Date(event.deadline_rsvp).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>
      </div>

      {/* === EN UN COUP D'ŒIL : trois chiffres === */}
      <section aria-labelledby="resume" className="bg-white rounded-3xl shadow-sm ring-1 ring-stone-900/5 p-4 mb-4">
        <h2 id="resume" className="text-base font-bold text-stone-900">En un coup d’œil</h2>
        <dl className="grid grid-cols-3 gap-2 mt-3 text-center tabular-nums">
          <div className="rounded-2xl bg-emerald-50 px-2 py-3">
            <dd className="text-3xl font-extrabold text-emerald-900 leading-none">{totalPersonnes}</dd>
            <dt className="text-xs font-semibold text-emerald-900 mt-1.5 leading-tight">
              {isApero ? `partant${totalPersonnes > 1 ? 's' : ''}` : `confirmé${totalPersonnes > 1 ? 's' : ''}`}
              {totalPersonnes > confirmed.length && <span className="block font-normal">dont {totalPersonnes - confirmed.length} accomp.</span>}
            </dt>
          </div>
          {isApero ? (
            <div className="rounded-2xl bg-stone-100 px-2 py-3">
              <dd className="text-3xl font-extrabold text-stone-800 leading-none">{pending.length}</dd>
              <dt className="text-xs font-semibold text-stone-700 mt-1.5 leading-tight">sans réponse</dt>
            </div>
          ) : (
            <div className="rounded-2xl bg-stone-100 px-2 py-3">
              <dd className="text-3xl font-extrabold text-stone-800 leading-none">{event.nb_participants || '?'}</dd>
              <dt className="text-xs font-semibold text-stone-700 mt-1.5 leading-tight">personnes attendues</dt>
            </div>
          )}
          {event.mode !== 'solo' && apportItems.length > 0 ? (
            <div className="rounded-2xl bg-amber-50 px-2 py-3">
              <dd className="text-3xl font-extrabold text-amber-900 leading-none">{reserves.length}<span className="text-base font-bold text-amber-800">/{apportItems.length}</span></dd>
              <dt className="text-xs font-semibold text-amber-900 mt-1.5 leading-tight">apports réservés</dt>
            </div>
          ) : (
            <div className="rounded-2xl bg-stone-100 px-2 py-3">
              <dd className="text-3xl font-extrabold text-stone-800 leading-none">{pending.length}</dd>
              <dt className="text-xs font-semibold text-stone-700 mt-1.5 leading-tight">sans réponse</dt>
            </div>
          )}
        </dl>
        {!isApero && Number(event.nb_participants) > 0 && (
          <>
            <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden mt-4" role="img" aria-label={`${totalPersonnes} confirmés sur ${event.nb_participants} attendus`}>
              <div className="h-full rounded-full bg-emerald-600 transition-all duration-700" style={{ width: `${Math.min(100, Math.round(totalPersonnes / Number(event.nb_participants) * 100))}%` }} />
            </div>
            <p className="flex justify-between text-xs text-stone-600 mt-1.5">
              <span>{event.mode !== 'solo' && apportItems.length > 0 ? `${pending.length} sans réponse` : ''}</span>
              <span>{refused.length} ne vien{refused.length === 1 ? 't' : 'nent'} pas</span>
            </p>
          </>
        )}
      </section>

      {/* === À FAIRE MAINTENANT === */}
      {!isClosed && hasMissing && (() => {
        const bouts = []
        if (disponibles.length > 0) bouts.push(`${disponibles.length} apport${disponibles.length > 1 ? 's cherchent' : ' cherche'} encore quelqu’un`)
        if (slotsIncomplets.length > 0) bouts.push(`${slotsIncomplets.length} poste${slotsIncomplets.length > 1 ? 's' : ''} d’aide ${slotsIncomplets.length > 1 ? 'ne sont pas complets' : 'n’est pas complet'}`)
        if (pending.length > 0) bouts.push(`${pending.length} personne${pending.length > 1 ? 's n’ont' : ' n’a'} pas répondu`)
        if (giftDispo.length > 0 && bouts.length === 0) bouts.push(`${giftDispo.length} cadeau${giftDispo.length > 1 ? 'x' : ''} ${giftDispo.length > 1 ? 'restent' : 'reste'} à réserver`)
        const phrase = bouts.length ? bouts.join(' et ') + '.' : 'Il manque encore quelques réponses.'
        return (
          <div className="flex items-center gap-3 bg-stone-900 text-white rounded-3xl px-4 py-3.5 mb-4">
            <p className="text-[15px] flex-1 min-w-0"><span className="block text-xs font-bold uppercase tracking-wide text-orange-300">À faire maintenant</span>{phrase.charAt(0).toUpperCase() + phrase.slice(1)}</p>
            <button
              onClick={() => setShareMsg({ title: 'Relancer les invités', text: buildRelance().text })}
              className="shrink-0 bg-white text-stone-900 font-bold text-sm rounded-2xl px-3 min-h-[44px]"
            >
              Relancer
            </button>
          </div>
        )
      })()}

      {/* === APÉRO PARTICIPATIF : partants, budget, liste de courses === */}
      {isApero && (
        <div className="bg-white rounded-3xl shadow-sm ring-1 ring-stone-900/5 p-5 mb-4">
          <h3 className="text-sm font-bold text-slate-800 mb-1">🥂 Apéro participatif</h3>
          <p className="text-sm text-slate-600">
            {totalPersonnes} personne{totalPersonnes > 1 ? 's' : ''} partante{totalPersonnes > 1 ? 's' : ''}
            {aperoAmount > 0 && <> · budget estimé : <span className="font-semibold text-slate-800">{aperoBudget} €</span></>}
          </p>
          <p className="text-xs text-slate-400 mt-1">Tu es le garant de la répartition de l'argent entre les participants. Planify n'encaisse rien.</p>

          {apportItems.length === 0 ? (
            <button
              onClick={generateAperoList}
              disabled={generatingApero || totalPersonnes === 0}
              className="mt-3 w-full bg-amber-700 hover:bg-amber-800 disabled:bg-amber-300 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
            >
              {generatingApero ? '✨ Génération de la liste...' : '🛒 Générer la liste de courses'}
            </button>
          ) : (
            <button
              onClick={() => setShareMsg({ title: 'Partager la liste de courses', text: buildAperoShareList() })}
              className="mt-3 w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
            >
              🛒 Partager la liste de courses
            </button>
          )}
          {totalPersonnes === 0 && apportItems.length === 0 && (
            <p className="text-xs text-slate-400 mt-2 text-center">En attente des premiers partants…</p>
          )}

          {/* Pavé unique : qui vient + qui prend quoi + équilibre (transparence, PAS de moteur de dette) */}
          {confirmed.length > 0 && (() => {
            const SEUIL = 5 // tolérance en € pour considérer la part "équilibrée"
            const rows = confirmed.map(p => {
              const pris = getItemsForParticipant(p)
              const montant = Math.round(pris.reduce((s, it) => s + (Number(it.estimated_price) || 0), 0))
              const part = Math.round(aperoAmount * (p.nb_personnes || 1))
              const ecart = montant - part
              let statut = 'ok'
              if (ecart > SEUIL) statut = 'plus'
              else if (ecart < -SEUIL) statut = 'moins'
              return { p, pris, montant, part, ecart, statut }
            })
            const totalCotis = rows.reduce((s, r) => s + r.part, 0)
            const totalPris = rows.reduce((s, r) => s + r.montant, 0)
            return (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-500 mb-2">🥂 Qui vient et qui prend quoi</p>
                <ul className="space-y-2">
                  {rows.map(({ p, pris, montant, part, ecart, statut }) => (
                    <li key={p.id} className="text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-slate-700 min-w-0 truncate">
                          {p.participant_name}{p.nb_personnes > 1 ? ` (+${p.nb_personnes - 1})` : ''}
                        </span>
                        <span className="shrink-0 text-xs font-semibold">
                          {statut === 'ok' && <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">✅ équilibré</span>}
                          {statut === 'plus' && <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">⚠️ a avancé {ecart} € de plus</span>}
                          {statut === 'moins' && <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">⚠️ n'a pas encore pris sa part</span>}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        part : {part} € · a pris : {montant} €
                        {pris.length > 0 && <span className="text-slate-400"> — {pris.map(it => it.item_name).join(', ')}</span>}
                      </p>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-slate-600 mt-3 pt-2 border-t border-slate-100">
                  Cotisations cumulées : <span className="font-semibold">{totalCotis} €</span> · Courses prises : <span className="font-semibold">{totalPris} €</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">Indicateur de transparence. Planify ne calcule pas les remboursements et n'encaisse rien — la régularisation se fait entre vous.</p>
              </div>
            )
          })()}
        </div>
      )}

      {/* === CARTE PRINCIPALE === */}
      <div className="bg-white rounded-3xl shadow-sm ring-1 ring-stone-900/5 overflow-hidden mb-4">
        {/* Les deux listes restent visibles, même pendant les modifications. */}
        {event.mode !== 'solo' && (event.event_type !== 'Match/Tournoi' || apportItems.length > 0) && (
          <div className="grid gap-4 p-4 md:grid-cols-2">
            <section aria-labelledby="remaining-contributions" className="rounded-3xl border-2 border-amber-400 bg-amber-50 p-4">
              <h2 id="remaining-contributions" className="font-bold text-xl text-amber-950 flex items-center justify-between gap-2">Il reste à apporter <span className="shrink-0 min-w-[34px] h-[34px] grid place-items-center text-base font-extrabold text-white bg-amber-800 rounded-full tabular-nums">{disponibles.length}</span></h2>
              <p className="text-sm text-amber-800 mt-0.5">Personne ne s’en occupe encore.</p>
              {disponibles.length ? <ul className="mt-4 divide-y divide-amber-200">
                {disponibles.map(item => <li key={item.id} className="py-3 flex items-start justify-between gap-3">
                  <span className="font-semibold text-stone-900 break-words min-w-0">{item.item_name}{item.category === 'Suggestions des invités' && <span className="block w-fit mt-1 text-xs font-semibold bg-white text-blue-800 rounded-full px-2 py-0.5">Idée d’un invité</span>}</span>
                  <span className="text-sm font-bold text-amber-950 text-right shrink-0 max-w-[45%] bg-amber-100 rounded-full px-2.5 py-0.5">{formatQuantity(item.quantity)} {item.unit}</span>
                </li>)}
              </ul> : <p className="mt-4 text-sm text-amber-950">{apportItems.length ? 'Tout est pris en charge, merci à tous !' : 'Aucun article à apporter pour le moment.'}</p>}
            </section>
            <section aria-labelledby="reserved-contributions" className="rounded-3xl border-2 border-emerald-200 bg-emerald-50 p-4">
              <h2 id="reserved-contributions" className="font-bold text-xl text-emerald-950 flex items-center justify-between gap-2">Déjà réservé <span className="shrink-0 min-w-[34px] h-[34px] grid place-items-center text-base font-extrabold text-white bg-emerald-700 rounded-full tabular-nums">{reserves.length}</span></h2>
              <p className="text-sm text-emerald-800 mt-0.5">Et par qui.</p>
              {reserves.length ? <ul className="mt-4 divide-y divide-emerald-200">
                {reserves.map(item => <li key={item.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0"><p className="font-semibold text-stone-900 break-words">{item.item_name}{item.category === 'Suggestions des invités' && <span className="block w-fit mt-1 text-xs font-semibold bg-white text-blue-800 rounded-full px-2 py-0.5">Idée d’un invité</span>}</p><p className="text-sm font-semibold text-emerald-800 mt-0.5">{item.assigned_to || participants.find(p => p.id === item.assigned_participant_id)?.participant_name || 'Invité à préciser'}</p></div>
                  <span className="text-sm font-bold text-emerald-950 text-right shrink-0 max-w-[45%] bg-emerald-100 rounded-full px-2.5 py-0.5">{formatQuantity(item.quantity)} {item.unit}</span>
                </li>)}
              </ul> : <p className="mt-4 text-sm text-emerald-950">Personne n’a encore réservé d’article.</p>}
            </section>
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

      {/* === BILAN (rédigé, toujours visible) — coloré selon l'état === */}
      <div role="status" className={`rounded-3xl border p-5 mb-4 ${
        allCovered ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
      }`}>
        <h2 className="text-base font-bold text-stone-900 mb-2">📋 Bilan</h2>
        <div className="space-y-1.5 text-[15px] text-stone-800 leading-relaxed">
          {bilanLines.map((line, idx) => <p key={idx}>{line}</p>)}
        </div>

        {isClosed && (
          <button
            onClick={() => setShareMsg({ title: 'Récap final', text: buildRecapFinal().text })}
            className="mt-4 w-full min-h-[48px] bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-2xl transition-colors"
          >
            ✅ Préparer le récap final
          </button>
        )}
      </div>

      {/* === BOUTON MODIFIER LA LISTE (masqué en mode solo) === */}
      {event.mode !== 'solo' && (event.event_type !== 'Match/Tournoi' || apportItems.length > 0) && (
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
        <div className="bg-white rounded-3xl shadow-sm ring-1 ring-stone-900/5 overflow-hidden mb-4">
          <div className="px-5 py-3 border-b border-slate-100 bg-blue-50">
            <h3 className="text-sm font-bold text-blue-800">Liste de courses</h3>
            <p className="text-xs text-blue-500">Supprime, modifie ou ajoute des articles</p>
          </div>

          {event.event_type === 'BBQ' && <div className="p-4 bg-amber-50 border-b border-amber-200">
<h4 className="font-semibold text-amber-950">Les courses suivent les invités</h4>
<p className="text-sm mt-2">{quantityCheck.confirmed} personnes confirmées, accompagnants compris. Repères pour {quantityCheck.people} personnes (au moins le nombre prévu).</p>
<p className="text-xs text-slate-600 mt-2">Compte aussi ton foyer dans les réponses. Les quantités déjà listées, réservées ou non, sont déduites. Les articles personnalisés restent à vérifier à la main.</p>
{quantityCheck.additions.length ? <ul className="text-sm mt-3 space-y-1">{quantityCheck.additions.map(it => <li key={it.item_name}>À ajouter si besoin : <strong>{it.quantity} {it.unit}</strong> de {it.item_name}</li>)}</ul> : <p className="text-sm mt-3">Aucun complément suggéré pour les articles reconnus.</p>}
<p className="text-xs mt-2">Valide les compléments en ajoutant des articles ci-dessous. Les apports réservés restent inchangés.</p>
</div>}
{/* Recalcul des quantités après suppression d'articles */}
          {canRecalc && (
            <div className="px-4 py-3 border-b border-slate-100 bg-amber-50">
              <button
                onClick={recalculateQuantities}
                disabled={recalculating}
                className="w-full bg-amber-700 hover:bg-amber-800 disabled:bg-amber-300 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
              >
                {recalculating ? '✨ Recalcul en cours...' : '🔄 Recalculer les quantités'}
              </button>
              <p className="text-xs text-amber-700 mt-2">
                Réajuste les quantités des articles restants pour {recalcPeople} personne{recalcPeople > 1 ? 's' : ''} (utile après avoir supprimé des articles). Les réservations des invités sont conservées.
              </p>
              {recalcNotice && (
                <p className="text-xs font-semibold text-emerald-700 mt-2">✅ {recalcNotice}</p>
              )}
            </div>
          )}

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
                        className="px-4 py-1.5 bg-blue-700 text-white text-xs font-medium rounded-lg hover:bg-blue-800"
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
                      <span className="text-xs text-slate-500 ml-2">{formatQuantity(item.quantity)} {item.unit}</span>
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
                  className="px-5 py-2 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  {saving ? '...' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* === PARTAGER ET RELANCER (maquette v3) === */}
      <section id="partager" aria-labelledby="partager-titre" className="scroll-mt-4">
      <h2 id="partager-titre" className="text-lg font-bold text-stone-900 mt-2">Partager et relancer</h2>
      <p className="text-sm text-stone-600 mb-3">Planify prépare le message, c’est toi qui l’envoies, à qui tu veux. Rien ne part tout seul.</p>
      {/* === PARTAGE CIBLÉ TOURNOI : familles toujours, bénévoles une fois les postes créés === */}
      {event.event_type === 'Match/Tournoi' && (
        <div className={`grid gap-2 mb-4 ${slots.length > 0 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <button
            onClick={() => setShareMsg({ title: 'Inviter les familles', text: buildInviteFamilies() })}
            className="bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            📣 Inviter les familles
          </button>
          {slots.length > 0 && (
            <button
              onClick={() => setShareMsg({ title: 'Mobiliser les bénévoles', text: buildMobilizeVolunteers() })}
              className="bg-amber-700 hover:bg-amber-800 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
            >
              🙋 Mobiliser les bénévoles
            </button>
          )}
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
          className="flex flex-col items-center gap-1 bg-green-700 hover:bg-green-800 text-white font-semibold py-3 rounded-2xl transition-all text-xs shadow-sm"
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

      {/* Messages prêts à envoyer : relance, rappel, récap final */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <button
          onClick={() => setShareMsg({ title: 'Relancer les invités', text: buildRelance().text })}
          className="bg-white border-2 border-stone-200 hover:border-orange-300 rounded-2xl min-h-[64px] px-2 py-2 text-sm font-semibold text-stone-800"
        >
          Relance<span className="block text-xs font-normal text-stone-600">ce qui manque</span>
        </button>
        <button
          onClick={() => setShareMsg({ title: 'Rappel aux invités', text: buildReminder().text })}
          className="bg-white border-2 border-stone-200 hover:border-orange-300 rounded-2xl min-h-[64px] px-2 py-2 text-sm font-semibold text-stone-800"
        >
          Rappel<span className="block text-xs font-normal text-stone-600">quelques jours avant</span>
        </button>
        <button
          onClick={() => setShareMsg({ title: 'Récap final', text: buildRecapFinal().text })}
          className="bg-white border-2 border-stone-200 hover:border-orange-300 rounded-2xl min-h-[64px] px-2 py-2 text-sm font-semibold text-stone-800"
        >
          Récap final<span className="block text-xs font-normal text-stone-600">quand tout est calé</span>
        </button>
      </div>
      </section>

      {/* === BARRE FIXE : Partager / Relancer === */}
      <div className="fixed inset-x-0 bottom-0 z-40 bg-white/95 backdrop-blur border-t border-stone-200 px-4 pt-3" style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}>
        <div className="max-w-md mx-auto grid grid-cols-2 gap-2">
          <button
            onClick={() => document.getElementById('partager')?.scrollIntoView({ behavior: 'smooth' })}
            className="min-h-[52px] rounded-2xl border-2 border-stone-200 bg-white font-bold text-stone-900"
          >
            Partager
          </button>
          <button
            onClick={() => setShareMsg(isClosed ? { title: 'Récap final', text: buildRecapFinal().text } : { title: 'Relancer les invités', text: buildRelance().text })}
            className="min-h-[52px] rounded-2xl bg-orange-700 hover:bg-orange-800 font-bold text-white"
          >
            {isClosed ? 'Récap final' : 'Relancer'}
          </button>
        </div>
      </div>

      {/* === MODAL MESSAGE À PARTAGER (relance / récap) === */}
      {shareMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => setShareMsg(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800 mb-1">{shareMsg.title}</h3>
            <p className="text-sm text-stone-600 mb-3">Planify prépare le texte à partir de ce qui manque. C’est toi qui l’envoies : rien n’est envoyé automatiquement.</p>
            <textarea
              readOnly
              value={shareMsg.text}
              rows={8}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 bg-slate-50 resize-none focus:outline-none"
            />
            <div className="grid grid-cols-3 gap-2 mt-3">
              <button
                onClick={copyShareMsg}
                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-2.5 rounded-xl transition-colors text-sm"
              >
                {msgCopied ? 'Copié !' : '🔗 Copier'}
              </button>
              <button
                onClick={shareMsgWhatsApp}
                className="bg-green-700 hover:bg-green-800 text-white font-semibold min-h-[44px] rounded-xl transition-colors text-sm"
              >
                💬 WhatsApp
              </button>
              <button
                onClick={shareMsgSMS}
                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-2.5 rounded-xl transition-colors text-sm"
              >
                📱 SMS
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
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
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

      {/* === PARTICIPANTS === (masqué pour l'apéro : fusionné dans "Qui vient et qui prend quoi") */}
      {participants.length > 0 && !isApero && (
        <div className="bg-white rounded-3xl shadow-sm ring-1 ring-stone-900/5 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">Participants</h3>
            <span className="text-xs text-slate-400">{totalPersonnes} personnes ({participants.length} réponses)</span>
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
                        <p className="text-xs text-blue-800 truncate">avec {c.accompagnants.join(', ')}</p>
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
                      {p.rsvp_status === 'Confirmé' ? 'Oui' : p.rsvp_status === 'Refusé' ? 'Non' : 'Peut-être'}
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
            <span className="text-sm font-bold text-slate-800">{totalPersonnes} personnes confirmées</span>
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

      {/* === TEMPS 2 TOURNOI : préparer le planning bénévole === */}
      {event.event_type === 'Match/Tournoi' && slots.length === 0 && (
        <div className="bg-white rounded-3xl shadow-sm ring-1 ring-stone-900/5 overflow-hidden mt-4">
          <div className="px-5 py-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">Planning bénévole</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {draftSlots === null
                ? "Quand tu as assez de réponses, génère les postes à pourvoir. Tu pourras les ajuster avant de les publier."
                : "Ajuste les postes proposés (nom, horaire, quota, description), puis enregistre. Les bénévoles pourront ensuite s'y inscrire."}
            </p>
          </div>

          {draftSlots === null ? (
            <div className="p-5">
              <button
                onClick={prepareVolunteerPlanning}
                disabled={preparingPlanning}
                className="w-full bg-amber-700 hover:bg-amber-800 disabled:bg-amber-300 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
              >
                {preparingPlanning
                  ? '✨ Génération des postes...'
                  : `⚙️ Préparer le planning bénévole (${totalPersonnes} réponses sur ${event.nb_participants} attendus)`}
              </button>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {draftSlots.map((p, i) => (
                <div key={i} className="bg-slate-50 rounded-xl border border-slate-100 p-3 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Nom du poste</label>
                    <input type="text" value={p.slot_name} onChange={(e) => updateDraftSlot(i, 'slot_name', e.target.value)}
                      placeholder="Arbitrage, Buvette, Montage..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-400 outline-none text-sm bg-white" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Début</label>
                      <input type="time" value={p.start_time} onChange={(e) => updateDraftSlot(i, 'start_time', e.target.value)}
                        className="w-full px-2 py-2 rounded-lg border border-slate-200 focus:border-blue-400 outline-none text-sm bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Durée (min)</label>
                      <input type="number" min="0" value={p.duration_minutes}
                        onChange={(e) => updateDraftSlot(i, 'duration_minutes', e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full px-2 py-2 rounded-lg border border-slate-200 focus:border-blue-400 outline-none text-sm text-center bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Quota</label>
                      <input type="number" min="1" value={p.max_participants}
                        onChange={(e) => updateDraftSlot(i, 'max_participants', e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full px-2 py-2 rounded-lg border border-slate-200 focus:border-blue-400 outline-none text-sm text-center bg-white" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                    <textarea value={p.description} onChange={(e) => updateDraftSlot(i, 'description', e.target.value)} rows={2}
                      placeholder="Tâches du poste..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-400 outline-none text-sm resize-none bg-white" />
                  </div>
                  <button type="button" onClick={() => deleteDraftSlot(i)}
                    className="w-full py-2 rounded-lg border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 transition-colors">
                    Supprimer ce poste
                  </button>
                </div>
              ))}

              <button type="button" onClick={addDraftSlot}
                className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 text-sm font-medium hover:border-blue-300 hover:text-blue-500 transition-colors">
                + Ajouter un poste
              </button>

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setDraftSlots(null)}
                  className="px-4 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold text-sm hover:border-slate-300 transition-colors">
                  Annuler
                </button>
                <button type="button" onClick={saveVolunteerPlanning} disabled={savingPlanning}
                  className="flex-1 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-300 text-white font-semibold py-3 rounded-xl transition-colors text-sm">
                  {savingPlanning ? '⏳ Enregistrement...' : 'Enregistrer le planning'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* === PLANNING D'AIDE === */}
      {slots.length > 0 && (
        <div className="bg-white rounded-3xl shadow-sm ring-1 ring-stone-900/5 overflow-hidden mt-4">
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

          {/* Régénérer le planning (tournoi uniquement) */}
          {event.event_type === 'Match/Tournoi' && (
            <div className="px-5 py-3 border-t border-slate-100">
              <button
                onClick={regenerateVolunteerPlanning}
                disabled={preparingPlanning}
                className="w-full text-center text-sm font-medium text-slate-500 hover:text-amber-600 disabled:text-slate-300 transition-colors"
              >
                {preparingPlanning ? '✨ Régénération...' : '🔄 Régénérer le planning (selon les réponses actuelles)'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* === ÉQUIPEMENT DES PARTICIPANTS (listes checklist) === */}
      {checklistItems.length > 0 && confirmed.length > 0 && (() => {
        const total = checklistItems.length
        // Statut par participant confirmé
        const rows = confirmed.map(p => {
          const ids = parseCommentaire(p.commentaire).checklist
          const coches = checklistItems.filter(it => ids.includes(it.id))
          const manques = checklistItems.filter(it => !ids.includes(it.id))
          let statut = 'encours'
          if (coches.length === 0) statut = 'pas'
          else if (manques.length === 0) statut = 'pret'
          return { p, coches, manques, statut }
        })
        const nbPret = rows.filter(r => r.statut === 'pret').length
        const nbEnCours = rows.filter(r => r.statut === 'encours').length
        const nbPas = rows.filter(r => r.statut === 'pas').length
        return (
          <div className="bg-white rounded-3xl shadow-sm ring-1 ring-stone-900/5 overflow-hidden mt-4">
            <div className="px-5 py-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">✅ Équipement des participants</h3>
              <p className="text-xs text-slate-400 mt-0.5">{nbPret} prêt{nbPret > 1 ? 's' : ''} · {nbEnCours} en cours · {nbPas} pas commencé</p>
            </div>
            <div className="divide-y divide-slate-50">
              {rows.map(({ p, coches, manques, statut }) => {
                const open = !!expandedEquip[p.id]
                return (
                  <div key={p.id}>
                    <button
                      type="button"
                      onClick={() => setExpandedEquip(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                      className="w-full flex items-center justify-between gap-2 px-5 py-3 text-left hover:bg-slate-50 transition-colors"
                    >
                      <span className="text-sm font-medium text-slate-700 min-w-0 truncate">{p.participant_name}</span>
                      <span className="shrink-0 flex items-center gap-2">
                        {statut === 'pret' && <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">✅ Prêt</span>}
                        {statut === 'encours' && (
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">⚠️ Presque ({coches.length}/{total})</span>
                        )}
                        {statut === 'pas' && <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">⛔ Pas commencé</span>}
                        <span className="text-slate-300 text-xs">{open ? '▲' : '▼'}</span>
                      </span>
                    </button>
                    {statut === 'encours' && !open && manques.length > 0 && (
                      <p className="px-5 -mt-1 pb-2 text-xs text-orange-600">manque : {manques.map(it => it.item_name).join(', ')}</p>
                    )}
                    {open && (
                      <div className="px-5 pb-3 space-y-1">
                        {checklistItems.map(it => {
                          const ok = coches.some(c => c.id === it.id)
                          return (
                            <p key={it.id} className={`text-sm ${ok ? 'text-emerald-600' : 'text-orange-600'}`}>
                              {ok ? '✅' : '⬜'} {it.item_name}
                            </p>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* Si personne n'a repondu */}
      {participants.length === 0 && (
        <div className="bg-slate-50 rounded-2xl p-6 text-center">
          <p className="text-slate-500 text-sm mb-1">Personne n'a encore repondu</p>
          <p className="text-slate-400 text-xs">Partage le lien pour recevoir les premières réponses</p>
        </div>
      )}
    </div>
    </div>
  )
}
