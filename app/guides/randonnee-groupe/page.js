import { SAFETY_CHECKLISTS } from '@/lib/safety-checklists'
import { GuideLayout, Card, guideMetadata } from '../GuideLayout'

const SLUG = 'randonnee-groupe'
export const metadata = guideMetadata(SLUG)

function Checklist({ list }) {
  const essentials = list.items.filter(i => i.essential)
  const extras = list.items.filter(i => !i.essential)
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <h3 className="font-bold">Indispensable</h3>
        <ul className="mt-1 space-y-1">{essentials.map(i => <li key={i.item_name} className="flex gap-2"><span aria-hidden="true" className="text-emerald-700 font-bold">✓</span>{i.item_name}</li>)}</ul>
      </div>
      <div>
        <h3 className="font-bold">Conseillé</h3>
        <ul className="mt-1 space-y-1">{extras.map(i => <li key={i.item_name} className="flex gap-2"><span aria-hidden="true" className="text-stone-500">○</span>{i.item_name}</li>)}</ul>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <GuideLayout slug={SLUG}
      intro="En groupe, le danger n’est pas d’oublier son propre matériel : c’est que personne ne vérifie celui des autres. Voici la liste par activité, et une méthode simple pour savoir avant le départ qui est équipé et qui ne l’est pas."
    >
      <Card title="Randonnée : le matériel de chacun">
        <Checklist list={SAFETY_CHECKLISTS.rando} />
      </Card>

      <Card title="VTT : le matériel de chacun">
        <Checklist list={SAFETY_CHECKLISTS.vtt} />
      </Card>

      <Card title="La méthode pour un groupe">
        <ol className="list-decimal pl-5 space-y-2">
          <li><strong>Partage la liste avant la sortie</strong>, pas sur le parking. Chacun coche ce qu’il a.</li>
          <li><strong>Repère les manques la veille</strong> : qui n’a pas de veste, pas de lampe, pas de chambre à air ? Il reste le temps de prêter ou d’acheter.</li>
          <li><strong>Mutualise ce qui peut l’être</strong> : une trousse de secours et un kit de réparation pour le groupe valent mieux que dix à moitié remplis.</li>
          <li><strong>Organise le covoiturage</strong> : qui part d’où, avec combien de places.</li>
          <li><strong>Laisse l’itinéraire et l’heure de retour</strong> à quelqu’un qui ne vient pas.</li>
        </ol>
      </Card>

      <Card title="Météo et montagne">
        <p>Consulte la météo la veille et le matin même, et renonce si elle se dégrade. En montagne, le bulletin de Météo-France pour le massif concerné et les conseils de l’office de tourisme ou du bureau des guides restent la référence.</p>
      </Card>
    </GuideLayout>
  )
}
