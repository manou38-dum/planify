// Sélection éditoriale vérifiée le 28/09/2026. Pas de recherche web automatique ni d'appel IA.
export const MENU_INSPIRATIONS = {
  classique: { label: 'Simple et classique', grill: 'Assortiment de grillades (sans os)', salad: 'Salade de pâtes ou pommes de terre préparée', vegetables: 'Crudités ou légumes à griller', sources: [] },
  familial: {
    label: 'Convivial et familial', grill: 'Brochettes de poulet et saucisses (sans os)', salad: 'Salade de riz aux légumes croquants', vegetables: 'Tomates, concombre et maïs à partager',
    sources: [
      { title: 'Salades composées pour barbecue — 750g', url: 'https://www.750g.com/nos-meilleures-recettes-de-salades-composees-a-servir-avec-un-barbecue-a40543.htm' },
      { title: 'Brochettes de poulet pour barbecue — 750g', url: 'https://www.750g.com/recettes-plats/viandes/blanches/poulet/brochettes/' },
    ],
  },
  mediterraneen: {
    label: 'Saveurs méditerranéennes', grill: 'Brochettes de poulet aux herbes (sans os)', salad: 'Salade de pâtes aux courgettes grillées', vegetables: 'Brochettes de légumes colorés',
    sources: [
      { title: 'Salade de pâtes aux courgettes — Marmiton', url: 'https://www.marmiton.org/recettes/recette_salade-de-pates-aux-courgettes-grillees-au-barbecue_531199.aspx' },
      { title: 'Brochettes de légumes — 750g', url: 'https://www.750g.com/brochettes-de-legumes-colores-r39518.htm' },
    ],
  },
  legumes: {
    label: 'Végétal gourmand', grill: 'Brochettes de légumes et halloumi à griller', salad: 'Salade de pâtes aux courgettes grillées', vegetables: 'Brochettes de légumes de saison',
    sources: [
      { title: 'Salade de pâtes aux courgettes — Marmiton', url: 'https://www.marmiton.org/recettes/recette_salade-de-pates-aux-courgettes-grillees-au-barbecue_531199.aspx' },
      { title: 'Brochettes de légumes — Manger Bouger', url: 'https://www.mangerbouger.fr/manger-mieux/la-fabrique-a-menus/recettes/200000204-brochettes-de-legumes' },
    ],
  },
  plancha: {
    label: 'Plancha et fraîcheur', grill: 'Brochettes de bœuf et légumes (sans os)', salad: 'Taboulé aux herbes et tomates', vegetables: 'Courgettes, poivrons et tomates à la plancha',
    sources: [
      { title: 'Brochettes cajun et salades estivales — 750g', url: 'https://www.750g.com/brochettes-cajun-salades-estivales-r202060.htm' },
      { title: 'Barbecue ou plancha : idées Marmiton', url: 'https://www.marmiton.org/none/salades-barbecue-et-plancha-faites-le-plein-de-recettes-gourmandes-avec-les-nouveaux-livres-marmiton-s4042848.html' },
    ],
  },
  gourmand: {
    label: 'Gourmand et généreux', grill: 'Brochettes variées et grillades (sans os)', salad: 'Salade piémontaise maison', vegetables: 'Poivrons, champignons et maïs grillés',
    sources: [
      { title: 'Brochettes pour barbecue — 750g', url: 'https://www.750g.com/15-recettes-de-delicieuses-brochettes-pour-vos-barbecues-cet-ete-a44134.htm' },
      { title: 'Salades composées pour barbecue — 750g', url: 'https://www.750g.com/nos-meilleures-recettes-de-salades-composees-a-servir-avec-un-barbecue-a40543.htm' },
    ],
  },
}
export const menuInspiration = options => MENU_INSPIRATIONS[options?.menu_style] || MENU_INSPIRATIONS.classique
