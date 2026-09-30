// Habillage visuel par type d'événement (maquette docs/maquettes, validée le 29/09/2026).
// Affichage uniquement : aucune logique métier. Les classes sont écrites en entier pour Tailwind.
const THEMES = {
  repas: {
    hero: 'bg-gradient-to-br from-orange-100 via-orange-200 to-orange-300',
    button: 'bg-orange-700 hover:bg-orange-800',
    selected: 'border-orange-600 bg-orange-50',
    check: 'accent-orange-700',
    link: 'text-orange-800',
  },
  fete: {
    hero: 'bg-gradient-to-br from-rose-100 via-rose-200 to-rose-300',
    button: 'bg-rose-700 hover:bg-rose-800',
    selected: 'border-rose-600 bg-rose-50',
    check: 'accent-rose-700',
    link: 'text-rose-800',
  },
  sortie: {
    hero: 'bg-gradient-to-br from-teal-100 via-teal-200 to-teal-300',
    button: 'bg-teal-700 hover:bg-teal-800',
    selected: 'border-teal-600 bg-teal-50',
    check: 'accent-teal-700',
    link: 'text-teal-800',
  },
  match: {
    hero: 'bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300',
    button: 'bg-blue-700 hover:bg-blue-800',
    selected: 'border-blue-600 bg-blue-50',
    check: 'accent-blue-700',
    link: 'text-blue-800',
  },
  autre: {
    hero: 'bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300',
    button: 'bg-slate-800 hover:bg-slate-900',
    selected: 'border-slate-600 bg-slate-50',
    check: 'accent-slate-700',
    link: 'text-slate-800',
  },
}

// Types internes inchangés -> catégories validées (PR #9).
const CATEGORY_BY_TYPE = {
  BBQ: 'repas', Apero: 'repas',
  Anniversaire: 'fete', 'Soirée': 'fete',
  'Randonnée': 'sortie',
  'Match/Tournoi': 'match',
}

const EMOJI_BY_TYPE = { BBQ: '🔥', Apero: '🥂', Anniversaire: '🎂', 'Soirée': '🎉', 'Randonnée': '🧭', 'Match/Tournoi': '🏆' }

export function eventTheme(eventType) {
  return { ...THEMES[CATEGORY_BY_TYPE[eventType] || 'autre'], emoji: EMOJI_BY_TYPE[eventType] || '✨' }
}

// Affiche une quantité lisible (« 0,2 » au lieu de « 0.19999999999999996 »). La valeur stockée ne change pas.
export function formatQuantity(value) {
  if (value == null || value === '') return 'À préciser'
  const n = Number(value)
  if (!Number.isFinite(n)) return String(value)
  return n.toLocaleString('fr-FR', { maximumFractionDigits: 2 })
}
