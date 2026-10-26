# Plan — Base de données du Digital Hub (Lovable Cloud)

## Objectif
Activer Lovable Cloud et créer les tables qui alimentent le Digital Hub, en miroir 1:1 de la structure CMS-ready existante (`src/data/resort.ts`), avec les données actuelles seedées dans la migration.

## Étapes

### 1. Activer Lovable Cloud
Provisionne la base de données, l'authentification et le stockage intégrés.

### 2. Migration SQL — Schéma

**Enum `destination_type`** : restaurant, bar, spa, experience, pool, fitness, kids, retail, gallery, accommodation, service, beach, recreation.

**Table `public.levels`**
| Colonne | Type | Notes |
|---|---|---|
| id | text (pk) | heaven / sky / earth / sea |
| title | text | HEAVEN, SKY... |
| line | text | tagline éditoriale |
| image_url | text | chemin de l'image |
| clusters | text[] | EAT / MOVE / PLAY (Earth) |
| display_order | int | ordre de descente |

**Table `public.destinations`**
| Colonne | Type | Notes |
|---|---|---|
| id | text (pk) | slug (citron, mi-sol-spa...) |
| name | text | |
| level_id | text (fk → levels) | position géographique réelle |
| cluster | text null | EAT / MOVE / PLAY |
| type | destination_type | |
| short_description | text | |
| image_url | text | |
| discover_url / menu_url / booking_url / instagram_url | text null | liens officiels uniquement |
| booking_message | text null | template WhatsApp |
| display_order | int | ordre dans le stack |
| active | boolean | |

**Table `public.site_settings`** (clé/valeur) : liens officiels (website, Instagram, IHG, map, contact) et canal de réservation WhatsApp — éditables sans toucher au code.

Chaque table : `GRANT` + `ENABLE ROW LEVEL SECURITY` + policies. Lecture publique (`TO anon`) sur `levels`, `destinations` (actifs), `site_settings` ; pas d'auth requise côté visiteur.

### 3. Seed dans la migration
Insertion littérale des 4 niveaux et des ~40 destinations actuelles avec leurs descriptions, types, clusters et URLs existantes.

### 4. Brancher le frontend
- Types générés (`@/integrations/supabase/types`).
- Server fn publique `getHubData` (client publishable, colonnes sûres) appelée depuis le loader de `/`, avec `ensureQueryData` / `useSuspenseQuery`.
- `src/data/resort.ts` reste comme fallback si la base est vide, pour ne jamais casser l'aperçu.

### 5. Vérification
Build OK + parcours complet du hub dans le navigateur (descente, stacks, détails).

## Technique
- Pas de table d'utilisateurs ni d'authentification : l'expérience est publique (accès par QR code).
- Les images restent des assets du bundle pour l'instant ; `image_url` permettra plus tard de basculer vers le storage.
