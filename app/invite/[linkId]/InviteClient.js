'use client'
import { useState, useEffect } from 'react'
import { useSharedItems } from '@/lib/use-shared-items'
import { getSupabase } from '@/lib/supabase'
import { calendarEvent } from '@/lib/calendar.mjs'
import { invitationHook } from '@/lib/invitation.mjs'
import { eventTheme, formatQuantity } from '@/lib/ui-theme.mjs'
import { menuInspiration } from '@/lib/menu-inspirations.mjs'
import { useSearchParams } from 'next/navigation'

export default function InviteClient({ linkId }) {
  const searchParams = useSearchParams()
  const [event, setEvent] = useState(null)
  const [items, setItems] = useState([])
  const [lists, setLists] = useState([])
  const [confirmedTotal, setConfirmedTotal] = useState(0)
  const [confirmedParticipants, setConfirmedParticipants] = useState([])
  const [formRevealed, setFormRevealed] = useState(false)
  const [reservingGiftId, setReservingGiftId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [extraItem, setExtraItem] = useState({ name: '', quantity: 1, unit: 'unités' })
  const [addingItem, setAddingItem] = useState(false)
  const [extraFeedback, setExtraFeedback] = useState('')
  const [linkCopied, setLinkCopied] = useState(false)

  async function addSharedItem() {
    if (addingItem || !event || event.mode === 'solo' || rsvp !== 'Confirmé') return
    const name = extraItem.name.trim()
    const quantity = Number(extraItem.quantity)
    if (!guestName.trim() || !name || name.length > 100 || !Number.isInteger(quantity) || quantity < 1 || quantity > 1000) {
      setExtraFeedback('Indique ton prénom, un article (100 caractères maximum) et une quantité entière entre 1 et 1000.')
      return
    }
    if (items.some(item => item.item_name.trim().toLocaleLowerCase('fr') === name.toLocaleLowerCase('fr'))) {
      setExtraFeedback('Cet article figure déjà dans la liste. Sélectionne-le pour le prendre en charge.')
      return
    }
    setAddingItem(true)
    setExtraFeedback('')
    try {
      const target = lists.find(list => list.behavior === 'apport')
      const { data, error } = await getSupabase().from('items').insert({
        event_id: event.id, list_id: target?.id || null,
        item_name: name, quantity, unit: extraItem.unit.trim().slice(0, 30) || 'unités',
        category: 'Suggestions des invités', status: 'Disponible', ai_generated: false,
      }).select().single()
      if (error) throw error
      setItems(previous => [...previous.filter(item => item.id !== data.id), data])
      setExtraItem({ name: '', quantity: 1, unit: 'unités' })
      setExtraFeedback('Article enregistré dans la liste commune. Les autres personnes le verront automatiquement sous 15 secondes lorsque leur page est ouverte. Pour l’apporter toi-même, coche-le dans la liste ci-dessus puis envoie ta réponse.')
    } catch {
      setExtraFeedback('Impossible de confirmer l’ajout. Recharge la liste avant de réessayer pour éviter un doublon.')
    } finally { setAddingItem(false) }
  }

  const [guestName, setGuestName] = useState('')
  const [rsvp, setRsvp] = useState(null)
  const [nbPersonnes, setNbPersonnes] = useState(1)
  const [selectedRestrictions, setSelectedRestrictions] = useState([])
  const [commentaire, setCommentaire] = useState('')
  const [isVolunteer, setIsVolunteer] = useState(false)
  const [mealChoice, setMealChoice] = useState('')
  const [companionNames, setCompanionNames] = useState([])
  const [selectedItems, setSelectedItems] = useState({})
  const [checkedChecklist, setCheckedChecklist] = useState({}) // checklist perso (rando) : id -> true
  const [selectedItemDetails, setSelectedItemDetails] = useState([])
  const [existingParticipant, setExistingParticipant] = useState(null)

  const [slots, setSlots] = useState([])
  const [signups, setSignups] = useState([])
  const [selectedSlots, setSelectedSlots] = useState({})
  const [slotComments, setSlotComments] = useState({})
  const [signedSlotDetails, setSignedSlotDetails] = useState([])

  const [carpoolEntries, setCarpoolEntries] = useState([])
  const [carpoolMode, setCarpoolMode] = useState(null) // 'offre' | 'demande' | null
  const [carpoolForm, setCarpoolForm] = useState({ zone: '', heure: '', places: 1, phone: '' })
  const [carpoolSubmitting, setCarpoolSubmitting] = useState(false)

  useSharedItems(event?.id, setItems, setLists, addingItem || submitting || !!reservingGiftId)

  useEffect(() => {
    loadEvent()
  }, [linkId])

  // Pré-remplit le prénom si présent dans l'URL (?nom=...)
  useEffect(() => {
    const nom = searchParams.get('nom')
    if (nom) setGuestName(nom)
  }, [searchParams])

  // Redimensionne le tableau des accompagnants quand le nombre de personnes change
  useEffect(() => {
    const n = Math.max(0, nbPersonnes - 1)
    setCompanionNames(prev => {
      const next = prev.slice(0, n)
      while (next.length < n) next.push('')
      return next
    })
  }, [nbPersonnes])

  function updateCompanion(idx, value) {
    setCompanionNames(prev => prev.map((c, i) => (i === idx ? value : c)))
  }

  // Vérifie (avec debounce) si le prénom correspond à une réponse déjà enregistrée
  useEffect(() => {
    if (!event || !guestName.trim()) {
      setExistingParticipant(null)
      return
    }
    const t = setTimeout(() => checkExistingGuest(guestName), 500)
    return () => clearTimeout(t)
  }, [guestName, event])

  async function checkExistingGuest(name) {
    if (!event || !name.trim()) return
    const supabase = getSupabase()
    const { data: parts } = await supabase
      .from('participants')
      .select('*')
      .eq('event_id', event.id)
      .ilike('participant_name', name.trim()) // exact, insensible à la casse

    const match = parts && parts[0]
    if (!match) {
      setExistingParticipant(null)
      return
    }

    // Pré-remplir le formulaire avec sa réponse précédente
    setExistingParticipant(match)
    setRsvp(match.rsvp_status)
    setNbPersonnes(match.nb_personnes || 1)
    setIsVolunteer(!!match.is_volunteer)
    setSelectedRestrictions((match.restriction_alimentaire || '').split(', ').filter(Boolean))
    // Le commentaire peut être un JSON { accompagnants:[], commentaire:"" } ou du texte brut
    const rawComment = match.commentaire || ''
    let parsed = null
    try {
      const p = JSON.parse(rawComment)
      if (p && Array.isArray(p.accompagnants)) parsed = p
    } catch { /* texte brut */ }
    if (parsed) {
      setCompanionNames(parsed.accompagnants)
      setCommentaire(parsed.commentaire || '')
      if (typeof parsed.repas === 'string') setMealChoice(parsed.repas)
      if (Array.isArray(parsed.checklist)) setCheckedChecklist(Object.fromEntries(parsed.checklist.map(id => [id, true])))
    } else {
      setCompanionNames([])
      setCommentaire(rawComment)
    }

    // Charger les items qu'il avait déjà réservés
    const { data: myItems } = await supabase
      .from('items')
      .select('*')
      .eq('assigned_participant_id', match.id)

    const sel = {}
    ;(myItems || []).forEach(it => { sel[it.id] = Number(it.quantity) || 1 })
    setSelectedItems(sel)

    // Pré-cocher les créneaux auxquels il est déjà inscrit + récupérer ses commentaires
    const { data: mySignups } = await supabase
      .from('slot_signups')
      .select('slot_id, comment')
      .eq('participant_id', match.id)
    const selSlots = {}
    const slotComs = {}
    ;(mySignups || []).forEach(su => {
      selSlots[su.slot_id] = true
      if (su.comment) slotComs[su.slot_id] = su.comment
    })
    setSelectedSlots(selSlots)
    setSlotComments(slotComs)
  }

  async function loadEvent() {
    const supabase = getSupabase()
    // Trouver l'événement via le lien d'invitation
    const { data: evt } = await supabase
      .from('events')
      .select('*')
      .eq('invite_link_id', linkId)
      .single()

    if (evt) {
      setEvent(evt)
      // Charger les items disponibles
      const { data: itms } = await supabase
        .from('items')
        .select('*')
        .eq('event_id', evt.id)
        .order('category')
      setItems(itms || [])

      // Charger les listes pour connaître le behavior de chaque liste (apport vs cadeau)
      const { data: lsts } = await supabase
        .from('lists')
        .select('id, behavior')
        .eq('event_id', evt.id)
      setLists(lsts || [])

      // Participants confirmés : total de personnes (jauge) + commentaires (décompte repas du récap)
      const { data: confParts } = await supabase
        .from('participants')
        .select('participant_name, nb_personnes, commentaire')
        .eq('event_id', evt.id)
        .eq('rsvp_status', 'Confirmé')
      setConfirmedParticipants(confParts || [])
      setConfirmedTotal((confParts || []).reduce((s, p) => s + (p.nb_personnes || 1), 0))

      // Charger les créneaux d'aide et les inscriptions existantes
      const { data: slts } = await supabase
        .from('slots')
        .select('*')
        .eq('event_id', evt.id)
        .order('slot_date')
      setSlots(slts || [])

      const slotIds = (slts || []).map(s => s.id)
      if (slotIds.length > 0) {
        const { data: sus } = await supabase
          .from('slot_signups')
          .select('*')
          .in('slot_id', slotIds)
        setSignups(sus || [])
      } else {
        setSignups([])
      }

      // Charger les entrées de covoiturage si activé
      if (evt.carpool_enabled) {
        const { data: cp } = await supabase
          .from('carpool')
          .select('*')
          .eq('event_id', evt.id)
        setCarpoolEntries(cp || [])
      } else {
        setCarpoolEntries([])
      }
    }
    setLoading(false)
  }

  function toggleSlot(slotId) {
    setSelectedSlots(prev => {
      const next = { ...prev }
      if (next[slotId]) delete next[slotId]
      else next[slotId] = true
      return next
    })
  }

  function updateSlotComment(slotId, value) {
    setSlotComments(prev => ({ ...prev, [slotId]: value }))
  }

  // ---- Covoiturage ----
  async function loadCarpool(eventId) {
    const supabase = getSupabase()
    const { data } = await supabase.from('carpool').select('*').eq('event_id', eventId)
    setCarpoolEntries(data || [])
  }

  // Nettoie un numéro pour wa.me : ne garde que les chiffres, 0 initial → 33
  function cleanPhone(raw) {
    let digits = (raw || '').replace(/\D/g, '')
    if (digits.startsWith('0')) digits = '33' + digits.slice(1)
    return digits
  }

  function updateCarpoolForm(field, value) {
    setCarpoolForm(prev => ({ ...prev, [field]: value }))
  }

  async function submitCarpoolOffer() {
    if (!guestName.trim()) { alert('Indique ton prénom en haut de la page.'); return }
    setCarpoolSubmitting(true)
    const supabase = getSupabase()
    await supabase.from('carpool').insert({
      event_id: event.id,
      type: 'offre',
      prenom: guestName,
      zone: carpoolForm.zone || null,
      heure: carpoolForm.heure || null,
      places: Number(carpoolForm.places) || 1,
      phone: carpoolForm.phone || null,
    })
    setCarpoolForm({ zone: '', heure: '', places: 1, phone: '' })
    setCarpoolMode(null)
    await loadCarpool(event.id)
    setCarpoolSubmitting(false)
  }

  async function submitCarpoolSearch() {
    if (!guestName.trim()) { alert('Indique ton prénom en haut de la page.'); return }
    setCarpoolSubmitting(true)
    const supabase = getSupabase()
    await supabase.from('carpool').insert({
      event_id: event.id,
      type: 'demande',
      prenom: guestName,
      zone: carpoolForm.zone || null,
    })
    setCarpoolForm({ zone: '', heure: '', places: 1, phone: '' })
    setCarpoolMode(null)
    await loadCarpool(event.id)
    setCarpoolSubmitting(false)
  }

  // Nombre d'inscrits sur un créneau (signups en base) hors l'invité courant
  function slotTakenCount(slotId) {
    return signups.filter(s => s.slot_id === slotId).length
  }

  function formatHeure(d) {
    try {
      return new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  function toggleItem(itemId) {
    setSelectedItems(prev => {
      const next = { ...prev }
      if (next[itemId] != null) {
        delete next[itemId]
      } else {
        next[itemId] = 1
      }
      return next
    })
  }

  // Checklist personnelle (rando) : chacun coche POUR LUI, sans verrouillage anti-doublon
  function toggleChecklistItem(itemId) {
    setCheckedChecklist(prev => {
      const next = { ...prev }
      if (next[itemId]) delete next[itemId]
      else next[itemId] = true
      return next
    })
  }

  function setItemQty(itemId, qty, max) {
    const clamped = Math.max(1, Math.min(qty, max))
    setSelectedItems(prev => ({ ...prev, [itemId]: clamped }))
  }

  // Réservation d'un cadeau : 1 cadeau = 1 personne, anti-doublon via le statut Disponible
  async function reserveGift(gift) {
    if (!guestName.trim()) { alert('Indique ton prénom en haut de la page.'); return }
    setReservingGiftId(gift.id)
    const supabase = getSupabase()
    const { error } = await supabase
      .from('items')
      .update({ status: 'Réservé', assigned_to: guestName.trim() })
      .eq('id', gift.id)
      .eq('status', 'Disponible') // Sécurité anti-doublon : échoue si déjà pris
    if (error) alert('Erreur: ' + error.message)
    await loadEvent()
    setReservingGiftId(null)
  }

  async function handleSubmit(e) {
    const supabase = getSupabase()
    e.preventDefault()
    if (!guestName || !rsvp) return
    setSubmitting(true)

    // Contrôle anti-dépassement AU SUBMIT (données fraîches) : prime sur l'affichage.
    // On vérifie qu'il reste assez de places pour cet invité + ses accompagnants.
    if (rsvp === 'Confirmé' && !event.event_options?.allow_extra_guests && event.nb_participants > 0) {
      let q = supabase
        .from('participants')
        .select('nb_personnes')
        .eq('event_id', event.id)
        .eq('rsvp_status', 'Confirmé')
      if (existingParticipant) q = q.neq('id', existingParticipant.id) // ne pas se compter soi-même
      const { data: confParts } = await q
      const sommeFraiche = (confParts || []).reduce((s, p) => s + (p.nb_personnes || 1), 0)
      const placesRestantes = event.nb_participants - sommeFraiche
      if (nbPersonnes > placesRestantes) {
        setSubmitting(false)
        if (placesRestantes <= 0) {
          alert(`Désolé, l'événement est complet (${sommeFraiche}/${event.nb_participants}). Tu ne peux plus t'inscrire.`)
        } else {
          alert(`Il ne reste que ${placesRestantes} place${placesRestantes > 1 ? 's' : ''} et tu as indiqué ${nbPersonnes} personnes. Réduis le nombre ou contacte l'organisateur.`)
        }
        return
      }
    }

    // Commentaire final : JSON {accompagnants, commentaire, repas, checklist} si nécessaire, sinon texte brut.
    // Le vote repas et la checklist perso (rando) sont stockés dans ce JSON, par participant (sans migration).
    const comps = (nbPersonnes > 1 ? companionNames : []).map(s => s.trim()).filter(Boolean)
    const hasMealVote = Array.isArray(event.event_options?.meal_choices) && event.event_options.meal_choices.length > 0
    const repas = (hasMealVote && rsvp === 'Confirmé') ? (mealChoice || '') : ''
    const checklist = rsvp === 'Confirmé' ? Object.keys(checkedChecklist).filter(id => checkedChecklist[id]) : []
    const finalCommentaire = (comps.length > 0 || repas || checklist.length > 0)
      ? JSON.stringify({ accompagnants: comps, commentaire: commentaire.trim(), ...(repas ? { repas } : {}), ...(checklist.length ? { checklist } : {}) })
      : (commentaire.trim() || null)

    try {
      // 1. Créer OU mettre à jour le participant
      let participant
      if (existingParticipant) {
        const { data: updated, error: updErr } = await supabase
          .from('participants')
          .update({
            participant_name: guestName,
            rsvp_status: rsvp,
            nb_personnes: nbPersonnes,
            restriction_alimentaire: selectedRestrictions.join(', ') || null,
            commentaire: finalCommentaire,
            is_volunteer: rsvp === 'Confirmé' ? isVolunteer : false,
            date_reponse: new Date().toISOString(),
          })
          .eq('id', existingParticipant.id)
          .select()
          .single()

        if (updErr) throw updErr
        participant = updated

        // Libérer ses anciens items réservés avant de réserver les nouveaux
        await supabase
          .from('items')
          .update({ status: 'Disponible', assigned_to: null, assigned_participant_id: null })
          .eq('assigned_participant_id', existingParticipant.id)
      } else {
        const { data: created, error: partErr } = await supabase
          .from('participants')
          .insert({
            event_id: event.id,
            participant_name: guestName,
            rsvp_status: rsvp,
            nb_personnes: nbPersonnes,
            restriction_alimentaire: selectedRestrictions.join(', ') || null,
            commentaire: finalCommentaire,
            is_volunteer: rsvp === 'Confirmé' ? isVolunteer : false,
            date_reponse: new Date().toISOString(),
          })
          .select()
          .single()

        if (partErr) throw partErr
        participant = created
      }

      // 2. Réserver les items sélectionnés (verrouillage)
      if (rsvp === 'Confirmé' && Object.keys(selectedItems).length > 0) {
        for (const [itemId, chosenQty] of Object.entries(selectedItems)) {
          const item = items.find(i => i.id === itemId)
          if (!item) continue

          const total = Number(item.quantity) || 1
          const taken = Math.max(1, Math.min(chosenQty, total))
          const unitPrice = (item.estimated_price != null && total > 0)
            ? Number(item.estimated_price) / total
            : null
          const round2 = (n) => Math.round(n * 100) / 100

          if (taken >= total) {
            // Prise complète : on verrouille l'item existant
            await supabase
              .from('items')
              .update({
                status: 'Réservé',
                assigned_to: guestName,
                assigned_participant_id: participant.id,
              })
              .eq('id', itemId)
              .eq('status', 'Disponible') // Sécurité anti-doublon
          } else {
            // Réservation partielle : on scinde l'item
            const remaining = total - taken

            await supabase
              .from('items')
              .update({
                quantity: taken,
                estimated_price: unitPrice != null ? round2(unitPrice * taken) : item.estimated_price,
                status: 'Réservé',
                assigned_to: guestName,
                assigned_participant_id: participant.id,
              })
              .eq('id', itemId)
              .eq('status', 'Disponible')

            await supabase
              .from('items')
              .insert({
                event_id: event.id,
                item_name: item.item_name,
                list_id: item.list_id || null,
                category: item.category,
                quantity: remaining,
                unit: item.unit,
                estimated_price: unitPrice != null ? round2(unitPrice * remaining) : null,
                status: 'Disponible',
              })
          }
        }
      }

      // 3. Inscriptions aux créneaux d'aide (seulement si confirmé)
      let chosenSlotIds = []
      if (slots.length > 0) {
        chosenSlotIds = rsvp === 'Confirmé' ? Object.keys(selectedSlots).filter(id => selectedSlots[id]) : []

        // Supprimer toutes les inscriptions précédentes de ce participant,
        // puis ré-insérer les créneaux choisis (simple et idempotent)
        await supabase.from('slot_signups').delete().eq('participant_id', participant.id)

        if (chosenSlotIds.length > 0) {
          const rows = chosenSlotIds.map(slotId => ({
            slot_id: slotId,
            participant_id: participant.id,
            participant_name: guestName,
            comment: (slotComments[slotId] || '').trim() || null,
          }))
          await supabase.from('slot_signups').insert(rows)
        }

        // Recalculer current_count de chaque créneau impacté
        const affected = new Set([
          ...chosenSlotIds,
          ...signups.filter(s => s.participant_id === participant.id).map(s => s.slot_id),
        ])
        for (const slotId of affected) {
          const { count } = await supabase
            .from('slot_signups')
            .select('*', { count: 'exact', head: true })
            .eq('slot_id', slotId)
          await supabase.from('slots').update({ current_count: count || 0 }).eq('id', slotId)
        }
      }

      // Mémoriser les créneaux choisis pour le récap post-soumission
      setSignedSlotDetails(slots.filter(s => chosenSlotIds.includes(s.id)))

      // Mémoriser les items choisis pour le récap post-soumission
      const details = Object.entries(selectedItems).map(([itemId, chosenQty]) => {
        const item = items.find(i => i.id === itemId)
        return {
          item_name: item?.item_name || 'Article',
          quantity: Math.max(1, Math.min(chosenQty, Number(item?.quantity) || 1)),
          unit: item?.unit || '',
        }
      })
      setSelectedItemDetails(details)

      setSubmitted(true)
    } catch (err) {
      alert('Erreur: ' + err.message)
    }
    setSubmitting(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <div className="text-stone-500">Chargement…</div>
    </div>
  )

  if (!event) return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4">
      <div className="text-center">
        <p className="text-4xl mb-3">😕</p>
        <p className="text-stone-600">Ce lien d’invitation n’est plus valide. Demande à l’organisateur de te le renvoyer.</p>
      </div>
    </div>
  )

  // Habillage selon le type d'événement (affichage uniquement)
  const theme = eventTheme(event.event_type)
  // Téléphone de l'organisateur (si renseigné quelque part sur l'événement)
  const organizerPhone = event.organizer_phone || event.event_options?.organizer_phone || event.event_options?.phone || null
  const organizerWaLink = organizerPhone
    ? `https://wa.me/${cleanPhone(organizerPhone)}?text=${encodeURIComponent("Salut, j'ai une question pour " + event.event_name)}`
    : null

  // Vérifier deadline : la date limite vaut jusqu'à la FIN de la journée (23:59:59)
  const deadlineEnd = event.deadline_rsvp ? new Date(new Date(event.deadline_rsvp).getFullYear(), new Date(event.deadline_rsvp).getMonth(), new Date(event.deadline_rsvp).getDate(), 23, 59, 59) : null
  const isExpired = deadlineEnd ? deadlineEnd < new Date() : false

  if (submitted) {
    const dateStr = new Date(event.date).toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
    })
    const deadlineStr = event.deadline_rsvp
      ? new Date(event.deadline_rsvp).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
      : null

    const companions = (nbPersonnes > 1 ? companionNames : []).map(n => n.trim()).filter(Boolean)
    const presence = nbPersonnes > 1
      ? `Oui, à ${nbPersonnes}${companions.length ? ` : toi et ${companions.join(', ')}` : ''}`
      : 'Oui'
    const inviteUrl = typeof window !== 'undefined' ? `${window.location.origin}/invite/${linkId}` : ''

    return (
      <div className="min-h-screen bg-cream px-4 py-10">
        <div className="max-w-sm w-full mx-auto">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-emerald-50 ring-2 ring-emerald-200 flex items-center justify-center text-4xl" aria-hidden="true">
              {rsvp === 'Confirmé' ? '🎉' : rsvp === 'Refusé' ? '👋' : '🤔'}
            </div>

            {rsvp === 'Confirmé' && (
              <>
                <h1 className="text-2xl font-bold text-stone-900 mb-2 text-balance">
                  {guestName ? `C'est noté, ${guestName} !` : 'C’est noté !'}
                </h1>
                <p className="text-stone-600">
                  {event.organizer_name} voit ta réponse dès maintenant.{' '}
                  {signedSlotDetails.length > 0
                    ? 'Merci pour ton coup de main, ça compte énormément.'
                    : selectedItemDetails.length > 0
                      ? 'Merci pour ta contribution, ça va régaler tout le monde.'
                      : 'On a hâte de te voir !'}
                </p>
              </>
            )}

            {rsvp === 'Refusé' && (
              <>
                <h1 className="text-2xl font-bold text-stone-900 mb-2">Dommage !</h1>
                <p className="text-stone-600">Merci d’avoir prévenu, ça aide {event.organizer_name} à s’organiser. À la prochaine{guestName ? `, ${guestName}` : ''} !</p>
                <p className="text-stone-500 text-sm mt-2">Si tu changes d’avis, le lien reste actif.</p>
              </>
            )}

            {rsvp === 'Peut-être' && (
              <>
                <h1 className="text-2xl font-bold text-stone-900 mb-2">On note !</h1>
                <p className="text-stone-600">Tu pourras confirmer plus tard avec le même lien{deadlineStr ? `, avant le ${deadlineStr}` : ''}.</p>
              </>
            )}
          </div>

          {rsvp === 'Confirmé' && (
            <>
              <div className="bg-white rounded-3xl p-4 shadow-sm ring-1 ring-stone-900/5 mt-6">
                <p className="font-bold text-stone-900">{event.event_name}</p>
                <p className="text-sm text-stone-600 mt-0.5">📅 {dateStr}</p>
                {event.location && <p className="text-sm text-stone-600 mt-0.5">📍 {event.location}</p>}
                <dl className="mt-3 divide-y divide-stone-100 text-sm">
                  <div className="flex gap-3 py-2"><dt className="w-24 shrink-0 font-semibold text-stone-500">Présence</dt><dd className="text-stone-800 min-w-0">{presence}</dd></div>
                  {selectedItemDetails.length > 0 && (
                    <div className="flex gap-3 py-2"><dt className="w-24 shrink-0 font-semibold text-stone-500">Tu apportes</dt>
                      <dd className="text-stone-800 min-w-0">{selectedItemDetails.map(it => `${it.item_name} · ${formatQuantity(it.quantity)} ${it.unit || ''}`.trim()).join(', ')}</dd></div>
                  )}
                  {signedSlotDetails.length > 0 && (
                    <div className="flex gap-3 py-2"><dt className="w-24 shrink-0 font-semibold text-stone-500">Tu aides</dt>
                      <dd className="text-stone-800 min-w-0">{signedSlotDetails.map(s => `${s.slot_name} (${new Date(s.slot_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })})`).join(', ')}</dd></div>
                  )}
                  {mealChoice && (
                    <div className="flex gap-3 py-2"><dt className="w-24 shrink-0 font-semibold text-stone-500">Repas</dt><dd className="text-stone-800 min-w-0">{mealChoice}</dd></div>
                  )}
                  {isVolunteer && (
                    <div className="flex gap-3 py-2"><dt className="w-24 shrink-0 font-semibold text-stone-500">Bénévole</dt><dd className="text-stone-800 min-w-0">Tu es prêt(e) à aider</dd></div>
                  )}
                </dl>
              </div>

              <div className="bg-white rounded-3xl p-4 shadow-sm ring-1 ring-stone-900/5 mt-3">
                <p className="font-bold text-stone-900">Pour ne rien oublier</p>
                <button type="button" className="mt-3 w-full min-h-[48px] rounded-2xl border border-stone-300 bg-white font-semibold text-stone-900 hover:bg-stone-50" onClick={() => {
                  const url = URL.createObjectURL(new Blob([calendarEvent(event, window.location.origin)], { type: 'text/calendar;charset=utf-8' }))
                  const link = document.createElement('a'); link.href = url; link.download = 'invitation-planify.ics'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
                }}>📅 Ajouter à mon agenda</button>
                <p className="text-xs text-stone-600 mt-2 rounded-xl bg-stone-50 p-3">Le fichier propose une alerte la veille et 2 h avant. C’est ton application d’agenda qui décide de l’activer : vérifie-la après l’ajout.</p>
                <button type="button" className="mt-3 w-full min-h-[48px] rounded-2xl border border-stone-300 bg-white font-semibold text-stone-900 hover:bg-stone-50"
                  onClick={() => { navigator.clipboard?.writeText(inviteUrl).then(() => setLinkCopied(true), () => {}); setTimeout(() => setLinkCopied(false), 2000) }}>
                  {linkCopied ? '✓ Lien copié' : '🔗 Copier le lien de l’invitation'}
                </button>
                <p className="text-xs text-stone-600 mt-2">Garde ce lien : il te permet de retrouver ou modifier ta réponse{deadlineStr ? ` avant le ${deadlineStr}` : ''}.</p>
              </div>

              {organizerWaLink && (
                <a href={organizerWaLink} target="_blank" rel="noopener noreferrer"
                  className="mt-3 flex items-center justify-center w-full min-h-[48px] rounded-2xl bg-green-700 hover:bg-green-800 text-white font-semibold">
                  Écrire à {event.organizer_name} sur WhatsApp
                </a>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  // Map list_id -> behavior pour séparer apports, cadeaux et checklist
  const listBehavior = {}
  lists.forEach(l => { listBehavior[l.id] = l.behavior })
  const giftItems = items.filter(i => listBehavior[i.list_id] === 'cadeau')
  const checklistItems = items.filter(i => listBehavior[i.list_id] === 'checklist')
  const apportItems = items.filter(i => listBehavior[i.list_id] !== 'cadeau' && listBehavior[i.list_id] !== 'checklist')

  const disponibles = apportItems.filter(i => i.status === 'Disponible')
  const reserves = apportItems.filter(i => i.status === 'Réservé')
  const giftDispo = giftItems.filter(i => i.status === 'Disponible')

  // Jauge atteinte : autant de personnes confirmées que de convives attendus
  const isFull = !event.event_options?.allow_extra_guests && event.nb_participants > 0 && confirmedTotal >= event.nb_participants
  // Tout est déjà couvert : il existe des listes mais plus rien de disponible (apports ni cadeaux)
  const hasAnyList = apportItems.length > 0 || giftItems.length > 0
  const allReserved = hasAnyList && disponibles.length === 0 && giftDispo.length === 0
  // Bouton réutilisable : n'affiche rien si l'organisateur n'a pas de numéro
  function ContactOrganizerButton({ label, className }) {
    if (!organizerWaLink) return null
    return (
      <a href={organizerWaLink} target="_blank" rel="noopener noreferrer" className={className}>
        {label}
      </a>
    )
  }

  const isAnnivEnfant = event.event_options?.anniv_type === 'enfant'
  // Tournoi complet : on propose à l'invité de se déclarer prêt à aider comme bénévole
  const isTournoiComplet = event.event_type === 'Match/Tournoi' && event.event_options?.tournoi_mode === 'complet'
  // Vote repas : choix proposés par l'organisateur
  const mealChoices = Array.isArray(event.event_options?.meal_choices) ? event.event_options.meal_choices : []
  // Sortie / Activité : lien itinéraire ou site de l'activité (facultatif)
  const lienRando = event.event_options?.lien_sortie || event.event_options?.lien_rando || ''
  // Apéro participatif : mise indicative par personne (€)
  const isApero = event.event_type === 'Apero'
  const contributionAmount = event.contribution_amount || event.event_options?.contribution_amount || null
  // Compteur de part personnelle : ce que représente la part de ce contributeur et ce qu'il a déjà pris
  const aperoPart = Math.round(Number(contributionAmount || 0) * (nbPersonnes || 1))
  const aperoPris = Math.round(Object.entries(selectedItems).reduce((sum, [id, q]) => {
    const it = items.find(i => i.id === id)
    if (!it || it.estimated_price == null) return sum
    const total = Number(it.quantity) || 1
    const qty = Math.max(1, Math.min(q, total))
    return sum + Number(it.estimated_price) * (qty / total)
  }, 0))
  const aperoReste = aperoPart - aperoPris
  const eventDateStr = new Date(event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })

  // Vue récapitulatif (lien de rappel : ?recap=1) : on montre un récap en lecture seule avant le formulaire
  const isRecap = searchParams.get('recap') === '1'
  const eventDateLong = new Date(event.date).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  })
  // Décompte des votes repas (par nombre de personnes), à partir des participants confirmés
  function extractRepas(raw) {
    if (!raw || !raw.trim().startsWith('{')) return ''
    try { const p = JSON.parse(raw); return typeof p.repas === 'string' ? p.repas : '' } catch { return '' }
  }
  // Ids de checklist cochés par un participant (stockés dans le JSON commentaire)
  function extractChecklist(raw) {
    if (!raw || !raw.trim().startsWith('{')) return []
    try { const p = JSON.parse(raw); return Array.isArray(p.checklist) ? p.checklist : [] } catch { return [] }
  }
  const mealVoteCounts = {}
  if (mealChoices.length > 0) {
    confirmedParticipants.forEach(p => {
      const r = extractRepas(p.commentaire)
      if (r) mealVoteCounts[r] = (mealVoteCounts[r] || 0) + (p.nb_personnes || 1)
    })
  }

  const allRestrictions = ['Végétarien', 'Vegan', 'Sans gluten', 'Sans porc', 'Sans lactose', 'Allergie noix']
  // Si l'événement est halal, "Sans porc" est redondant
  const restrictions = event.event_options?.halal ? allRestrictions.filter(r => r !== 'Sans porc') : allRestrictions

  const categoryEmojis = {
    'Nourriture': '🍖',
    'Boissons': '🍺',
    'Matériel': '🔧',
    'Décoration': '🎉',
    'Service': '🙋',
  }

  return (
    <div className="min-h-screen bg-cream text-stone-900">
      {/* Bandeau surprise */}
      {event.event_options?.surprise && (
        <div className="bg-amber-100 border-b border-amber-200 text-amber-900 text-sm font-medium px-4 py-3 text-center">
          🤫 C'est une surprise ! Surtout, ne dis rien à {event.event_options?.pour_qui || 'la personne fêtée'}.
        </div>
      )}

      {/* En-tête de l'invitation : couleur selon la catégorie, photo de l'organisateur si elle existe */}
      <div className="max-w-lg mx-auto px-3 pt-3">
        <div className={`relative overflow-hidden rounded-[28px] px-5 pt-6 pb-5 ${theme.hero}`}>
          {event.photo_url && (
            <>
              <img src={event.photo_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-white/85 to-white/75" />
            </>
          )}
          <div className="relative">
            <span className="absolute right-0 top-0 text-5xl" aria-hidden="true">{theme.emoji}</span>
            <p className="text-sm font-semibold text-stone-700 pr-16">{event.organizer_name} t’invite</p>
            <h1 className="text-3xl font-bold tracking-tight leading-tight mt-1 pr-16 text-balance">{event.event_name}</h1>
            <p className="text-base text-stone-800 mt-3 leading-relaxed">
              {isRecap ? "Voici où en est l'événement" : invitationHook(event)}
            </p>
            <div className="mt-4 space-y-1.5">
              <div className="flex gap-3 rounded-2xl bg-white/75 px-3 py-2.5">
                <span aria-hidden="true">📅</span>
                <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-wide text-stone-600">Quand</p>
                  <p className="first-letter:uppercase">{new Date(event.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</p></div>
              </div>
              {event.location && (
                <div className="flex gap-3 rounded-2xl bg-white/75 px-3 py-2.5">
                  <span aria-hidden="true">📍</span>
                  <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-wide text-stone-600">Où</p>
                    <p className="break-words">{event.location}</p>
                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`} target="_blank" rel="noopener noreferrer"
                      className={`text-sm font-semibold underline ${theme.link}`}>Voir l'itinéraire</a></div>
                </div>
              )}
              {event.deadline_rsvp && !isExpired && (
                <div className="flex gap-3 rounded-2xl bg-white/75 px-3 py-2.5">
                  <span aria-hidden="true">⏳</span>
                  <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-wide text-stone-600">Réponse souhaitée</p>
                    <p>avant le {new Date(event.deadline_rsvp).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p></div>
                </div>
              )}
              {isApero ? (
                <p className="rounded-2xl bg-white/75 px-3 py-2.5 text-sm">
                  🥂 {event.organizer_name} propose un apéro participatif{contributionAmount ? `, ~${contributionAmount} €/pers.` : ''} Tu es partant ?
                </p>
              ) : (
                <p className="rounded-2xl bg-white/75 px-3 py-2.5 text-sm">👥 {event.nb_participants} personnes attendues</p>
              )}
            </div>
            {lienRando && (
              <a href={lienRando} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-3 bg-white/80 hover:bg-white text-stone-900 text-sm font-semibold px-3 py-2 rounded-full transition-colors">
                🗺 Voir l'itinéraire / le site
              </a>
            )}
            {isExpired && (
              <p className="mt-3 rounded-xl bg-white/85 text-red-800 text-sm font-semibold px-3 py-2">
                ⏰ La date limite de réponse est dépassée
              </p>
            )}
          </div>
        </div>
        {!isRecap && confirmedTotal >= 2 && (
          <p className="mx-2 mt-3 text-sm text-stone-600">
            <span className="font-bold text-stone-900">{confirmedTotal} personnes</span> ont déjà dit oui, accompagnants compris
          </p>
        )}
      </div>

      {/* === VUE RÉCAPITULATIF (lien de rappel ?recap=1) === */}
      {isRecap && (
        <div className="max-w-lg mx-auto px-4 mt-4">
          <div className="bg-white rounded-3xl p-4 shadow-sm ring-1 ring-stone-900/5 space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-800">📋 Récapitulatif de l'événement</h2>
              <p className="text-sm text-slate-600 mt-1">{event.event_name}</p>
              <p className="text-sm text-slate-500 mt-0.5">📅 {eventDateLong}</p>
              {event.location && <p className="text-sm text-slate-500 mt-0.5">📍 {event.location}</p>}
              <p className="text-sm text-slate-500 mt-0.5">
                👥 {confirmedTotal} personne{confirmedTotal > 1 ? 's' : ''} confirmée{confirmedTotal > 1 ? 's' : ''} sur {event.nb_participants} attendues
              </p>
            </div>

            {/* Qui apporte quoi */}
            {(reserves.length > 0 || disponibles.length > 0) && (
              <div className="border-t border-slate-100 pt-3">
                <p className="text-sm font-semibold text-slate-700 mb-2">Qui apporte quoi</p>
                {reserves.length > 0 && (
                  <ul className="space-y-1">
                    {reserves.map(it => (
                      <li key={it.id} className="text-sm text-slate-600 flex items-center gap-2">
                        ✅ <span className="font-medium">{it.item_name}</span>
                        <span className="text-emerald-600">— {it.assigned_to || 'pris en charge'}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {disponibles.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-amber-600 mb-1">Il reste à prendre :</p>
                    <p className="text-sm text-slate-500">{disponibles.map(i => i.item_name).join(', ')}</p>
                  </div>
                )}
              </div>
            )}

            {/* Planning / créneaux */}
            {slots.length > 0 && (
              <div className="border-t border-slate-100 pt-3">
                <p className="text-sm font-semibold text-slate-700 mb-2">Planning</p>
                <ul className="space-y-1.5">
                  {slots.map(s => {
                    const inscrits = signups.filter(su => su.slot_id === s.id)
                    return (
                      <li key={s.id} className="text-sm text-slate-600">
                        <span className="font-medium">{s.slot_name}</span>
                        <span className="text-slate-400"> · {formatHeure(s.slot_date)}</span>
                        <span className="text-slate-500">
                          {' — '}{inscrits.length > 0 ? inscrits.map(i => i.participant_name).join(', ') : 'personne inscrit'}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            {/* Décompte vote repas */}
            {mealChoices.length > 0 && Object.keys(mealVoteCounts).length > 0 && (
              <div className="border-t border-slate-100 pt-3">
                <p className="text-sm font-semibold text-slate-700 mb-2">🍽 Vote repas</p>
                <p className="text-sm text-slate-600">
                  {mealChoices.filter(c => mealVoteCounts[c]).map(c => `${c} ${mealVoteCounts[c]}`).join(' · ')}
                </p>
              </div>
            )}
          </div>

          {/* Retrouve ta réponse */}
          <div className="bg-white rounded-3xl p-4 shadow-sm ring-1 ring-stone-900/5 mt-3">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Retrouve ta réponse</label>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              onBlur={(e) => checkExistingGuest(e.target.value)}
              placeholder="Ton prénom"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
            />
            {existingParticipant && (() => {
              const monApport = items.filter(i =>
                i.status === 'Réservé' &&
                (i.assigned_participant_id === existingParticipant.id || i.assigned_to === existingParticipant.participant_name)
              )
              const mesCreneaux = signups.filter(su => su.participant_id === existingParticipant.id)
              const monRepas = extractRepas(existingParticipant.commentaire)
              const mesIdsChecklist = extractChecklist(existingParticipant.commentaire)
              const checklistCoches = checklistItems.filter(it => mesIdsChecklist.includes(it.id))
              const checklistManques = checklistItems.filter(it => !mesIdsChecklist.includes(it.id))
              const presence = existingParticipant.rsvp_status === 'Confirmé' ? 'Présent(e) ✅'
                : existingParticipant.rsvp_status === 'Refusé' ? 'Absent(e)'
                : 'Peut-être'
              return (
                <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-1.5">
                  <p className="text-sm font-semibold text-emerald-800">✅ Ta réponse</p>
                  <p className="text-sm text-slate-600">Présence : {presence}</p>
                  <p className="text-sm text-slate-600">Nombre de personnes : {existingParticipant.nb_personnes || 1}</p>
                  {monApport.length > 0 && (
                    <p className="text-sm text-slate-600">Tu apportes : {monApport.map(i => i.item_name).join(', ')}</p>
                  )}
                  {mesCreneaux.length > 0 && (
                    <p className="text-sm text-slate-600">Tes créneaux : {mesCreneaux.map(su => su.slot_name || (slots.find(s => s.id === su.slot_id)?.slot_name) || 'créneau').join(', ')}</p>
                  )}
                  {monRepas && (
                    <p className="text-sm text-slate-600">Ton choix de repas : {monRepas}</p>
                  )}
                  {checklistItems.length > 0 && (
                    <div className="pt-1.5 border-t border-emerald-200/60">
                      {checklistManques.length === 0 ? (
                        <p className="text-sm font-medium text-emerald-700">✅ Checklist complète</p>
                      ) : (
                        <p className="text-sm font-medium text-orange-600">⚠️ Il te manque : {checklistManques.map(it => it.item_name).join(', ')}</p>
                      )}
                      {checklistCoches.length > 0 && (
                        <p className="text-sm text-slate-600 mt-0.5">Tu as coché : {checklistCoches.map(it => it.item_name).join(', ')}</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })()}
          </div>

          {/* Accès discret au formulaire */}
          {!formRevealed && (
            <button
              type="button"
              onClick={() => setFormRevealed(true)}
              className="w-full mt-3 mb-2 text-center text-sm font-medium text-blue-500 hover:text-blue-600 transition-colors"
            >
              Modifier ma réponse / m'inscrire
            </button>
          )}
        </div>
      )}

      {(!isRecap || formRevealed) && (
      <div className="max-w-lg mx-auto px-4 mt-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {existingParticipant && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm px-4 py-3 rounded-2xl flex items-start gap-2">
              <span>👋</span>
              <span>Tu as deja repondu ! Tu peux modifier ta reponse ci-dessous.</span>
            </div>
          )}

          {/* Nom */}
          <div className="bg-white rounded-3xl p-4 shadow-sm ring-1 ring-stone-900/5">
            <label htmlFor="guest-name" className="block font-bold text-stone-900 mb-2">Ton prénom</label>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              onBlur={(e) => checkExistingGuest(e.target.value)}
              id="guest-name"
              autoComplete="given-name"
              placeholder="Ton prénom"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-lg"
              required
              disabled={isExpired}
            />
          </div>

          {/* Jauge atteinte : on bloque la confirmation (sauf pour qui est déjà inscrit) */}
          {isFull && !existingParticipant && (
            <div className="bg-orange-50 border border-orange-200 text-orange-800 text-sm px-4 py-3 rounded-2xl">
              <p className="font-semibold">Désolé, c'est complet ! ({confirmedTotal}/{event.nb_participants} personnes)</p>
              <p className="text-orange-700 mt-0.5">L'organisateur a peut-être encore de la place, contacte-le.</p>
              <ContactOrganizerButton
                label="💬 Contacter l'organisateur"
                className="inline-block mt-3 text-xs font-semibold bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-full transition-colors"
              />
            </div>
          )}

          {/* RSVP */}
          <div className="bg-white rounded-3xl p-4 shadow-sm ring-1 ring-stone-900/5">
            <p className="font-bold text-stone-900 mb-3" id="rsvp-label">Tu viens ?</p>
            <div className="grid grid-cols-3 gap-2" role="group" aria-labelledby="rsvp-label">
              {[
                { val: 'Confirmé', emoji: '🙌', label: 'Oui !' },
                { val: 'Peut-être', emoji: '🤔', label: 'Peut-être' },
                { val: 'Refusé', emoji: '🙁', label: 'Non' },
              ].map((opt) => {
                // "Je viens" bloqué quand c'est complet, sauf si l'invité a déjà répondu
                const blocked = opt.val === 'Confirmé' && isFull && !existingParticipant
                return (
                  <button
                    key={opt.val}
                    type="button"
                    disabled={isExpired || blocked}
                    onClick={() => setRsvp(opt.val)}
                    aria-pressed={rsvp === opt.val}
                    className={`min-h-[72px] py-3 rounded-2xl border-2 bg-white text-center transition-all ${
                      blocked ? 'opacity-40 cursor-not-allowed border-slate-100' :
                      rsvp === opt.val
                        ? opt.val === 'Confirmé' ? 'border-emerald-500 bg-emerald-50'
                          : opt.val === 'Refusé' ? 'border-rose-500 bg-rose-50'
                          : 'border-amber-500 bg-amber-50'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <span className="text-2xl block" aria-hidden="true">{opt.emoji}</span>
                    <span className="text-[15px] mt-1 block font-semibold text-stone-800">{opt.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Apéro participatif : règle d'or sur l'argent */}
          {isApero && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 text-sm px-4 py-3 rounded-2xl">
              💶 Chacun avance sa part en faisant une partie des courses. L'organisateur veille à ce que tout s'équilibre entre vous. Planify ne gère pas l'argent.
            </div>
          )}

          {/* Si confirmé → détails */}
          {rsvp === 'Confirmé' && (
            <>
              {/* Nombre de personnes */}
              <div className="bg-white rounded-3xl p-4 shadow-sm ring-1 ring-stone-900/5">
                <p className="font-bold text-stone-900">Vous serez combien ?</p>
                <p className="text-sm text-stone-600 mb-3">Toi compris{isTournoiComplet ? ' : joueurs et supporters' : ''}</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setNbPersonnes(n)}
                      aria-pressed={nbPersonnes === n}
                      className={`flex-1 min-h-[48px] rounded-xl border-2 text-center font-bold transition-all ${
                        nbPersonnes === n
                          ? `${theme.selected} text-stone-900`
                          : 'border-stone-200 text-stone-600 hover:border-stone-300'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>

                {nbPersonnes > 1 && (
                  <div className="mt-3 space-y-2">
                    {companionNames.map((name, i) => (
                      <div key={i}>
                        <label htmlFor={`companion-${i}`} className="block text-sm font-semibold text-stone-600 mb-1">Prénom accompagnant {i + 1}</label>
                        <input id={`companion-${i}`} type="text" value={name} onChange={(e) => updateCompanion(i, e.target.value)}
                          placeholder="Facultatif"
                          className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-stone-300 focus:border-stone-500 outline-none text-base" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Checklist personnelle (rando) : chacun coche ce qu'il prend POUR LUI, sans verrouillage */}
              {checklistItems.length > 0 && (
                <div className="bg-white rounded-3xl p-4 shadow-sm ring-1 ring-stone-900/5">
                  <label className="block text-sm font-medium text-slate-700 mb-1">✅ Équipement & sécurité</label>
                  <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                    ⚠️ Cette liste est indicative et générée automatiquement. Elle ne remplace pas les consignes de ta fédération, de ton club ou de ton encadrant. Vérifie toujours ton équipement de sécurité avec un professionnel. Sers-toi-en comme mémo : coche au fur et à mesure pour t'assurer, toi et le groupe, de ne rien oublier avant de partir.
                  </p>
                  <div className="flex gap-2 mb-3">
                    <button type="button"
                      onClick={() => setCheckedChecklist(Object.fromEntries(checklistItems.map(it => [it.id, true])))}
                      className="flex-1 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold transition-colors">
                      ✅ J'ai tout
                    </button>
                    <button type="button"
                      onClick={() => setCheckedChecklist({})}
                      className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors">
                      Tout décocher
                    </button>
                  </div>
                  <div className="space-y-2">
                    {checklistItems.map((item) => {
                      const checked = !!checkedChecklist[item.id]
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => toggleChecklistItem(item.id)}
                          className={`w-full flex items-center justify-between rounded-xl border-2 px-3 py-3 text-left transition-all ${
                            checked ? 'border-emerald-400 bg-emerald-50' : 'border-slate-100 hover:border-slate-200'
                          }`}
                        >
                          <span className="text-sm font-medium text-slate-700">{item.item_name}</span>
                          <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center text-xs ${
                            checked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'
                          }`}>
                            {checked ? '✓' : ''}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Coche ce que tu as / prends pour toi. Plusieurs personnes peuvent cocher le même élément.</p>
                </div>
              )}

              {/* Tout est déjà couvert : message bienveillant à la place des listes */}
              {event.mode !== 'solo' && allReserved && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                  <p className="text-sm text-emerald-800">
                    ✅ Super, tout est déjà couvert ! Tu peux ajouter une idée à la liste commune plus bas, ou contacter l'organisateur.
                  </p>
                  <ContactOrganizerButton
                    label="💬 Contacter l'organisateur"
                    className="inline-block mt-3 text-xs font-semibold bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-full transition-colors"
                  />
                </div>
              )}

              {/* Apéro : liste de courses pas encore générée */}
              {isApero && apportItems.length === 0 && (
                <div className="bg-white rounded-3xl p-4 shadow-sm ring-1 ring-stone-900/5 text-center">
                  <p className="text-sm text-slate-500">🛒 La liste de courses arrivera une fois qu'on saura qui est partant.</p>
                </div>
              )}

              {event.event_type === 'BBQ' && menuInspiration(event.event_options).sources.length > 0 && (
                <div className="rounded-xl bg-white border border-slate-200 p-4 text-sm">
                  <p className="font-semibold">Des idées pour préparer les accompagnements</p>
                  <p className="text-slate-500 my-1">Adapte les recettes à la quantité que tu prends en charge et aux régimes des invités.</p>
                  {menuInspiration(event.event_options).sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer" className="block text-blue-600 underline">{source.title} ↗</a>)}
                </div>
              )}

              {/* Liste d'apports (masquée en mode solo et en anniversaire enfant) */}
              {event.mode !== 'solo' && !isAnnivEnfant && disponibles.length > 0 && (
                <div className="bg-white rounded-3xl p-4 shadow-sm ring-1 ring-stone-900/5">
                  <p className="font-bold text-stone-900">
                    {isApero ? 'Tu prends quoi en charge ?' : 'Ce que tu peux apporter'}
                  </p>
                  <p className="text-sm text-stone-600 mt-0.5 mb-3">
                    {isApero ? 'Réserve une partie des courses : chacun avance sa part.' : 'Touche ce que tu prends. Les quantités sont des repères, pas des obligations.'}
                  </p>
                  {isApero && contributionAmount && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 mb-3 text-sm">
                      <p className="text-amber-900">Ta part : <span className="font-semibold">~{aperoPart} €</span> <span className="text-amber-700 text-xs">(toi + {Math.max(0, nbPersonnes - 1)} accompagnant{nbPersonnes - 1 > 1 ? 's' : ''})</span></p>
                      <p className="text-amber-900">Tu as pris : <span className="font-semibold">{aperoPris} €</span></p>
                      {aperoReste > 0 ? (
                        <p className="text-amber-700">Reste à prendre pour ta part : ~{aperoReste} €</p>
                      ) : (
                        <p className="text-emerald-700">Tu as pris un peu plus que ta part, merci 🙌</p>
                      )}
                    </div>
                  )}
                  <div className="space-y-4">
                    {[...new Set(disponibles.map(i => i.category || 'Autre'))].map((cat) => (
                      <div key={cat}>
                        <p className="text-xs font-bold uppercase tracking-wide text-stone-500 mb-2 flex items-center gap-1.5">
                          <span aria-hidden="true">{categoryEmojis[cat] || '💡'}</span> {cat === 'Suggestions des invités' ? 'Idées des invités' : cat}
                        </p>
                        {/mat[ée]riel|logistique/i.test(cat) && (
                          <p className="text-xs text-slate-400 mb-2">Coche ce que tu peux apporter.</p>
                        )}
                        <div className="space-y-2">
                          {disponibles.filter(i => (i.category || 'Autre') === cat).map((item) => {
                      const selected = selectedItems[item.id] != null
                      const max = Number(item.quantity) || 1
                      const qty = selectedItems[item.id] || 1
                      return (
                        <div
                          key={item.id}
                          className={`rounded-2xl border-2 transition-all ${
                            selected
                              ? 'border-emerald-500 bg-emerald-50'
                              : 'border-stone-200 hover:border-stone-300'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => toggleItem(item.id)}
                            aria-pressed={selected}
                            className="w-full min-h-[56px] flex items-center justify-between gap-3 px-3 py-3 text-left"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className={`shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center text-xs ${
                                selected ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-stone-400 bg-white'
                              }`} aria-hidden="true">{selected ? '✓' : ''}</span>
                              <div className="min-w-0">
                                <span className="text-base text-stone-900 break-words">{item.item_name}</span>
                                {isApero && item.estimated_price != null && (
                                  <span className="text-xs text-amber-800 font-semibold ml-2">~{Math.round(Number(item.estimated_price))} €</span>
                                )}
                              </div>
                            </div>
                            <span className="shrink-0 text-sm font-bold text-amber-950 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-0.5 whitespace-nowrap">{formatQuantity(item.quantity)} {item.unit}</span>
                          </button>
                          {selected && max > 1 && (
                            <div className="flex items-center justify-between px-3 pb-3 pt-1">
                              <span className="text-sm text-stone-600">Tu en apportes combien ?</span>
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => setItemQty(item.id, qty - 1, max)}
                                  disabled={qty <= 1}
                                  aria-label="En apporter un de moins"
                                  className="w-10 h-10 rounded-xl border-2 border-stone-300 bg-white text-stone-700 font-bold disabled:opacity-30"
                                >
                                  −
                                </button>
                                <span className="text-sm font-semibold text-slate-700 w-16 text-center tabular-nums">{qty} / {formatQuantity(max)}</span>
                                <button
                                  type="button"
                                  onClick={() => setItemQty(item.id, qty + 1, max)}
                                  disabled={qty >= max}
                                  aria-label="En apporter un de plus"
                                  className="w-10 h-10 rounded-xl border-2 border-stone-300 bg-white text-stone-700 font-bold disabled:opacity-30"
                                >
                                  +
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setItemQty(item.id, max, max)}
                                  className="px-3 h-10 rounded-xl border-2 border-emerald-400 bg-white text-emerald-800 text-sm font-semibold hover:bg-emerald-100 transition-colors"
                                >
                                  Tout
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Items déjà pris */}
                  {reserves.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-stone-100">
                      <p className="text-xs font-bold uppercase tracking-wide text-stone-500 mb-2">Déjà pris</p>
                      {reserves.map((item) => (
                        <div key={item.id} className="flex justify-between items-center gap-3 py-2">
                          <span className="text-sm text-stone-600 min-w-0 break-words">✓ {item.item_name}</span>
                          <span className="shrink-0 text-xs font-semibold text-emerald-800 bg-emerald-50 rounded-full px-2 py-0.5">{item.assigned_to ? `Pris par ${item.assigned_to}` : 'Pris'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {event.mode !== 'solo' && !isAnnivEnfant && rsvp === 'Confirmé' && (
                <details className="bg-white rounded-3xl p-4 shadow-sm ring-1 ring-stone-900/5">
                  <summary className="cursor-pointer font-bold text-stone-900 min-h-[28px]">+ Ajouter une idée à la liste commune</summary>
                  <p className="text-sm text-stone-600 my-2">Elle sera visible par tous les invités. Chacun pourra ensuite choisir de l’apporter.</p>
                  <label className="block text-sm font-semibold text-stone-600">Article<input maxLength={100} value={extraItem.name} onChange={e => setExtraItem(p => ({ ...p, name: e.target.value }))} placeholder="Ex. glaçons, jeu de cartes…" className="block w-full min-h-[44px] border border-stone-300 rounded-xl px-3 my-1 text-base font-normal text-stone-900" /></label>
                  <div className="flex gap-3">
                    <label className="text-sm font-semibold text-stone-600">Quantité<input type="number" min="1" max="1000" step="1" value={extraItem.quantity} onChange={e => setExtraItem(p => ({ ...p, quantity: e.target.value }))} className="block w-24 min-h-[44px] border border-stone-300 rounded-xl px-3 my-1 text-base font-normal text-stone-900" /></label>
                    <label className="flex-1 text-sm font-semibold text-stone-600">Unité<input maxLength={30} value={extraItem.unit} onChange={e => setExtraItem(p => ({ ...p, unit: e.target.value }))} className="block w-full min-h-[44px] border border-stone-300 rounded-xl px-3 my-1 text-base font-normal text-stone-900" /></label>
                  </div>
                  <button type="button" disabled={addingItem} onClick={addSharedItem} className="mt-2 min-h-[48px] w-full rounded-2xl border border-stone-300 bg-white font-semibold text-stone-900 hover:bg-stone-50 disabled:opacity-50">{addingItem ? 'Ajout…' : 'Proposer cet article à tout le monde'}</button>
                  {extraFeedback && <p role="status" className="mt-2 text-sm text-stone-600">{extraFeedback}</p>}
                </details>
              )}

              {/* Idées cadeaux */}
              {giftItems.length > 0 && !allReserved && (
                <div className="bg-white rounded-3xl p-4 shadow-sm ring-1 ring-stone-900/5">
                  <label className="block text-sm font-medium text-slate-700 mb-1">🎁 Idées cadeaux</label>
                  <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 mb-3">
                    Réserve le cadeau que tu offres (pour éviter les doublons), puis achète-le où tu veux. L'app ne gère pas l'achat.
                  </p>
                  <div className="space-y-2">
                    {giftItems.map((gift) => {
                      const reserved = gift.status === 'Réservé'
                      const price = gift.estimated_price != null ? `~${Math.round(Number(gift.estimated_price))}€` : null
                      const shopUrl = `https://www.google.com/search?tbm=shop&gl=fr&hl=fr&q=${encodeURIComponent(gift.item_name)}`
                      return (
                        <div key={gift.id} className={`rounded-xl border-2 px-3 py-3 transition-all ${
                          reserved ? 'border-slate-100 bg-slate-50' : 'border-slate-100 hover:border-slate-200'
                        }`}>
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className={`text-sm font-medium ${reserved ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                🎁 {gift.item_name}
                              </p>
                              {price && <p className="text-xs text-slate-400 mt-0.5">Prix indicatif : {price}</p>}
                            </div>
                            {reserved ? (
                              <span className="shrink-0 text-xs font-medium text-slate-400">
                                🔒 déjà réservé{gift.assigned_to ? ` · ${gift.assigned_to}` : ''}
                              </span>
                            ) : (
                              <button type="button" onClick={() => reserveGift(gift)} disabled={reservingGiftId === gift.id}
                                className="shrink-0 text-xs font-semibold bg-pink-700 hover:bg-pink-800 disabled:bg-pink-300 text-white px-3 py-1.5 rounded-full transition-colors">
                                {reservingGiftId === gift.id ? '…' : "Je m'en charge"}
                              </button>
                            )}
                          </div>
                          {reserved && (
                            <a href={shopUrl} target="_blank" rel="noopener noreferrer"
                              className="inline-block mt-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-full transition-colors">
                              🔍 Trouver ce cadeau
                            </a>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  <p className="text-xs text-slate-400 mt-3">Pense à commander avant le {eventDateStr} pour être livré à temps.</p>
                </div>
              )}

              {/* Créneaux d'aide */}
              {slots.length > 0 && (
                <div className="bg-white rounded-3xl p-4 shadow-sm ring-1 ring-stone-900/5">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Donne un coup de main ? (optionnel)</label>
                  <p className="text-xs text-slate-400 mb-3">Donne un coup de main si tu peux ! Choisis un ou plusieurs créneaux. Quand un créneau est complet, il se verrouille automatiquement.</p>
                  <div className="space-y-2">
                    {slots.map((s) => {
                      const max = s.max_participants || 4
                      const selected = !!selectedSlots[s.id]
                      // Inscrits en base, en retirant l'invité courant s'il y figure déjà (évite le double comptage)
                      const baseCount = signups.filter(
                        su => su.slot_id === s.id && (!existingParticipant || su.participant_id !== existingParticipant.id)
                      ).length
                      const taken = baseCount + (selected ? 1 : 0)
                      const full = taken >= max && !selected
                      return (
                        <div key={s.id}>
                          <button
                            type="button"
                            onClick={() => !full && toggleSlot(s.id)}
                            disabled={full}
                            className={`w-full text-left rounded-xl border-2 px-3 py-3 transition-all ${
                              selected ? 'border-emerald-400 bg-emerald-50'
                                : full ? 'border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed'
                                : 'border-slate-100 hover:border-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-700 truncate">{s.slot_name}</p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  🕒 {formatHeure(s.slot_date)} · {s.duration_minutes || 60} min · {taken}/{max} inscrits
                                </p>
                              </div>
                              <span className={`shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center text-xs ${
                                selected ? 'bg-emerald-500 border-emerald-500 text-white'
                                  : full ? 'border-slate-200 text-slate-300'
                                  : 'border-slate-300'
                              }`}>
                                {selected ? '✓' : full ? '✕' : ''}
                              </span>
                            </div>
                            {full && !selected && (
                              <p className="text-xs text-slate-400 mt-1">Complet</p>
                            )}
                          </button>
                          {/* Commentaire optionnel : visible seulement une fois inscrit */}
                          {selected && (
                            <textarea
                              value={slotComments[s.id] || ''}
                              onChange={(e) => updateSlotComment(s.id, e.target.value)}
                              rows={2}
                              placeholder="Une précision ? (ex : dispo seulement 1h, j'arrive à 19h…)"
                              className="w-full mt-1.5 px-3 py-2 rounded-lg border border-slate-200 focus:border-emerald-400 outline-none text-sm resize-none"
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Covoiturage */}
              {event.carpool_enabled && (
                <div className="bg-white rounded-3xl p-4 shadow-sm ring-1 ring-stone-900/5">
                  <label className="block text-sm font-medium text-slate-700 mb-1">🚗 Covoiturage</label>
                  <p className="text-xs text-slate-400 mb-3">Propose des places ou trouve un trajet avec d'autres invités.</p>

                  <div className="flex gap-2 mb-3">
                    <button type="button" onClick={() => setCarpoolMode(carpoolMode === 'offre' ? null : 'offre')}
                      className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                        carpoolMode === 'offre' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-100 text-slate-600 hover:border-slate-200'
                      }`}>
                      Je propose des places
                    </button>
                    <button type="button" onClick={() => setCarpoolMode(carpoolMode === 'demande' ? null : 'demande')}
                      className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                        carpoolMode === 'demande' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-100 text-slate-600 hover:border-slate-200'
                      }`}>
                      Je cherche une place
                    </button>
                  </div>

                  {/* Formulaire : je propose */}
                  {carpoolMode === 'offre' && (
                    <div className="space-y-2 mb-4 bg-slate-50 rounded-xl p-3">
                      <input type="text" value={carpoolForm.zone} onChange={(e) => updateCarpoolForm('zone', e.target.value)}
                        placeholder="Zone de départ (ex : Lyon 3e)"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-400 outline-none text-sm" />
                      <input type="text" value={carpoolForm.heure} onChange={(e) => updateCarpoolForm('heure', e.target.value)}
                        placeholder="Heure de départ (ex : 13h30)"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-400 outline-none text-sm" />
                      <div className="flex gap-2">
                        <input type="number" min={1} value={carpoolForm.places} onChange={(e) => updateCarpoolForm('places', e.target.value)}
                          placeholder="Places"
                          className="w-20 px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-400 outline-none text-sm text-center" />
                        <input type="text" value={carpoolForm.phone} onChange={(e) => updateCarpoolForm('phone', e.target.value)}
                          placeholder="Téléphone (facultatif)"
                          className="flex-1 px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-400 outline-none text-sm" />
                      </div>
                      <button type="button" onClick={submitCarpoolOffer} disabled={carpoolSubmitting}
                        className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 text-white text-sm font-semibold rounded-lg transition-colors">
                        {carpoolSubmitting ? '…' : 'Publier mon offre'}
                      </button>
                    </div>
                  )}

                  {/* Formulaire : je cherche */}
                  {carpoolMode === 'demande' && (
                    <div className="space-y-2 mb-4 bg-slate-50 rounded-xl p-3">
                      <input type="text" value={carpoolForm.zone} onChange={(e) => updateCarpoolForm('zone', e.target.value)}
                        placeholder="Zone de départ (ex : Lyon 3e)"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-400 outline-none text-sm" />
                      <button type="button" onClick={submitCarpoolSearch} disabled={carpoolSubmitting}
                        className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 text-white text-sm font-semibold rounded-lg transition-colors">
                        {carpoolSubmitting ? '…' : 'Publier ma demande'}
                      </button>
                    </div>
                  )}

                  {/* Deux colonnes : conducteurs / passagers */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 mb-2">Conducteurs</p>
                      <div className="space-y-2">
                        {carpoolEntries.filter(c => c.type === 'offre').map(c => {
                          const msg = encodeURIComponent(`Salut ${c.prenom}, je suis intéressé(e) par ta place pour ${event.event_name} !`)
                          return (
                            <div key={c.id} className="rounded-lg border border-slate-100 px-3 py-2">
                              <p className="text-sm font-medium text-slate-700">{c.prenom}</p>
                              <p className="text-xs text-slate-400">
                                {[c.zone, c.heure, c.places ? `${c.places} place${c.places > 1 ? 's' : ''}` : null].filter(Boolean).join(' · ')}
                              </p>
                              {c.phone && (
                                <a href={`https://wa.me/${cleanPhone(c.phone)}?text=${msg}`} target="_blank" rel="noopener noreferrer"
                                  className="inline-block mt-1.5 text-xs font-medium bg-green-700 hover:bg-green-800 text-white px-3 py-1 rounded-full transition-colors">
                                  Contacter
                                </a>
                              )}
                            </div>
                          )
                        })}
                        {carpoolEntries.filter(c => c.type === 'offre').length === 0 && (
                          <p className="text-xs text-slate-300 italic">Personne pour l'instant</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 mb-2">Passagers</p>
                      <div className="space-y-2">
                        {carpoolEntries.filter(c => c.type === 'demande').map(c => (
                          <div key={c.id} className="rounded-lg border border-slate-100 px-3 py-2">
                            <p className="text-sm font-medium text-slate-700">{c.prenom}</p>
                            {c.zone && <p className="text-xs text-slate-400">{c.zone}</p>}
                          </div>
                        ))}
                        {carpoolEntries.filter(c => c.type === 'demande').length === 0 && (
                          <p className="text-xs text-slate-300 italic">Personne pour l'instant</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 mt-3">Ton numéro ne sera visible que par les invités de cet événement, et seulement si tu choisis de le partager.</p>
                </div>
              )}

              {/* Vote repas : choix unique parmi les options proposées par l'organisateur */}
              {mealChoices.length > 0 && (
                <div className="bg-white rounded-3xl p-4 shadow-sm ring-1 ring-stone-900/5">
                  <p className="font-bold text-stone-900">🍽️ Repas <span className="ml-1 align-middle text-xs font-semibold bg-stone-100 text-stone-700 rounded-full px-2 py-0.5">facultatif</span></p>
                  <p className="text-sm text-stone-600 mt-0.5 mb-3">Proposé par {event.organizer_name}. Ton choix compte pour tout ton groupe (toi et tes accompagnants).</p>
                  <div className="space-y-2">
                    {mealChoices.map((choice) => (
                      <button
                        key={choice}
                        type="button"
                        onClick={() => setMealChoice(choice)}
                        aria-pressed={mealChoice === choice}
                        className={`w-full min-h-[52px] text-left rounded-2xl border-2 px-4 py-3 transition-all flex items-center justify-between ${
                          mealChoice === choice ? theme.selected : 'border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <span className="text-base text-stone-900">{choice}</span>
                        <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs ${
                          mealChoice === choice ? 'bg-stone-900 border-stone-900 text-white' : 'border-stone-400'
                        }`} aria-hidden="true">
                          {mealChoice === choice ? '✓' : ''}
                        </span>
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-stone-600 mt-2">C’est une indication pour l’organisation du repas. Tu peux ne rien choisir.</p>
                </div>
              )}

              {/* Bénévolat (tournoi complet) : simple déclaration d'intérêt */}
              {isTournoiComplet && (
                <div className="bg-white rounded-3xl p-4 shadow-sm ring-1 ring-stone-900/5">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={isVolunteer}
                      onChange={(e) => setIsVolunteer(e.target.checked)}
                      className={`w-6 h-6 mt-0.5 shrink-0 ${theme.check}`} />
                    <span><span className="block font-bold text-stone-900">Je peux donner un coup de main</span>
                      <span className="block text-sm text-stone-600">Installation, buvette, arbitrage… L’organisateur répartit les postes ensuite.</span></span>
                  </label>
                </div>
              )}

              {/* Restrictions alimentaires */}
              <div className="bg-white rounded-3xl p-4 shadow-sm ring-1 ring-stone-900/5">
                <p className="font-bold text-stone-900 mb-3">Restrictions alimentaires ?</p>
                <div className="flex flex-wrap gap-2">
                  {restrictions.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSelectedRestrictions(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r])}
                      aria-pressed={selectedRestrictions.includes(r)}
                      className={`min-h-[40px] px-3.5 rounded-full text-sm border-2 transition-all ${
                        selectedRestrictions.includes(r)
                          ? 'border-violet-600 bg-violet-50 text-violet-900 font-semibold'
                          : 'border-stone-200 text-stone-700 hover:border-stone-300'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Commentaire */}
              <div className="bg-white rounded-3xl p-4 shadow-sm ring-1 ring-stone-900/5">
                <label htmlFor="guest-comment" className="block font-bold text-stone-900 mb-2">Un mot pour {event.organizer_name} <span className="font-normal text-stone-600">(facultatif)</span></label>
                <textarea
                  id="guest-comment"
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  placeholder="Allergies, retard prévu…"
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none resize-none text-sm"
                />
              </div>
            </>
          )}

          {/* Submit */}
          {rsvp && (
            <div className="sticky bottom-0 z-10 -mx-4 px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-cream/95 backdrop-blur shadow-[0_-8px_16px_rgba(28,25,23,0.06)]">
              {rsvp === 'Confirmé' && (
                <p className="text-sm text-stone-600 text-center mb-2" aria-live="polite">
                  {[
                    `${nbPersonnes} personne${nbPersonnes > 1 ? 's' : ''}`,
                    Object.keys(selectedItems).length > 0 && `${Object.keys(selectedItems).length} apport${Object.keys(selectedItems).length > 1 ? 's' : ''}`,
                    mealChoice && `repas : ${mealChoice}`,
                    isVolunteer && 'bénévole',
                  ].filter(Boolean).join(' · ')}
                </p>
              )}
              {!guestName && <p className="text-sm text-stone-600 text-center mb-2">Indique ton prénom pour envoyer ta réponse.</p>}
              <button
                type="submit"
                disabled={submitting || isExpired || !guestName}
                className={`w-full min-h-[52px] disabled:bg-stone-300 disabled:text-stone-600 text-white font-bold rounded-2xl transition-colors text-lg ${theme.button}`}
              >
                {submitting ? 'Envoi…' : existingParticipant ? 'Mettre à jour ma réponse' : 'Envoyer ma réponse'}
              </button>
            </div>
          )}
        </form>

        {/* Contact organisateur : toujours disponible si un numéro existe */}
        {organizerWaLink && (
          <div className="text-center pt-4 pb-10">
            <ContactOrganizerButton
              label="💬 Une question ? Contacter l'organisateur"
              className="inline-block text-sm font-semibold text-green-800 hover:text-green-900 underline"
            />
          </div>
        )}
      </div>
      )}
    </div>
  )
}
