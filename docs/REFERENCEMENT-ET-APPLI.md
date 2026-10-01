# Référencement et appli téléphone

Préparé par Claude le 1er octobre 2026. Coût de tout ce qui suit : **0 €**, sauf mention contraire.

## 1. Référencement (SEO) : ce qui est en place

| Élément | Adresse | Rôle |
|---|---|---|
| Plan du site | `/sitemap.xml` | Liste les 10 pages publiques à Google |
| Règles des robots | `/robots.txt` | Autorise tout sauf `/api/`, indique le plan du site |
| 5 guides + sommaire | `/guides/...` | Pages qui répondent à des recherches réelles, avec calculateur |
| Pages privées | `/invite/...`, `/event/...` | Balise `noindex` : Google ne les affiche jamais, mais l'aperçu WhatsApp reste lisible |

Les chiffres des guides viennent **des mêmes fonctions que l'application** (`lib/free-mode.mjs`, `lib/activity-planning.mjs`, `lib/safety-checklists.js`, `lib/birthday-lists.mjs`). Si Codex change un calcul, les guides suivent automatiquement.

Ajouter un guide :

1. Ajouter une entrée dans `app/guides/guides.mjs`.
2. Créer `app/guides/<slug>/page.js` en s'inspirant d'un guide existant.

Le plan du site, le sommaire et les liens croisés se mettent à jour tout seuls.

### Déclarer le site à Google (Manou, 10 minutes, une seule fois)

1. Va sur https://search.google.com/search-console et connecte-toi avec ton compte Google.
2. Clique sur **Ajouter une propriété**, choisis **Préfixe de l'URL** et saisis `https://planify.manoulabs.com`.
3. Pour la validation, choisis **Balise HTML** et copie seulement la valeur de `content="..."`. Envoie-la à Claude : ce n'est pas un secret, elle est publique dans la page. Claude l'ajoute au site.
   - Variante sans Claude : la validation **Enregistrement DNS** chez Porkbun (ajouter un enregistrement TXT).
4. Une fois validé, va dans **Sitemaps**, saisis `sitemap.xml` et clique sur **Envoyer**.
5. Va dans **Inspection de l'URL**, colle l'adresse de chaque guide et clique sur **Demander une indexation**. Cela accélère la première visite de Google.

### À quoi s'attendre

- Une première apparition dans Google prend en général de quelques jours à quelques semaines. Un trafic régulier prend plutôt 3 à 6 mois pour un site neuf.
- Suivi : dans Search Console, l'onglet **Performances** donne les impressions, les clics et les requêtes. On le regarde une fois par mois, à partir de décembre.
- Prochains guides à forte demande : liste pour un apéro, pique-nique, crémaillère, repas de Noël entre amis, kermesse d'école.

## 2. Appli téléphone : la stratégie

### Ce qui est livré : Planify s'installe déjà comme une appli (PWA)

- Icône Planify sur l'écran d'accueil, ouverture en plein écran, couleur orange dans la barre du téléphone.
- **Android et ordinateur** : un bouton « Installer Planify » apparaît sur la page d'accueil.
- **iPhone** : Safari n'a pas de bouton d'installation. La carte affiche les 3 gestes à faire : Partager, puis « Sur l'écran d'accueil », puis Ajouter.
- Raccourci « Créer un événement » en appui long sur l'icône (Android).
- Sans réseau, Planify affiche une page claire « Pas de connexion » au lieu d'une erreur du navigateur. Aucune donnée d'événement n'est gardée sur le téléphone : elles restent privées et à jour.

### Pourquoi ne pas aller tout de suite sur l'App Store et Google Play

1. **Les invités ne doivent rien installer.** Ils répondent depuis le lien WhatsApp, en un clic. Leur imposer le téléchargement d'une appli ferait chuter le taux de réponse, le chiffre clé de la bêta. Seuls les organisateurs ont intérêt à l'icône, et la PWA la leur donne.
2. **Coût et délai.** Pour le compte développeur, Google Play demande 25 $ une seule fois et Apple 99 $ par an. Il faut compter 1 à 2 semaines de préparation et de validation par store.
3. **Apple refuse les applis qui ne sont qu'un site emballé** (règle 4.2, « fonctionnalité minimale »). Pour être accepté, il faut une vraie fonction de téléphone, typiquement les notifications de rappel, qui ne sont pas encore développées.

### Le plan proposé

| Étape | Quand | Quoi | Coût |
|---|---|---|---|
| 1 | Maintenant | PWA installable (livrée) | 0 € |
| 2 | Après la bêta, si elle est validée | Codex : notifications de rappel (« il manque 3 réponses », « c'est demain »). Elles marchent aussi dans la PWA : Android, et iPhone depuis iOS 16.4 une fois Planify ajouté à l'écran d'accueil | 0 € |
| 3 | Si les organisateurs le demandent | Google Play, en emballant la PWA (TWA via PWABuilder) : même code, aucune réécriture | 25 $ une fois, **feu vert de Manou** |
| 4 | Ensuite | App Store via Capacitor, avec les notifications natives pour passer la règle 4.2 | 99 $/an, **feu vert de Manou** |

Ce plan évite de réécrire Planify en React Native : le code web actuel sert aux 4 étapes.
