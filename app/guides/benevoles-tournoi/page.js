import { ACTIVITES } from '@/lib/activity-planning.mjs'
import { GuideLayout, Card, guideMetadata } from '../GuideLayout'
import VolunteerPlanner from './VolunteerPlanner'

const SLUG = 'benevoles-tournoi'
export const metadata = guideMetadata(SLUG)

export default function Page() {
  const sports = ACTIVITES.filter(a => a.cle !== 'autre_sport').map(a => ({ cle: a.cle, nom: a.nom }))
  return (
    <GuideLayout slug={SLUG}
      intro="Un tournoi réussi tient à quelques postes bien tenus : accueil, arbitrage, buvette, rangement. Choisis ton sport, ton heure de début et ton nombre de participants : le planning des bénévoles s’affiche, avec les horaires et le nombre de personnes par poste.">
      <VolunteerPlanner sports={sports} />

      <Card title="Comment remplir les postes sans y passer la soirée">
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Des créneaux courts.</strong> On trouve plus facilement quelqu’un pour une heure que pour l’après-midi.</li>
          <li><strong>Chacun s’inscrit lui-même</strong> sur le créneau qui lui va, au lieu que l’organisateur appelle tout le monde.</li>
          <li><strong>Les postes vides restent visibles</strong> : une relance ciblée (« il manque 2 personnes au rangement ») marche mieux qu’un appel général.</li>
          <li><strong>Un message aux familles</strong> pour dire qui joue et à quelle heure, séparé de l’appel aux bénévoles.</li>
        </ul>
      </Card>

      <Card title="Ce qui change selon le sport">
        <p>Les besoins ne sont pas les mêmes partout : un tournoi de football demande des arbitres, une sortie VTT des serre-files, une rencontre dans un gymnase équipé peu d’installation. Le planning ci-dessus s’adapte au sport choisi. Ajuste ensuite les postes à ton lieu et à ton club.</p>
      </Card>
    </GuideLayout>
  )
}
