'use client'
import { useState, useEffect, useRef } from 'react'
import { getSupabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const EVENT_TYPES = [
  { value: 'BBQ', icon: '🔥', label: 'BBQ', bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700', accent: 'bg-orange-500' },
  { value: 'Anniversaire', icon: '🎂', label: 'Anniversaire', bg: 'bg-pink-50', border: 'border-pink-300', text: 'text-pink-700', accent: 'bg-pink-500' },
  { value: 'Mariage', icon: '💍', label: 'Mariage', bg: 'bg-violet-50', border: 'border-violet-300', text: 'text-violet-700', accent: 'bg-violet-500' },
  { value: 'Randonnée', icon: '🥾', label: 'Randonnée', bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700', accent: 'bg-green-500' },
  { value: 'Soirée', icon: '🎶', label: 'Soirée', bg: 'bg-indigo-50', border: 'border-indigo-300', text: 'text-indigo-700', accent: 'bg-indigo-500' },
  { value: 'Match/Tournoi', icon: '⚽', label: 'Match/Tournoi', bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700', accent: 'bg-blue-500' },
  { value: 'Autre', icon: '✨', label: 'Autre', bg: 'bg-slate-50', border: 'border-slate-300', text: 'text-slate-700', accent: 'bg-slate-500' },
]

// Options spécifiques par type d'événement
const OPTIONS_BY_TYPE = {
  'BBQ': {
    checks: [
      { key: 'halal', label: 'Halal' },
      { key: 'vegetarien', label: 'Végétarien' },
      { key: 'sans_alcool', label: 'Sans alcool' },
      { key: 'desserts', label: 'Prévoir les desserts' },
      { key: 'aide_montage', label: "Besoin d'aide montage/démontage" },
    ],
  },
  'Anniversaire': {
    fields: [
      { key: 'pour_qui', label: 'Pour qui ?', placeholder: 'Léa, ma sœur...' },
      { key: 'age', label: 'Âge', placeholder: '30 ans' },
      { key: 'centres_interet', label: "Centres d'intérêt", placeholder: 'Cuisine, voyages...' },
    ],
    checks: [
      { key: 'liste_cadeaux', label: 'Proposer liste cadeaux' },
      { key: 'decoration', label: 'Décoration (ballons, guirlandes, banderole)' },
      { key: 'theme', label: 'Thème spécial' },
    ],
    conditionals: [
      { showIf: 'theme', key: 'theme_detail', label: 'Thème', placeholder: 'Princesse, Super-héros, Années 80...' },
    ],
  },
  'Mariage': {
    fields: [{ key: 'prenoms_maries', label: 'Prénoms des mariés', placeholder: 'Marie & Thomas' }],
    checks: [
      { key: 'liste_cadeaux', label: 'Liste cadeaux' },
      { key: 'aide_logistique', label: 'Aide logistique' },
    ],
  },
  'Randonnée': {
    fields: [
      { key: 'duree', label: 'Durée estimée', placeholder: '4h, journée...' },
      { key: 'denivele', label: 'Dénivelé', placeholder: '800 m' },
    ],
    checks: [
      { key: 'enfants', label: 'Enfants présents' },
      { key: 'checklist_securite', label: 'Checklist sécurité obligatoire' },
    ],
  },
  'Soirée': {
    checks: [
      { key: 'interieur_exterieur', label: 'Intérieur / Extérieur' },
      { key: 'theme', label: 'Thème' },
      { key: 'sans_alcool', label: 'Sans alcool' },
    ],
  },
  'Match/Tournoi': {
    fields: [
      { key: 'sport', label: 'Sport', placeholder: 'Foot, padel...' },
      { key: 'nb_equipes', label: "Nb d'équipes", placeholder: '4' },
    ],
    checks: [{ key: 'snacks', label: 'Snacks post-match' }],
  },
  'Autre': {
    textarea: { key: 'description', label: "Décris ton événement pour que l'IA génère les bonnes listes" },
  },
}

// Listes à la carte proposées dans l'invitation
const LIST_CHOICES = [
  { key: 'menu', label: '🍽 Menu (nourriture)' },
  { key: 'boissons', label: '🥤 Boissons' },
  { key: 'materiel', label: '📦 Matériel & logistique' },
  { key: 'cadeaux', label: '🎁 Liste de cadeaux' },
  { key: 'planning', label: "📋 Planning d'aide (montage, service, rangement)" },
  { key: 'checklist', label: '✅ Checklist (matériel obligatoire)' },
]

// Pré-cochage intelligent selon le type
const DEFAULT_LISTS = {
  'BBQ': ['menu', 'boissons', 'materiel'],
  'Anniversaire': ['menu', 'boissons', 'cadeaux'],
  'Mariage': ['menu', 'boissons', 'cadeaux', 'planning'],
  'Randonnée': ['menu', 'checklist'],
  'Soirée': ['boissons', 'menu'],
  'Match/Tournoi': ['boissons', 'menu'],
  'Autre': ['menu'],
}

export default function CreateEvent() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [generating, setGenerating] = useState(false)
  const [creating, setCreating] = useState(false)

  const [form, setForm] = useState({
    event_name: '',
    event_type: 'BBQ',
    date: '',
    location: '',
    nb_participants: 20,
    organizer_name: '',
    deadline_rsvp: '',
    mode: 'collaboratif',
  })
  const [eventOptions, setEventOptions] = useState({})
  const [eventDescription, setEventDescription] = useState('')
  const [selectedLists, setSelectedLists] = useState({})
  const [listening, setListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const recognitionRef = useRef(null)
  const fileInputRef = useRef(null)

  const [photoUrl, setPhotoUrl] = useState('')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const [generatedLists, setGeneratedLists] = useState([])
  const [planning, setPlanning] = useState([])
  const [menuResume, setMenuResume] = useState('')
  const [activeTab, setActiveTab] = useState(0)

  // Détection du support Web Speech (côté client uniquement)
  useEffect(() => {
    const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)
    setSpeechSupported(!!SR)
  }, [])

  function toggleDictation() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop()
      return
    }
    const rec = new SR()
    rec.lang = 'fr-FR'
    rec.continuous = false
    rec.interimResults = true
    rec.onresult = (e) => {
      let finalText = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalText += e.results[i][0].transcript
      }
      if (finalText.trim()) {
        setEventDescription(prev => (prev ? prev.trimEnd() + ' ' : '') + finalText.trim())
      }
    }
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    recognitionRef.current = rec
    setListening(true)
    rec.start()
  }

  function updateForm(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }
  function updateOption(key, value) {
    setEventOptions(prev => ({ ...prev, [key]: value }))
  }

  function chooseType(type) {
    updateForm('event_type', type)
    setEventOptions({})
    setSelectedLists(Object.fromEntries((DEFAULT_LISTS[type] || ['menu']).map(k => [k, true])))
    setStep(2)
  }

  function toggleList(key) {
    setSelectedLists(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // ---- Upload photo de l'événement (bucket public event-photos) ----
  async function handlePhotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      alert('La photo est trop lourde (maximum 5 Mo).')
      e.target.value = ''
      return
    }
    setUploadingPhoto(true)
    try {
      const supabase = getSupabase()
      const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = `${Date.now()}-${cleanName}`
      const { error: upErr } = await supabase.storage
        .from('event-photos')
        .upload(path, file, { cacheControl: '3600', upsert: false })
      if (upErr) throw upErr
      const { data } = supabase.storage.from('event-photos').getPublicUrl(path)
      setPhotoUrl(data.publicUrl)
    } catch (err) {
      alert('Erreur lors de l\'envoi de la photo: ' + err.message)
    }
    setUploadingPhoto(false)
    e.target.value = ''
  }

  function removePhoto() {
    setPhotoUrl('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ---- Étape 2 → 3 : génération IA ----
  async function handleGenerate() {
    if (!form.event_name || !form.date || !form.organizer_name) {
      alert('Remplis le nom de l\'événement, la date et ton prénom.')
      return
    }
    setGenerating(true)
    try {
      // Mode solo : aucune liste d'apports. On récupère uniquement le planning
      // bénévoles si une aide montage/logistique est demandée.
      if (form.mode === 'solo') {
        const wantsPlanning = !!(eventOptions.aide_montage || eventOptions.aide_logistique)
        let planningData = []
        if (wantsPlanning) {
          const res = await fetch('/api/generate-list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event_type: form.event_type,
              event_name: form.event_name,
              nb_participants: form.nb_participants,
              event_options: eventOptions,
              location: form.location,
              description: eventDescription,
              date: form.date,
              selected_lists: { planning: true },
            }),
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error || 'Génération impossible')
          planningData = data.planning || []
        }
        setGeneratedLists([])
        setPlanning(planningData)
        setMenuResume('')
        setActiveTab(0)
        setStep(3)
        setGenerating(false)
        return
      }

      const res = await fetch('/api/generate-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: form.event_type,
          event_name: form.event_name,
          nb_participants: form.nb_participants,
          event_options: eventOptions,
          location: form.location,
          description: eventDescription,
          date: form.date,
          selected_lists: selectedLists,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Génération impossible')
      setGeneratedLists(data.lists || [])
      setPlanning(data.planning || [])
      setMenuResume(data.menu_resume || '')
      setActiveTab(0)
      setStep(3)
    } catch (err) {
      alert('Erreur IA: ' + err.message)
    }
    setGenerating(false)
  }

  // ---- Édition des listes (étape 3) ----
  function updateItem(listIdx, itemIdx, field, value) {
    setGeneratedLists(prev => prev.map((l, li) =>
      li !== listIdx ? l : { ...l, items: l.items.map((it, ii) => ii !== itemIdx ? it : { ...it, [field]: value }) }
    ))
  }
  function deleteItem(listIdx, itemIdx) {
    setGeneratedLists(prev => prev.map((l, li) =>
      li !== listIdx ? l : { ...l, items: l.items.filter((_, ii) => ii !== itemIdx) }
    ))
  }
  function addItem(listIdx) {
    setGeneratedLists(prev => prev.map((l, li) =>
      li !== listIdx ? l : { ...l, items: [...(l.items || []), { item_name: '', category: 'Nourriture', quantity: 1, unit: '', estimated_price: 0 }] }
    ))
  }
  function deleteSlot(slotIdx) {
    setPlanning(prev => prev.filter((_, i) => i !== slotIdx))
  }

  // Liste "Matériel & Logistique" → comportement inversé (coché par défaut, on décoche)
  function isMaterielList(list) {
    return /mat[ée]riel|logistique/i.test(list?.list_name || '')
  }
  function toggleIncluded(listIdx, itemIdx) {
    setGeneratedLists(prev => prev.map((l, li) =>
      li !== listIdx ? l : { ...l, items: l.items.map((it, ii) => ii !== itemIdx ? it : { ...it, included: it.included === false }) }
    ))
  }

  // ---- Étape 3 : création réelle ----
  async function handleCreate() {
    setCreating(true)
    try {
      const supabase = getSupabase()

      // 1. Événement
      const { data: event, error } = await supabase
        .from('events')
        .insert({
          event_name: form.event_name,
          event_type: form.event_type,
          date: form.date,
          location: form.location || null,
          nb_participants: form.nb_participants,
          organizer_name: form.organizer_name,
          deadline_rsvp: form.deadline_rsvp || null,
          photo_url: photoUrl || null,
          mode: form.mode,
          event_options: { ...eventOptions, selected_lists: selectedLists, ...(menuResume ? { menu_resume: menuResume } : {}) },
        })
        .select()
        .single()
      if (error) throw error

      // 2. Listes + items (sautées en mode solo : aucun apport)
      for (let i = 0; form.mode !== 'solo' && i < generatedLists.length; i++) {
        const L = generatedLists[i]
        const { data: list, error: lErr } = await supabase
          .from('lists')
          .insert({
            event_id: event.id,
            behavior: L.behavior || 'apport',
            list_name: L.list_name || 'Liste',
            icon: L.icon || '📦',
            description: L.description || null,
            sort_order: i,
          })
          .select()
          .single()
        if (lErr) throw lErr

        const itemsToInsert = (L.items || [])
          .filter(it => (it.item_name || '').trim() && it.included !== false)
          .map(it => ({
            event_id: event.id,
            list_id: list.id,
            item_name: it.item_name,
            category: it.category || null,
            quantity: it.quantity ?? null,
            unit: it.unit || null,
            estimated_price: it.estimated_price ?? null,
            status: 'Disponible',
            ai_generated: true,
          }))
        if (itemsToInsert.length) {
          const { error: iErr } = await supabase.from('items').insert(itemsToInsert)
          if (iErr) throw iErr
        }
      }

      // 3. Planning → slots (heure absolue start_time "HH:MM" le jour de l'événement)
      if (planning.length > 0) {
        const dayPart = (form.date || '').slice(0, 10)
        const slotsToInsert = planning.map(p => {
          let slotDate
          if (p.start_time && dayPart) {
            slotDate = new Date(`${dayPart}T${p.start_time}`).toISOString()
          } else if (form.date) {
            // Repli : ancien format offset_hours, sinon heure de début de l'événement
            const base = new Date(form.date).getTime()
            slotDate = new Date(base + (Number(p.offset_hours) || 0) * 3600 * 1000).toISOString()
          } else {
            slotDate = new Date().toISOString()
          }
          return {
            event_id: event.id,
            slot_name: p.slot_name || 'Créneau',
            slot_date: slotDate,
            duration_minutes: p.duration_minutes || 60,
            max_participants: p.max_participants || 4,
          }
        })
        const { error: sErr } = await supabase.from('slots').insert(slotsToInsert)
        if (sErr) throw sErr
      }

      // 4. Redirection
      router.push(`/event/${event.id}`)
    } catch (err) {
      alert('Erreur création: ' + err.message)
      setCreating(false)
    }
  }

  const currentType = EVENT_TYPES.find(t => t.value === form.event_type) || EVENT_TYPES[0]
  const opts = OPTIONS_BY_TYPE[form.event_type] || {}

  // Onglets de l'étape 3 : une liste = un onglet, + Planning si présent
  const tabs = [
    ...generatedLists.map((l, i) => ({ id: i, label: `${l.icon || '📦'} ${l.list_name}` })),
    ...(planning.length > 0 ? [{ id: 'planning', label: '⏰ Planning' }] : []),
  ]

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <button
        onClick={() => (step === 1 ? router.push('/') : setStep(step - 1))}
        className="text-slate-400 hover:text-slate-600 mb-6 flex items-center gap-1"
      >
        ← Retour
      </button>

      {/* Barre de progression */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((n) => (
          <div key={n} className="flex items-center flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              step > n ? 'bg-emerald-500 text-white'
                : step === n ? 'bg-blue-500 text-white'
                : 'bg-slate-200 text-slate-400'
            }`}>
              {step > n ? '✓' : n}
            </div>
            {n < 3 && <div className={`flex-1 h-1 mx-1 rounded ${step > n ? 'bg-emerald-500' : 'bg-slate-200'}`} />}
          </div>
        ))}
      </div>

      {/* ───────── ÉTAPE 1 : type ───────── */}
      {step === 1 && (
        <>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Quel type d'événement ?</h1>
          <p className="text-slate-500 mb-6">Choisis pour démarrer</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {EVENT_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => chooseType(type.value)}
                className={`p-5 rounded-2xl border-2 text-center transition-all hover:scale-[1.03] ${type.bg} ${type.border}`}
              >
                <span className="text-3xl block mb-1">{type.icon}</span>
                <span className={`text-sm font-semibold block ${type.text}`}>{type.label}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* ───────── ÉTAPE 2 : détails + options ───────── */}
      {step === 2 && (
        <>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{currentType.icon}</span>
            <h1 className="text-2xl font-bold text-slate-900">{currentType.label}</h1>
          </div>
          <p className="text-slate-500 mb-6">Les détails de ton événement</p>

          <div className="space-y-4">
            {/* Mode d'organisation */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Comment veux-tu organiser ?</label>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => updateForm('mode', 'collaboratif')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    form.mode === 'collaboratif' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                  }`}>
                  <span className="text-2xl block mb-1">🤝</span>
                  <span className="text-sm font-semibold text-slate-800 block">Collaboratif</span>
                  <span className="text-xs text-slate-500">Chacun apporte quelque chose</span>
                </button>
                <button type="button" onClick={() => updateForm('mode', 'solo')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    form.mode === 'solo' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                  }`}>
                  <span className="text-2xl block mb-1">🎯</span>
                  <span className="text-sm font-semibold text-slate-800 block">J'organise tout</span>
                  <span className="text-xs text-slate-500">Les invités confirment juste leur venue</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nom de l'événement</label>
              <input type="text" value={form.event_name} onChange={(e) => updateForm('event_name', e.target.value)}
                placeholder="BBQ chez Thomas"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-slate-900" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-700">Description de l'événement</label>
                {speechSupported && (
                  <button type="button" onClick={toggleDictation}
                    className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                      listening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}>
                    🎤 {listening ? 'Écoute...' : 'Dicter'}
                  </button>
                )}
              </div>
              <textarea value={eventDescription} onChange={(e) => setEventDescription(e.target.value)} rows={3}
                placeholder="Décris ton événement : ambiance, thème, ce que tu prévois... L'IA s'en servira pour personnaliser les listes."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none resize-none text-slate-900 text-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ton prénom</label>
              <input type="text" value={form.organizer_name} onChange={(e) => updateForm('organizer_name', e.target.value)}
                placeholder="Thomas"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-slate-900" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date et heure</label>
              <input type="datetime-local" value={form.date} onChange={(e) => updateForm('date', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-slate-900" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Lieu</label>
              <input type="text" value={form.location} onChange={(e) => updateForm('location', e.target.value)}
                placeholder="Adresse ou lien Google Maps"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-slate-900" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Photo de l'événement (optionnel)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
              {photoUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-200">
                  <img src={photoUrl} alt="Aperçu" className="w-full h-44 object-cover" />
                  <button type="button" onClick={removePhoto}
                    className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors">
                    ✕ Retirer la photo
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto}
                  className="w-full flex flex-col items-center justify-center gap-1 py-6 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-500 transition-colors disabled:opacity-60">
                  {uploadingPhoto ? (
                    <span className="text-sm">⏳ Envoi de la photo...</span>
                  ) : (
                    <>
                      <span className="text-2xl">🖼️</span>
                      <span className="text-sm font-medium">Ajouter une photo</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nombre de personnes attendues : <span className="text-blue-500 font-bold">{form.nb_participants}</span>
              </label>
              <input type="range" min="2" max="200" value={form.nb_participants}
                onChange={(e) => updateForm('nb_participants', parseInt(e.target.value))}
                className="w-full accent-blue-500" />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>2</span><span>50</span><span>100</span><span>200</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date limite de réponse (optionnel)</label>
              <input type="datetime-local" value={form.deadline_rsvp} onChange={(e) => updateForm('deadline_rsvp', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-slate-900" />
            </div>

            {/* Options spécifiques au type */}
            {(opts.fields?.length || opts.checks?.length || opts.textarea) && (
              <div className={`rounded-2xl p-4 border-2 ${currentType.bg} ${currentType.border}`}>
                <p className={`text-sm font-semibold mb-3 ${currentType.text}`}>Options {currentType.label}</p>

                {opts.fields?.map((f) => (
                  <div key={f.key} className="mb-3">
                    <label className="block text-xs font-medium text-slate-600 mb-1">{f.label}</label>
                    <input type="text" value={eventOptions[f.key] || ''} placeholder={f.placeholder || ''}
                      onChange={(e) => updateOption(f.key, e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-400 outline-none text-sm bg-white" />
                  </div>
                ))}

                {opts.checks?.map((c) => (
                  <label key={c.key} className="flex items-center gap-2 py-1.5 cursor-pointer">
                    <input type="checkbox" checked={!!eventOptions[c.key]}
                      onChange={(e) => updateOption(c.key, e.target.checked)}
                      className="w-4 h-4 accent-blue-500" />
                    <span className="text-sm text-slate-700">{c.label}</span>
                  </label>
                ))}

                {opts.conditionals?.map((c) => (
                  eventOptions[c.showIf] ? (
                    <div key={c.key} className="mt-2 ml-6">
                      <input type="text" value={eventOptions[c.key] || ''} placeholder={c.placeholder || c.label}
                        onChange={(e) => updateOption(c.key, e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-400 outline-none text-sm bg-white" />
                    </div>
                  ) : null
                ))}

                {opts.textarea && (
                  <textarea value={eventOptions[opts.textarea.key] || ''} rows={3}
                    placeholder={opts.textarea.label}
                    onChange={(e) => updateOption(opts.textarea.key, e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-400 outline-none text-sm resize-none bg-white" />
                )}
              </div>
            )}

            {/* Listes à la carte (collaboratif uniquement) */}
            {form.mode !== 'solo' && (
              <div className="rounded-2xl p-4 border border-slate-200 bg-white">
                <p className="text-sm font-semibold text-slate-700 mb-1">Que veux-tu dans ton invitation ?</p>
                <p className="text-xs text-slate-400 mb-3">L'IA générera uniquement les listes cochées</p>
                <div className="space-y-1">
                  {LIST_CHOICES.map((c) => (
                    <label key={c.key} className="flex items-center gap-2 py-1.5 cursor-pointer">
                      <input type="checkbox" checked={!!selectedLists[c.key]}
                        onChange={() => toggleList(c.key)}
                        className="w-4 h-4 accent-blue-500" />
                      <span className="text-sm text-slate-700">{c.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setStep(1)}
                className="px-5 py-4 rounded-2xl border-2 border-slate-200 text-slate-600 font-semibold hover:border-slate-300 transition-colors">
                Retour
              </button>
              <button type="button" onClick={handleGenerate} disabled={generating}
                className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold py-4 rounded-2xl transition-colors text-lg">
                {generating ? '✨ Génération IA...' : 'Suivant →'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ───────── ÉTAPE 3 : listes générées ───────── */}
      {step === 3 && (
        <>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Listes générées</h1>
          <p className="text-slate-500 mb-5">Ajuste, supprime ou ajoute avant de créer</p>

          {tabs.length === 0 && (
            <p className="text-slate-400 text-sm mb-4">Aucune liste générée. Tu peux quand même créer l'événement.</p>
          )}

          {/* Onglets scrollables */}
          {tabs.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1">
              {tabs.map((t) => (
                <button key={String(t.id)} onClick={() => setActiveTab(t.id)}
                  className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === t.id ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>
          )}

          {/* Contenu : liste d'items */}
          {typeof activeTab === 'number' && generatedLists[activeTab] && (() => {
            const materiel = isMaterielList(generatedLists[activeTab])
            return (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                {materiel ? (
                  <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-3">
                    Décoche ce que tu fournis toi-même ou qui n'est pas nécessaire
                  </p>
                ) : generatedLists[activeTab].description && (
                  <p className="text-xs text-slate-400 mb-3">{generatedLists[activeTab].description}</p>
                )}
                <div className="space-y-2">
                  {(generatedLists[activeTab].items || []).map((it, ii) => {
                    const included = it.included !== false
                    return (
                      <div key={ii} className={`flex items-center gap-2 ${materiel && !included ? 'opacity-40' : ''}`}>
                        {materiel && (
                          <input type="checkbox" checked={included} onChange={() => toggleIncluded(activeTab, ii)}
                            className="shrink-0 w-5 h-5 accent-emerald-500" />
                        )}
                        <input value={it.item_name} onChange={(e) => updateItem(activeTab, ii, 'item_name', e.target.value)}
                          placeholder="Article"
                          className="flex-1 min-w-0 px-2 py-2 rounded-lg border border-slate-200 focus:border-blue-400 outline-none text-sm" />
                        <input type="number" value={it.quantity ?? ''} onChange={(e) => updateItem(activeTab, ii, 'quantity', e.target.value === '' ? null : Number(e.target.value))}
                          className="w-14 px-2 py-2 rounded-lg border border-slate-200 focus:border-blue-400 outline-none text-sm text-center" />
                        <input value={it.unit || ''} onChange={(e) => updateItem(activeTab, ii, 'unit', e.target.value)}
                          placeholder="u."
                          className="w-14 px-2 py-2 rounded-lg border border-slate-200 focus:border-blue-400 outline-none text-sm" />
                        {!materiel && (
                          <button onClick={() => deleteItem(activeTab, ii)}
                            className="shrink-0 w-8 h-8 rounded-lg text-red-400 hover:bg-red-50 transition-colors">✕</button>
                        )}
                      </div>
                    )
                  })}
                </div>
                <button onClick={() => addItem(activeTab)}
                  className="mt-3 w-full py-2 rounded-lg border-2 border-dashed border-slate-200 text-slate-400 text-sm hover:border-blue-300 hover:text-blue-500 transition-colors">
                  + Ajouter un article
                </button>
              </div>
            )
          })()}

          {/* Contenu : planning */}
          {activeTab === 'planning' && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-2">
              {planning.map((p, i) => (
                <div key={i} className="flex items-start justify-between gap-2 py-2 border-b border-slate-50 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700">{p.slot_name}</p>
                    {p.description && <p className="text-xs text-slate-400">{p.description}</p>}
                    <p className="text-xs text-slate-400 mt-0.5">
                      {p.start_time ? `🕒 ${p.start_time}` : (Number(p.offset_hours) >= 0 ? '+' : '') + (p.offset_hours || 0) + 'h'} · {p.duration_minutes || 60} min · {p.max_participants || 4} pers.
                    </p>
                  </div>
                  <button onClick={() => deleteSlot(i)} className="shrink-0 w-8 h-8 rounded-lg text-red-400 hover:bg-red-50 transition-colors">✕</button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 pt-5">
            <button type="button" onClick={() => setStep(2)}
              className="px-5 py-4 rounded-2xl border-2 border-slate-200 text-slate-600 font-semibold hover:border-slate-300 transition-colors">
              Retour
            </button>
            <button type="button" onClick={handleCreate} disabled={creating}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-semibold py-4 rounded-2xl transition-colors text-lg">
              {creating ? '⏳ Création...' : '✅ Valider et créer l\'événement'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
