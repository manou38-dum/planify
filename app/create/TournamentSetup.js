'use client'
import { SPORT_FORMATS, OTHER_SPORT, findSportFormat, formatChoices, placeWord } from '@/lib/tournament-formats.mjs'

// Préférences d'un tournoi : d'abord le sport, puis les options qui existent pour ce sport.
// Les valeurs restent dans event_options (sport, team_size, match_format, court_count, court_word, nb_equipes).
export default function TournamentSetup({ options, nbParticipants, setOptions, withMatches }) {
  const preset = findSportFormat(options.sport)
  const isOther = !preset && (options.sport_choice === 'autre' || (options.sport && !preset))
  const sport = preset || (isOther ? OTHER_SPORT : null)
  const teamSize = Number(options.team_size) || sport?.defaultSize || 2
  const courts = Number(options.court_count) || 1
  const place = sport?.place || OTHER_SPORT.place
  const format = options.match_format || (sport ? sport.defaultFormat : 'none')
  const players = Number(nbParticipants) || 0
  const teams = teamSize > 0 ? Math.floor(players / teamSize) : 0

  const patch = values => setOptions(prev => {
    const next = { ...prev, ...values }
    const size = Number(next.team_size) || 2
    next.nb_equipes = players && size ? String(Math.floor(players / size)) : prev.nb_equipes
    return next
  })

  function chooseSport(choice) {
    if (choice === OTHER_SPORT) { patch({ sport: '', sport_choice: 'autre', team_size: 2, court_word: OTHER_SPORT.place, match_format: OTHER_SPORT.defaultFormat }); return }
    patch({ sport: choice.label, sport_choice: choice.key, team_size: choice.defaultSize, court_word: choice.place, match_format: choice.defaultFormat })
  }

  const chip = active => `min-h-[44px] rounded-xl border-2 px-3 text-sm font-semibold transition-colors ${active ? 'border-blue-600 bg-white text-blue-800' : 'border-transparent bg-white/70 text-stone-700 hover:border-blue-200'}`

  return (
    <section aria-labelledby="prefs-tournoi" className="rounded-2xl p-4 border-2 bg-blue-50 border-blue-300 space-y-4">
      <p id="prefs-tournoi" className="text-xs font-semibold text-blue-700">Préférences et extras — Match/Tournoi</p>

      {/* 1. Le sport */}
      <div>
        <p className="text-sm font-bold text-stone-900">1. Quel sport ?</p>
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {SPORT_FORMATS.map(s => (
            <button key={s.key} type="button" onClick={() => chooseSport(s)} aria-pressed={preset?.key === s.key} className={chip(preset?.key === s.key)}>
              <span aria-hidden="true">{s.emoji} </span>{s.label}
            </button>
          ))}
          <button type="button" onClick={() => chooseSport(OTHER_SPORT)} aria-pressed={isOther} className={chip(isOther)}>
            <span aria-hidden="true">{OTHER_SPORT.emoji} </span>Autre
          </button>
        </div>
        {isOther && (
          <label className="block mt-2 text-sm text-stone-700">Lequel ?
            <input type="text" value={options.sport || ''} placeholder="Ex. : ultimate, rugby à toucher, bowling…"
              onChange={e => patch({ sport: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-sm text-stone-900" />
          </label>
        )}
      </div>

      {/* 2. Les options du sport choisi */}
      {sport && withMatches && (
        <>
          <div>
            <p className="text-sm font-bold text-stone-900">2. Comment on joue ?</p>
            {sport.sizes.length > 1 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {sport.sizes.map(size => (
                  <button key={size.n} type="button" onClick={() => patch({ team_size: size.n })} aria-pressed={teamSize === size.n} className={chip(teamSize === size.n)}>
                    {size.label}
                  </button>
                ))}
              </div>
            ) : sport.sizes.length === 1 ? (
              <p className="mt-1 text-sm text-stone-700">{sport.sizes[0].label}{teamSize > 1 && !/\d/.test(sport.sizes[0].label) ? ` (${teamSize} par équipe)` : ''}.</p>
            ) : (
              <label className="mt-1 block text-sm text-stone-700">Joueurs par équipe
                <input type="number" inputMode="numeric" min="1" max="15" value={options.team_size ?? teamSize} onChange={e => patch({ team_size: e.target.value })}
                  className="mt-1 block w-24 px-3 py-2 rounded-xl border border-stone-200 bg-white text-sm" />
              </label>
            )}
            <label className="mt-3 flex items-center gap-3 text-sm text-stone-700">
              <span>Nombre de {place[1]} disponibles</span>
              <input type="number" inputMode="numeric" min="1" max="50" value={options.court_count ?? 1} onChange={e => patch({ court_count: e.target.value, court_word: place })}
                className="w-20 px-3 py-2 rounded-xl border border-stone-200 bg-white text-sm" />
            </label>
            {players > 0 && (
              <p className="mt-2 text-xs text-stone-600">
                Avec {players} participant{players > 1 ? 's' : ''} prévu{players > 1 ? 's' : ''} : {teamSize === 1 ? `${players} joueurs` : `environ ${teams} équipe${teams > 1 ? 's' : ''} de ${teamSize}`} sur {courts} {placeWord(place, courts)}. Le nombre exact se fera avec les confirmés.
              </p>
            )}
          </div>

          <div>
            <p className="text-sm font-bold text-stone-900">3. {teamSize === 1 ? 'Qui joue contre qui ?' : 'Comment se forment les équipes ?'}</p>
            <div className="mt-2 space-y-2">
              {formatChoices(teamSize).map(choice => (
                <label key={choice.value} className={`flex items-start gap-3 rounded-xl border-2 p-3 cursor-pointer bg-white ${format === choice.value ? 'border-blue-600' : 'border-transparent'}`}>
                  <input type="radio" name="match-format" checked={format === choice.value} onChange={() => patch({ match_format: choice.value })} className="mt-1 w-4 h-4 accent-blue-700" />
                  <span>
                    <span className="block text-sm font-semibold text-stone-900">{choice.title}{choice.value === sport.defaultFormat && <span className="ml-2 text-xs font-bold text-emerald-800">conseillé</span>}</span>
                    <span className="block text-xs text-stone-600">{choice.hint}</span>
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-stone-600">La grille des rencontres se crée depuis ton tableau, avec les joueurs qui auront vraiment confirmé.</p>
          </div>
        </>
      )}
    </section>
  )
}
