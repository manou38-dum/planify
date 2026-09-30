import { LegalLayout, Section, AFaire } from '../components/LegalLayout'

export const metadata = {
  title: 'Confidentialité — Planify',
  description: 'Quelles données Planify enregistre, pourquoi, combien de temps et comment exercer vos droits.',
}

const Li = ({ children }) => <li>{children}</li>

export default function Confidentialite() {
  return (
    <LegalLayout title="Confidentialité" updated="1er octobre 2026">
      <Section title="En bref">
        <ul className="list-disc pl-5 space-y-1">
          <Li>Planify enregistre seulement ce qu’il faut pour organiser l’événement : prénoms, réponses et ce que chacun apporte.</Li>
          <Li>Pas de compte, pas de publicité, pas de revente de données, pas de traceur publicitaire.</Li>
          <Li>Un événement n’est visible que par les personnes qui ont son lien.</Li>
          <Li>L’organisateur peut supprimer son événement à tout moment, avec toutes les réponses.</Li>
        </ul>
      </Section>

      <Section title="Qui est responsable de vos données">
        <p>L’éditeur de Planify, décrit dans les <a href="/mentions-legales" className="text-orange-800 font-semibold underline underline-offset-2">mentions légales</a>, est responsable du traitement. Contact pour toute question sur vos données : <AFaire>adresse e-mail de contact</AFaire>.</p>
      </Section>

      <Section title="Ce que Planify enregistre">
        <p><strong>Pour l’organisateur</strong> : prénom ou nom affiché, numéro de téléphone s’il choisit de le donner (pour que les invités puissent le joindre), et les informations de l’événement : nom, date, lieu, photo éventuelle, listes, créneaux d’aide.</p>
        <p><strong>Pour chaque invité</strong> : prénom, réponse (oui, peut-être, non), nombre de personnes et prénoms des accompagnants, ce qu’il apporte, son choix de repas, son créneau d’aide, le matériel coché, le covoiturage et le commentaire éventuel.</p>
        <p>Des accompagnants peuvent être des enfants : n’indiquez que leur prénom, rien de plus.</p>
        <p><strong>Techniquement</strong> : nos hébergeurs conservent des journaux de connexion (adresse IP, date, page demandée) pour faire fonctionner et sécuriser le service.</p>
      </Section>

      <Section title="Pourquoi">
        <p>Uniquement pour faire fonctionner l’événement : afficher l’invitation, compter les réponses, répartir les apports et les créneaux, préparer les messages que l’organisateur envoie lui-même. Base légale : l’exécution du service demandé par l’organisateur et les invités.</p>
        <p>Planify n’utilise pas vos données pour de la publicité et ne les vend à personne.</p>
      </Section>

      <Section title="Qui peut voir quoi">
        <ul className="list-disc pl-5 space-y-1">
          <Li>Les personnes qui ont le lien d’invitation voient l’événement, les réponses et qui apporte quoi.</Li>
          <Li>L’organisateur, avec son lien organisateur, voit tout et peut modifier ou supprimer l’événement.</Li>
          <Li>La photo de l’événement est accessible à toute personne qui a son adresse, pour qu’elle s’affiche dans l’aperçu WhatsApp.</Li>
          <Li>Nos hébergeurs (Vercel pour le site, Supabase pour la base de données et les photos, données stockées en Irlande) traitent les données pour notre compte.</Li>
        </ul>
      </Section>

      <Section title="Saisie à la voix">
        <p>Si vous dictez votre événement, la reconnaissance vocale est assurée par votre navigateur (par exemple Google pour Chrome) selon ses propres règles. Planify ne reçoit que le texte obtenu.</p>
      </Section>

      <Section title="Combien de temps">
        <p>Un événement et ses réponses sont conservés jusqu’à ce que l’organisateur le supprime. <AFaire>durée maximale de conservation après la date de l’événement, par exemple 12 mois, une fois la suppression automatique en place</AFaire></p>
        <p>Un invité qui souhaite retirer sa réponse peut le demander à l’organisateur ou à nous directement.</p>
      </Section>

      <Section title="Stockage sur votre appareil">
        <p>Planify garde dans votre navigateur le lien organisateur des événements que vous avez créés, pour que vous les retrouviez sur la page d’accueil. Ce n’est pas un traceur publicitaire : il ne sert qu’à vous donner accès à vos propres événements. Planify n’utilise pas de cookies de mesure d’audience ni de publicité.</p>
      </Section>

      <Section title="Vos droits">
        <p>Vous pouvez demander à consulter, corriger ou supprimer vos données, ou vous opposer à leur utilisation, en écrivant à <AFaire>adresse e-mail de contact</AFaire>. Nous répondons sous un mois.</p>
        <p>Si vous estimez que vos droits ne sont pas respectés, vous pouvez saisir la CNIL (cnil.fr).</p>
      </Section>
    </LegalLayout>
  )
}
