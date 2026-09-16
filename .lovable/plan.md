# Analyse des deux cartes officielles — écarts avec les cards actuelles

Les deux cartes (version vietnamienne et version anglaise) donnent les mêmes 22 points et les mêmes quatre étages : Heaven, Sky, Earth, Sea. Comparaison avec les 44 cards actuellement en base.

## 1. Lieux de la carte sans card (à créer)

| Point | Lieu | Niveau proposé |
|---|---|---|
| 7 | Moulin Rouge Karaoke Club | Heaven |
| 10 | Relaxation Pavilion (Vọng lâu thư giãn) | Heaven |
| 21 | Spirit House (Miếu Địa Tạng) — la card existe sous « Địa Tạng Shrine », à renommer « Spirit House » | Earth |
| — | Wall of Lanterns (spot photo E) | Earth |
| — | Jacuzzi at Garden Pool (spot photo F) — déjà « Garden Jacuzzi », à aligner sur le nom officiel | Earth |
| — | Card « Top 9 Instagram Spots » regroupant les 9 spots photo de la carte | transversal |

Autres correspondances déjà couvertes : Sports Centre (1), The Summit (2), Carpark / APEC 2017 Sculpture Garden (3), Reception Lobby (4), Club Lounge (5), Nam Tram (6), Heritage Village (11), Nursery & Organic Garden (20).

## 2. Cards mal positionnées par rapport à la carte

- **Citron (8)** et **Tingara (9)** : actuellement en Sky. Sur les deux cartes ils sont dans le groupe 4-9, au niveau **Heaven**.
- **L_O_N_G Pool, L_O_N_G Bar, Soar Gym, Planet Trekkers (17)** : actuellement en Earth, alors qu'ils sont en bord de plage → **Sea**.
- **Yoga Pavilion (19)** : actuellement en Earth, situé sur la plage à côté du Beach Activity Centre (18) → **Sea**.
- **Terra Mare (13)**, **Garden Pool & Jacuzzi / Kids Pool (14)** : restent en **Earth** (conforme).
- **The Nail & Hair Studio (15)** et **Mi Sol Spa Reception (16)** : la version VN précise « tầng Biển cả » → **Sea** (déjà correct). L'accueil du spa peut rester dans la fiche Mi Sol plutôt qu'en card séparée.
- **Mi Sol Spa & Wellness (22)** au lagon → **Sea** (correct).
- **Spirit House (21)** et **Nursery & Organic Garden (20)** : entre le spa et la plage → rester en **Earth**.

## 3. Doublons et incohérences de contenu

- **The Summit** et **Conference · Cinema · M-Club** correspondent tous deux au point 2 → fusionner en une card « The Summit » (Conference Centre, Auditorium-Cinema, M Club).
- **Tingara** est typé `bar` alors que c'est le restaurant japonais (Omakase, Teppanyaki, Sushi) → type `restaurant`. Nom officiel : « Tingara Japanese ».
- **Heritage Village (11)** : la carte ne liste que BENSLEY Outsider Gallery et Sammy's Boutique. Kate McCoy n'apparaît plus sur la carte anglaise → à vérifier avant de la garder.
- **Noms officiels à aligner** : Citron Vietnamese, Terra Mare Italian, Beach Activity Centre (au lieu de Marine Recreation Centre), Reception Lobby, APEC 2017 Sculpture Garden, Garden Pool & Jacuzzi, Planet Trekkers - Kids Club.
- **Plages** : la carte distingue Sunset Beach (vues coucher de soleil) et Coconut Beach (baignade). Les cards actuelles sont Coconut Beach, Family Beach, Club InterContinental Beach → remplacer/compléter par Sunset Beach.
- **B Lounge** n'apparaît que sur la carte VN (point 13 avec Terra Mare) → à garder rattaché à Terra Mare.
- **Sports Centre (1)** : ajouter Tennis & Pickleball Courts et terrain de football à la description.

## 4. Descriptions officielles

La page 2 du PDF fournit un texte officiel court pour Citron, Tingara, Buffalo Bar, La Maison 1888, Terra Mare, L_O_N_G Bar, The Summit, Club Lounge, Moulin Rouge, Bensley Gallery, Nail & Hair Studio, Planet Trekkers, Soar Gym, Beach Activity Centre, Yoga Pavilion et Mi Sol Spa. Ces textes serviront de base aux descriptions (traduites EN/VI/RU/ZH).

## 5. Mise en œuvre

1. Migration/données : mise à jour des `level_id` (Citron, Tingara, L_O_N_G Pool/Bar, Soar Gym, Planet Trekkers, Yoga Pavilion), correction du type Tingara, fusion Summit/M-Club, renumérotation des `display_order` par niveau.
2. Nouvelles cards : Moulin Rouge Karaoke Club, Relaxation Pavilion, Wall of Lanterns, Sunset Beach, et éventuellement « Top 9 Instagram Spots » — avec description, type, ordre et visuel.
3. Alignement des noms et descriptions officiels, plus traductions VI/RU/ZH dans `src/i18n/destinations.ts`.
4. Mise à jour du fallback `src/data/resort.ts` pour rester synchrone avec la base.
5. Vérification : build, puis parcours mobile des quatre niveaux.

## Point à confirmer

Les étages nommés sur la carte désignent les niveaux de chambres. Je propose de suivre l'altitude physique réelle des lieux (Citron/Tingara en Heaven, L_O_N_G et Yoga en Sea). Dis-moi si tu veux garder la répartition éditoriale actuelle pour certains d'entre eux.
