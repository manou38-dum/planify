import { birthdayLists } from '@/lib/birthday-lists.mjs'
import { GuideLayout, Card, guideMetadata } from '../GuideLayout'

const SLUG = 'anniversaire-enfant'
export const metadata = guideMetadata(SLUG)

// Idées par âge : mêmes suggestions que l'application (lib/birthday-lists.mjs), sans le suffixe d'âge.
const idees = age => birthdayLists(['cadeaux'], 10, { anniv_type: 'enfant', age }).lists[0].items.map(i => i.item_name.replace(/ — \d+ ans$/, ''))

const RETRO = [
  ['3 semaines avant', 'Choisir la date, le lieu et le nombre d’enfants. Envoyer l’invitation aux parents avec une date limite de réponse.'],
  ['2 semaines avant', 'Relancer les parents qui n’ont pas répondu. Choisir le thème et le gâteau.'],
  ['1 semaine avant', 'Arrêter le nombre d’enfants. Acheter le goûter, les bougies et la décoration. Prévoir 2 ou 3 jeux.'],
  ['La veille', 'Envoyer un rappel aux parents : heure d’arrivée, heure de fin, adresse.'],
  ['Le jour J', 'Noter qui récupère quel enfant et à quelle heure. Garder le téléphone des parents à portée de main.'],
]

export default function Page() {
  return (
    <GuideLayout slug={SLUG}
      intro="Un anniversaire d’enfant se joue sur trois choses : savoir combien d’enfants viennent, éviter que trois parents offrent le même cadeau, et caler les horaires d’arrivée et de départ. Voici la liste complète, semaine par semaine.">
      <Card title="Le rétroplanning">
        <ol className="space-y-3">
          {RETRO.map(([when, what]) => (
            <li key={when} className="flex gap-3">
              <span className="shrink-0 w-28 font-bold text-orange-800">{when}</span>
              <span>{what}</span>
            </li>
          ))}
        </ol>
      </Card>

      <Card title="Le vrai casse-tête : savoir combien d’enfants viennent">
        <p>L’invitation part dans le cartable ou sur le groupe de la classe, et les réponses arrivent au compte-gouttes, par SMS, à la sortie de l’école, ou jamais. Résultat : on prépare un goûter pour 15 sans savoir si on en aura 6 ou 12.</p>
        <p>La parade : <strong>un seul lien</strong> où chaque parent répond « oui » ou « non », indique le prénom de l’enfant, et voit la date limite. Tu vois en un coup d’œil qui vient, et qui n’a pas encore répondu pour le relancer.</p>
      </Card>

      <Card title="Des idées cadeaux par âge, sans doublon">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <h3 className="font-bold">Avant 3 ans</h3>
            <ul className="list-disc pl-5 mt-1 space-y-1">{idees(2).map(i => <li key={i}>{i}</li>)}</ul>
          </div>
          <div>
            <h3 className="font-bold">À partir de 3 ans</h3>
            <ul className="list-disc pl-5 mt-1 space-y-1">{idees(6).map(i => <li key={i}>{i}</li>)}</ul>
          </div>
        </div>
        <p>Pour éviter les doublons, publie une petite liste d’idées et laisse chaque parent <strong>réserver</strong> celle qu’il offre. Les autres voient qu’elle est prise. Vérifie toujours l’âge indiqué sur l’emballage.</p>
      </Card>

      <Card title="Le goûter">
        <p>Pour un anniversaire d’enfant, c’est en général l’hôte qui prépare le goûter : gâteau, boissons, quelques bonbons ou fruits. Pense aux allergies : demande-les dans l’invitation plutôt que de les découvrir le jour même.</p>
      </Card>
    </GuideLayout>
  )
}
