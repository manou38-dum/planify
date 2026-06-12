# 🎉 Planify V1

Application d'organisation d'événements sociaux.

## Déploiement en 5 étapes

### Étape 1 — Supabase (base de données)
1. Va sur [supabase.com](https://supabase.com)
2. Crée un nouveau projet (gratuit)
3. Va dans **SQL Editor** > **New Query**
4. Copie-colle TOUT le contenu de `schema.sql`
5. Clique **Run**
6. Va dans **Settings > API** et note :
   - `Project URL` → c'est ton `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → c'est ton `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Étape 2 — GitHub
1. Crée un nouveau repo sur github.com (ex: `planify`)
2. Push tout ce dossier dedans

### Étape 3 — Vercel (hébergement)
1. Va sur [vercel.com](https://vercel.com)
2. Clique **Add New > Project**
3. Importe ton repo GitHub `planify`
4. Dans **Environment Variables**, ajoute :
   - `NEXT_PUBLIC_SUPABASE_URL` = ta valeur de l'étape 1
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = ta valeur de l'étape 1
5. Clique **Deploy**

### Étape 4 — Tester
1. Vercel te donne une URL (ex: planify-xxx.vercel.app)
2. Crée un événement test
3. Copie le lien d'invitation
4. Ouvre le lien dans un autre navigateur/téléphone
5. Teste le RSVP + la sélection d'items

### Étape 5 — Partager
Envoie le lien d'invitation à tes amis et tes 2 associations !

## Structure du projet

```
planify/
├── app/
│   ├── page.js                    # Accueil (liste événements)
│   ├── create/page.js             # Créer un événement
│   ├── event/[id]/page.js         # Dashboard organisateur
│   ├── invite/[linkId]/page.js    # Page invité (lien public)
│   └── api/generate-list/route.js # API génération liste IA
├── lib/
│   └── supabase.js                # Client Supabase
├── schema.sql                     # Structure base de données
└── .env.local.example             # Variables d'environnement
```
