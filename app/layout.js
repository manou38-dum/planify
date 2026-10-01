import './globals.css'
import PwaRegister from './components/PwaRegister'

export const metadata = {
  metadataBase: new URL('https://planify.manoulabs.com'),
  title: 'Planify — Qui vient ? Qui apporte quoi ? Organise ton événement',
  description: 'Barbecue, anniversaire, sortie ou tournoi : crée l’invitation en 2 minutes, partage-la sur WhatsApp, chacun répond et réserve ce qu’il apporte. Gratuit, sans compte.',
  applicationName: 'Planify',
  appleWebApp: { capable: true, title: 'Planify', statusBarStyle: 'default' },
  formatDetection: { telephone: false },
  openGraph: { siteName: 'Planify', locale: 'fr_FR', type: 'website' },
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
