'use client'
import { useState, useEffect, useRef } from 'react'
import { getSupabase } from '@/lib/supabase'
import { organizerTokenEntries } from '@/lib/event-access'
import Link from 'next/link'
import InstallCard from './components/InstallCard'
import { GUIDES } from './guides/guides.mjs'
import { CtaButton, Hero, PhoneDemo, HowItWorks, EventTypes, Pains, Reassurance } from './components/HomeShowcase'
import { eventTheme } from '@/lib/ui-theme.mjs'

export default function Home() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showStickyCta, setShowStickyCta] = useState(false)
  const heroCtaRef = useRef(null)

  // Bouton « Organiser » fixé en bas dès que celui du haut sort de l'écran (téléphone surtout).
  useEffect(() => {
    const target = heroCtaRef.current
    if (!target || !('IntersectionObserver' in window)) return
    const observer = new IntersectionObserver(([entry]) => setShowStickyCta(!entry.isIntersecting && entry.boundingClientRect.top < 0))
    observer.observe(target)
    return () => observer.disconnect()
  }, [])

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

  const next = upcoming[0]

  return (
    <div className="min-h-screen bg-cream text-stone-900">
      {/* Barre du haut : la marque, et l'accès direct pour ceux qui organisent déjà */}
      <header className="max-w-5xl mx-auto px-4 pt-4 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2 font-extrabold text-xl tracking-tight">
          <img src="/icons/icon-192.png" alt="" width="32" height="32" className="rounded-lg" />Planify
        </Link>
        <nav aria-label="Navigation principale" className="flex items-center gap-1 text-sm font-semibold">
          {events.length > 0 && <a href="#mes-evenements" className="px-3 min-h-[44px] inline-flex items-center rounded-xl text-orange-800 hover:bg-orange-50">Mes événements</a>}
          <Link href="/guides" className="px-3 min-h-[44px] inline-flex items-center rounded-xl text-stone-700 hover:bg-stone-100">Guides</Link>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-4 pb-8">
        {/* Accès direct pour un organisateur qui revient : son prochain événement, en un clic */}
        {next && (
          <section aria-labelledby="reprendre" className="mt-4">
            <h2 id="reprendre" className="text-xs font-bold uppercase tracking-wide text-stone-600 mb-2">Ton prochain événement</h2>
            <EventCard event={next} />
            {events.length > 1 && <a href="#mes-evenements" className="mt-2 inline-flex min-h-[44px] items-center text-sm font-semibold text-orange-800">Voir mes {events.length} événements ↓</a>}
          </section>
        )}

        {/* Vitrine : à quoi sert Planify, en un coup d'œil */}
        <div className="mt-6 grid gap-10 md:grid-cols-2 md:items-center md:mt-12">
          <Hero ctaRef={heroCtaRef} />
          <PhoneDemo />
        </div>

        <div className="max-w-2xl mx-auto">
          <HowItWorks />
          <EventTypes />
          <Pains />
          <Reassurance />

          {/* Tous les événements de l'organisateur, gardés sur cet appareil */}
          {!loading && events.length > 0 && (
            <section id="mes-evenements" aria-labelledby="titre-mes-evenements" className="mt-14 scroll-mt-4">
              <h2 id="titre-mes-evenements" className="text-2xl font-extrabold tracking-tight">Mes événements</h2>
              <div className="mt-5 space-y-8">
                {upcoming.length > 0 && (
                  <section aria-labelledby="a-venir">
                    <h3 id="a-venir" className="text-sm font-bold uppercase tracking-wide text-stone-600 mb-3">À venir</h3>
                    <div className="space-y-3">{upcoming.map(event => <EventCard key={event.id} event={event} />)}</div>
                  </section>
                )}
                {past.length > 0 && (
                  <section aria-labelledby="passes">
                    <h3 id="passes" className="text-sm font-bold uppercase tracking-wide text-stone-600 mb-3">Passés</h3>
                    <div className="space-y-3 opacity-80">{past.map(event => <EventCard key={event.id} event={event} />)}</div>
                  </section>
                )}
              </div>
            </section>
          )}
          {!loading && events.length === 0 && (
            <p className="mt-10 text-sm text-stone-600 text-center">Tu as déjà créé un événement sur un autre appareil&nbsp;? Ouvre ton lien organisateur ici une fois&nbsp;: il apparaîtra sur cette page.</p>
          )}

          <div className="mt-10">
            <InstallCard />
          </div>

          {/* Dernier appel à l'action */}
          <section aria-labelledby="go" className="mt-4 text-center">
            <h2 id="go" className="text-2xl font-extrabold tracking-tight">Ton prochain événement, sans prise de tête</h2>
            <p className="text-stone-700 mt-2">2 minutes pour créer, un lien à partager.</p>
            <CtaButton className="mt-5" />
          </section>

          {/* Guides publics : utiles aux organisateurs et liens internes pour le référencement */}
          <section aria-labelledby="guides" className="mt-14">
            <h2 id="guides" className="text-sm font-bold uppercase tracking-wide text-stone-600 mb-3">Guides pratiques</h2>
            <ul className="space-y-2">
              {GUIDES.map(g => (
                <li key={g.slug}>
                  <Link href={`/guides/${g.slug}`} className="flex items-center gap-3 bg-white rounded-2xl ring-1 ring-stone-900/5 px-4 min-h-[52px] font-semibold hover:ring-orange-300">
                    <span aria-hidden="true">{g.icon}</span>{g.short}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>

      {/* Bouton fixe en bas sur téléphone, une fois le bouton principal dépassé */}
      {showStickyCta && (
        <div className="fixed inset-x-0 bottom-0 z-20 p-3 bg-gradient-to-t from-cream via-cream/95 to-transparent md:hidden">
          <CtaButton className="shadow-lg" />
        </div>
      )}
    </div>
  )
}
