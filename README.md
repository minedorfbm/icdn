# InterContinental Danang — Digital Hub

Expérience mobile accessible depuis un QR code intégré à une œuvre d’Art Digital Journey. Le parcours descend à travers **Heaven → Sky → Earth → Sea** ; chaque niveau propose des lieux à parcourir horizontalement, avec fiches, menus, événements et réservations.

Adresse du hub : https://icdnd.artdigitaljourney.com/ . L’hébergement actuel reste géré par Lovable ; la migration vers un compte Cloudflare et un projet Supabase indépendants est préparée séparément.

## Développement

Stack : React 19, TypeScript, TanStack Start (rendu serveur), Vite, Tailwind CSS 4 et Supabase. La configuration de compilation actuelle est fournie par `@lovable.dev/vite-tanstack-config` et utilise Nitro pour sa sortie Cloudflare.

Prérequis : Node.js 22.12+ et Bun 1.4.2 (version utilisée pour les vérifications).

```sh
bun install --frozen-lockfile
bun run dev
```

Ouvrir l’adresse affichée par Vite. Les commandes de validation sont :

```sh
bun run test
bun run typecheck
bun run lint
bun run build
bun run preview
```

Le workflow GitHub Actions `.github/workflows/ci.yml` exécute ces contrôles sur les pull requests et les mises à jour de `main`.

Les tests de régression portent sur l’autorité des contenus Supabase et la sélection des actions. Les vérifications de navigation et de responsive nécessitent aussi un navigateur, notamment en portrait et paysage.

## Configuration

Les valeurs propres à un environnement peuvent être placées dans `.env.local` (ignoré par Git). Le fichier `.env` contient la configuration publique du projet Supabase indépendant `cxcffaegqyvbhrpzpowa` ; ne pas y ajouter de secret.

| Variable                        | Utilisation                                                  |
| ------------------------------- | ------------------------------------------------------------ |
| `SUPABASE_URL`                  | URL du projet, lecture côté serveur                          |
| `SUPABASE_PUBLISHABLE_KEY`      | Clé publique pour les lectures autorisées par les règles RLS |
| `VITE_SUPABASE_URL`             | URL du client Supabase navigateur                            |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Clé publique du client navigateur                            |

Exemple sans valeurs de production : `.env.example`. Le hub public ne nécessite pas de clé `service_role`. Une clé administrateur ne doit jamais être incluse dans une variable `VITE_*`.

L’export Git ne sauvegarde pas les données vivantes de la base. Avant toute migration, exporter également les lignes actuelles, y compris inactives, et les éventuels fichiers Storage. Les migrations contiennent des données initiales : ne pas les additionner aveuglément à un export réel.

## Migration vers le Supabase indépendant

Les sept tables du hub ont été importées depuis l’export Lovable du 22 septembre 2026 : 4 niveaux, 47 destinations, 75 liens, 40 photos, 4 événements, 1 publication et 10 paramètres. La lecture via la clé publique du nouveau projet a été vérifiée sur les sept tables (181 lignes au total).

Pour lancer le serveur local avec les variables serveur du nouveau projet :

```sh
node --env-file=.env node_modules/vite/bin/vite.js
```

Les variables déjà définies par l’hébergeur ont priorité sur `.env`. Lors du déploiement, configurer `SUPABASE_URL` et `SUPABASE_PUBLISHABLE_KEY` côté serveur, et leurs équivalents `VITE_*` lors du build. Modifier le fichier Git ne remplace pas les variables gérées dans Lovable ou Cloudflare. La bascule de l’hébergement et du domaine reste une étape distincte.

Le `project_id` dans `supabase/config.toml` ne constitue pas une authentification ni une liaison CLI au projet distant. Ne pas relancer les migrations historiques et leurs données initiales sur la base déjà importée. Aucune clé administrateur n’est nécessaire pour servir le hub public.

## Contenu et base de données

Les sept tables principales sont `levels`, `destinations`, `destination_links`, `destination_photos`, `destination_events`, `destination_posts` et `site_settings`. Leurs migrations, contraintes et politiques RLS se trouvent dans `supabase/migrations`.

**Une réponse réussie de la base est la source de vérité, même vide.** Retirer tous les événements, photos ou liens d’un lieu ne réactive plus les anciennes données locales. Une table indisponible est représentée par `null`, tandis qu’une liste vide `[]` signifie qu’aucun contenu n’est publié.

Les données locales servent uniquement si la configuration ou la lecture correspondante est indisponible ; un message est alors écrit dans les logs serveur. Les requêtes de contenu ont un délai réseau borné. Si les tables essentielles des niveaux ou destinations échouent, le catalogue local prend le relais.

Les liens actifs de `destination_links` déterminent les actions, leurs libellés personnalisés et leur ordre. Tous restent visibles dans la fiche. La card en présente au maximum trois, en réservant une place à BOOK lorsqu’un lien de réservation est explicitement configuré. Instagram dispose d’un accès séparé. Les anciennes colonnes de liens restent compatibles uniquement en mode de secours ; aucune colonne ni donnée n’est supprimée par ces corrections.

Les traductions éditoriales sont encore dans le code. Une modification du texte anglais en base ne modifie pas automatiquement les traductions ; leur administration en base reste une évolution à prévoir.

## Organisation

- `src/routes/index.tsx` : parcours principal et progression Nam Tram.
- `src/components/hub/` : cards, fiches, galeries et navigation.
- `src/components/ui/fullscreen-dialog.tsx` : dialogue partagé, focus et fermeture des couches.
- `src/lib/hub.functions.ts` : lectures Supabase côté serveur.
- `src/data/hub-value.ts` : transformation du contenu et stratégie de secours.
- `src/lib/destination-actions.ts` : sélection des actions configurées.
- `src/data/resort.ts`, `src/data/events.ts` : types, correspondance des images et contenu de secours.
- `src/i18n/` : traductions ; `src/assets/` : photographies locales.
- `tests/` : tests métier de non-régression.

## Git et Lovable

Travailler sur une branche et ouvrir une pull request. La branche connectée à Lovable se synchronise avec son éditeur. Ne pas réécrire l’historique publié : pas de force push, amend ou rebase des commits déjà poussés. Le passage à Cloudflare et au nouveau Supabase sera validé avant de basculer le domaine du QR code.

Le [brief créatif historique](docs/design-brief.md) est conservé séparément.
