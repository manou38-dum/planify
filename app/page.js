'use client'
import { useState, useEffect } from 'react'
import { getSupabase } from '@/lib/supabase'
import { organizerTokenEntries } from '@/lib/event-access'
import Link from 'next/link'
import { eventTheme } from '@/lib/ui-theme.mjs'

export default function Home() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEvents()
  }, [])

  async function loadEvents() {
    const loaded = await Promise.all(organizerTokenEntries().map(async ([id, organizerToken]) => {
      const { data } = await getSupabase({ organizerToken }).from('events').select('*').eq('id', id).single()
      return data
    }))
    setEvents(loaded.filter(Boolean).sort((a, b) => new Date(a.date) - new Date(b.date)))
    setLoading(false)
  }

  async function deleteEvent(e, eventId) {
    e.preventDefault()
    e.stopPropagation()
    if (!window.confirm('Supprimer cet événement de façon définitive ?')) return
    const organizerToken = organizerTokenEntries().find(([id]) => id === eventId)?.[1]
    if (!organizerToken) return
    const supabase = getSupabase({ organizerToken })
    await supabase.from('events').delete().eq('id', eventId)
    setEvents(prev => prev.filter(ev => ev.id !== eventId))
  }

  const statusColors = {
    'Actif': 'bg-emerald-100 text-emerald-900',
    'Brouillon': 'bg-amber-100 text-amber-900',
    'Terminé': 'bg-stone-200 text-stone-700',
  }

  const now = new Date()
  const upcoming = events.filter(ev => new Date(ev.date) >= new Date(now.getTime() - 12 * 3600 * 1000))
  const past = events.filter(ev => !upcoming.includes(ev)).reverse()

  function EventCard({ event }) {
    const theme = eventTheme(event.event_type)
    return (
      <Link
        href={`/event/${event.id}`}
        className="flex items-stretch gap-3 bg-white rounded-3xl p-3 shadow-sm ring-1 ring-stone-900/5 hover:ring-orange-300 transition-all"
      >
        <span aria-hidden="true" className={`shrink-0 w-14 rounded-2xl grid place-items-center text-2xl ${theme.hero}`}>{theme.emoji}</span>
        <div className="min-w-0 flex-1 py-0.5">
          <h3 className="font-bold text-stone-900 leading-snug break-words">{event.event_name}</h3>
          <p className="text-sm text-stone-700 first-letter:uppercase">
            {new Date(event.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
          </p>
          {event.location && <p className="text-sm text-stone-600 truncate">{event.location}</p>}
          {event.status && (
            <span className={`inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full font-semibold ${statusColors[event.status] || 'bg-stone-100 text-stone-700'}`}>
              {event.status}
            </span>
          )}
        </div>
        <button
          onClick={(e) => deleteEvent(e, event.id)}
          className="shrink-0 self-start w-11 h-11 grid place-items-center rounded-xl text-stone-400 hover:bg-red-50 hover:text-red-700 transition-colors"
          title="Supprimer l'événement"
          aria-label={`Supprimer ${event.event_name}`}
        >
          ✕
        </button>
      </Link>
    )
  }

  return (
    <div className="min-h-screen bg-cream text-stone-900">
    <div className="max-w-md mx-auto px-4 py-8">
      {/* En-tête */}
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Planify</h1>
        <p className="text-stone-700 mt-1">Invite, chacun répond et choisit ce qu’il apporte. Tu vois tout d’un coup d’œil.</p>
      </header>

      {/* Bouton créer */}
      <Link
        href="/create"
        className="flex items-center justify-center w-full min-h-[56px] bg-orange-700 hover:bg-orange-800 text-white font-bold rounded-2xl mb-8 transition-colors text-lg shadow-sm"
      >
        Créer un événement
      </Link>

      {/* Liste des événements */}
      {loading ? (
        <p className="text-center py-12 text-stone-600">Chargement de tes événements…</p>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-sm ring-1 ring-stone-900/5 p-6 text-center">
          <p className="font-bold text-lg">Aucun événement pour l’instant</p>
          <p className="text-stone-700 mt-1">BBQ, anniversaire, sortie ou tournoi : décris-le en une phrase, Planify prépare l’invitation et la liste.</p>
          <p className="text-sm text-stone-600 mt-3">Tu as déjà créé un événement sur un autre appareil ? Ouvre ton lien organisateur ici une fois : il réapparaîtra dans cette liste.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {upcoming.length > 0 && (
            <section aria-labelledby="a-venir">
              <h2 id="a-venir" className="text-sm font-bold uppercase tracking-wide text-stone-600 mb-3">À venir</h2>
              <div className="space-y-3">{upcoming.map(event => <EventCard key={event.id} event={event} />)}</div>
            </section>
          )}
          {past.length > 0 && (
            <section aria-labelledby="passes">
              <h2 id="passes" className="text-sm font-bold uppercase tracking-wide text-stone-600 mb-3">Passés</h2>
              <div className="space-y-3 opacity-80">{past.map(event => <EventCard key={event.id} event={event} />)}</div>
            </section>
          )}
        </div>
      )}
    </div>
    </div>
  )
}
