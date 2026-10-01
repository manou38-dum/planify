// Fiche d'application : permet d'installer Planify sur l'écran d'accueil du téléphone,
// en plein écran, comme une application, sans passer par un store.
export default function manifest() {
  return {
    name: 'Planify — Organise tes événements',
    short_name: 'Planify',
    description: 'Invite, chacun répond et choisit ce qu’il apporte. Tu vois tout d’un coup d’œil.',
    id: '/',
    start_url: '/?source=app',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#FFF8F1',
    theme_color: '#C2410C',
    lang: 'fr',
    dir: 'ltr',
    categories: ['lifestyle', 'productivity', 'social'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Créer un événement', short_name: 'Créer', url: '/create', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
    ],
  }
}
