// Page organisateur : privée, jamais dans les résultats des moteurs de recherche.
export const metadata = {
  robots: { index: false, follow: false },
}

export default function EventLayout({ children }) {
  return children
}
