'use client'
import { useState, useEffect } from 'react'
import { getSupabase } from '@/lib/supabase'
import { useSearchParams } from 'next/navigation'

export default function InviteClient({ linkId }) {
  const searchParams = useSearchParams()
  const [event, setEvent] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [guestName, setGuestName] = useState('')
  const [rsvp, setRsvp] = useState(null)
  const [nbPersonnes, setNbPersonnes] = useState(1)
  const [restriction, setRestriction] = useState('')
  const [commentaire, setCommentaire] = useState('')
  const [companionNames, setCompanionNames] = useState([])
  const [selectedItems, setSelectedItems] = useState({})
  const [selectedItemDetails, setSelectedItemDetails] = useState([])
  const [existingParticipant, setExistingParticipant] = useState(null)

  const [slots, setSlots] = useState([])
  const [signups, setSignups] = useState([])
  const [selectedSlots, setSelectedSlots] = useState({})
  const [slotComments, setSlotComments] = useState({})
  const [signedSlotDetails, setSignedSlotDetails] = useState([])

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
    setRestriction(match.restriction_alimentaire || '')
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

  function setItemQty(itemId, qty, max) {
    const clamped = Math.max(1, Math.min(qty, max))
    setSelectedItems(prev => ({ ...prev, [itemId]: clamped }))
  }

  async function handleSubmit(e) {
    const supabase = getSupabase()
    e.preventDefault()
    if (!guestName || !rsvp) return
    setSubmitting(true)

    // Commentaire final : JSON {accompagnants, commentaire} s'il y a des accompagnants, sinon texte brut
    const comps = (nbPersonnes > 1 ? companionNames : []).map(s => s.trim()).filter(Boolean)
    const finalCommentaire = comps.length > 0
      ? JSON.stringify({ accompagnants: comps, commentaire: commentaire.trim() })
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
            restriction_alimentaire: restriction || null,
            commentaire: finalCommentaire,
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
            restriction_alimentaire: restriction || null,
            commentaire: finalCommentaire,
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-slate-400">Chargement...</div>
    </div>
  )

  if (!event) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <p className="text-4xl mb-3">😕</p>
        <p className="text-slate-500">Ce lien d'invitation n'est plus valide</p>
      </div>
    </div>
  )

  // Vérifier deadline
  const isExpired = event.deadline_rsvp && new Date(event.deadline_rsvp) < new Date()

  if (submitted) {
    const dateStr = new Date(event.date).toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
    })
    const deadlineStr = event.deadline_rsvp
      ? new Date(event.deadline_rsvp).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
      : null

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="text-center max-w-sm w-full">
          <p className="text-5xl mb-4">{rsvp === 'Confirmé' ? '🎉' : rsvp === 'Refusé' ? '👋' : '🤔'}</p>

          {rsvp === 'Confirmé' && (
            <>
              <h1 className="text-2xl font-bold text-slate-900 mb-4">Super, tu es inscrit ! 🎉</h1>

              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-left mb-4">
                <p className="font-bold text-slate-900 mb-1">{event.event_name}</p>
                <p className="text-sm text-slate-500 flex items-center gap-2">📅 {dateStr}</p>
                {event.location && (
                  <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">📍 {event.location}</p>
                )}

                {selectedItemDetails.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-sm font-medium text-slate-700 mb-2">Tu apportes :</p>
                    <ul className="space-y-1">
                      {selectedItemDetails.map((it, idx) => (
                        <li key={idx} className="text-sm text-emerald-600 flex items-center gap-2">
                          ✅ {it.item_name} <span className="text-slate-400">({it.quantity} {it.unit})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {signedSlotDetails.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-sm font-medium text-slate-700 mb-1">Tu aides pour :</p>
                    <p className="text-sm text-blue-600">
                      {signedSlotDetails.map(s => `${s.slot_name} (${new Date(s.slot_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })})`).join(', ')}
                    </p>
                  </div>
                )}
              </div>

              <p className="text-slate-500 text-sm">
                {event.organizer_name} a ete notifie. A {dateStr} !
              </p>
              {deadlineStr && (
                <p className="text-slate-400 text-xs mt-2">
                  📩 Un message récapitulatif te sera envoyé à la date limite d'inscription ({deadlineStr}).
                </p>
              )}
            </>
          )}

          {rsvp === 'Refusé' && (
            <>
              <h1 className="text-2xl font-bold text-slate-900 mb-3">Dommage !</h1>
              <p className="text-slate-500 mb-2">Merci d'avoir repondu. A la prochaine, {guestName} ! 👋</p>
              <p className="text-slate-400 text-sm">Si tu changes d'avis, le lien reste actif.</p>
            </>
          )}

          {rsvp === 'Peut-être' && (
            <>
              <h1 className="text-2xl font-bold text-slate-900 mb-3">On note ! 🤔</h1>
              <p className="text-slate-500">Pas de souci, tu pourras confirmer plus tard avec le meme lien.</p>
            </>
          )}
        </div>
      </div>
    )
  }

  const disponibles = items.filter(i => i.status === 'Disponible')
  const reserves = items.filter(i => i.status === 'Réservé')

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
    <div className="min-h-screen bg-slate-50">
      {/* Header événement */}
      <div className="relative bg-gradient-to-b from-blue-500 to-blue-600 text-white px-4 pt-10 pb-8 overflow-hidden">
        {event.photo_url && (
          <>
            <img src={event.photo_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-blue-900/70 to-blue-950/80" />
          </>
        )}
        <div className="relative max-w-lg mx-auto">
          <p className="text-blue-200 text-sm mb-1">Tu es invité(e) par {event.organizer_name}</p>
          <h1 className="text-2xl font-bold mb-3">{event.event_name}</h1>
          <div className="space-y-1.5">
            <p className="text-blue-100 text-sm flex items-center gap-2">
              📅 {new Date(event.date).toLocaleDateString('fr-FR', {
                weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
              })}
            </p>
            {event.location && (
              <p className="text-blue-100 text-sm flex items-center gap-2">
                📍 {event.location}
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-200 underline hover:text-white text-xs"
                >
                  Voir l'itinéraire
                </a>
              </p>
            )}
            <p className="text-blue-100 text-sm flex items-center gap-2">👥 {event.nb_participants} personnes attendues</p>
            <p className="text-blue-50 text-sm mt-2">Confirme ta venue et participe à l'événement en remplissant les infos</p>
          </div>
          {isExpired && (
            <div className="mt-3 bg-red-500/20 text-red-100 text-sm px-3 py-2 rounded-lg">
              ⏰ La date limite de réponse est dépassée
            </div>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {existingParticipant && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm px-4 py-3 rounded-2xl flex items-start gap-2">
              <span>👋</span>
              <span>Tu as deja repondu ! Tu peux modifier ta reponse ci-dessous.</span>
            </div>
          )}

          {/* Nom */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <label className="block text-sm font-medium text-slate-700 mb-2">Ton prénom (contact)</label>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              onBlur={(e) => checkExistingGuest(e.target.value)}
              placeholder="Prénom du contact"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-lg"
              required
              disabled={isExpired}
            />
          </div>

          {/* RSVP */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <label className="block text-sm font-medium text-slate-700 mb-3">Tu viens ?</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 'Confirmé', emoji: '✅', label: 'Oui !' },
                { val: 'Refusé', emoji: '❌', label: 'Non' },
                { val: 'Peut-être', emoji: '🤔', label: 'Peut-être' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  disabled={isExpired}
                  onClick={() => setRsvp(opt.val)}
                  className={`py-4 rounded-xl border-2 text-center transition-all ${
                    rsvp === opt.val
                      ? opt.val === 'Confirmé' ? 'border-emerald-500 bg-emerald-50'
                        : opt.val === 'Refusé' ? 'border-red-400 bg-red-50'
                        : 'border-amber-400 bg-amber-50'
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <span className="text-2xl block">{opt.emoji}</span>
                  <span className="text-sm mt-1 block text-slate-600">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Si confirmé → détails */}
          {rsvp === 'Confirmé' && (
            <>
              {/* Nombre de personnes */}
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Tu viens à combien ? <span className="text-blue-500 font-bold">{nbPersonnes}</span>
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setNbPersonnes(n)}
                      className={`flex-1 py-3 rounded-xl border-2 text-center font-semibold transition-all ${
                        nbPersonnes === n
                          ? 'border-blue-500 bg-blue-50 text-blue-600'
                          : 'border-slate-100 text-slate-500 hover:border-slate-200'
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
                        <label className="block text-xs font-medium text-slate-600 mb-1">Prénom accompagnant {i + 1}</label>
                        <input type="text" value={name} onChange={(e) => updateCompanion(i, e.target.value)}
                          placeholder="Prénom"
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-400 outline-none text-sm" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Liste d'apports (masquée en mode solo) */}
              {event.mode !== 'solo' && disponibles.length > 0 && (
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Qu'est-ce que tu apportes ?
                  </label>
                  <p className="text-xs text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2 mb-3">Plus on partage, plus la fête est réussie ! Choisis ce que tu apportes 👇</p>
                  <div className="space-y-4">
                    {[...new Set(disponibles.map(i => i.category || 'Autre'))].map((cat) => (
                      <div key={cat}>
                        <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
                          <span>{categoryEmojis[cat] || '📦'}</span> {cat}
                        </p>
                        <div className="space-y-2">
                          {disponibles.filter(i => (i.category || 'Autre') === cat).map((item) => {
                      const selected = selectedItems[item.id] != null
                      const max = Number(item.quantity) || 1
                      const qty = selectedItems[item.id] || 1
                      return (
                        <div
                          key={item.id}
                          className={`rounded-xl border-2 transition-all ${
                            selected
                              ? 'border-emerald-400 bg-emerald-50'
                              : 'border-slate-100 hover:border-slate-200'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => toggleItem(item.id)}
                            className="w-full flex items-center justify-between px-3 py-3 text-left"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-lg">{categoryEmojis[item.category] || '📦'}</span>
                              <div>
                                <span className="text-sm font-medium text-slate-700">{item.item_name}</span>
                                <span className="text-xs text-slate-400 ml-2">{item.quantity} {item.unit}</span>
                              </div>
                            </div>
                            <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center text-xs ${
                              selected
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'border-slate-300'
                            }`}>
                              {selected ? '✓' : ''}
                            </span>
                          </button>
                          {selected && max > 1 && (
                            <div className="flex items-center justify-between px-3 pb-3 pt-1">
                              <span className="text-xs text-slate-500">Tu en apportes combien ?</span>
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => setItemQty(item.id, qty - 1, max)}
                                  disabled={qty <= 1}
                                  className="w-8 h-8 rounded-lg border-2 border-slate-200 text-slate-600 font-bold disabled:opacity-30"
                                >
                                  −
                                </button>
                                <span className="text-sm font-semibold text-slate-700 w-14 text-center">{qty} / {max}</span>
                                <button
                                  type="button"
                                  onClick={() => setItemQty(item.id, qty + 1, max)}
                                  disabled={qty >= max}
                                  className="w-8 h-8 rounded-lg border-2 border-slate-200 text-slate-600 font-bold disabled:opacity-30"
                                >
                                  +
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
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <p className="text-xs text-slate-400 mb-2">Déjà pris en charge :</p>
                      {reserves.map((item) => (
                        <div key={item.id} className="flex justify-between items-center py-1 opacity-50">
                          <span className="text-sm text-slate-400 line-through">{item.item_name}</span>
                          <span className="text-xs text-emerald-500">{item.assigned_to} ✓</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Créneaux d'aide */}
              {slots.length > 0 && (
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
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

              {/* Restrictions alimentaires */}
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                <label className="block text-sm font-medium text-slate-700 mb-3">Restrictions alimentaires ?</label>
                <div className="flex flex-wrap gap-2">
                  {restrictions.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRestriction(prev => prev === r ? '' : r)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                        restriction === r
                          ? 'border-purple-400 bg-purple-50 text-purple-700'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Commentaire */}
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                <label className="block text-sm font-medium text-slate-700 mb-2">Suggestion & commentaire</label>
                <textarea
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  placeholder="Je serai en retard, j'apporte ma guitare..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none resize-none text-sm"
                />
              </div>
            </>
          )}

          {/* Submit */}
          {rsvp && (
            <button
              type="submit"
              disabled={submitting || isExpired || !guestName}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 text-white font-semibold py-4 rounded-2xl transition-colors text-lg mb-8"
            >
              {submitting ? '⏳ Envoi...' : existingParticipant ? 'Mettre à jour ma réponse' : 'Confirmer ma réponse'}
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
