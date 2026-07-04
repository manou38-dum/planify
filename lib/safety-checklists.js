// Checklists de sécurité FIXES (en dur) pour les activités de plein air à risque.
// Objectif : ne PAS laisser l'IA générer ce matériel critique (elle peut oublier un élément vital).
// Seules ces activités sont couvertes en dur ; les autres (plongée, parapente...) restent générées par l'IA.

export const SAFETY_CHECKLISTS = {
  rando: {
    label: 'Équipement & sécurité — Randonnée',
    items: [
      { item_name: 'Eau (1,5 L minimum)', essential: true },
      { item_name: 'Chaussures de randonnée', essential: true },
      { item_name: 'Veste imperméable / coupe-vent', essential: true },
      { item_name: 'Trousse de secours', essential: true },
      { item_name: 'En-cas énergétiques', essential: false },
      { item_name: 'Carte / GPS ou trace', essential: false },
      { item_name: 'Téléphone chargé', essential: true },
      { item_name: 'Crème solaire', essential: false },
      { item_name: 'Couverture de survie', essential: false },
      { item_name: 'Lampe frontale', essential: false },
    ],
  },
  vtt: {
    label: 'Équipement & sécurité — VTT',
    items: [
      { item_name: 'Casque', essential: true },
      { item_name: 'Vélo révisé (freins, pneus)', essential: true },
      { item_name: 'Chambre à air de rechange', essential: true },
      { item_name: 'Pompe', essential: false },
      { item_name: 'Kit de réparation / démonte-pneus', essential: false },
      { item_name: 'Multi-outils', essential: false },
      { item_name: 'Eau', essential: true },
      { item_name: 'Gants', essential: false },
      { item_name: 'Coupe-vent', essential: false },
      { item_name: 'Téléphone chargé', essential: true },
      { item_name: 'Trousse de secours', essential: false },
    ],
  },
  'ski-rando': {
    label: 'Équipement & sécurité — Ski de rando',
    warning: '⚠️ Le trio DVA + pelle + sonde est vital et obligatoire pour toute sortie hors-piste. Ne partez jamais sans.',
    items: [
      { item_name: 'DVA (détecteur de victimes d\'avalanche)', essential: true },
      { item_name: 'Pelle', essential: true },
      { item_name: 'Sonde', essential: true },
      { item_name: 'Peaux de phoque', essential: true },
      { item_name: 'Couteaux', essential: false },
      { item_name: 'Casque', essential: true },
      { item_name: 'Veste imperméable', essential: true },
      { item_name: 'Couches chaudes', essential: true },
      { item_name: 'Lunettes / masque', essential: false },
      { item_name: 'Eau + en-cas', essential: false },
      { item_name: 'Couverture de survie', essential: false },
      { item_name: 'Téléphone chargé', essential: true },
      { item_name: 'Carte / topo', essential: false },
    ],
  },
}

// Fait correspondre le texte libre "activite" saisi par l'organisateur à une clé de checklist fixe.
// Insensible à la casse et aux accents. Renvoie 'rando' | 'vtt' | 'ski-rando' | null.
export function matchActivity(texte) {
  const t = (texte || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // retire les accents
    .trim()
  if (!t) return null

  // Ski de rando EN PREMIER (car "rando à ski" / "ski de rando" contiennent aussi "rando")
  if (/ski\s*-?\s*(de\s+)?rando/.test(t) || /rando\s+a\s+ski/.test(t)) return 'ski-rando'
  if (/\bvtt\b/.test(t) || /velo/.test(t) || /\bbike\b/.test(t)) return 'vtt'
  if (/rando/.test(t) || /marche/.test(t) || /trek/.test(t) || /balade/.test(t) || /hike/.test(t)) return 'rando'

  return null
}
