// Les invitations (/invite/…) et pages organisateur (/event/…) ne sont pas bloquées ici :
// WhatsApp doit pouvoir lire leur aperçu. Elles portent une balise « noindex » qui interdit
// à Google de les afficher dans ses résultats.
export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/'] }],
    sitemap: 'https://planify.manoulabs.com/sitemap.xml',
    host: 'https://planify.manoulabs.com',
  }
}
