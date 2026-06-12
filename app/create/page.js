'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const EVENT_TYPES = [
  { value: 'BBQ', emoji: '🍖', label: 'BBQ' },
  { value: 'Anniversaire', emoji: '🎂', label: 'Anniversaire' },
  { value: 'Tournoi', emoji: '⚽', label: 'Tournoi' },
  { value: 'Mariage', emoji: '💍', label: 'Mariage' },
  { value: 'Créneau récurrent', emoji: '📅', label: 'Créneau' },
  { value: 'Autre', emoji: '🎉', label: 'Autre' },
]

export default function CreateEvent() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [generatingList, setGeneratingList] = useState(false)
  const [form, setForm] = useState({
    event_name: '',
    event_type: 'BBQ',
    date: '',
    location: '',
    nb_participants: 20,
    organizer_name: '',
    deadline_rsvp: '',
  })

  function updateForm(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.event_name || !form.date || !form.organizer_name) return
    setLoading(true)

    try {
      // 1. Créer l'événement
      const { data: event, error } = await supabase
        .from('events')
        .insert({
          event_name: form.event_name,
          event_type: form.event_type,
          date: form.date,
          location: form.location,
          nb_participants: form.nb_participants,
          organizer_name: form.organizer_name,
          deadline_rsvp: form.deadline_rsvp || null,
        })
        .select()
        .single()

      if (error) throw error

      // 2. Générer la liste IA
      setGeneratingList(true)
      try {
        const res = await fetch('/api/generate-list', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_id: event.id,
            event_type: form.event_type,
            nb_participants: form.nb_participants,
          }),
        })
        if (!res.ok) {
          console.warn('Génération IA non disponible, on continue sans')
        }
      } catch {
        console.warn('API IA non configurée, on continue sans')
      }

      // 3. Rediriger vers le dashboard
      router.push(`/event/${event.id}`)
    } catch (err) {
      alert('Erreur: ' + err.message)
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <button onClick={() => router.push('/')} className="text-slate-400 hover:text-slate-600 mb-6 flex items-center gap-1">
        ← Retour
      </button>

      <h1 className="text-2xl font-bold text-slate-900 mb-1">Nouvel événement</h1>
      <p className="text-slate-500 mb-6">30 secondes, c'est parti</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Type d'événement */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
          <div className="grid grid-cols-3 gap-2">
            {EVENT_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => updateForm('event_type', type.value)}
                className={`p-3 rounded-xl border-2 text-center transition-all ${
                  form.event_type === type.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-100 hover:border-slate-200'
                }`}
              >
                <span className="text-2xl block">{type.emoji}</span>
                <span className="text-xs text-slate-600 mt-1 block">{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Nom */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nom de l'événement</label>
          <input
            type="text"
            value={form.event_name}
            onChange={(e) => updateForm('event_name', e.target.value)}
            placeholder="BBQ chez Thomas"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-slate-900"
            required
          />
        </div>

        {/* Ton nom */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Ton prénom</label>
          <input
            type="text"
            value={form.organizer_name}
            onChange={(e) => updateForm('organizer_name', e.target.value)}
            placeholder="Thomas"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-slate-900"
            required
          />
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Date et heure</label>
          <input
            type="datetime-local"
            value={form.date}
            onChange={(e) => updateForm('date', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-slate-900"
            required
          />
        </div>

        {/* Lieu */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Lieu</label>
          <input
            type="text"
            value={form.location}
            onChange={(e) => updateForm('location', e.target.value)}
            placeholder="Adresse ou lien Google Maps"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-slate-900"
          />
        </div>

        {/* Nb participants */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Nombre de personnes attendues : <span className="text-blue-500 font-bold">{form.nb_participants}</span>
          </label>
          <input
            type="range"
            min="2"
            max="200"
            value={form.nb_participants}
            onChange={(e) => updateForm('nb_participants', parseInt(e.target.value))}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>2</span><span>50</span><span>100</span><span>200</span>
          </div>
        </div>

        {/* Deadline RSVP */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Date limite de réponse (optionnel)</label>
          <input
            type="datetime-local"
            value={form.deadline_rsvp}
            onChange={(e) => updateForm('deadline_rsvp', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-slate-900"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold py-4 rounded-2xl transition-colors text-lg"
        >
          {generatingList
            ? '✨ Génération de la liste IA...'
            : loading
            ? '⏳ Création...'
            : '✨ Créer et générer la liste'}
        </button>
      </form>
    </div>
  )
}
