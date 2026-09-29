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
  'ski-fond': {
    label: 'Équipement — Ski de fond',
    description: 'Repères à adapter à la météo, au parcours et au style classique ou skating.',
    items: [
      { item_name: 'Skis de fond adaptés au parcours et à la pratique', essential: true },
      { item_name: 'Chaussures et fixations compatibles avec les skis', essential: true },
      { item_name: 'Bâtons adaptés à la pratique', essential: true },
      { item_name: 'Vêtements respirants en plusieurs couches', essential: true },
      { item_name: 'Gants et tour de cou ou bonnet léger', essential: true },
      { item_name: 'Lunettes de soleil et protection solaire', essential: false },
      { item_name: 'Eau et encas', essential: true },
      { item_name: 'Téléphone chargé et itinéraire partagé', essential: true },
      { item_name: 'Vêtements secs pour l’après-sortie', essential: false },
    ],
  },
  plongee: {
    label: 'À vérifier avec le club — Plongée',
    warning: '⚠️ Cette liste ne valide pas la sécurité d’une plongée. Confirme le matériel, les contrôles, les niveaux et les consignes avec le club ou l’encadrant. Le matériel technique doit être fourni ou vérifié par les personnes compétentes.',
    items: [
      { item_name: 'Maillot de bain', essential: false },
      { item_name: 'Serviette et vêtements secs', essential: false },
      { item_name: 'Masque, palmes et tuba (si demandés par le club)', essential: false },
      { item_name: 'Combinaison adaptée au site (à confirmer avec le club)', essential: false },
      { item_name: 'Eau potable et protection contre le soleil ou le froid', essential: false },
      { item_name: 'Carnet, certification et documents demandés par le club', essential: false },
      { item_name: 'Matériel technique : confirmer la prise en charge avec le club', essential: false },
    ],
  },
  'sortie-generique': {
    label: 'Repères — Sortie de plein air',
    warning: 'Adapte cette liste à l’activité, aux conditions et au niveau du groupe. Pour une activité encadrée ou à risque, suis les consignes de l’organisateur ou du professionnel.',
    items: [
      { item_name: 'Eau et encas adaptés à la durée', essential: true },
      { item_name: 'Vêtements adaptés à la météo, avec une couche chaude et imperméable', essential: true },
      { item_name: 'Chaussures adaptées au terrain', essential: true },
      { item_name: 'Téléphone chargé et itinéraire / point de rendez-vous partagé', essential: true },
      { item_name: 'Protection solaire selon les conditions', essential: false },
      { item_name: 'Trousse de premiers secours du groupe', essential: false },
      { item_name: 'Vêtements secs pour l’après-sortie', essential: false },
    ],
  },
}

// Fait correspondre le texte libre "activite" saisi par l'organisateur à une clé de checklist fixe.
// Insensible à la casse et aux accents. Renvoie une checklist connue ou la checklist plein air générique.
export function matchActivity(texte) {
  const t = (texte || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // retire les accents
    .trim()
  if (!t) return null

  // Ski de rando EN PREMIER (car "rando à ski" / "ski de rando" contiennent aussi "rando")
  if (/ski\s*-?\s*(de\s+)?rando/.test(t) || /rando\s+a\s+ski/.test(t)) return 'ski-rando'
  if (/ski\s*(de\s*)?fond|ski\s*nordique|ski\s*classique|skating/.test(t)) return 'ski-fond'
  if (/plongee|bapteme\s+de\s+plongee|randonnee\s+palmee|\bpalmee\b/.test(t)) return 'plongee'
  if (/\bvtt\b/.test(t) || /velo/.test(t) || /\bbike\b/.test(t)) return 'vtt'
  if (/rando/.test(t) || /marche/.test(t) || /trek/.test(t) || /balade/.test(t) || /hike/.test(t)) return 'rando'

  return 'sortie-generique'
}
