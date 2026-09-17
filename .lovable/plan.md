# Vrais posts Instagram dans les fiches détaillées

Aujourd'hui la fiche affiche une bande de photos (galerie maison) : on voit des images, pas des posts. Objectif : voir le post tel qu'il apparaît sur Instagram — compte, photo, légende, date, lien.

## Ce qu'on va faire

1. **Bloc "post Instagram" dans la fiche détaillée**, à la place / au-dessus de la bande photo actuelle.
2. **Vrai embed officiel** quand on dispose du lien d'un post public : le post s'affiche via le lecteur Instagram, avec sa légende complète et le lien vers le compte.
3. **Repli élégant** si Instagram ne charge pas (réseau, post privé, chargement lent) : une carte au format post — avatar, nom du compte, photo, légende, mention "Voir sur Instagram". L'utilisateur voit toujours quelque chose de propre, jamais un cadre vide.
4. **Simulation immédiate** : je prépare un aperçu sur un lieu (La Maison 1888 ou Tingara) et je vous montre une capture sur mobile, avec le vrai embed et la version de repli côte à côte, pour que vous choisissiez.
5. Les contenus (lien du post, légende, compte) sont stockés en base, comme le reste — rien en dur dans le code.

## Portée

- Tous les lieux ayant un Instagram ; ceux sans lien de post gardent la galerie actuelle.
- Un seul post mis en avant par lieu au départ, extensible à plusieurs ensuite.
- Aucune modification des cartes du fil principal.

## Détails techniques

- Nouveau composant `InstagramPostEmbed.tsx` : `blockquote.instagram-media` + chargement unique et différé de `//www.instagram.com/embed.js`, montage sur `IntersectionObserver` pour ne rien charger hors écran.
- Détection d'échec : si aucune iframe n'est injectée après un délai court, bascule sur le rendu maison (mêmes données : avatar, handle, image, légende).
- Données : table `destination_links` étendue ou nouvelle table `destination_posts` (post_url, caption, image, posted_at, order) ; lecture dans `hub.functions.ts` et `hub-context.tsx`.
- `DestinationDetail.tsx` rend le post au-dessus de `InstagramStrip`, qui reste pour les lieux sans post.
- Légendes traduites : la légende d'origine reste en anglais ; les libellés d'interface (VOIR SUR INSTAGRAM, etc.) sont traduits EN/VI/RU/ZH.
- Styles alignés sur le fond de l'univers (`--level-bg` / `--level-fg`), contrastes renforcés comme pour les boutons.
