// Liste des guides publics : sert à la page /guides, au plan du site et aux liens entre guides.
// Les chiffres affichés dans les guides viennent des mêmes fonctions que l'application
// (lib/free-mode.mjs, lib/activity-planning.mjs, lib/safety-checklists.js) : un seul calcul, aucune divergence.
export const GUIDES = [
  {
    slug: 'quantites-barbecue',
    title: 'Quantités pour un barbecue : combien par personne',
    short: 'Quantités pour un barbecue',
    description: 'Combien de viande, de salade, de pain et de boissons pour un barbecue de 10, 20 ou 50 personnes. Calculateur gratuit, quantités arrondies aux conditionnements.',
    icon: '🔥',
  },
  {
    slug: 'boissons-vaisselle-fete',
    title: 'Boissons et vaisselle pour une fête : les bonnes quantités',
    short: 'Boissons et vaisselle pour une fête',
    description: 'Combien de bouteilles d’eau, de jus, d’assiettes, de verres et de serviettes prévoir pour une fête ou une soirée. Calculateur gratuit selon le nombre d’invités.',
    icon: '🥤',
  },
  {
    slug: 'anniversaire-enfant',
    title: 'Organiser un anniversaire d’enfant : la liste complète',
    short: 'Organiser un anniversaire d’enfant',
    description: 'Le rétroplanning d’un anniversaire d’enfant, des idées cadeaux par âge sans doublon et la méthode pour savoir enfin combien d’enfants viennent.',
    icon: '🎂',
  },
  {
    slug: 'randonnee-groupe',
    title: 'Randonnée ou sortie VTT en groupe : la liste du matériel',
    short: 'Matériel pour une sortie en groupe',
    description: 'La liste du matériel essentiel pour une randonnée ou une sortie VTT en groupe, et comment vérifier que chacun est équipé avant le départ.',
    icon: '🥾',
  },
  {
    slug: 'benevoles-tournoi',
    title: 'Planning des bénévoles d’un tournoi : modèle par sport',
    short: 'Planning des bénévoles d’un tournoi',
    description: 'Les postes de bénévoles, horaires et nombre de personnes pour un tournoi de football, basket, volley, pétanque et plus de 20 autres activités. Modèle gratuit.',
    icon: '🏆',
  },
]

export const guideBySlug = slug => GUIDES.find(guide => guide.slug === slug)
