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
    const text = `🎉 ${event.organizer_name} t'invite !\n${event.event_name}\n📅 ${new Date(event.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}\n📍 ${event.location || 'Lieu à confirmer'}\n\nConfirme ta venue et choisis ce que tu apportes 👇\n${url}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  if (loading) return <div className="max-w-lg mx-auto px-4 py-12 text-center text-slate-400">Chargement...</div>
  if (!event) return <div className="max-w-lg mx-auto px-4 py-12 text-center text-slate-400">Événement non trouvé</div>

  const confirmed = participants.filter(p => p.rsvp_status === 'Confirmé')
  const refused = participants.filter(p => p.rsvp_status === 'Refusé')
  const pending = participants.filter(p => p.rsvp_status === 'En attente' || p.rsvp_status === 'Peut-être')
  const totalPersonnes = confirmed.reduce((sum, p) => sum + (p.nb_personnes || 1), 0)

  const disponibles = items.filter(i => i.status === 'Disponible')
  const reserves = items.filter(i => i.status === 'Réservé')
  const totalManquant = disponibles.reduce((sum, i) => sum + (i.estimated_price || 0), 0)
  const totalCouvert = reserves.reduce((sum, i) => sum + (i.estimated_price || 0), 0)

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <button onClick={() => router.push('/')} className="text-slate-400 hover:text-slate-600 mb-4 flex items-center gap-1">
        ← Mes événements
      </button>

      {/* Header événement */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 mb-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{event.event_name}</h1>
            <p className="text-slate-500 text-sm mt-1">
              📅 {new Date(event.date).toLocaleDateString('fr-FR', {
                weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
              })}
            </p>
            {event.location && <p className="text-slate-500 text-sm">📍 {event.location}</p>}
          </div>
          <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full font-medium">
            {event.status}
          </span>
        </div>

        {/* Deadline */}
        {event.deadline_rsvp && (
          <p className="text-xs text-amber-600 mt-3 bg-amber-50 px-3 py-1.5 rounded-lg">
            ⏰ Deadline : {new Date(event.deadline_rsvp).toLocaleDateString('fr-FR', {
              weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
            })}
          </p>
        )}
      </div>

      {/* Boutons partage */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={copyInviteLink}
          className="bg-white border border-slate-200 hover:border-blue-300 text-slate-700 font-medium py-3 rounded-xl transition-colors text-sm"
        >
          {copied ? '✅ Copié !' : '🔗 Copier le lien'}
        </button>
        <button
          onClick={shareWhatsApp}
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 rounded-xl transition-colors text-sm"
        >
          📱 WhatsApp
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-emerald-50 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-emerald-600">{confirmed.length}</p>
          <p className="text-xs text-emerald-600">Confirmés</p>
          <p className="text-xs text-emerald-400">{totalPersonnes} pers.</p>
        </div>
        <div className="bg-red-50 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-red-500">{refused.length}</p>
          <p className="text-xs text-red-500">Refusés</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-amber-500">{pending.length}</p>
          <p className="text-xs text-amber-500">En attente</p>
        </div>
      </div>

      {/* Budget */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 mb-4">
        <h2 className="font-semibold text-slate-900 mb-3">💰 Budget estimé</h2>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-slate-500">Couvert par les invités</span>
          <span className="text-sm font-semibold text-emerald-600">{totalCouvert.toFixed(2)}€</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-slate-500">Reste à acheter</span>
          <span className="text-sm font-semibold text-amber-600">{totalManquant.toFixed(2)}€</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden mt-3">
          <div
            className="h-full bg-emerald-400 rounded-full transition-all"
            style={{ width: `${items.length > 0 ? (reserves.length / items.length) * 100 : 0}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-1">{reserves.length}/{items.length} items couverts</p>
      </div>

      {/* Items manquants */}
      {disponibles.length > 0 && (
        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 mb-4">
          <h2 className="font-semibold text-amber-800 mb-3">⚠️ Il manque encore</h2>
          <div className="space-y-2">
            {disponibles.map((item) => (
              <div key={item.id} className="flex justify-between items-center bg-white rounded-lg px-3 py-2">
                <div>
                  <span className="text-sm text-slate-700">{item.item_name}</span>
                  <span className="text-xs text-slate-400 ml-2">{item.quantity} {item.unit}</span>
                </div>
                <span className="text-sm font-medium text-amber-600">{item.estimated_price}€</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Items réservés */}
      {reserves.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-slate-100 mb-4">
          <h2 className="font-semibold text-slate-900 mb-3">✅ Pris en charge</h2>
          <div className="space-y-2">
            {reserves.map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <div>
                  <span className="text-sm text-slate-700">{item.item_name}</span>
                  <span className="text-xs text-slate-400 ml-2">{item.quantity} {item.unit}</span>
                </div>
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                  {item.assigned_to} ✓
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Liste participants */}
      {participants.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-slate-100 mb-4">
          <h2 className="font-semibold text-slate-900 mb-3">👥 Participants</h2>
          <div className="space-y-2">
            {participants.map((p) => (
              <div key={p.id} className="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-0">
                <div>
                  <span className="text-sm font-medium text-slate-700">{p.participant_name}</span>
                  {p.nb_personnes > 1 && (
                    <span className="text-xs text-slate-400 ml-1">(+{p.nb_personnes - 1})</span>
                  )}
                  {p.restriction_alimentaire && (
                    <span className="text-xs bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded ml-2">
                      {p.restriction_alimentaire}
                    </span>
                  )}
                  {p.commentaire && (
                    <p className="text-xs text-slate-400 mt-0.5">💬 {p.commentaire}</p>
                  )}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  p.rsvp_status === 'Confirmé' ? 'bg-emerald-100 text-emerald-700' :
                  p.rsvp_status === 'Refusé' ? 'bg-red-100 text-red-600' :
                  'bg-amber-100 text-amber-600'
                }`}>
                  {p.rsvp_status === 'Confirmé' ? '✓' : p.rsvp_status === 'Refusé' ? '✗' : '?'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
