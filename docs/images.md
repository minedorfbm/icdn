# Images dans Supabase Storage

## Fonctionnement actuel

Le site accepte les URL publiques dans `destinations.image_key`, `levels.image_key`, `destination_photos.image_url` et `destination_posts.image_url`. Les anciennes clés locales fonctionnent toujours. La page d’accueil utilise l’image de Heaven, sauf si une valeur `hero_image` existe dans `site_settings`. Son préchargement utilise exactement la même URL.

Le bucket `hub-images` est public et les références du hub ont été basculées vers Supabase Storage. Les 26 images initiales (2,2 Mo) et leurs empreintes sont décrites dans `scripts/storage-manifest.json`. Les fichiers locaux restent disponibles pour le mode de secours lorsque les données essentielles Supabase sont indisponibles ; une URL distante qui renvoie 404 n’est pas remplacée automatiquement.

Les images du catalogue déjà publiées ont été vérifiées après l’import. La migration est terminée : **ne pas relancer** `activate-images.sql` ni les anciennes migrations SQL sur la production. Le script `bun run images:audit` vérifie uniquement les 26 fichiers initiaux du manifeste ; il ne couvre pas les nouvelles images ajoutées ensuite.

Les objets du bucket sont lisibles publiquement, mais l’écriture reste réservée à l’administration. Ne pas créer de politique d’écriture publique pour faciliter l’ajout d’images.

## Changer une image ensuite

- Ajouter une nouvelle image WebP optimisée dans `hub-images` avec un **nouveau nom** pour éviter qu’un cache conserve l’ancienne photo. Conserver l’ancienne image tant qu’elle est référencée.
- Lors du téléversement, régler le cache navigateur sur `31536000` secondes (un an). Les noms versionnés changent avec le contenu, ce qui permet ce cache long. Le réglage se fait avec l’option `cacheControl` de l’API Storage.
- Copier son URL **publique**, sans expiration, dans le champ correspondant à la card, au niveau ou à la galerie. Malgré son nom historique, `image_key` accepte maintenant cette URL complète.
- Pour changer seulement l’image d’accueil, ajouter/modifier `site_settings` : `key = hero_image`, `value = URL publique`. Sans ce réglage, l’accueil suit Heaven.
- Vérifier l’affichage après rechargement. Aucun déploiement ni changement de traduction n’est nécessaire pour remplacer une image.

`bun run images:check` contrôle l’intégrité du paquet initial local en CI. `bun run images:audit` vérifie les fichiers initiaux publiés, pas les nouvelles images ajoutées manuellement après la migration. Le bucket ne constitue pas une interface de sélection d’image intégrée au site et n’optimise pas automatiquement les nouveaux fichiers.

## Corriger le cache des 26 images déjà publiées

`bun run images:cache` compare d’abord les 26 fichiers du dépôt avec ceux du bucket, sans modifier Storage. Si tout correspond, définir `SUPABASE_SECRET_KEY` dans l’environnement du terminal local, puis exécuter `bun run images:cache:apply`. Cette commande remplace les objets par les **mêmes octets** avec `cacheControl: 31536000`. Ne jamais placer la clé secrète dans le dépôt, Cloudflare ou le navigateur. Le script vérifie toute la collection avant le premier remplacement et s’arrête à la première erreur. Les nouvelles images ajoutées après la migration ne sont pas concernées.

Supabase peut mettre un moment à diffuser les nouveaux en-têtes de cache sur tous ses nœuds. Vérifier ensuite une URL d’image publique avec `curl -I` et contrôler son en-tête `cache-control`.

Documentation : https://supabase.com/docs/guides/storage/quickstart
