# Mise en sécurité des événements

Cette livraison remplace les politiques « Public … » par un accès par capacité : le lien d'invitation donne accès à un seul événement et le jeton administrateur permet de le gérer. Le jeton n'est jamais enregistré en base : seul son empreinte SHA-256 l'est.

Pour reprendre les événements déjà créés sans les perdre :

1. Dans Supabase SQL Editor, exécuter `security-add-owner-token.sql`.
2. Sur un poste de confiance, renseigner `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` localement, puis lancer `node scripts/claim-existing-events.mjs`. Conserver les liens affichés et ouvrir chacun une fois avec le navigateur de l'organisateur. Ne pas envoyer la clé de service dans Vercel, GitHub ni une conversation.
3. Dans Supabase SQL Editor, exécuter `security-rls.sql`.
4. Tester un lien d'invitation, un lien administrateur, puis la page d'accueil. Elle ne doit afficher que les événements dont le navigateur détient le jeton.

Les invités peuvent répondre, réserver un apport, s'inscrire à un créneau et publier une proposition via leur lien d'invitation. Ils ne peuvent ni modifier ni supprimer un événement, ni modifier les créneaux. L'organisateur peut gérer l'ensemble depuis son navigateur.
