# Hébergement Cloudflare Workers

Le hub est déjà en production sur <https://icdnd.artdigitaljourney.com/>. Le Worker `icdnd` est relié au dépôt `minedorfbm/icdnd`, branche `main`. Cloudflare sert à la fois le rendu serveur TanStack Start et les fichiers statiques. La landing page `artdigitaljourney.com` relève d’un autre dépôt et d’un autre Worker.

## Construction et déploiement

La configuration du dépôt est dans `wrangler.json`. Le build `bun run build` génère `.output/server/wrangler.json` et `.output/public` ; `bun run deploy` déploie cette sortie. Le Worker ne doit pas être remplacé par une publication du seul dossier statique.

Pour reproduire la configuration du build Cloudflare :

- Node.js 22.12 ou supérieur et Bun 1.4.2 ;
- installation : `bun install --frozen-lockfile --ignore-scripts` ;
- build : `bun run build` ;
- déploiement : `bun run deploy`.

Le workflow GitHub Actions valide les pull requests et `main`. `bun run deploy:check` vérifie le paquet local sans le publier. `bun run preview:cloudflare` démarre le Worker construit dans le moteur local de Cloudflare.

Le site et les prévisualisations utilisent `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` et `HUB_TRANSLATIONS_FROM_DATABASE` définis dans `wrangler.json`. La clé est **publique** et les lectures restent limitées par les politiques RLS. Ne jamais ajouter de clé secrète Supabase au Worker ou au dépôt. Les fichiers `.env.local` ne concernent que le développement local.

## Vérifier une publication

Après un déploiement, ouvrir le domaine de production et contrôler les quatre niveaux, le swipe dans les deux sens, l’ouverture d’une fiche, ses liens et les traductions. Vérifier également qu’aucune erreur `[hub]` ne signale une lecture Supabase indisponible dans les logs du Worker. Une modification du contenu en base peut prendre environ deux minutes à se refléter, car les données publiques sont mises en cache brièvement dans les instances et dans le centre de données Cloudflare.

Le domaine personnalisé est configuré dans Cloudflare et n’est pas recréé par `wrangler.json`. Le DNS du domaine racine et les enregistrements de messagerie OVH (MX, SPF, DKIM, DMARC) ne sont pas modifiés par ce dépôt.

Le preset Nitro est `cloudflare-module`. `@lovable.dev/vite-tanstack-config` reste une dépendance de compilation, mais l’exécution du site ne dépend plus de l’hébergement Lovable.
