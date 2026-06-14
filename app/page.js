'use client'
import { useState, useEffect } from 'react'
import { getSupabase } from '@/lib/supabase'
import Link from 'next/link'

export default function Home() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEvents()
  }, [])

  async function loadEvents() {
    const supabase = getSupabase()
    const { data } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true })
    setEvents(data || [])
    setLoading(false)
  }

  async function deleteEvent(e, eventId) {
    e.preventDefault()
    e.stopPropagation()
    if (!window.confirm('Supprimer cet événement de façon définitive ?')) return
    const supabase = getSupabase()
    await supabase.from('events').delete().eq('id', eventId)
    setEvents(prev => prev.filter(ev => ev.id !== eventId))
  }

  const statusColors = {
    'Actif': 'bg-emerald-100 text-emerald-700',
    'Brouillon': 'bg-amber-100 text-amber-700',
    'Terminé': 'bg-slate-100 text-slate-500',
  }

  const typeEmojis = {
    'BBQ': '🍖',
    'Anniversaire': '🎂',
    'Tournoi': '⚽',
    'Mariage': '💍',
    'Créneau récurrent': '📅',
    'Autre': '🎉',
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">🎉 Planify</h1>
        <p className="text-slate-500 mt-1">Tes événements, zéro tracas</p>
      </div>

      {/* Bouton créer */}
      <Link
        href="/create"
        className="block w-full bg-blue-500 hover:bg-blue-600 text-white text-center font-semibold py-4 rounded-2xl mb-8 transition-colors text-lg"
      >
        + Créer un événement
      </Link>

      {/* Liste des événements */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Chargement...</div>
      ) : events.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-5xl mb-4">📋</p>
          <p className="text-slate-500">Aucun événement pour l'instant</p>
          <p className="text-slate-400 text-sm mt-1">Crée ton premier événement en 30 secondes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <Link
              key={event.id}
              href={`/event/${event.id}`}
              className="block bg-white rounded-2xl p-4 border border-slate-100 hover:border-blue-200 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{typeEmojis[event.event_type] || '🎉'}</span>
                  <div>
                    <h3 className="font-semibold text-slate-900">{event.event_name}</h3>
                    <p className="text-sm text-slate-500">
                      {new Date(event.date).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    {event.location && (
                      <p className="text-sm text-slate-400">📍 {event.location}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[event.status] || ''}`}>
                    {event.status}
                  </span>
                  <button
                    onClick={(e) => deleteEvent(e, event.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                    title="Supprimer l'événement"
                    aria-label="Supprimer l'événement"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
