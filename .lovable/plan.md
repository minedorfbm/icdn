# Carrousel de 5 posts Instagram dans les fiches

Aujourd'hui chaque fiche détaillée n'affiche qu'un seul post Instagram (le premier enregistré). On passe à un carrousel horizontal pouvant afficher jusqu'à 5 posts.

## Ce que verra le visiteur

- Sous la description du lieu : un bandeau « LATEST POSTS » avec jusqu'à 5 vrais posts Instagram.
- On fait glisser horizontalement d'un post à l'autre, un post à la fois, calé au bord (comme les cartes du site).
- De petits points sous le carrousel indiquent la position (1 sur 5) et permettent de sauter à un post.
- Chaque post reste un vrai embed officiel : compte, photo/carrousel, légende complète, lien vers Instagram.
- Si un post ne charge pas, il est remplacé par la carte de repli déjà en place, à la même taille que les autres.
- S'il n'y a qu'un seul post, l'affichage reste identique à aujourd'hui (pas de points, pas de défilement).

## Ajout des posts

Rien à coder pour vous : une ligne par post dans la table `destination_posts` (identifiant du lieu + lien du post, plus l'ordre d'affichage). Les 5 premiers posts actifs, triés par ordre d'affichage, sont repris automatiquement.

## Détails techniques

- `src/components/hub/InstagramPostCarousel.tsx` (nouveau) : conteneur scroll-snap horizontal (`overflow-x-auto`, `snap-x snap-mandatory`, masquage de la barre de défilement), chaque slide en largeur quasi pleine, rendu de `InstagramPostEmbed` par slide, points de pagination synchronisés sur l'événement `scroll` et navigation au clic via `scrollTo`.
- `InstagramPostEmbed` reste inchangé dans sa logique ; chargement paresseux conservé (IntersectionObserver par slide, donc les posts hors écran ne chargent pas tout de suite).
- `src/components/hub/DestinationDetail.tsx` : remplace `dest.posts?.[0]` par le carrousel alimenté par `dest.posts.slice(0, 5)`.
- `src/i18n/dictionary.ts` : ajout d'une clé `latest_posts` (EN/VI/RU/ZH) utilisée quand il y a plus d'un post ; `latest_post` conservé pour le cas unique.
- Aucun changement de schéma : la table `destination_posts` gère déjà plusieurs lignes par lieu via `display_order`.
