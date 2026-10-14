# Atlas du resort

## Source unique

`destinations`, ses relations de médias/liens et les tables de traductions du hub restent la source des cards. La carte utilise `useHub` et ouvre le composant `DestinationDetail` existant. Les noms, descriptions, images, niveaux, collections et visibilité ne sont pas copiés depuis le dépôt de carte. Le niveau de la première card associée est prioritaire sur le niveau du repère : Citron reste Heaven ; La Maison 1888 et Tingara restent Sky.

`map_places` contient uniquement les repères illustrés : identifiant, nom de repère de secours, niveau de repère, numéro, coordonnées x/y, zoom et publication. Les coordonnées correspondent au plan dessiné (pas à des coordonnées GPS). `map_destination_links` relie un repère à une ou plusieurs destinations existantes. `display_order` sélectionne la card principale et ordonne les autres ; `is_primary` choisit la position ouverte depuis une card possédant plusieurs repères, comme Mi Sol Spa.

Les repères publics utilisent une icône de collection issue des cards associées (ou un repère neutre sans collection). Les numéros restent des références internes en base. Les noms apparaissent dans la recherche et dans la fiche après sélection. Sur le dessin, le lieu sélectionné est prioritaire ; les autres étiquettes apparaissent en zoom rapproché si elles n'empiètent pas sur un repère ou un arrêt du Nam Tram. Les boutons conservent leur nom accessible pour les lecteurs d’écran.

## Modifier un lieu

- Texte, image, traduction, niveau ou collection : modifier les tables habituelles du hub.
- Position : modifier x/y dans `map_places` en conservant le référentiel du dessin.
- Association : ajouter une ligne à `map_destination_links` avec les identifiants existants, puis vérifier les deux sens de navigation.
- Retirer une card : désactiver la destination ; la politique RLS retire ses associations publiques. Le repère géographique peut rester comme point d’orientation sans fiche éditoriale. Désactiver aussi `map_places.active` pour masquer complètement ce repère.

Aucune écriture anonyme n’est autorisée. Les associations ne sont lisibles que si la destination et le repère sont actifs. Un index empêche plusieurs positions principales actives pour une destination. Les FK évitent les liens orphelins. Le cache du hub peut retarder une modification d’environ deux minutes.

## Couverture et limites

La migration `20260927120000_resort_map.sql` ajoute 24 repères et 33 associations (32 lisibles publiquement à l’intégration, la réception étant masquée). Plusieurs équipements partagent le repère du bâtiment : La Maison/Wine Cellar/Buffalo Bar, Heritage Village/galerie/boutique, LONG/Soar/Planet Trekkers, Garden Pool/Kids Pool. Cette association n’invente pas de position précise à l’intérieur du bâtiment.

Les offres sans lieu déterminé (IHG, mariages, fêtes…) n’ont pas de point artificiel. Bensley Package ouvre le parcours, Instagram Spots ouvre les repères photo. Les lieux dont le rapprochement reste incertain — Family Pool, B Lounge, Kate McCoy, Family Beach, Club Beach et Sea Experiences — restent accessibles dans le hub ; leur position pourra être ajoutée après validation. Les sentiers, temps de marche et le parcours sont illustratifs, sans géolocalisation ni guidage en temps réel.

## Provenance et performance

Le dessin, les coordonnées et le parcours proviennent du dépôt privé `minedorfbm/adj-interactive-resort-map`, commit `a19804e1cf17c8c897fb856c27b7a65ddae651a0`. L’illustration et le plan de référence sont optimisés en WebP. Les fichiers de cette fonctionnalité se trouvent dans `src/features/resort-map/` ; aucun contenu descriptif du projet source n’est importé. Les styles sont limités à `.hub-atlas` et le composant est chargé seulement à l’ouverture.

## Validation

Exécuter les contrôles habituels du README et `supabase/manual/verify-resort-map.sql`. Tester un repère partagé, une card masquée, la recherche, le zoom/déplacement, le retour card → carte et l’ouverture des PDF/vidéos au-dessus de la carte. Vérifier les formats téléphone portrait/paysage et tablette, puis les gestes sur un véritable iPhone. La migration est rejouable sans écraser les réglages existants.

## Cadrage, stations et recherche — 14 octobre 2026

Les limites de déplacement suivent l'enveloppe du resort et retirent les coins vides du canevas. La vue d'ensemble reste centrée dans l'espace disponible au-dessus du dock et de la fiche ouverte. Le zoom maximal reste à 8 ; les gestes, boutons, clavier et recadrages utilisent les mêmes limites. Les stations gardent leurs coordonnées : leurs étiquettes à taille écran, reliées aux arrêts, utilisent les quatre icônes du resort et évitent les repères proches.

Le filtre hébergements reprend le libellé traduit en capitales des cards. La recherche globale et celle de la carte disposent d'une catégorie dédiée aux destinations de type `accommodation`, indépendamment de leur cluster en base. Les quatre filtres occupent deux colonnes sur mobile.

Moulin Rouge conserve le repère 7 près de Citron. Le [plan officiel du resort](https://www.danang.intercontinental.com/wp-content/uploads/2025/12/InterContinental-Danang-Resort-Map-VN.pdf) distingue ce repère du Summit / cinéma / M Club au repère 2. Aucun déplacement ni changement de données géographiques n'est appliqué dans cette mise à jour.

## Zones des hébergements — 13 octobre 2026

La carte fournie décrit des plages de numéros, pas la répartition exacte des catégories Classic/Club/Suites ni le bâtiment de chaque villa. Quinze cards sont donc associées à cinq zones représentatives, avec une indication explicite de précision dans les six langues. Les numéros sont des références de la zone sur le plan, pas une attribution garantie à chaque catégorie. Le repère des villas Sea représente l’ensemble des villas côtières, pas le bâtiment individuel d’une résidence.

`accommodation_group`, `covered_levels` et `room_numbers` complètent `map_places`. Les zones conservent leur titre et leurs niveaux géographiques ; le premier hébergement lié ne remplace pas le nom de la zone. Un filtre Hébergements et une icône de lit permettent de les repérer. Toutes les cards associées sont proposées, avec une liste défilante sur mobile. Les chambres/suites couvrent Heaven, Sky et Earth ; les penthouses Heaven et Sky ; les villas quatre chambres Earth ; les villas côtières et du lagon Sea. Cela ne modifie pas le niveau éditorial des cards d’accueil.

La préparation `20261013160000_accommodation_map_areas.sql` a été appliquée le 13 octobre 2026 : les colonnes existent et les cinq zones ainsi que les quinze liens sont **inactifs**. Le contrôle public confirme que les repères et associations précédents sont préservés. Les repères existants restent publiés. Après fusion et déploiement du code, exécuter `docs/activate-accommodation-map-areas.sql` puis vérifier les quinze actions View on map et la recherche. Cette séparation empêche l’ancienne interface d’afficher les zones comme des bâtiments précis. [Le relevé des zones](accommodation-map-areas.json) conserve les coordonnées du plan original et celles du dessin du hub.
