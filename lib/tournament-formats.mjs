// Formats de jeu proposés selon le sport, à la création d'un tournoi.
// Principe : on choisit d'abord le sport, puis Planify propose les formats qui existent pour ce sport
// (doublette / triplette, foot à 5 / à 7…), le mot juste pour l'aire de jeu (terrain, piste, table)
// et la façon de former les équipes la plus courante. L'organisateur peut tout changer.

const fold = value => String(value || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

// versus : true si les participants s'affrontent (grille de rencontres possible).
// place : [singulier, pluriel] du lieu de jeu.
// defaultFormat : 'melee' (équipes remélangées à chaque partie) ou 'equipes' (équipes formées une fois).
export const SPORT_FORMATS = [
  { key: 'petanque', label: 'Pétanque', emoji: '🎯', aliases: ['petanque', 'boules', 'boulodrome'], versus: true, place: ['terrain', 'terrains'], defaultFormat: 'melee',
    sizes: [{ n: 1, label: 'Tête-à-tête' }, { n: 2, label: 'Doublette' }, { n: 3, label: 'Triplette' }], defaultSize: 2 },
  { key: 'padel', label: 'Padel', emoji: '🎾', aliases: ['padel'], versus: true, place: ['terrain', 'terrains'], defaultFormat: 'melee',
    sizes: [{ n: 2, label: 'En double' }], defaultSize: 2 },
  { key: 'tennis', label: 'Tennis', emoji: '🎾', aliases: ['tennis'], versus: true, place: ['court', 'courts'], defaultFormat: 'equipes',
    sizes: [{ n: 1, label: 'Simple' }, { n: 2, label: 'Double' }], defaultSize: 1 },
  { key: 'badminton', label: 'Badminton', emoji: '🏸', aliases: ['badminton', 'bad'], versus: true, place: ['terrain', 'terrains'], defaultFormat: 'equipes',
    sizes: [{ n: 1, label: 'Simple' }, { n: 2, label: 'Double' }], defaultSize: 1 },
  { key: 'tennis_table', label: 'Ping-pong', emoji: '🏓', aliases: ['ping pong', 'ping-pong', 'tennis de table'], versus: true, place: ['table', 'tables'], defaultFormat: 'equipes',
    sizes: [{ n: 1, label: 'Simple' }, { n: 2, label: 'Double' }], defaultSize: 1 },
  { key: 'football', label: 'Football', emoji: '⚽', aliases: ['football', 'foot', 'soccer', 'five'], versus: true, place: ['terrain', 'terrains'], defaultFormat: 'equipes',
    sizes: [{ n: 5, label: 'Foot à 5' }, { n: 7, label: 'Foot à 7' }, { n: 11, label: 'Foot à 11' }], defaultSize: 5 },
  { key: 'futsal', label: 'Futsal', emoji: '⚽', aliases: ['futsal'], versus: true, place: ['terrain', 'terrains'], defaultFormat: 'equipes',
    sizes: [{ n: 5, label: 'À 5' }], defaultSize: 5 },
  { key: 'basket', label: 'Basket', emoji: '🏀', aliases: ['basket', 'basketball', '3x3'], versus: true, place: ['terrain', 'terrains'], defaultFormat: 'equipes',
    sizes: [{ n: 3, label: '3 contre 3' }, { n: 5, label: '5 contre 5' }], defaultSize: 3 },
  { key: 'volley', label: 'Volley', emoji: '🏐', aliases: ['volley', 'volleyball', 'volley-ball'], versus: true, place: ['terrain', 'terrains'], defaultFormat: 'equipes',
    sizes: [{ n: 4, label: '4 contre 4' }, { n: 6, label: '6 contre 6' }], defaultSize: 4 },
  { key: 'beach_volley', label: 'Beach-volley', emoji: '🏐', aliases: ['beach', 'beach volley', 'beach-volley'], versus: true, place: ['terrain', 'terrains'], defaultFormat: 'melee',
    sizes: [{ n: 2, label: '2 contre 2' }, { n: 4, label: '4 contre 4' }], defaultSize: 2 },
  { key: 'handball', label: 'Handball', emoji: '🤾', aliases: ['handball', 'hand'], versus: true, place: ['terrain', 'terrains'], defaultFormat: 'equipes',
    sizes: [{ n: 5, label: 'À 5' }, { n: 7, label: 'À 7' }], defaultSize: 7 },
  { key: 'molkky', label: 'Mölkky', emoji: '🪵', aliases: ['molkky', 'mölkky'], versus: true, place: ['terrain', 'terrains'], defaultFormat: 'melee',
    sizes: [{ n: 1, label: 'Individuel' }, { n: 2, label: 'Équipes de 2' }, { n: 3, label: 'Équipes de 3' }], defaultSize: 2 },
  { key: 'echecs', label: 'Échecs', emoji: '♟️', aliases: ['echecs', 'echec'], versus: true, place: ['table', 'tables'], defaultFormat: 'equipes',
    sizes: [{ n: 1, label: 'Un contre un' }], defaultSize: 1 },
  { key: 'cartes', label: 'Belote / cartes', emoji: '🃏', aliases: ['belote', 'tarot', 'cartes', 'coinche', 'poker'], versus: true, place: ['table', 'tables'], defaultFormat: 'melee',
    sizes: [{ n: 2, label: 'Par 2 (belote)' }, { n: 1, label: 'Chacun pour soi' }], defaultSize: 2 },
  { key: 'esport', label: 'Jeux vidéo', emoji: '🎮', aliases: ['jeux video', 'jeu video', 'esport', 'e-sport', 'fifa', 'mario kart'], versus: true, place: ['console', 'consoles'], defaultFormat: 'equipes',
    sizes: [{ n: 1, label: 'Un contre un' }, { n: 2, label: '2 contre 2' }], defaultSize: 1 },
]

export const OTHER_SPORT = { key: 'autre', label: 'Autre sport', emoji: '🏅', versus: true, place: ['terrain', 'terrains'], defaultFormat: 'melee', sizes: [], defaultSize: 2 }

// Retrouve le format d'un sport saisi librement (« foot », « Pétanque », « belote »…).
export function findSportFormat(text) {
  const value = fold(text)
  if (!value) return null
  let best = null
  for (const sport of SPORT_FORMATS) {
    for (const alias of [sport.label, ...sport.aliases]) {
      const a = fold(alias)
      if (value === a || new RegExp(`(^|[^a-z])${a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z]|$)`).test(value)) {
        if (!best || a.length > best.length) best = { sport, length: a.length }
      }
    }
  }
  return best ? best.sport : null
}

// Mot du lieu de jeu pour un nombre donné : « 1 terrain », « 3 tables ».
export function placeWord(place = ['terrain', 'terrains'], count = 2) {
  return Number(count) > 1 ? place[1] : place[0]
}

// Libellés des deux façons de jouer, adaptés aux sports individuels.
export function formatChoices(teamSize) {
  const solo = Number(teamSize) === 1
  return [
    { value: 'melee', title: solo ? 'Un adversaire différent à chaque tour' : 'Équipes tirées au sort à chaque partie', hint: solo ? 'Tout le monde joue à chaque tour, sans élimination.' : 'Tout le monde joue avec tout le monde : idéal entre amis.' },
    { value: 'equipes', title: solo ? 'Championnat : chacun affronte tous les autres' : 'Équipes formées une fois pour toute la journée', hint: solo ? 'Le plus juste, mais plus long avec beaucoup de joueurs.' : 'Chaque équipe affronte toutes les autres.' },
    { value: 'none', title: 'Je ne sais pas encore', hint: 'Tu pourras décider plus tard depuis ton tableau.' },
  ]
}
