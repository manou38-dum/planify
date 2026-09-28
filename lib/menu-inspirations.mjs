// Sélection éditoriale vérifiée le 28/09/2026. Pas de recherche web automatique ni d'appel IA.
export const MENU_INSPIRATIONS = {
  classique: { label: 'Simple et classique', salad: 'Salade de pâtes ou pommes de terre préparée', vegetables: 'Crudités ou légumes à griller', sources: [] },
  mediterraneen: {
    label: 'Saveurs méditerranéennes', salad: 'Salade de pâtes aux courgettes grillées', vegetables: 'Brochettes de légumes colorés',
    sources: [
      { title: 'Salade de pâtes aux courgettes — Marmiton', url: 'https://www.marmiton.org/recettes/recette_salade-de-pates-aux-courgettes-grillees-au-barbecue_531199.aspx' },
      { title: 'Brochettes de légumes — 750g', url: 'https://www.750g.com/brochettes-de-legumes-colores-r39518.htm' },
    ],
  },
  legumes: {
    label: 'Légumes à l’honneur', salad: 'Salade de pâtes aux courgettes grillées', vegetables: 'Brochettes de légumes de saison',
    sources: [
      { title: 'Salade de pâtes aux courgettes — Marmiton', url: 'https://www.marmiton.org/recettes/recette_salade-de-pates-aux-courgettes-grillees-au-barbecue_531199.aspx' },
      { title: 'Brochettes de légumes — Manger Bouger', url: 'https://www.mangerbouger.fr/manger-mieux/la-fabrique-a-menus/recettes/200000204-brochettes-de-legumes' },
    ],
  },
}
export const menuInspiration = options => MENU_INSPIRATIONS[options?.menu_style] || MENU_INSPIRATIONS.classique
