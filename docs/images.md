# Images dans Supabase Storage

## Fonctionnement actuel

Le site accepte les URL publiques dans `destinations.image_key` (card d’accueil), `destinations.detail_image_key` (card agrandie), `levels.image_key`, `destination_photos.image_url` et `destination_posts.image_url`. Les anciennes clés locales fonctionnent toujours. La page d’accueil utilise par défaut la photo de la vasque fleurie dans le hall, intégrée au site. Une valeur `hero_image` dans `site_settings` peut la remplacer sans déploiement. Son préchargement utilise exactement la même URL.

Le bucket `hub-images` est public et les références du hub ont été basculées vers Supabase Storage. Les 26 images initiales (2,2 Mo) et leurs empreintes sont décrites dans `scripts/storage-manifest.json`. Les fichiers locaux restent disponibles pour résoudre les anciennes clés d’image et les images absentes d’une ligne publiée ; une URL distante qui renvoie 404 n’est pas remplacée automatiquement.

Les deux références exactes du lobby `hero-lobby-portrait-no-chandelier-e29f7810e97a.webp` et `hero-lobby-landscape-no-chandelier-f06bd383569a.webp` du bucket de ce projet sont servies par leurs copies intégrées au site. Leurs octets et empreintes SHA-256 ont été comparés aux objets publics le 26 octobre 2026 : fichiers identiques, respectivement 120 038 et 197 540 octets. Le navigateur utilise ainsi les fichiers versionnés du même domaine avec cache long, au lieu du cache Storage d'une heure. Le hero et son préchargement partagent toujours la même résolution. Une nouvelle URL CMS, un autre projet ou une variante avec paramètres n'est pas substitué : pour remplacer une photo, conserver la procédure de nouveau nom ci-dessous. Aucun objet Storage ni délai de publication des données n'est modifié par cette correspondance.

Les images du catalogue déjà publiées ont été vérifiées après l’import. La migration est terminée : **ne pas relancer** `activate-images.sql` ni les anciennes migrations SQL sur la production. Le script `bun run images:audit` vérifie uniquement les 26 fichiers initiaux du manifeste ; il ne couvre pas les nouvelles images ajoutées ensuite.

Les objets du bucket sont lisibles publiquement, mais l’écriture reste réservée à l’administration. Ne pas créer de politique d’écriture publique pour faciliter l’ajout d’images.

## Changer une image ensuite

- Ajouter une nouvelle image WebP optimisée dans `hub-images` avec un **nouveau nom** pour éviter qu’un cache conserve l’ancienne photo. Conserver l’ancienne image tant qu’elle est référencée.
- Lors du téléversement, régler le cache navigateur sur `31536000` secondes (un an). Les noms versionnés changent avec le contenu, ce qui permet ce cache long. Le réglage se fait avec l’option `cacheControl` de l’API Storage.
- Copier son URL **publique**, sans expiration, dans le champ correspondant. `destinations.image_key` pilote la card d’accueil, la recherche et les aperçus ; `destinations.detail_image_key` pilote uniquement la couverture agrandie. Après la migration, les deux champs contiennent la même référence initiale ; modifier l’un n’altère pas l’autre. Si `detail_image_key` est vide, le site utilise `image_key`. Malgré leur nom historique, ces champs acceptent une URL complète.
- Pour changer seulement l’image d’accueil, ajouter/modifier `site_settings` : `key = hero_image`, `value = URL publique` de la nouvelle image dans `hub-images`. Sans ce réglage, l’accueil utilise la photo de la vasque intégrée au site.
- Vérifier l’affichage après rechargement. Aucun déploiement ni changement de traduction n’est nécessaire pour remplacer une image.

`bun run images:check` contrôle l’intégrité du paquet initial local en CI. `bun run images:audit` vérifie les fichiers initiaux publiés, pas les nouvelles images ajoutées manuellement après la migration. Le bucket ne constitue pas une interface de sélection d’image intégrée au site et n’optimise pas automatiquement les nouveaux fichiers.

## Corriger le cache des 26 images déjà publiées

`bun run images:cache` compare d’abord les 26 fichiers du dépôt avec ceux du bucket, sans modifier Storage. Si tout correspond, définir `SUPABASE_SECRET_KEY` dans l’environnement du terminal local, puis exécuter `bun run images:cache:apply`. Cette commande remplace les objets par les **mêmes octets** avec `cacheControl: 31536000`. Ne jamais placer la clé secrète dans le dépôt, Cloudflare ou le navigateur. Le script vérifie toute la collection avant le premier remplacement et s’arrête à la première erreur. Les nouvelles images ajoutées après la migration ne sont pas concernées.

Supabase peut mettre un moment à diffuser les nouveaux en-têtes de cache sur tous ses nœuds. Vérifier ensuite une URL d’image publique avec `curl -I` et contrôler son en-tête `cache-control`.

Documentation : https://supabase.com/docs/guides/storage/quickstart

## Cadrage des cards

`destinations.image_position` accepte deux pourcentages, par exemple `28% 50%`.
Le cadrage s'applique à la photo d'accueil et à ses aperçus ; la couverture agrandie
reste indépendante. La valeur vide centre la photo. Lors du remplacement de
`image_key`, réexaminer aussi ce cadrage pour éviter de reprendre le point focal
de l'ancienne photo.

L'import du 16 octobre 2026 est décrit dans `docs/catalogue-refresh-20261016.json`.
Les 19 nouveaux WebP ont été téléversés sous des noms versionnés et vérifiés par
empreinte. L'interface Storage leur attribue un cache d'une heure ; les anciens
fichiers ont été conservés.
