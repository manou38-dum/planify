'use client'
import { playerMatches } from '@/lib/tournament-schedules.mjs'

// Récap invité d'un tournoi : ses rencontres à lui, puis toute la grille si besoin.
export default function MyMatches({ schedule, name, place = ['terrain', 'terrains'] }) {
  if (!schedule?.rounds?.length) return null
  const word = (Array.isArray(place) ? place[0] : 'terrain') || 'terrain'
  const Word = word.charAt(0).toUpperCase() + word.slice(1)
  const mine = name ? playerMatches(schedule, name) : []
  const plays = mine.some(m => !m.rest)

  return (
    <section aria-labelledby="mes-rencontres" className="bg-white rounded-3xl p-4 shadow-sm ring-1 ring-stone-900/5 mt-3">
      <h2 id="mes-rencontres" className="text-sm font-bold text-stone-900">🏆 {name && plays ? `Tes rencontres, ${name.charAt(0).toUpperCase() + name.slice(1)}` : 'Grille des rencontres'}</h2>
      {name && plays && (
        <ol className="mt-3 space-y-2">
          {mine.map((m, i) => (
            <li key={i} className={`rounded-2xl p-3 ${m.rest ? 'bg-stone-50' : 'bg-blue-50'}`}>
              <p className="text-xs font-bold uppercase tracking-wide text-stone-600">{m.label}</p>
              {m.rest ? (
                <p className="text-sm text-stone-700 mt-0.5">Repos : profites-en pour encourager les autres.</p>
              ) : (
                <p className="text-sm text-stone-900 mt-0.5">
                  <span className="font-bold text-blue-800">{Word} {m.court}</span>
                  {m.partners.length > 0 && <> · avec {m.partners.join(', ')}</>}
                  {m.team && m.partners.length === 0 && <> · {m.team}</>}
                  {' '}<span className="text-stone-500">contre</span> {m.opponents.join(', ')}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
      {name && !plays && (
        <p className="mt-2 text-sm text-stone-700">Ton prénom n’apparaît pas encore dans la grille : l’organisateur la refera avec les dernières réponses.</p>
      )}
      <details className="mt-3">
        <summary className="cursor-pointer text-sm font-semibold text-blue-800 min-h-[32px]">Voir toute la grille</summary>
        <div className="mt-2 space-y-2">
          {schedule.rounds.map((round, index) => (
            <div key={index} className="rounded-2xl ring-1 ring-stone-900/5 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-stone-600">{round.label}</p>
              <ul className="mt-1 space-y-1">
                {round.matches.map(match => (
                  <li key={match.court} className="text-sm text-stone-800">
                    <span className="font-semibold text-blue-800">{Word} {match.court}</span> · {(match.noms || [match.equipes[0].join(' + ')])[0]} <span className="text-stone-500">contre</span> {(match.noms || [null, match.equipes[1].join(' + ')])[1]}
                  </li>
                ))}
              </ul>
              {round.waiting?.length > 0 && <p className="mt-1 text-xs text-amber-900">Au repos : {round.waiting.join(', ')}</p>}
            </div>
          ))}
        </div>
      </details>
    </section>
  )
}
