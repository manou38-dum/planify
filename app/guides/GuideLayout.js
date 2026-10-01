import Link from 'next/link'
import { GUIDES, guideBySlug } from './guides.mjs'

// Métadonnées d'un guide : titre, description, adresse canonique et aperçu de partage.
export function guideMetadata(slug) {
  const guide = guideBySlug(slug)
  const url = `/guides/${slug}`
  return {
    title: `${guide.title} | Planify`,
    description: guide.description,
    alternates: { canonical: url },
    openGraph: { title: guide.title, description: guide.description, url, type: 'article', locale: 'fr_FR', siteName: 'Planify' },
  }
}

// Mise en page commune des guides : lecture sur téléphone d'abord, un seul appel à l'action répété.
export function GuideLayout({ slug, intro, children }) {
  const guide = guideBySlug(slug)
  const others = GUIDES.filter(g => g.slug !== slug)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.description,
    inLanguage: 'fr-FR',
    mainEntityOfPage: `https://planify.manoulabs.com/guides/${slug}`,
    publisher: { '@type': 'Organization', name: 'Planify' },
  }
  return (
    <div className="min-h-screen bg-cream text-stone-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <nav aria-label="Fil d’Ariane" className="text-sm font-semibold text-stone-600">
          <Link href="/" className="hover:text-stone-900">Planify</Link>
          <span aria-hidden="true"> › </span>
          <Link href="/guides" className="hover:text-stone-900">Guides</Link>
        </nav>
        <h1 className="text-3xl font-extrabold tracking-tight mt-4">{guide.title}</h1>
        <p className="text-stone-700 mt-3 text-[17px] leading-relaxed">{intro}</p>
        <div className="mt-6 space-y-6 text-[15px] leading-relaxed text-stone-800">{children}</div>
        <CreateCta />
        <section aria-labelledby="autres-guides" className="mt-10">
          <h2 id="autres-guides" className="text-sm font-bold uppercase tracking-wide text-stone-600 mb-3">Autres guides</h2>
          <ul className="space-y-2">
            {others.map(g => (
              <li key={g.slug}>
                <Link href={`/guides/${g.slug}`} className="flex items-center gap-3 bg-white rounded-2xl ring-1 ring-stone-900/5 px-4 min-h-[52px] font-semibold hover:ring-orange-300">
                  <span aria-hidden="true">{g.icon}</span>{g.short}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  )
}

export function Card({ title, children }) {
  return (
    <section className="bg-white rounded-3xl shadow-sm ring-1 ring-stone-900/5 p-5 space-y-3">
      {title && <h2 className="text-lg font-bold text-stone-900">{title}</h2>}
      {children}
    </section>
  )
}

// Appel à l'action : honnête sur ce que fait Planify (pas d'envoi automatique, pas de compte).
export function CreateCta({ text = 'Planify calcule ces quantités pour toi, prépare l’invitation et chaque invité choisit ce qu’il apporte. Gratuit, sans compte.' }) {
  return (
    <aside className="mt-8 bg-stone-900 text-white rounded-3xl p-5">
      <p className="font-bold text-lg">Organise-le avec Planify</p>
      <p className="text-stone-200 mt-1">{text}</p>
      <Link href="/create" className="mt-4 flex items-center justify-center min-h-[52px] rounded-2xl bg-orange-700 hover:bg-orange-600 font-bold text-white">
        Créer mon événement
      </Link>
    </aside>
  )
}
