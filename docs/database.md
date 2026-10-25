# Base Supabase : cohérence et publication

> Dernier relevé vérifié : **25 octobre 2026, après la PR 170**, sur le projet `cxcffaegqyvbhrpzpowa`. Le journal contient **92 versions**, jusqu’à `20261025010001`, avec la même empreinte de liste que les migrations de [`main` à cette révision](https://github.com/minedorfbm/icdn/tree/004ab0e201c5af37af4afb1b5c2c85266c72d33d/supabase/migrations). Ce contrôle porte sur les identifiants enregistrés, pas sur l’identité de tous les effets SQL ni sur une restauration. Les comptages de septembre et de l’[audit du 14 octobre](audits/code-security-2026-10-14.md) sont historiques. **Ne pas rejouer les anciennes migrations éditoriales, lancer un `db push` global ou réparer le journal sans examiner l’état réellement installé.**

## Procédure de maintenance actuelle

1. Vérifier le projet ciblé, la révision Git fusionnée et les résultats des déploiements Supabase et Cloudflare. Relever le journal en lecture seule avec la requête ci-dessous. Une fusion et un test local réussis ne prouvent pas que la base distante a été mise à jour.
2. Préparer chaque changement de schéma ou de droits dans **un nouveau fichier** de `supabase/migrations`, avec une version unique. Conserver les fichiers déjà fusionnés. Une modification éditoriale courante passe par les tables de contenu existantes ; elle ne nécessite pas de rejouer la migration qui les avait initialisées.
3. Exécuter `bun run migrations:check` pour les noms et doublons, puis `bun run migrations:test` pour reconstruire une base PostgreSQL locale jetable et vérifier les permissions et les contrats publics. Ce second contrôle utilise PGlite et ne se connecte pas à Supabase. Il ne restaure ni le contenu actuel du CMS ni les fichiers Storage.
4. Avant une opération distante, vérifier la sauvegarde disponible et le plan de retour correspondant au changement. Faire relire le SQL et les effets attendus dans la PR. Préserver la compatibilité pendant les déploiements indépendants de la base et du frontend.
5. Fusionner normalement la PR approuvée ; l’intégration Supabase applique les migrations non enregistrées. Vérifier sa réussite et celle du Worker, puis relire le journal et contrôler le comportement public attendu. Si une étape échoue ou si le journal diverge, examiner la cause ; ne pas marquer une migration comme appliquée pour masquer l’écart.
6. Pour revenir sur le code, utiliser un commit de revert normal. Cela **n’annule pas** une migration SQL ni une modification de contenu. Un retour en base nécessite une correction relue ou une restauration vérifiée ; ne pas réinitialiser la production ou réécrire l’historique Git.

### Contrôle du journal en lecture seule

```sql
SELECT
  count(*) AS recorded_versions,
  max(version) AS latest_recorded_version,
  md5(string_agg(version, ',' ORDER BY version)) AS version_set_checksum
FROM supabase_migrations.schema_migrations;
```

Au relevé du 25 octobre : `92`, `20261025010001`, `81ea7069fd45f497acbeb5e064183f86`. Cette empreinte sert à comparer la liste ordonnée des versions ; ce n’est ni une signature de sécurité ni une empreinte des corps SQL. Refaire la comparaison après les futures migrations au lieu de conserver ces valeurs comme une cible permanente. Une égalité de nombre ou de dernière version ne suffit pas à établir l’égalité de la liste.

Le [suivi de réconciliation d’octobre](audits/reliability-followup-2026-10-14.md) explique la correction de l’ancien journal sans rejouer les contenus. Il décrit une opération passée, pas une procédure automatique de réparation. La [documentation Supabase sur les migrations](https://supabase.com/docs/guides/deployment/database-migrations) distingue également l’exécution du SQL du suivi de son historique.

## Lecture publique et caches

Les lectures serveur utilisent exclusivement le client anonyme, avec validation des réponses et politiques RLS du visiteur. Les trois fonctions de snapshot sont `STABLE`, `SECURITY INVOKER`, avec un `search_path` fixé et des colonnes publiques explicites.

| Arrivée du visiteur | Données attendues avant le premier HTML | Chargements suivants |
| --- | --- | --- |
| Accueil | Réglages publics `site_settings` | Catalogue complet en arrière-plan |
| Fiche ouverte directement | Réglages et fiche publiée via `published_hub_destination_card_v1` ; horaires initiaux inclus | Catalogue complet en arrière-plan, médias propres à la fiche |
| Autre fiche avec un catalogue valide | Projection de la fiche demandée depuis ce catalogue | Médias propres à la nouvelle fiche |

Les réglages et la fiche directe sont demandés **en parallèle**, pas successivement. `published_hub_catalogue_v1()` regroupe les collections publiques du catalogue, horaires inclus. `published_hub_destination_media_v1(id)` vérifie la publication et regroupe galerie, posts, vidéos, horaires, actualités et sous-cards. Les médias plus récents gardent la priorité sur les horaires initiaux, y compris une liste volontairement vide.

| Cache serveur | Clé à la révision PR 170 | Expiration |
| --- | --- | --- |
| Réglages | `settings-v1` | 2 minutes strictes |
| Catalogue complet | `catalogue-v11` | 2 minutes strictes |
| Fiche ciblée | `card-v3/{id}` | 2 minutes strictes |
| Médias d’une fiche | `media-v4/{id}` | 2 minutes strictes |

Les [clés et délais serveur](../src/lib/hub-cache.server.ts), la [projection de fiche](../src/lib/card-snapshot.server.ts) et les [lectures](../src/lib/hub.functions.ts) font foi si ces contrats évoluent. Une fiche extraite d’un catalogue ne crée pas une nouvelle entrée et ne renouvelle pas son expiration. Les réponses partielles ou en échec ne sont pas conservées ; une expiration ne ressuscite pas un contenu plus ancien. Le cache navigateur partage les requêtes en cours et conserve les réponses complètes jusqu’à 30 secondes, indépendamment du cache serveur. Les réglages publics ne doivent contenir aucun secret.

Seule l’erreur de fonction absente `PGRST202` active les lecteurs de compatibilité. Une panne, une permission refusée ou une réponse invalide reste une erreur relançable par l’interface, sans nouvelle salve de lectures ni tentative automatique du SDK. Chaque appel Supabase est borné à 8 secondes ; ce délai n’est pas une promesse de temps total de page.

`Server-Timing` distingue réglages, catalogue, fiche et médias ainsi que leur provenance (`cache`, `catalogue-cache`, `database`, `rpc`, `compatibility`). La durée comprend le travail applicatif de validation et de cache ; elle ne mesure pas uniquement le SQL ni l’affichage complet. Comparer les lectures hors cache entre elles et conserver les conditions de mesure. Une réponse en cache ne prouve pas à elle seule que la fonction distante est installée.

## Sauvegarde et restauration

Le contrôle du 25 octobre confirme que l’offre actuelle n’inclut pas de sauvegardes Supabase restaurables. Un export réel des 23 tables du CMS (1 437 lignes) et des 118 fichiers du bucket public `hub-images` a été récupéré et vérifié sur une cible locale jetable : empreintes identiques, 74 fiches publiées lisibles et droits visiteurs contrôlés. Aucune donnée de production n’a été modifiée.

Voir la [procédure reproductible et ses limites](cms-recovery.md), l’[export SELECT](../supabase/manual/export-cms-recovery.sql) et le [script d’archivage et de vérification hors ligne](../scripts/rehearse-cms-recovery.ts). Cet exercice couvre le CMS et les fichiers de ce bucket ; il ne remplace pas une sauvegarde chiffrée indépendante du poste ni une restauration complète du compte Supabase. Les [sauvegardes de base Supabase](https://supabase.com/docs/guides/platform/backups) contiennent les métadonnées Storage, pas les fichiers eux-mêmes. Ne pas lancer de restauration sur la production pour reproduire le test.

## Collections et navigation

Le hub utilise trois collections communes aux quatre niveaux : **DINING**, **WELLNESS** et **EXPERIENCES**, dans cet ordre. Les collections vides ne sont pas affichées. La migration [`20260925180000_three_collections.sql`](../supabase/migrations/20260925180000_three_collections.sql) remplace les anciens regroupements, y compris pour les fiches inactives, et dépublie Reception Lobby et Information Desk sans supprimer leurs contenus.

- **DINING** : restaurants, bars et Club InterContinental Lounge.
- **WELLNESS** : spa, soins, sport, yoga, piscines, plages, Relaxation Pavilion et Spa Lagoon Villas.
- **EXPERIENCES** : art, activités famille, lieux à explorer, événements, offres et IHG One Rewards.

Comptage historique à l’issue de la migration du 25 septembre : les 43 cards alors visibles étaient réparties ainsi. Ce tableau n’est pas l’inventaire actuel :

| Niveau | DINING | WELLNESS | EXPERIENCES |
| ------ | -----: | -------: | ----------: |
| HEAVEN |      2 |        2 |           9 |
| SKY    |      4 |        0 |           4 |
| EARTH  |      3 |        5 |           5 |
| SEA    |      0 |        7 |           2 |

Pour réorganiser une card, modifier `destinations.cluster` avec l'une des trois clés. La répartition de la migration est ponctuelle : un changement de type ne déplace pas automatiquement une card. `levels.clusters` définit l'ordre des onglets ; la base refuse une collection absente du niveau. Les six langues du hub traduisent les libellés. Les anciennes clés du dictionnaire restent compatibles avec un catalogue encore en cache pendant le déploiement.

Le catalogue local de secours a été supprimé. Seules les lignes publiées dans Supabase alimentent les cards. Les identifiants et les quatre niveaux alimentent la carte interactive et la navigation du funiculaire.

L'intégration GitHub applique la nouvelle migration à la fusion. Ne pas rejouer l'historique complet sur la production. Pour contrôler la répartition :

```sql
SELECT l.id AS niveau, d.cluster AS collection, count(*) AS lieux
FROM public.levels l
JOIN public.destinations d ON d.level_id = l.id AND d.active
GROUP BY l.id, l.display_order, d.cluster
ORDER BY l.display_order, d.cluster;
```

## Vidéos YouTube

La migration historique [`20260925130000_destination_videos.sql`](../supabase/migrations/20260925130000_destination_videos.sql) ajoute la table `destination_videos` au projet `cxcffaegqyvbhrpzpowa` et publie la vidéo officielle initiale de `mi-sol-spa`. Le contrôle du 25 septembre 2026 confirmait une seule ligne active pour ce lieu ; ce n’est pas le comptage actuel. **Ne pas rejouer cette migration pour ajouter une vidéo.** La table active RLS et n’autorise la lecture publique que pour une vidéo active appartenant à un lieu actif.

Pour préparer une vidéo, créer une ligne dans `destination_videos` avec l'identifiant exact de la card dans `destination_id`, l'URL officielle YouTube en HTTPS dans `video_url`, un `title` et, si souhaité, un objet `title_translations` avec les clés `vi`, `ru`, `zh`, `ko` et `ja`. Régler `display_order` pour l'ordre d'affichage. Laisser `active = false` pendant la préparation, puis le passer à `true` pour publier. Une URL non reconnue est ignorée par le hub ; formats acceptés : `youtube.com/watch?v=…`, `youtu.be/…`, `youtube.com/shorts/…` et `youtube.com/live/…`. Utiliser le lien `/shorts/…` pour obtenir le lecteur vertical 9:16 ; un lien `/watch?v=…` reste affiché en 16:9, même s'il désigne le même Short. Vérifier que le propriétaire de la vidéo autorise l'intégration. Une modification peut mettre environ deux minutes à apparaître à cause du cache.

Le catalogue et ses médias utilisent plusieurs tables et vues `public` dans Supabase. Vérifier l’état actuel du journal avant toute opération de maintenance : **ne pas exécuter `db push` ni rejouer toutes les migrations historiques sur la production**. Les procédures de septembre ci-dessous restent historiques ; elles ne sont pas une liste de scripts à rejouer.

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

Cette ancienne section concernait le déploiement de septembre. Les migrations `20260923120000_content_integrity.sql`, `20260923121000_translation_lifecycle.sql` et `20260924120000_retire_legacy_action_columns.sql` appartiennent désormais à l’historique enregistré. **Ne pas les réexécuter comme des étapes d’installation actuelles.** Pour une nouvelle évolution, suivre la [procédure de maintenance actuelle](#procédure-de-maintenance-actuelle).

Les protections existantes empêchent la suppression accidentelle en cascade d’un niveau, d’un lieu ou d’un événement possédant encore des contenus liés. Utiliser `active = false` pour retirer un lieu du site. Une suppression définitive nécessite de traiter explicitement ses dépendances. Les anciens champs de réservation ne doivent pas créer un bouton `BOOK` sans véritable lien publié.

## État constaté avant migration

Inspection directe en lecture seule le 23 septembre 2026 : 4 niveaux, 47 lieux, 75 liens, 40 photos, 4 événements, 1 post et 10 réglages. Les 141 traductions de lieux et 12 traductions d'événements attendues étaient publiées, sans source dépassée. Le bucket public `hub-images` contenait 26 objets ; les 91 références d'image en base pointaient vers ces objets. Aucun contenu actif ne dépendait d'un lieu inactif et aucune catégorie utilisée n'était absente de son niveau.

Quatre lieux actifs n'avaient aucun lien dans `destination_links` malgré une ancienne URL `DISCOVER` générique vers l'accueil du resort : `instagram-spots`, `moulin-rouge`, `relaxation-pavilion` et `wall-of-lanterns`. Il faut décider éditorialement, pour chacun, entre aucun bouton et un véritable lien spécifique ; rétablir l'URL générique serait trompeur.

## Familles éditoriales et espaces marketing

Voir [la classification éditoriale](editorial-taxonomy.md) pour les champs de `destinations`, les trois vues marketing et les règles de publication.

## Recherche par envie

`destinations.search_keywords` contient les concepts et synonymes de recherche, indépendamment des textes affichés. La migration `20261013003000_destination_search_keywords.sql` a été appliquée le 13 octobre 2026 aux 75 fiches, dont les deux masquées, sans modifier leur contenu ni leur statut. Voir [le vocabulaire de recherche](search.md) pour la maintenance et les traductions des envies.

## Modèle partagé des cards agrandies

Le modèle éditorial validé s'applique à toutes les destinations, y compris les fiches masquées et les nouvelles fiches. Le statut `active` reste indépendant de la présentation : une fiche masquée ne devient pas publique.

La migration `20261012120000_editorial_catalogue_rollout.sql` généralise le réglage et initialise 225 titres personnalisés pour les 75 destinations, avec 1 125 traductions (VI, RU, ZH, KO, JA en plus de l'anglais). Les quatre fiches du pilote gardent leurs titres approuvés. Les descriptions, photographies, horaires, actualités, événements et relations restent leurs sources existantes.

| Champ dans `destinations` | Utilisation                                                                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `detail_layout`           | Champ historique conservé en base avec la valeur `editorial`. Le site utilise toujours le modèle commun et ne lit plus ce sélecteur. |
| `primary_link_id`         | Identifiant d'un lien actif de **la même fiche** dans `destination_links`, mis en avant et retiré de la collection secondaire.       |
| `links_heading`           | Titre personnalisé sous le label de la collection de liens.                                                                          |
| `video_heading`           | Titre personnalisé sous « In motion ».                                                                                               |
| `instagram_heading`       | Titre personnalisé sous « From our world ».                                                                                          |
| `heading_translations`    | Traductions des trois titres, associées à leur texte anglais de référence.                                                           |

Un `primary_link_id` vide sélectionne automatiquement BOOK, puis DISCOVER/WEBSITE, puis la première action publiée. Si un lien choisi est dépublié, aucun remplacement n'est inventé. Sa suppression efface la sélection ; le choix automatique reprend alors. Les URL restent dans `destination_links`, avec leurs variantes linguistiques. Plusieurs menus distincts peuvent appartenir à une même fiche.

Les labels communs sont traduits dans le dictionnaire du hub (EN, VI, RU, ZH, KO, JA). Les titres personnalisés se gèrent en base, par exemple :

```json
{ "ja": { "video": { "source": "A table above the bay.", "value": "湾を見渡すテーブル。" } } }
```

Si le titre anglais change, la traduction n'est plus utilisée tant que `source` n'a pas été actualisé après relecture. Une section sans contenu reste masquée, même si son titre est prêt. Les légendes natives des posts appartiennent à Instagram ; elles ne sont pas recopiées ni traduites par le hub.

`destination_relations` contient une seule paire d'identifiants, classés alphabétiquement, pour les deux sens. Les quatre relations existantes relient La Maison à Wine Cellar et Buffalo Bar, L_O_N_G Bar à L_O_N_G Pool, Mi Sol Spa à One-Bedroom Spa Lagoon Villa. Le titre est « RELATED PLACE », sans sous-titre ; nom et photo viennent de la destination liée. Une relation vers une fiche inactive n'est pas publique.

La navigation inférieure propose « Previous discovery » uniquement après la visite d'une autre fiche, et « Continue the journey » vers la suivante dans le carrousel d'origine (ou l'ordre du catalogue pour une arrivée directe). Les swipes suivent ces mêmes directions. Le bouton Back supérieur restaure directement la position et la sélection précédentes de l'accueil.

Déploiement : sauvegarder les champs éditoriaux des 75 fiches, appliquer uniquement la nouvelle migration et publier le code compatible. Contrôler les 75 modèles et traductions, les 73 publications et les deux fiches masquées, puis vérifier les quatre univers sur mobile. Après vérification de la publication, le rendu classique, ses styles et la compatibilité de lecture antérieure à la migration sont retirés. Un retour arrière passe par Git et la sauvegarde des champs, pas par une bascule du champ `detail_layout`.

Contrôle du 12 octobre 2026 après application : 75 modèles éditoriaux, 75 jeux complets de titres dans les six langues, 71 liens principaux utilisables, 73 fiches actives et 2 masquées (`information`, `reception`). La comparaison des exports avant/après confirme que les autres champs sont inchangés.
