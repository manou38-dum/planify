import './globals.css'

export const metadata = {
  title: 'Planify — Organise tes événements sans tracas',
  description: 'Crée un événement, invite tes amis, chacun choisit ce qu\'il apporte. Zéro doublon, zéro stress.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className="bg-slate-50 min-h-screen">{children}</body>
    </html>
  )
}
