'use client'
import { useState } from 'react'
import { activityPlanning } from '@/lib/activity-planning.mjs'

const duree = min => (min >= 60 ? `${Math.floor(min / 60)} h${min % 60 ? String(min % 60).padStart(2, '0') : ''}` : `${min} min`)

// Même calcul que l'application (activityPlanning) ; rien n'est enregistré.
export default function VolunteerPlanner({ sports }) {
  const [sport, setSport] = useState('football')
  const [start, setStart] = useState('14:00')
  const [count, setCount] = useState(40)
  const [repas, setRepas] = useState(true)
  const slots = activityPlanning(sport, start, Math.max(1, Math.min(1000, Number(count) || 1)), { repas_enabled: repas })

  return (
    <section aria-labelledby="planning" className="bg-white rounded-3xl shadow-sm ring-1 ring-stone-900/5 p-5 space-y-4">
      <h2 id="planning" className="text-lg font-bold">Ton planning de bénévoles</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="text-sm font-semibold">Sport ou activité</span>
          <select value={sport} onChange={e => setSport(e.target.value)} className="mt-1 w-full h-11 rounded-xl ring-1 ring-stone-300 px-3 bg-white">
            {sports.map(s => <option key={s.cle} value={s.cle}>{s.nom}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-semibold">Début</span>
          <input type="time" value={start} onChange={e => setStart(e.target.value)} className="mt-1 w-full h-11 rounded-xl ring-1 ring-stone-300 px-3" />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">Participants</span>
          <input type="number" inputMode="numeric" min="1" max="1000" value={count} onChange={e => setCount(e.target.value)} className="mt-1 w-full h-11 rounded-xl ring-1 ring-stone-300 px-3" />
        </label>
      </div>
      <label className="flex items-center gap-3 min-h-[44px]">
        <input type="checkbox" checked={repas} onChange={e => setRepas(e.target.checked)} className="w-5 h-5 accent-orange-700" />
        <span>Il y a une buvette ou un repas</span>
      </label>
      {slots.length === 0 ? (
        <p className="text-stone-600">Indique une heure de début pour voir le planning.</p>
      ) : (
        <ul className="divide-y divide-stone-100">
          {slots.map(slot => (
            <li key={slot.slot_name + slot.start_time} className="py-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-bold">{slot.slot_name}</span>
                <span className="shrink-0 text-sm font-semibold">{slot.max_participants} pers.</span>
              </div>
              <p className="text-sm text-stone-600">{slot.start_time} · {duree(slot.duration_minutes)}</p>
              <p className="text-sm mt-1">{slot.description.replace(/^À remplir : /, '')}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
