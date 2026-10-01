import { freeLists } from '@/lib/free-mode.mjs'
import { formatQuantity } from '@/lib/ui-theme.mjs'
import { GuideLayout, Card, guideMetadata } from '../GuideLayout'
import QuantityCalculator from '../QuantityCalculator'

const SLUG = 'quantites-barbecue'
export const metadata = guideMetadata(SLUG)

// Tableau de référence calculé avec les mêmes règles que l'application.
const GROUPES = [10, 20, 30, 50]
const LIGNES = [
  { label: 'Grillades sans os', find: name => name.startsWith('Assortiment de grillades') },
  { label: 'Salade préparée', find: name => /salade/i.test(name) },
  { label: 'Légumes ou crudités', find: name => /légumes|crudités/i.test(name) },
  { label: 'Pain (baguettes)', find: name => name === 'Pain' },
  { label: 'Eau (bouteilles 1,5 L)', find: name => name.startsWith('Eau') },
  { label: 'Jus ou sodas (bouteilles 1,5 L)', find: name => name.startsWith('Jus') },
]

function reference() {
  return GROUPES.map(n => {
    const items = freeLists(['menu', 'boissons'], n, {}, 'BBQ').lists.flatMap(l => l.items)
    return LIGNES.map(line => {
      const item = items.find(i => line.find(i.item_name))
      if (!item) return '—'
      return item.unit === 'kg' ? `${formatQuantity(item.quantity)} kg` : formatQuantity(item.quantity)
    })
  })
}

export default function Page() {
  const table = reference()
  return (
    <GuideLayout slug={SLUG}
      intro="Pour un barbecue, compte 250 g de viande sans os par adulte, 150 g de salade, 100 g de légumes, un quart de baguette et environ 1 litre d’eau. Le calculateur ci-dessous fait le reste, arrondi aux conditionnements du commerce.">
      <QuantityCalculator type="BBQ" keys={['menu', 'boissons', 'materiel']} defaultCount={20} />

      <Card title="Tableau rapide : 10, 20, 30 ou 50 personnes">
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-stone-600">
                <th scope="col" className="py-2 pr-2 font-semibold">Par groupe</th>
                {GROUPES.map(n => <th key={n} scope="col" className="py-2 px-1 font-semibold text-right">{n} pers.</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {LIGNES.map((line, row) => (
                <tr key={line.label}>
                  <th scope="row" className="py-2 pr-2 text-left font-normal">{line.label}</th>
                  {table.map((col, i) => <td key={GROUPES[i]} className="py-2 px-1 text-right font-semibold whitespace-nowrap">{col[row]}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-stone-600">Portions adultes, arrondies aux conditionnements. Réduis pour les enfants et les petits appétits.</p>
      </Card>

      <Card title="Combien de viande par personne ?">
        <p><strong>250 g de viande sans os par adulte</strong> suffisent quand il y a aussi des salades et du pain. Avec os (côtes, cuisses de poulet), prévois un peu plus, car l’os compte dans le poids.</p>
        <p>Mélange les morceaux : des saucisses et merguez cuisent vite et rassurent les premiers affamés, les brochettes et le poulet arrivent ensuite. Pour les végétariens, compte <strong>200 g de protéines végétales à griller</strong> (halloumi, brochettes de légumes, galettes).</p>
      </Card>

      <Card title="Les erreurs qui coûtent cher">
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Trois personnes apportent des chips, personne n’apporte le pain.</strong> Le vrai problème d’un barbecue partagé n’est pas la quantité, c’est la répartition. Une liste où chacun réserve ce qu’il apporte règle ça.</li>
          <li><strong>Oublier l’eau.</strong> Par forte chaleur ou sur un après-midi entier, prévois nettement plus d’eau que la base d’un litre par personne.</li>
          <li><strong>Une seule pince.</strong> Prévois deux pinces distinctes, une pour la viande crue et une pour la viande cuite.</li>
          <li><strong>Compter les invités au jugé.</strong> Sans réponses claires, on achète pour 30 et on se retrouve à 18. Demande une réponse avant une date limite.</li>
        </ul>
      </Card>

      <Card title="Et l’alcool ?">
        <p>Les quantités ci-dessus sont sans alcool. Ajoute les boissons alcoolisées selon le nombre d’adultes et leurs habitudes, et garde toujours de l’eau et des boissons sans alcool en quantité suffisante.</p>
      </Card>
    </GuideLayout>
  )
}
