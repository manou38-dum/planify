import './globals.css'

export const metadata = {
  metadataBase: new URL('https://planify.manoulabs.com'),
  title: 'Planify — Organise tes événements sans tracas',
  description: 'Crée un événement, invite tes amis, chacun choisit ce qu\'il apporte. Zéro doublon, zéro stress.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className="bg-cream min-h-screen">
        {children}
        <footer className="bg-cream text-center text-xs text-stone-600 pt-2 pb-28 space-x-4">
          <a href="/mentions-legales" className="underline underline-offset-2 hover:text-stone-900">Mentions légales</a>
          <a href="/confidentialite" className="underline underline-offset-2 hover:text-stone-900">Confidentialité</a>
        </footer>
      </body>
    </html>
  )
}
