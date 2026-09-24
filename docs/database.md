# Base Supabase : cohérence et publication

## Vidéos YouTube

La migration [`20260925130000_destination_videos.sql`](../supabase/migrations/20260925130000_destination_videos.sql) ajoute la table `destination_videos` au projet `cxcffaegqyvbhrpzpowa` et publie la vidéo officielle fournie pour `mi-sol-spa`. Elle a été appliquée au projet de production le 25 septembre 2026 ; la requête de contrôle a confirmé une seule ligne active pour `mi-sol-spa`. **Ne pas rejouer l'historique complet des migrations** sur cette base. Le fichier est réexécutable sans dupliquer cette vidéo si l'intégration GitHub le reprend. La table active RLS et n'autorise la lecture publique que pour une vidéo active appartenant à un lieu actif.

Pour préparer une vidéo, créer une ligne dans `destination_videos` avec l'identifiant exact de la card dans `destination_id`, l'URL officielle YouTube en HTTPS dans `video_url`, un `title` et, si souhaité, un objet `title_translations` avec les clés `vi`, `ru`, `zh`, `ko` et `ja`. Régler `display_order` pour l'ordre d'affichage. Laisser `active = false` pendant la préparation, puis le passer à `true` pour publier. Une URL non reconnue est ignorée par le hub ; formats acceptés : `youtube.com/watch?v=…`, `youtu.be/…`, `youtube.com/shorts/…` et `youtube.com/live/…`. Vérifier que le propriétaire de la vidéo autorise l'intégration. Une modification peut mettre environ deux minutes à apparaître à cause du cache.

Le projet de production utilise neuf tables `public` dans Supabase. La base importée depuis Lovable ne partage pas nécessairement l'historique des migrations du dépôt : **ne pas exécuter `db push` ni rejouer toutes les migrations historiques sur la production**. Les deux migrations datées du 23 septembre 2026 sont prévues pour ce schéma déjà importé et se lancent une fois chacune, dans l'ordre, après sauvegarde.

## Source de vérité du contenu

`destinations` contient l'identité, l'ordre, la catégorie, la description et l'image des lieux. `destination_links` contient les boutons et leur ordre. Lorsqu'une lecture de cette table réussit, une liste vide signifie volontairement « aucun bouton ». Le Worker ne lit plus les anciennes colonnes d'URL de `destinations`. Elles restent dans la base le temps de valider ce déploiement et seront retirées dans une migration ultérieure ; **ne plus les modifier**. Le catalogue local conserve ses propres liens uniquement pour le mode de secours hors base.

Huit lieux possèdent un ancien `booking_message` sans bouton `BOOK` correspondant. Ces textes et les réglages `booking_channel` / `booking_destination` sont des vestiges d'un canal WhatsApp non activé. **Aucun bouton de réservation n'est créé à partir de ces champs.** Un bouton `BOOK` apparaît seulement lorsqu'un véritable lien approuvé est ajouté à `destination_links`. Les anciens messages restent en base comme archive, sans contrôler le site.

`levels.clusters` définit les catégories affichées sur un niveau. La valeur `destinations.cluster` doit figurer dans la liste du même niveau ; les nouvelles protections refusent une faute de frappe ou la suppression d'une catégorie encore utilisée. Pour masquer un lieu, mettre `destinations.active = false`. Les liens, photos, événements, posts et traductions publiées associés ne sont alors plus lisibles publiquement. Les clés de `site_settings` sont publiques : n'y enregistrer aucun mot de passe ni secret.

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
