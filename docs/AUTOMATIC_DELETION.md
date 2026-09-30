# Suppression automatique des événements

Chaque jour à 03:17 UTC, Vercel appelle `GET /api/cron/cleanup-events`. La tâche supprime les événements dont la date est dépassée de plus de douze mois, ainsi que leurs réponses, listes, apports, créneaux, inscriptions aux créneaux, covoiturages et leur photo du bucket `event-photos`.

Les relations de la base suppriment les réponses, listes et apports avec l’événement. La tâche retire aussi explicitement les inscriptions aux créneaux et les covoiturages afin de couvrir les anciennes données.

## Mise en service

Dans les variables d’environnement **Production** de Vercel, ajouter :

- `CRON_SECRET` : une valeur aléatoire longue, utilisée pour authentifier Vercel ;
- `SUPABASE_SERVICE_ROLE_KEY` : la clé `service_role` de Supabase, uniquement côté serveur.

Ne jamais préfixer ces variables par `NEXT_PUBLIC_`, ni les ajouter à GitHub ou à un fichier commité. Les tâches planifiées Vercel ne sont appelées que sur le déploiement de production. Une suppression intervient au plus tard dans les 24 heures après l’échéance des douze mois.
