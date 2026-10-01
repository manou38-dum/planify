// Service worker Planify : volontairement minimal.
// - Aucune donnée d'événement n'est mise en cache (elles sont privées et doivent rester à jour).
// - Seule la page « hors connexion » est gardée, pour afficher un message clair sans réseau.
const CACHE = 'planify-offline-v1'
const OFFLINE_URL = '/offline.html'

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.add(new Request(OFFLINE_URL, { cache: 'reload' }))))
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  )
})

// Navigation uniquement : on tente le réseau, et sans réseau on affiche la page hors connexion.
self.addEventListener('fetch', event => {
  if (event.request.mode !== 'navigate') return
  event.respondWith(
    fetch(event.request).catch(() => caches.open(CACHE).then(cache => cache.match(OFFLINE_URL)))
  )
})
