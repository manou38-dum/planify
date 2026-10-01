import './globals.css'
import PwaRegister from './components/PwaRegister'

export const metadata = {
  metadataBase: new URL('https://planify.manoulabs.com'),
  title: 'Planify — Organise tout ton événement, de A à Z',
  description: 'Fête, sortie, tournoi ou association : invitations, réponses, qui apporte quoi, bénévoles, matériel et covoiturage au même endroit. Un lien à partager. Gratuit, sans compte.',
  applicationName: 'Planify',
  appleWebApp: { capable: true, title: 'Planify', statusBarStyle: 'default' },
  formatDetection: { telephone: false },
  openGraph: { siteName: 'Planify', locale: 'fr_FR', type: 'website' },
  // Validation Google Search Console (valeur publique, visible dans le code de la page).
  verification: { google: 'iHXX9gSHnkdSkoNB3aKkg2CZuppTlYNL6E-lH25QRYY' },
}

export const viewport = {
  themeColor: '#C2410C',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className="bg-cream min-h-screen">
        {children}
        <footer className="bg-cream text-center text-xs text-stone-600 pt-2 pb-28 space-x-4">
          <a href="/guides" className="underline underline-offset-2 hover:text-stone-900">Guides</a>
          <a href="/mentions-legales" className="underline underline-offset-2 hover:text-stone-900">Mentions légales</a>
          <a href="/confidentialite" className="underline underline-offset-2 hover:text-stone-900">Confidentialité</a>
        </footer>
        <PwaRegister />
      </body>
    </html>
  )
}
