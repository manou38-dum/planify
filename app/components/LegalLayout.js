import Link from 'next/link'

// Mise en page commune des pages légales : lecture confortable sur téléphone.
export function LegalLayout({ title, updated, children }) {
  return (
    <div className="min-h-screen bg-cream text-stone-900">
      <main className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/" className="text-stone-600 hover:text-stone-900 text-sm font-semibold">← Planify</Link>
        <h1 className="text-3xl font-extrabold tracking-tight mt-4">{title}</h1>
        <p className="text-sm text-stone-600 mt-1">Dernière mise à jour : {updated}</p>
        <div className="mt-6 space-y-6 text-[15px] leading-relaxed text-stone-800">{children}</div>
      </main>
    </div>
  )
}

export function Section({ title, children }) {
  return (
    <section className="bg-white rounded-3xl shadow-sm ring-1 ring-stone-900/5 p-5 space-y-3">
      <h2 className="text-lg font-bold text-stone-900">{title}</h2>
      {children}
    </section>
  )
}

// Champ à compléter par l'éditeur avant ouverture publique : bien visible pour ne pas l'oublier.
export function AFaire({ children }) {
  return <mark className="bg-amber-100 text-amber-950 rounded px-1">[À compléter : {children}]</mark>
}

// Adresse de contact affichée sur les pages légales : à renseigner ici une seule fois.
export const CONTACT_EMAIL = 'contact.planify@manoulabs.com'

export function Contact() {
  if (!CONTACT_EMAIL) return <AFaire>adresse e-mail de contact</AFaire>
  return <a href={`mailto:${CONTACT_EMAIL}`} className="text-orange-800 font-semibold underline underline-offset-2">{CONTACT_EMAIL}</a>
}
