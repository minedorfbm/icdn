# InterContinental Danang — Digital Hub

Le hub mobile s’ouvre depuis le QR code intégré à une œuvre d’Art Digital Journey. Le visiteur parcourt les niveaux **Heaven → Sky → Earth → Sea**, fait défiler les cards et ouvre les fiches, menus et liens de réservation.

**Production :** <https://icdnd.artdigitaljourney.com/>. Le rendu serveur et les fichiers statiques sont hébergés sur Cloudflare Workers. Le contenu public et les traductions éditoriales viennent du projet Supabase indépendant ; les images publiées sont dans le bucket public `hub-images`. La landing page <https://artdigitaljourney.com/> possède son propre dépôt et son propre Worker.

## Démarrer en local

Prérequis : Node.js 22.12+ et Bun 1.4.2.

```sh
cp .env.example .env.local
bun install --frozen-lockfile --ignore-scripts
bun run dev
```

Renseigner dans `.env.local` l’URL du projet Supabase et sa **clé publiable**. Ce fichier est ignoré par Git. Les mêmes valeurs publiques de production et de prévisualisation sont déclarées dans `wrangler.json` ; modifier `.env.local` ne modifie pas le Worker déployé. `HUB_TRANSLATIONS_FROM_DATABASE=true` active les traductions publiées dans Supabase.

Le site ne demande ni compte utilisateur ni clé secrète pour lire le contenu. Les politiques RLS limitent les lectures publiques aux lignes autorisées et aucune écriture publique n’est accordée. Une clé secrète Supabase sert uniquement à une opération d’administration locale, par exemple la mise à jour du cache des images ; elle ne doit jamais être ajoutée au dépôt ni aux variables du Worker.

## Vérifier une modification

```sh
bun run security:audit
bun run i18n:check
bun run images:check
bun run test
bun run typecheck
bun run lint
bun run build
bun run deploy:check
```

Le workflow [Validate hub](.github/workflows/ci.yml) exécute ces contrôles sur les pull requests et `main`. `bun run preview:cloudflare` permet ensuite de tester le Worker construit en local. Les gestes tactiles et le rendu responsive doivent aussi être vérifiés dans un navigateur et sur téléphone.

## Modifier le contenu

Supabase est la source de vérité du catalogue. Les tables principales sont `levels`, `destinations`, `destination_links`, `destination_photos`, `destination_events`, `destination_posts` et `site_settings`. Les descriptions et événements traduits se trouvent dans `destination_translations` et `event_translations`. Les anciennes migrations du dépôt décrivent l’historique Lovable ; **ne pas les rejouer sur la base de production déjà importée**.

Pour modifier une card, mettre à jour sa ligne dans `destinations`. Les actions affichées et leur ordre viennent des lignes actives de `destination_links` : la card en montre au plus trois, la fiche toutes. Après un changement de texte anglais, vérifier les traductions associées avec `bun run i18n:audit` ; une traduction dont le texte source ne correspond plus est écartée au profit du texte anglais courant. Les nouveaux textes ne sont pas traduits automatiquement. Procédure détaillée : [traductions](docs/translations.md).

La [procédure de maintenance de la base](docs/database.md) décrit les protections de publication et les migrations du 23 septembre. Les anciennes colonnes d'URL de `destinations` ne pilotent plus les boutons du Worker ; les modifier ne changera pas les cards. Leur suppression physique est une deuxième étape, à lancer seulement après validation du déploiement compatible.

Les photos des cards, niveaux et galeries sont référencées par URL publique Supabase Storage. Pour remplacer une image, publier un WebP optimisé sous un **nouveau nom**, puis changer son URL dans la ligne concernée. Pour l’image d’accueil seulement, `site_settings.hero_image` peut remplacer l’image de Heaven. Les objets déjà publiés et leur cache sont documentés dans le [guide des images](docs/images.md).

Les contenus publics complets sont conservés brièvement en mémoire et dans le cache Cloudflare du centre de données, pendant deux minutes. Une modification Supabase peut donc prendre environ deux minutes à apparaître sur tous les visiteurs. Si une lecture échoue, le site utilise les données locales de secours ; une réponse réussie mais vide reste vide et ne fait pas réapparaître d’anciens contenus.

## Déploiement et structure

Les changements fusionnés dans `main` sont construits pour le Worker `icdnd`. Nitro génère `.output/server/wrangler.json` et `.output/public` ; le site nécessite le rendu serveur et ne se publie pas comme un simple dossier statique. Les paramètres du Worker, des prévisualisations et du domaine sont dans le [guide Cloudflare](docs/cloudflare.md).

- `src/routes/index.tsx` : parcours et progression Nam Tram.
- `src/components/hub/` : cards, fiches, images et navigation.
- `src/lib/hub.functions.ts` : lectures et cache des données Supabase côté serveur.
- `src/data/hub-value.ts` : préparation du contenu et données de secours.
- `src/i18n/` : interface et traductions éditoriales de secours.
- `src/assets/` : images locales de secours ; `tests/` : tests de régression.

Le projet reste connecté à Lovable pour son historique Git. Travailler sur une branche et ouvrir une pull request ; ne pas forcer un push ni réécrire des commits déjà publiés. Le [brief créatif historique](docs/design-brief.md) reste disponible séparément.
