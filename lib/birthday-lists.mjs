const fold = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
export function safeGiftUrl(value) {
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : '' } catch { return '' }
}
export const giftSearchUrl = name => 'https://www.google.com/search?tbm=shop&gl=fr&hl=fr&q=' + encodeURIComponent(name)

export function birthdayLists(keys, count, options = {}) {
  const n = Math.max(1, Math.min(10000, Number(count) || 1))
  const age = Number.parseInt(options.age, 10)
  const child = options.anniv_type === 'enfant' || (!options.anniv_type && Number.isFinite(age) && age < 18)
  const interests = String(options.centres_interet || '').trim()
  const theme = options.theme ? String(options.theme_detail || '').trim() : ''
  const context = fold(interests + ' ' + theme)
  const ideas = []
  const add = (...gifts) => ideas.push(...gifts.map(([item_name, estimated_price]) => ({ item_name, estimated_price })))
  if (/cuisin|patis|chocolat/.test(context)) add(child ? ['Kit de pâtisserie avec accessoires', 25] : ['Atelier de pâtisserie à choisir ensemble', 55], ['Livre de recettes illustré', 25])
  if (/sport|foot|basket|velo|rando/.test(context)) add(['Gourde isotherme pour le sport', 25], child ? ['Ballon adapté à son sport préféré', 25] : ['Sac de sport ou de week-end', 45])
  if (/dessin|art|creatif|peinture/.test(context)) add(['Coffret de dessin complet', 30], ['Carnet créatif et beaux crayons', 20])
  if (/musiqu|guitare|piano/.test(context)) add(child ? ['Livre musical adapté à son âge', 20] : ['Place de concert à choisir ensemble', 50], ['Casque audio ou enceinte compacte', 45])
  if (/scien|espace|dinos|nature|animaux/.test(context)) add(['Livre illustré sur ' + (theme || interests), 25], child ? ['Kit d’exploration ou expérience scientifique', 30] : ['Sortie nature ou visite à offrir', 35])
  if (/jeu|gaming|video/.test(context)) add(['Jeu de société à partager', 30], child ? ['Jeu de construction ou puzzle illustré', 25] : ['Carte cadeau pour jeu vidéo ou accessoire compatible', 35])
  if (/voyage|voyages|week.end|escapade/.test(context)) add(['Guide de voyage ou carnet de route', 25], ['Participation à une escapade à choisir', 50])
  if (/lecture|livre|roman|bd|manga/.test(context)) add(['Librairie : sélection de livres à choisir', 30], ['Belle édition de son livre ou manga préféré', 25])
  if (/princesse|super.?heros|pirate|licorne/.test(context)) add(['Livre d’aventures sur le thème ' + (theme || interests), 20], ['Jeu ou puzzle sur le thème ' + (theme || interests), 25])
  if (interests && !ideas.length) add(['Livre ou beau livre autour de ' + interests, 30], ['Coffret découverte autour de ' + interests, 35])
  if (theme && ideas.length < 5) add(['Découverte ou activité sur le thème ' + theme, 35])
  if (child && age < 3) {
    ideas.splice(0, ideas.length)
    add(['Livre cartonné à toucher', 15], ['Jouet d’éveil adapté à l’âge', 30], ['Peluche douce', 25], ['Boîte à musique ou livre de comptines', 25], ['Jeu de bain ou de manipulation', 20], ['Vêtement ou pyjama de qualité', 25])
  } else if (child) {
    add(['Jeu de société adapté à son âge', 25], ['Coffret de loisirs créatifs', 25], ['Puzzle ou jeu de construction', 30], ['Livre illustré à choisir', 20], ['Expérience à partager en famille', 40])
  } else {
    add(['Jeu de société à partager', 35], ['Album photo à personnaliser', 30], ['Atelier créatif à choisir ensemble', 50], ['Objet utile selon ses goûts', 40], ['Expérience à vivre avec ses proches', 60])
  }
  const suffix = child && Number.isFinite(age) ? ' — ' + age + ' ans' : ''
  const seen = new Set()
  const gifts = ideas.filter(gift => !seen.has(gift.item_name) && seen.add(gift.item_name)).slice(0, 8).map(gift => ({ ...gift, item_name: gift.item_name + suffix, quantity: 1, unit: 'cadeau', category: gift.estimated_price <= 25 ? 'Petite attention' : gift.estimated_price <= 45 ? 'Belle idée' : 'Cadeau commun' }))
  const lists = []
  if (keys.includes('cadeaux')) lists.push({ list_name: 'Ses envies cadeaux' + (options.pour_qui ? ' : ' + options.pour_qui : ''), icon: '🎁', behavior: 'cadeau', description: 'Des envies à garder, modifier ou remplacer. Le prix est indicatif : les invités réservent une idée puis l’achètent où ils veulent. Tu peux ajouter un lien externe à une envie précise si tu en as un.', items: gifts })
  const item = (item_name, quantity, unit, category) => ({ item_name, quantity, unit, category })
  if (!child && keys.includes('menu')) lists.push({ list_name:'Buffet anniversaire',icon:'🎂',behavior:'apport',description:'Base de buffet à adapter à la durée et aux appétits.',items:[item('Bouchées salées ou mini-sandwichs',n*6,'pièces','Buffet salé'),item('Salade composée préparée',Math.ceil(n*1.5)/10,'kg','Accompagnements'),item('Gâteau d’anniversaire',n,'parts','Dessert')] })
  if (!child && keys.includes('boissons')) lists.push({list_name:'Boissons de la fête',icon:'🥤',behavior:'apport',items:[item('Eau',Math.ceil(n/1.5),'bouteilles de 1,5 L','Boissons'),item('Jus de fruits ou boissons fraîches',Math.ceil(n*0.25/1.5),'bouteilles de 1,5 L','Boissons')],description:'Boissons sans alcool ; quantités à adapter à la durée et à la chaleur.'})
  const notes = []
  if (keys.includes('cadeaux')) notes.push('Les cadeaux sont des idées au choix : un exemplaire par idée, quel que soit le nombre d’invités. Chaque invité peut réserver un cadeau pour éviter les doublons.')
  if (!child && keys.includes('menu')) notes.push('Repères de buffet par personne : 6 bouchées salées, 150 g de salade préparée et 1 part de gâteau. À adapter à la durée, aux enfants et aux appétits.')
  if (!child && keys.includes('boissons')) notes.push('Boissons par personne : 1 L d’eau et 25 cl de jus, arrondis aux bouteilles.')
  if (child) notes.push('Le goûter est organisé par l’hôte ; aucune liste de nourriture à répartir entre invités.')
  if (options.decoration) notes.push('Pense aux ballons, à la guirlande et aux bougies' + (theme ? ' dans le thème ' + theme : '') + ' : décoration à préparer par l’organisateur.')
  return { lists, planning: [], menu_resume: notes.join(' ') }
}
