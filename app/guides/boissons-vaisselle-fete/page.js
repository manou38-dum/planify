import { GuideLayout, Card, guideMetadata } from '../GuideLayout'
import QuantityCalculator from '../QuantityCalculator'

const SLUG = 'boissons-vaisselle-fete'
export const metadata = guideMetadata(SLUG)

export default function Page() {
  return (
    <GuideLayout slug={SLUG}
      intro="Pour une fête, compte 1 litre d’eau et 25 cl d’autres boissons sans alcool par personne, une assiette, un verre et des couverts par invité plus 10 % de réserve, et 2 serviettes par personne. Indique ton nombre d’invités, le calcul est fait.">
      <QuantityCalculator type="Soirée" keys={['boissons', 'materiel']} defaultCount={20} allowGenerous={false} />

      <Card title="Les repères par personne">
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Eau : 1 litre</strong>, davantage s’il fait chaud ou si la fête dure longtemps.</li>
          <li><strong>Jus, sodas, boissons fraîches : 25 cl</strong>, soit environ une bouteille de 1,5 L pour 6 personnes.</li>
          <li><strong>Assiettes, verres, couverts : 1 par personne + 10 %.</strong> La réserve couvre la casse, les verres perdus et les invités de dernière minute.</li>
          <li><strong>Serviettes : 2 par personne.</strong></li>
        </ul>
      </Card>

      <Card title="Réutilisable ou jetable ?">
        <p>Depuis 2020 pour les gobelets et assiettes, et 2021 pour les couverts, la vaisselle jetable en plastique n’est plus vendue en France (loi anti-gaspillage). Plutôt que d’acheter du jetable en carton, demande à chaque invité d’apporter quelques assiettes ou verres : sur une fête de 20 personnes, trois ou quatre volontaires suffisent.</p>
      </Card>

      <Card title="Éviter le classique « tout le monde apporte du rosé »">
        <p>Quand chacun apporte « une bouteille », on finit avec six bouteilles de la même chose et pas d’eau. La solution : une liste partagée où chacun réserve une ligne précise (« 2 bouteilles d’eau », « 22 verres »). Ce qui est pris passe dans « Déjà réservé », avec le prénom de qui s’en charge, et ce qui manque reste visible.</p>
      </Card>

      <Card title="Et l’alcool ?">
        <p>Les quantités sont sans alcool. Ajoute les boissons alcoolisées selon le nombre d’adultes, et garde toujours de l’eau et des boissons sans alcool en quantité suffisante.</p>
      </Card>
    </GuideLayout>
  )
}
