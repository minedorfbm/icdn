# Tout le contenu des cards en base de données

## État actuel (vérifié)

Toutes les cards créées récemment sont bien enregistrées en base : Enchanted Holiday, Club InterContinental, IHG One Rewards, Bensley Design Package, Weddings, Bensley Outsider Gallery, The Nail & Hair Studio (bien placée dans Sea, en 2e position), ainsi que les liens de menus de La Maison 1888, Tingara, Citron, Terra Mare, L_O_N_G Bar, Buffalo Bar et Mi Sol Spa.

Deux limites de maintenance :

1. Chaque type de lien occupe sa propre colonne (menu, menu végétarien, menu vegan, déjeuner, dîner, petit-déjeuner, tarifs, brochure). Chaque nouveau type de document oblige à modifier la structure de la base et le code.
2. Les événements récurrents (Sunday Champagne Brunch, Afternoon Tea, Wine Tasting, Beach BBQ) sont écrits en dur dans le code.

## Ce que je vais faire

### 1. Une table de liens flexible

Une nouvelle table « liens des lieux » : un lieu peut avoir autant de documents et de liens que nécessaire, sans jamais toucher à la structure.

Chaque lien contient : le lieu concerné, un type (menu, menu végétarien, menu vegan, déjeuner, dîner, petit-déjeuner, tarifs, brochure, réservation, Instagram, découvrir…), un libellé optionnel, l'adresse du lien, un ordre d'affichage et un interrupteur actif/inactif.

Tous les liens actuellement stockés en colonnes seront recopiés dans cette table automatiquement, sans perte.

### 2. Une table d'événements

Une table « événements des lieux » : titre, horaires, description, lien optionnel, ordre, actif/inactif. Les quatre événements existants y seront insérés avec leur contenu actuel.

### 3. Affichage inchangé

Les boutons des fiches (MENU, VEGETARIAN MENU, PRICE LIST, BOOK, BROCHURE…) et les blocs d'événements s'afficheront exactement comme aujourd'hui, mais alimentés par ces deux tables. L'ordre des boutons suit l'ordre défini en base.

Les anciennes colonnes de menus restent en place comme filet de sécurité pendant cette étape ; on pourra les supprimer une fois l'affichage validé.

## Détails techniques

- Migration : `destination_links` et `destination_events` (clé étrangère vers `destinations`, `display_order`, `active`, timestamps + trigger `set_updated_at`, lecture publique pour les lignes actives, GRANT `anon`/`authenticated` en lecture, `service_role` complet).
- Un type énuméré `destination_link_type` pour les catégories de liens.
- Copie des colonnes existantes (`menu_url`, `vegetarian_menu_url`, `vegan_menu_url`, `lunch_menu_url`, `dinner_menu_url`, `breakfast_menu_url`, `price_list_url`, `booking_url`, `instagram_url`, `discover_url`) vers `destination_links` via INSERT ... SELECT.
- `src/lib/hub.functions.ts` : ajout des deux nouvelles requêtes dans le chargement du hub.
- `src/data/resort.ts` : le modèle `Destination` reçoit `links: DestinationLink[]` et `events: DestinationEvent[]` ; construction des CTA à partir de `links` avec repli sur les colonnes existantes.
- `src/components/hub/DestinationDetail.tsx` et `DestinationPanel.tsx` : génération des boutons depuis `links`, événements depuis `events` (libellés toujours traduits via `src/i18n/dictionary.ts`).
- `src/data/events.ts` devient le repli hors-ligne uniquement.
