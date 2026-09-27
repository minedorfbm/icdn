# Atlas du resort

## Source unique

`destinations`, ses relations de médias/liens et les tables de traductions du hub restent la source des cards. La carte utilise `useHub` et ouvre le composant `DestinationDetail` existant. Les noms, descriptions, images, niveaux, collections et visibilité ne sont pas copiés depuis le dépôt de carte. Le niveau de la première card associée est prioritaire sur le niveau du repère : Citron reste Heaven ; La Maison 1888 et Tingara restent Sky.

`map_places` contient uniquement les repères illustrés : identifiant, nom de repère de secours, niveau de repère, numéro, coordonnées x/y, zoom et publication. Les coordonnées correspondent au plan dessiné (pas à des coordonnées GPS). `map_destination_links` relie un repère à une ou plusieurs destinations existantes. `display_order` sélectionne la card principale et ordonne les autres ; `is_primary` choisit la position ouverte depuis une card possédant plusieurs repères, comme Mi Sol Spa.

## Modifier un lieu

- Texte, image, traduction, niveau ou collection : modifier les tables habituelles du hub.
- Position : modifier x/y dans `map_places` en conservant le référentiel du dessin.
- Association : ajouter une ligne à `map_destination_links` avec les identifiants existants, puis vérifier les deux sens de navigation.
- Retirer une card : désactiver la destination ; la politique RLS retire ses associations publiques. Le repère géographique peut rester comme point d’orientation sans fiche éditoriale. Désactiver aussi `map_places.active` pour masquer complètement ce repère.

Aucune écriture anonyme n’est autorisée. Les associations ne sont lisibles que si la destination et le repère sont actifs. Un index empêche plusieurs positions principales actives pour une destination. Les FK évitent les liens orphelins. Le cache du hub peut retarder une modification d’environ deux minutes.

## Couverture et limites

La migration `20260927120000_resort_map.sql` ajoute 24 repères et 33 associations (32 lisibles publiquement à l’intégration, la réception étant masquée). Plusieurs équipements partagent le repère du bâtiment : La Maison/Wine Cellar/Buffalo Bar, Heritage Village/galerie/boutique, LONG/Soar/Planet Trekkers, Garden Pool/Kids Pool. Cette association n’invente pas de position précise à l’intérieur du bâtiment.

Les offres sans lieu déterminé (IHG, mariages, fêtes…) n’ont pas de point artificiel. Bensley Package ouvre le parcours, Instagram Spots ouvre les repères photo. Les lieux dont le rapprochement reste incertain — Family Pool, B Lounge, Kate McCoy, Family Beach, Club Beach, Spa Lagoon Villas et Sea Experiences — restent accessibles dans le hub ; leur position pourra être ajoutée après validation. Les sentiers, temps de marche et le parcours sont illustratifs, sans géolocalisation ni guidage en temps réel.

## Provenance et performance

Le dessin, les coordonnées et le parcours proviennent du dépôt privé `minedorfbm/adj-interactive-resort-map`, commit `a19804e1cf17c8c897fb856c27b7a65ddae651a0`. L’illustration et le plan de référence sont optimisés en WebP. Les fichiers de cette fonctionnalité se trouvent dans `src/features/resort-map/` ; aucun contenu descriptif du projet source n’est importé. Les styles sont limités à `.hub-atlas` et le composant est chargé seulement à l’ouverture.

## Validation

Exécuter les contrôles habituels du README et `supabase/manual/verify-resort-map.sql`. Tester un repère partagé, une card masquée, la recherche, le zoom/déplacement, le retour card → carte et l’ouverture des PDF/vidéos au-dessus de la carte. Vérifier les formats téléphone portrait/paysage et tablette, puis les gestes sur un véritable iPhone. La migration est rejouable sans écraser les réglages existants.
