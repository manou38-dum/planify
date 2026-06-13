'use client'
import { useState, useEffect } from 'react'
import { getSupabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'

export default function EventDashboard() {
  const { id } = useParams()
  const router = useRouter()
  const [event, setEvent] = useState(null)
  const [participants, setParticipants] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [showAllMissing, setShowAllMissing] = useState(false)
  const [showAllParticipants, setShowAllParticipants] = useState(false)

  useEffect(() => {
    loadAll()
  }, [id])

  async function loadAll() {
    const supabase = getSupabase()
    const [evtRes, partRes, itemRes] = await Promise.all([
      supabase.from('events').select('*').eq('id', id).single(),
      supabase.from('participants').select('*').eq('event_id', id),
      supabase.from('items').select('*').eq('event_id', id).order('category'),
    ])
    setEvent(evtRes.data)
    setParticipants(partRes.data || [])
    setItems(itemRes.data || [])
    setLoading(false)
  }

  function copyInviteLink() {
    if (!event) return
    const url = `${window.location.origin}/invite/${event.invite_link_id}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function shareWhatsApp() {
    if (!event) return
    const url = `${window.location.origin}/invite/${event.invite_link_id}`
    const d = new Date(event.date)
    const dateStr = d.toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
    })
    const text = `${event.organizer_name} t'invite !\n${event.event_name} - ${dateStr}\n${event.location || 'Lieu a confirmer'}\n\nConfirme ta venue et choisis ce que tu apportes :\n${url}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
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

  const disponibles = items.filter(i => i.status === 'Disponible')
  const reserves = items.filter(i => i.status === 'Réservé')
  const totalManquant = disponibles.reduce((sum, i) => sum + (i.estimated_price || 0), 0)
  const totalCouvert = reserves.reduce((sum, i) => sum + (i.estimated_price || 0), 0)
  const totalBudget = totalManquant + totalCouvert
  const pctCouvert = items.length > 0 ? Math.round((reserves.length / items.length) * 100) : 0

  const missingNames = disponibles.map(i => i.item_name)

  return (
    <div className="max-w-md mx-auto px-4 py-6 pb-12">
      {/* Retour */}
      <button
        onClick={() => router.push('/')}
        className="text-slate-400 hover:text-slate-600 text-sm mb-4 flex items-center gap-1 transition-colors"
      >
        ← Mes evenements
      </button>

      {/* === CARTE PRINCIPALE === */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-5 pt-5 pb-4">
          <div className="flex justify-between items-start">
            <h1 className="text-xl font-bold text-slate-900 leading-tight">{event.event_name}</h1>
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

        {/* Ce que chacun apporte */}
        {reserves.length > 0 && (
          <div className="px-5 py-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 mb-2">Ce que chacun apporte</h3>
            <div className="space-y-1.5">
              {reserves.map((item) => (
                <div key={item.id} className="flex items-center gap-2 text-sm">
                  <span className="font-semibold text-slate-700">{item.assigned_to} :</span>
                  <span className="text-slate-500">{item.item_name}</span>
                  <span className="text-xs text-slate-400">({item.quantity} {item.unit})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Barre orange "Manque" */}
        {disponibles.length > 0 && (
          <div className="mx-4 my-3 bg-orange-500 text-white rounded-xl px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">
                  Manque : {missingNames.slice(0, 3).join(', ')}{missingNames.length > 3 ? '...' : ''}
                </p>
                <p className="text-orange-100 text-xs mt-0.5">
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
              <div className="mt-3 pt-3 border-t border-orange-400 space-y-1.5">
                {disponibles.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <span>
                      {item.item_name}{' '}
                      <span className="text-orange-200 text-xs">{item.quantity} {item.unit}</span>
                    </span>
                    <span className="font-semibold">{item.estimated_price} €</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Barre de progression */}
        <div className="px-5 py-3">
          <div className="flex justify-between items-center text-xs text-slate-500 mb-1.5">
            <span>{reserves.length}/{items.length} articles couverts</span>
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
      </div>

      {/* === BOUTONS ACTION === */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={copyInviteLink}
          className="bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 font-semibold py-3 rounded-xl transition-all text-sm"
        >
          {copied ? 'Copie !' : 'Copier le lien'}
        </button>
        <button
          onClick={shareWhatsApp}
          className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-all text-sm shadow-sm"
        >
          Envoyer WhatsApp
        </button>
      </div>

      {/* === PARTICIPANTS === */}
      {participants.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">Participants</h3>
            <span className="text-xs text-slate-400">{participants.length} reponses</span>
          </div>
          <div className="divide-y divide-slate-50">
            {(showAllParticipants ? participants : participants.slice(0, 5)).map((p) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    p.rsvp_status === 'Confirmé' ? 'bg-blue-100 text-blue-600' :
                    p.rsvp_status === 'Refusé' ? 'bg-red-100 text-red-500' :
                    'bg-amber-100 text-amber-600'
                  }`}>
                    {(p.participant_name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">
                      {p.participant_name}
                      {p.nb_personnes > 1 && (
                        <span className="text-slate-400 font-normal"> (+{p.nb_personnes - 1})</span>
                      )}
                    </p>
                    {p.restriction_alimentaire && (
                      <p className="text-xs text-purple-500">{p.restriction_alimentaire}</p>
                    )}
                    {p.commentaire && (
                      <p className="text-xs text-slate-400 truncate">{p.commentaire}</p>
                    )}
                  </div>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${
                  p.rsvp_status === 'Confirmé' ? 'bg-emerald-100 text-emerald-700' :
                  p.rsvp_status === 'Refusé' ? 'bg-red-100 text-red-600' :
                  'bg-amber-100 text-amber-600'
                }`}>
                  {p.rsvp_status === 'Confirmé' ? 'Oui' : p.rsvp_status === 'Refusé' ? 'Non' : 'Peut-etre'}
                </span>
              </div>
            ))}
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
