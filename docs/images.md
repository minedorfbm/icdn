# Images dans Supabase Storage

## État de la bascule

Le site accepte les URL publiques dans `destinations.image_key`, `levels.image_key`, `destination_photos.image_url` et `destination_posts.image_url`. Les anciennes clés locales fonctionnent toujours. La page d’accueil utilise l’image de Heaven, sauf si une valeur `hero_image` existe dans `site_settings`. Son préchargement utilise exactement la même URL.

La PR prépare le code ; elle ne crée pas le bucket, ne téléverse aucun fichier et ne modifie aucune référence en production. Les 26 images initiales (2,2 Mo) et leurs empreintes sont décrites dans `scripts/storage-manifest.json`. Elles correspondent aux images du dépôt, sans conversion ni perte de qualité. Les fichiers locaux restent disponibles pour le mode de secours lorsque les données essentielles Supabase sont indisponibles ; il n’y a pas de remplacement automatique d’une URL distante qui renvoie 404.

## Ordre de migration du projet existant

1. Fusionner la PR et attendre le déploiement Cloudflare.
2. Dans Supabase Storage, créer `hub-images` en mode **Public**. Il ne contient que les images publiques du site. Ne pas ajouter de politique d’écriture publique. L’administration des fichiers se fait dans le tableau de bord Supabase.
3. Téléverser les 26 fichiers versionnés du dossier préparé `hub-images` à la racine du bucket, sans renommer les fichiers et sans ajouter de sous-dossier. Ne pas téléverser les fichiers SQL ou les rapports d’inventaire.
4. Exécuter `bun run images:audit` : les 26 fichiers doivent être lisibles sans authentification et avoir les mêmes octets que les originaux. `image-audit.json` fournit les détails. La clé publique de l’application ne sert pas à téléverser des fichiers.
5. Après cet audit, exécuter le fichier préparé `activate-images.sql` dans le SQL Editor. Ce fichier spécifique au relevé du 23 septembre 2026 vérifie le bucket et la présence/taille des objets. Il ne met à jour que les références qui correspondent encore au relevé, en une transaction. Les 47 images principales (y compris les images par défaut), 4 fonds de niveau et 40 photos passent sur Storage. Les traductions ne sont pas modifiées. Aucun média distant existant n’est copié.
6. Exécuter `verify-images.sql` : aucune ligne attendue. Une référence modifiée depuis le relevé doit être examinée, pas écrasée. Contrôler aussi les cards, galeries et fonds sur le site.

Le dossier de livraison local contient aussi `inventory-before.json` et `rollback-images.sql`. Le retour arrière ne restaure que les URL encore identiques à celles de cette bascule ; il préserve les changements ultérieurs et ne supprime aucun fichier du bucket. Ne pas exécuter les anciennes migrations SQL du dépôt pour cette opération.

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
