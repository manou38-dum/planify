import { LegalLayout, Section, AFaire } from '../components/LegalLayout'

export const metadata = {
  title: 'Mentions légales — Planify',
  description: 'Éditeur, hébergement et contact du service Planify.',
}

export default function MentionsLegales() {
  return (
    <LegalLayout title="Mentions légales" updated="1er octobre 2026">
      <Section title="Éditeur du service">
        <p>Le service Planify, accessible à l’adresse planify.manoulabs.com, est édité par :</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Raison sociale : <AFaire>nom de la société</AFaire></li>
          <li>Forme juridique et capital : <AFaire>ex. SAS au capital de … €</AFaire></li>
          <li>Siège social : <AFaire>adresse complète</AFaire></li>
          <li>SIRET : <AFaire>numéro SIRET</AFaire> — RCS : <AFaire>ville d’immatriculation</AFaire></li>
          <li>Numéro de TVA intracommunautaire : <AFaire>si applicable</AFaire></li>
          <li>Directeur de la publication : <AFaire>prénom et nom</AFaire></li>
          <li>Contact : <AFaire>adresse e-mail de contact</AFaire></li>
        </ul>
      </Section>

      <Section title="Hébergement">
        <p><strong>Site web</strong> : Vercel Inc., 440 N Barranca Ave, Covina, CA 91723, États-Unis — vercel.com.</p>
        <p><strong>Base de données et photos</strong> : Supabase Pte. Ltd., Singapour — supabase.com (contact : privacy@supabase.com). Les données de Planify sont stockées dans un centre de données situé en Irlande (Union européenne).</p>
      </Section>

      <Section title="Utilisation du service">
        <p>Planify permet d’organiser un événement entre proches : invitation, réponses, répartition de ce que chacun apporte, créneaux d’aide et matériel. Le service est gratuit.</p>
        <p>Chaque organisateur est responsable du contenu qu’il publie (nom de l’événement, lieu, photo, textes) et du partage de ses liens. Le lien organisateur donne le contrôle de l’événement : il ne doit pas être transmis aux invités.</p>
        <p>Planify ne vend rien aux invités, n’encaisse aucune somme et n’envoie aucun message à leur place : les messages sont préparés par l’application puis envoyés par l’organisateur lui-même.</p>
      </Section>

      <Section title="Propriété intellectuelle">
        <p>Le nom Planify, l’interface et les textes du service appartiennent à l’éditeur. Les contenus ajoutés par les organisateurs et les invités restent les leurs.</p>
      </Section>

      <Section title="Données personnelles">
        <p>La façon dont Planify utilise et protège vos données est décrite dans la <a href="/confidentialite" className="text-orange-800 font-semibold underline underline-offset-2">politique de confidentialité</a>.</p>
      </Section>
    </LegalLayout>
  )
}
