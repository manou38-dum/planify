import Link from 'next/link'
import { GUIDES } from './guides.mjs'
import { CreateCta } from './GuideLayout'

export const metadata = {
  title: 'Guides pour organiser un événement entre proches | Planify',
  description: 'Quantités pour un barbecue, boissons et vaisselle d’une fête, anniversaire d’enfant, matériel de randonnée, planning des bénévoles : des guides gratuits et des calculateurs.',
  alternates: { canonical: '/guides' },
}

export default function Guides() {
  return (
    <div className="min-h-screen bg-cream text-stone-900">
      <main className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/" className="text-stone-600 hover:text-stone-900 text-sm font-semibold">← Planify</Link>
        <h1 className="text-3xl font-extrabold tracking-tight mt-4">Guides pour organiser entre proches</h1>
        <p className="text-stone-700 mt-3 text-[17px] leading-relaxed">Des réponses concrètes, des quantités calculées pour ton nombre d’invités, et aucune inscription.</p>
        <ul className="mt-6 space-y-3">
          {GUIDES.map(g => (
            <li key={g.slug}>
              <Link href={`/guides/${g.slug}`} className="block bg-white rounded-3xl shadow-sm ring-1 ring-stone-900/5 p-5 hover:ring-orange-300">
                <span className="flex items-center gap-3 font-bold text-lg"><span aria-hidden="true">{g.icon}</span>{g.short}</span>
                <span className="block text-stone-700 mt-1">{g.description}</span>
              </Link>
            </li>
          ))}
        </ul>
        <CreateCta text="Crée ton événement en une phrase : Planify prépare l’invitation et la liste, et chacun choisit ce qu’il apporte. Gratuit, sans compte." />
      </main>
    </div>
  )
}
