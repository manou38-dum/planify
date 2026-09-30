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
  const add = (...names) => ideas.push(...names)
  if (/cuisin|patis|chocolat/.test(context)) add(child ? 'Kit de pâtisserie pour enfant' : 'Atelier de pâtisserie', 'Livre de recettes illustré')
  if (/sport|foot|basket|velo|rando/.test(context)) add('Gourde réutilisable pour le sport', child ? 'Ballon de jeu adapté à l’âge' : 'Sac de sport')
  if (/dessin|art|creatif|peinture/.test(context)) add('Coffret de dessin et coloriage', 'Carnet à dessin et crayons de couleur')
  if (/musiqu|guitare|piano/.test(context)) add(child ? 'Livre musical adapté à l’âge' : 'Place de concert à choisir ensemble', 'Carnet de musique')
  if (/scien|espace|dinos|nature|animaux/.test(context)) add('Livre illustré sur ' + (theme || interests), child ? 'Puzzle découverte de la nature' : 'Guide illustré de la nature')
  if (/jeu|gaming|video/.test(context)) add('Jeu de société coopératif', child ? 'Puzzle illustré' : 'Accessoire de bureau pour jeux vidéo (compatibilité à vérifier)')
  if (/princesse|super.?heros|pirate|licorne/.test(context)) add('Livre d’aventures sur le thème ' + (theme || interests), 'Puzzle sur le thème ' + (theme || interests))
  if (interests && !ideas.length) add('Livre découverte : ' + interests, 'Coffret créatif autour de ' + interests)
  if (theme && ideas.length < 4) add('Puzzle illustré sur le thème ' + theme, 'Album ou livre sur le thème ' + theme)
  add(...(child ? (age < 3 ? ['Livre cartonné à toucher', 'Jouet d’éveil adapté à l’âge', 'Peluches adaptées aux tout-petits', 'Livre de comptines'] : ['Jeu de société adapté à l’âge', 'Coffret de loisirs créatifs', 'Livre illustré', 'Puzzle adapté à l’âge']) : ['Jeu de société à partager', 'Livre selon ses goûts', 'Atelier créatif à choisir ensemble', 'Album photo à personnaliser']))
  if (child && age < 3) ideas.splice(0, ideas.length, 'Livre cartonné à toucher', 'Jouet d’éveil adapté à l’âge', 'Peluche adaptée aux tout-petits', 'Livre de comptines')
  const suffix = child && Number.isFinite(age) ? ' — ' + age + ' ans' : ''
  const gifts = [...new Set(ideas)].slice(0,6).map(name => ({ item_name: name + suffix, quantity: 1, unit: 'cadeau', category: 'Idées cadeaux' }))
  const lists = []
  if (keys.includes('cadeaux')) lists.push({ list_name: 'Idées cadeaux' + (options.pour_qui ? ' pour ' + options.pour_qui : ''), icon: '🎁', behavior: 'cadeau', description: 'Suggestions gratuites selon l’âge, les goûts et le thème. Garde les idées qui plaisent, supprime les autres et ajoute un lien produit si tu en as un. Vérifie l’âge recommandé et les préférences avant achat.', items: gifts })
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
