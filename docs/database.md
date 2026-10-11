# Base Supabase : cohérence et publication

## Collections et navigation

Le hub utilise trois collections communes aux quatre niveaux : **DINING**, **WELLNESS** et **EXPERIENCES**, dans cet ordre. Les collections vides ne sont pas affichées. La migration [`20260925180000_three_collections.sql`](../supabase/migrations/20260925180000_three_collections.sql) remplace les anciens regroupements, y compris pour les fiches inactives, et dépublie Reception Lobby et Information Desk sans supprimer leurs contenus.

- **DINING** : restaurants, bars et Club InterContinental Lounge.
- **WELLNESS** : spa, soins, sport, yoga, piscines, plages, Relaxation Pavilion et Spa Lagoon Villas.
- **EXPERIENCES** : art, activités famille, lieux à explorer, événements, offres et IHG One Rewards.

À l'issue de cette répartition, les 43 cards visibles sont réparties ainsi :

| Niveau | DINING | WELLNESS | EXPERIENCES |
| ------ | -----: | -------: | ----------: |
| HEAVEN |      2 |        2 |           9 |
| SKY    |      4 |        0 |           4 |
| EARTH  |      3 |        5 |           5 |
| SEA    |      0 |        7 |           2 |

Pour réorganiser une card, modifier `destinations.cluster` avec l'une des trois clés. La répartition de la migration est ponctuelle : un changement de type ne déplace pas automatiquement une card. `levels.clusters` définit l'ordre des onglets ; la base refuse une collection absente du niveau. Les six langues du hub traduisent les libellés. Les anciennes clés du dictionnaire restent compatibles avec un catalogue encore en cache pendant le déploiement.

Le catalogue local de secours a été supprimé. Seules les lignes publiées dans Supabase alimentent les cards. Les identifiants et les quatre niveaux restent disponibles pour la future carte interactive et le funiculaire.

L'intégration GitHub applique la nouvelle migration à la fusion. Ne pas rejouer l'historique complet sur la production. Pour contrôler la répartition :

```sql
SELECT l.id AS niveau, d.cluster AS collection, count(*) AS lieux
FROM public.levels l
JOIN public.destinations d ON d.level_id = l.id AND d.active
GROUP BY l.id, l.display_order, d.cluster
ORDER BY l.display_order, d.cluster;
```

## Vidéos YouTube

La migration [`20260925130000_destination_videos.sql`](../supabase/migrations/20260925130000_destination_videos.sql) ajoute la table `destination_videos` au projet `cxcffaegqyvbhrpzpowa` et publie la vidéo officielle fournie pour `mi-sol-spa`. Elle a été appliquée au projet de production le 25 septembre 2026 ; la requête de contrôle a confirmé une seule ligne active pour `mi-sol-spa`. **Ne pas rejouer l'historique complet des migrations** sur cette base. Le fichier est réexécutable sans dupliquer cette vidéo si l'intégration GitHub le reprend. La table active RLS et n'autorise la lecture publique que pour une vidéo active appartenant à un lieu actif.

Pour préparer une vidéo, créer une ligne dans `destination_videos` avec l'identifiant exact de la card dans `destination_id`, l'URL officielle YouTube en HTTPS dans `video_url`, un `title` et, si souhaité, un objet `title_translations` avec les clés `vi`, `ru`, `zh`, `ko` et `ja`. Régler `display_order` pour l'ordre d'affichage. Laisser `active = false` pendant la préparation, puis le passer à `true` pour publier. Une URL non reconnue est ignorée par le hub ; formats acceptés : `youtube.com/watch?v=…`, `youtu.be/…`, `youtube.com/shorts/…` et `youtube.com/live/…`. Utiliser le lien `/shorts/…` pour obtenir le lecteur vertical 9:16 ; un lien `/watch?v=…` reste affiché en 16:9, même s'il désigne le même Short. Vérifier que le propriétaire de la vidéo autorise l'intégration. Une modification peut mettre environ deux minutes à apparaître à cause du cache.

Le projet de production utilise neuf tables `public` dans Supabase. La base importée depuis Lovable ne partage pas nécessairement l'historique des migrations du dépôt : **ne pas exécuter `db push` ni rejouer toutes les migrations historiques sur la production**. Les deux migrations datées du 23 septembre 2026 sont prévues pour ce schéma déjà importé et se lancent une fois chacune, dans l'ordre, après sauvegarde.

La prise en charge Facebook a été annulée. Le hub ignore les URL Facebook et ne génère plus de lecteur ni d’aperçu. La migration `20260928140000_unpublish_terra_mare_facebook.sql` désactive la ligne Terra Mare concernée sans la supprimer ; les migrations précédentes sont conservées pour la traçabilité.

## Liens multilingues

`destination_link_translations` ajoute une variante facultative par bouton Discover/Website et par langue. `site_link_translations` couvre uniquement le Website du pied de page. RLS conserve la lecture publique des variantes actives de liens visibles, avec refus des écritures des visiteurs. Modifier le lien commun dépublie ses variantes. Procédure : [liens multilingues](localized-links.md).

## Source de vérité du contenu

`destinations` contient l'identité, l'ordre, la catégorie, la description et l'image des lieux. `destination_links` contient les boutons et leur ordre. Lorsqu'une lecture de cette table réussit, une liste vide signifie volontairement « aucun bouton ». Le Worker ne lit plus les anciennes colonnes d'URL de `destinations`. Leur retrait est décrit par la migration historique `20260924120000_retire_legacy_action_columns.sql` ; vérifier l’état installé avant toute intervention. Aucun lien de catalogue local n’est utilisé.

Huit lieux possèdent un ancien `booking_message` sans bouton `BOOK` correspondant. Ces textes et les réglages `booking_channel` / `booking_destination` sont des vestiges d'un canal WhatsApp non activé. **Aucun bouton de réservation n'est créé à partir de ces champs.** Un bouton `BOOK` apparaît seulement lorsqu'un véritable lien approuvé est ajouté à `destination_links`. Les anciens messages restent en base comme archive, sans contrôler le site.

`levels.clusters` définit les catégories affichées sur un niveau. La valeur `destinations.cluster` doit figurer dans la liste du même niveau ; les nouvelles protections refusent une faute de frappe ou la suppression d'une catégorie encore utilisée. Pour masquer un lieu, mettre `destinations.active = false`. Les liens, photos, événements, posts et traductions publiées associés ne sont alors plus lisibles publiquement. Les clés de `site_settings` sont publiques : n'y enregistrer aucun mot de passe ni secret.

Les fiches `penthouses` (« Heavenly Penthouses ») et `rooms` (« Rooms & Villas ») sont conservées en base mais dépubliées par `20260925170000_unpublish_rooms_and_penthouses.sql`. Pour les réafficher plus tard, repasser explicitement leur colonne `active` à `true`. La fiche distincte `spa-lagoon-villas` reste publiée.

Les descriptions des lieux et les textes des événements ont une traduction par langue (`vi`, `ru`, `zh`). Une modification du texte anglais dépublie automatiquement les anciennes traductions correspondantes. Le site montre alors le texte anglais actuel jusqu'à la relecture et republication des traductions. Les colonnes `source_*` doivent être mises à jour seulement après vérification de chaque traduction. Les nouvelles colonnes `created_at` et `updated_at` sont initialisées lors de la migration pour les lignes existantes ; elles ne reconstituent pas leur historique antérieur.

Les libellés standard des boutons restent traduits par le dictionnaire du site. Une légende de photo ou un libellé de bouton personnalisé ajouté dans Supabase n'a pas encore de traduction en base ; éviter ces champs pour du contenu multilingue tant que ce modèle n'est pas étendu.

## Déployer les protections

1. Sauvegarder la base. Vérifier que le projet ciblé est bien `cxcffaegqyvbhrpzpowa` et que les tables de contenu sont présentes.
2. Dans le SQL Editor du projet, exécuter **seulement** `supabase/migrations/20260923120000_content_integrity.sql`, puis `supabase/migrations/20260923121000_translation_lifecycle.sql`. Chaque fichier est transactionnel ; une erreur annule son propre changement.
3. Vérifier que les neuf tables ont toujours RLS activé, que les politiques de lecture des quatre tables enfants incluent le lieu actif, et que les traductions comportent les dates de suivi. Lancer `bun run i18n:audit:database` et les vérifications du hub.
4. Fusionner la PR et vérifier le site mobile. Ces deux migrations n'enlèvent aucune colonne : elles peuvent être appliquées avant ou après le nouveau Worker. Aucun bouton `BOOK` ne doit apparaître du seul fait d'un ancien `booking_message`.
5. **Après** validation du nouveau Worker en production et de la décision éditoriale sur les quatre boutons, exécuter séparément `supabase/migrations/20260924120000_retire_legacy_action_columns.sql`. Ce fichier refuse de supprimer les anciennes colonnes si un lien réel n'a pas été repris dans `destination_links`. Il n'excepte que les quatre liens génériques vers l'accueil du resort. Ne pas lancer cette étape sur l'ancien Worker, qui lit encore ces colonnes.

Ces protections empêchent désormais la suppression accidentelle en cascade d'un niveau, d'un lieu ou d'un événement possédant encore des contenus liés. Utiliser `active = false` pour retirer un lieu du site. Une suppression définitive nécessite de traiter explicitement ses dépendances.

## État constaté avant migration

Inspection directe en lecture seule le 23 septembre 2026 : 4 niveaux, 47 lieux, 75 liens, 40 photos, 4 événements, 1 post et 10 réglages. Les 141 traductions de lieux et 12 traductions d'événements attendues étaient publiées, sans source dépassée. Le bucket public `hub-images` contenait 26 objets ; les 91 références d'image en base pointaient vers ces objets. Aucun contenu actif ne dépendait d'un lieu inactif et aucune catégorie utilisée n'était absente de son niveau.

Quatre lieux actifs n'avaient aucun lien dans `destination_links` malgré une ancienne URL `DISCOVER` générique vers l'accueil du resort : `instagram-spots`, `moulin-rouge`, `relaxation-pavilion` et `wall-of-lanterns`. Il faut décider éditorialement, pour chacun, entre aucun bouton et un véritable lien spécifique ; rétablir l'URL générique serait trompeur.

## Familles éditoriales et espaces marketing

Voir [la classification éditoriale](editorial-taxonomy.md) pour les champs de `destinations`, les trois vues marketing et les règles de publication.

## Pilote des cards agrandies

La migration `20261011120000_editorial_card_pilot.sql` ajoute les réglages du nouveau modèle à `destinations`. Elle active quatre fiches seulement : `citron` (Heaven), `la-maison-1888` (Sky), `long-bar` (Earth) et `mi-sol-spa` (Sea). Le service temporaire de La Maison au Heaven reste une actualité ; il ne change pas son niveau éditorial. Les descriptions, photos, liens, horaires, événements et médias existants restent leurs sources de référence.

**Appliquée et contrôlée sur `cxcffaegqyvbhrpzpowa` le 11 octobre 2026.** Le contrôle retrouve quatre fiches `editorial`, cinq traductions en plus de l'anglais pour chacune, une relation et toujours 75 destinations au total. Le lien principal est DISCOVER pour Citron et L_O_N_G Bar, BOOK pour La Maison et Mi Sol Spa, selon leurs liens actuellement publiés. Ne pas réexécuter cette migration sur cette base. Le nouveau rendu devient visible seulement après le déploiement du code de la PR.

| Champ dans `destinations` | Utilisation                                                                                                                              |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `detail_layout`           | `classic` conserve la présentation actuelle ; `editorial` active le nouveau modèle commun.                                               |
| `primary_link_id`         | Identifiant d'un lien existant de **la même fiche** dans `destination_links`. Il est mis en avant et retiré de la collection secondaire. |
| `links_heading`           | Titre personnalisé sous le label de la collection de liens.                                                                              |
| `video_heading`           | Titre personnalisé sous « In motion ».                                                                                                   |
| `instagram_heading`       | Titre personnalisé sous « From our world ».                                                                                              |
| `heading_translations`    | Traductions des trois titres, associées à leur texte anglais de référence.                                                               |

Un `primary_link_id` vide sélectionne automatiquement BOOK, puis DISCOVER/WEBSITE, puis la première action publiée. Si le lien choisi est dépublié, aucun bouton principal de remplacement n'est inventé. Sa suppression efface la sélection ; le choix automatique reprend alors. Les URL restent uniquement dans `destination_links`, avec leurs traductions existantes. Une même destination peut proposer plusieurs menus distincts.

Les labels communs sont traduits dans le dictionnaire du hub (EN, VI, RU, ZH, KO, JA). Les titres personnalisés se gèrent en base, par exemple :

```json
{ "ja": { "video": { "source": "A table above the bay.", "value": "湾を見渡すテーブル。" } } }
```

Si le titre anglais change, sa traduction ne s'affiche plus tant que `source` n'a pas été actualisé après relecture. Une section sans contenu n'est pas rendue, même si son titre est renseigné. Les titres des quatre fiches pilotes sont initialisés dans les six langues. Les libellés personnalisés des actions conservent le fonctionnement actuel du dictionnaire ; cette migration ne crée pas de traduction libre de ces libellés.

`destination_relations` relie deux fiches par leurs identifiants, dans l'ordre alphabétique, avec `display_order` et `active`. Une seule ligne suffit pour les deux sens et aucun nom, texte ou visuel n'est recopié. Le pilote relie La Maison 1888 à Wine Cellar puis Buffalo Bar, L_O_N_G Bar à L_O_N_G Pool, et Mi Sol Spa à One-Bedroom Spa Lagoon Villa. Les trois dernières relations sont ajoutées par `20261011150000_complete_pilot_relations.sql`, sans remplacer la relation Wine Cellar. Une relation vers une fiche inactive n'est pas publique. Durant le pilote, seules les pages utilisant le nouveau modèle affichent ce bloc ; les fiches associées conservent donc leur présentation classique. L'édition reste réservée aux opérateurs du projet Supabase ; aucune écriture anonyme n'est autorisée.

Déploiement : appliquer **uniquement cette nouvelle migration**, une fois, avant de déployer le code. Ne pas rejouer l'historique complet. L'ancien code ignore les colonnes ajoutées ; le nouveau code peut aussi afficher le catalogue classique si la migration n'est pas encore appliquée. Vérifier les quatre fiches, un lien PDF, les horaires, les événements, les médias, la recherche, le téléphone et la relation sur mobile. Le bouton « Continue the journey » suit l'ordre du carrousel d'origine ; une arrivée directe utilise l'ordre des niveaux et des fiches publiées.

Pour revenir immédiatement à l'ancien modèle, remettre `detail_layout = 'classic'` sur les quatre identifiants et attendre l'expiration du cache public (deux minutes). Il n'est pas nécessaire de supprimer les colonnes ni les relations. Après validation du pilote, l'activation des autres fiches sera une modification de ce champ, sans recréer leurs contenus. La branche classique sera retirée lors de la généralisation, avec le code de compatibilité de migration, pour ne pas maintenir durablement deux modèles.
