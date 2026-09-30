import { LegalLayout, Section, AFaire, Contact } from '../components/LegalLayout'

export const metadata = {
  title: 'Mentions légales — Planify',
  description: 'Éditeur, hébergement et contact du service Planify.',
}

export default function MentionsLegales() {
  return (
    <LegalLayout title="Mentions légales" updated="1er octobre 2026">
      <Section title="Éditeur du service">
        <p>Planify, accessible à l’adresse planify.manoulabs.com, est un service gratuit édité par un particulier, à titre non professionnel et sans but commercial.</p>
        <p>Conformément à l’article 6, III, 2° de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l’économie numérique, l’éditeur a choisi de ne pas publier son identité ; elle a été communiquée à l’hébergeur du site.</p>
        <p>Contact : <Contact /></p>
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
        <p>Le nom Planify, l’interface et les textes du service appartiennent à leur auteur. Les contenus ajoutés par les organisateurs et les invités restent les leurs.</p>
      </Section>

      <Section title="Données personnelles">
        <p>La façon dont Planify utilise et protège vos données est décrite dans la <a href="/confidentialite" className="text-orange-800 font-semibold underline underline-offset-2">politique de confidentialité</a>.</p>
      </Section>
    </LegalLayout>
  )
}
