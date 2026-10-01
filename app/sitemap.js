import { GUIDES } from './guides/guides.mjs'

const BASE = 'https://planify.manoulabs.com'

// Plan du site pour les moteurs de recherche : uniquement les pages publiques.
// Les invitations et les pages organisateur sont privées et n'y figurent jamais.
export default function sitemap() {
  const now = new Date()
  return [
    { url: `${BASE}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/guides`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    ...GUIDES.map(g => ({ url: `${BASE}/guides/${g.slug}`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 })),
    { url: `${BASE}/create`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/mentions-legales`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE}/confidentialite`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ]
}
