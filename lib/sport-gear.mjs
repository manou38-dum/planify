// Matériel d'un tournoi selon le sport, en mode gratuit (sans IA) :
// - « Matériel de chacun » : liste à cocher par chaque joueur (behavior 'checklist') ;
// - « Matériel commun » : ce qu'il faut pour les terrains, réparti entre les participants (behavior 'apport').
// Quantités simples et arrondies, calculées selon le nombre de terrains/tables : à ajuster par l'organisateur.
import { findSportFormat, placeWord } from './tournament-formats.mjs'

const P = (item_name, essential = true) => ({ item_name, essential })

const PERSONNEL = {
  petanque: [P('Jeu de boules'), P('Gourde d’eau'), P('Casquette ou chapeau', false), P('Chiffon pour les boules', false)],
  padel: [P('Raquette de padel'), P('Chaussures de sport adaptées (padel ou multisport)'), P('Tenue de sport'), P('Gourde d’eau'), P('Serviette', false)],
  tennis: [P('Raquette de tennis'), P('Chaussures de tennis'), P('Tenue de sport'), P('Gourde d’eau'), P('Casquette', false), P('Serviette', false)],
  badminton: [P('Raquette de badminton'), P('Chaussures de salle'), P('Tenue de sport'), P('Gourde d’eau')],
  tennis_table: [P('Raquette de ping-pong'), P('Chaussures de salle'), P('Tenue de sport'), P('Gourde d’eau')],
  football: [P('Chaussures adaptées au terrain (crampons ou salle)'), P('Protège-tibias'), P('Tenue de sport'), P('Gourde d’eau'), P('Maillot ou couleur de son équipe', false)],
  futsal: [P('Chaussures de salle'), P('Protège-tibias'), P('Tenue de sport'), P('Gourde d’eau')],
  basket: [P('Chaussures de salle'), P('Tenue de sport'), P('Gourde d’eau')],
  volley: [P('Chaussures de salle'), P('Tenue de sport'), P('Gourde d’eau'), P('Genouillères', false)],
  beach_volley: [P('Tenue légère ou maillot'), P('Crème solaire'), P('Gourde d’eau'), P('Casquette ou lunettes de soleil', false)],
  handball: [P('Chaussures de salle'), P('Tenue de sport'), P('Gourde d’eau')],
  molkky: [P('Gourde d’eau'), P('Casquette ou chapeau', false), P('Crème solaire', false)],
  echecs: [P('Stylo pour noter ses parties', false), P('Gourde d’eau', false)],
  cartes: [],
  esport: [P('Sa manette, si on joue sur console'), P('Casque audio', false)],
  autre: [P('Tenue de sport'), P('Chaussures adaptées'), P('Gourde d’eau')],
}

// c = nombre de terrains/tables ; chaque ligne : [nom, quantité, unité]
const COMMUN = {
  petanque: c => [['Cochonnets (un par terrain + réserve)', c + 1, 'unités'], ['Mètres ou ficelles pour mesurer', c, 'unités'], ['Feuilles de score et stylos', 1, 'lot'], ['Trousse de secours', 1, 'unité']],
  padel: c => [['Tubes de balles de padel', c * 2, 'tubes'], ['Feuilles de score et stylos', 1, 'lot'], ['Trousse de secours', 1, 'unité']],
  tennis: c => [['Tubes de balles de tennis', c * 2, 'tubes'], ['Feuilles de score et stylos', 1, 'lot'], ['Trousse de secours', 1, 'unité']],
  badminton: c => [['Tubes de volants', c * 2, 'tubes'], ['Filets et poteaux (si la salle n’en fournit pas)', c, 'unités'], ['Trousse de secours', 1, 'unité']],
  tennis_table: c => [['Boîtes de balles de ping-pong', c, 'boîtes'], ['Filets de table (si non fournis)', c, 'unités'], ['Trousse de secours', 1, 'unité']],
  football: c => [['Ballons', c + 1, 'unités'], ['Jeux de chasubles', c, 'jeux'], ['Sifflets', c, 'unités'], ['Plots', 1, 'lot'], ['Pompe à ballon', 1, 'unité'], ['Feuilles de match et stylos', 1, 'lot'], ['Trousse de secours', 1, 'unité']],
  futsal: c => [['Ballons de futsal', c + 1, 'unités'], ['Jeux de chasubles', c, 'jeux'], ['Sifflets', c, 'unités'], ['Trousse de secours', 1, 'unité']],
  basket: c => [['Ballons de basket', c + 1, 'unités'], ['Jeux de chasubles', c, 'jeux'], ['Sifflets', c, 'unités'], ['Chronomètres', c, 'unités'], ['Trousse de secours', 1, 'unité']],
  volley: c => [['Ballons de volley', c + 1, 'unités'], ['Filets et poteaux (si non fournis)', c, 'unités'], ['Sifflets', c, 'unités'], ['Trousse de secours', 1, 'unité']],
  beach_volley: c => [['Ballons de beach-volley', c + 1, 'unités'], ['Filets et poteaux (si non fournis)', c, 'unités'], ['Ombrelle ou tonnelle', 1, 'unité'], ['Trousse de secours', 1, 'unité']],
  handball: c => [['Ballons de handball', c + 1, 'unités'], ['Jeux de chasubles', c, 'jeux'], ['Sifflets', c, 'unités'], ['Trousse de secours', 1, 'unité']],
  molkky: c => [['Jeux de mölkky', c, 'jeux'], ['Feuilles de score et stylos', 1, 'lot'], ['Trousse de secours', 1, 'unité']],
  echecs: c => [['Jeux d’échecs', c, 'jeux'], ['Pendules', c, 'unités'], ['Feuilles de notation', 1, 'lot']],
  cartes: c => [['Jeux de cartes', c, 'jeux'], ['Feuilles de score et stylos', c, 'lots'], ['Tapis de cartes', c, 'unités']],
  esport: c => [['Consoles ou PC avec le jeu installé', c, 'unités'], ['Écrans', c, 'unités'], ['Manettes de réserve', c, 'unités'], ['Multiprises', c, 'unités']],
  autre: () => [['Matériel de jeu (à préciser)', 1, 'lot'], ['Feuilles de score et stylos', 1, 'lot'], ['Trousse de secours', 1, 'unité']],
}

const keyFor = sport => findSportFormat(sport)?.key || 'autre'

export function personalGearList(sport) {
  const key = keyFor(sport)
  const items = PERSONNEL[key] || PERSONNEL.autre
  if (!items.length) return null
  return {
    behavior: 'checklist',
    list_name: 'Matériel de chacun',
    icon: '🎒',
    description: 'Chaque joueur coche ce qu’il a. Tu vois avant le jour J qui n’est pas encore équipé.',
    items: items.map(it => ({ item_name: it.item_name, quantity: 1, essential: it.essential })),
  }
}

export function sharedGearList(sport, courts = 1) {
  const key = keyFor(sport)
  const c = Math.max(1, Math.min(50, Math.round(Number(courts) || 1)))
  const rows = (COMMUN[key] || COMMUN.autre)(c)
  return {
    behavior: 'apport',
    list_name: 'Matériel commun à apporter',
    icon: '🏷️',
    description: `Pour ${c} ${placeWord(findSportFormat(sport)?.place, c)} : chacun réserve ce qu’il peut apporter. Vérifie ce que le lieu fournit déjà.`,
    items: rows.map(([item_name, quantity, unit]) => ({ item_name, quantity, unit, category: 'Matériel' })),
  }
}
