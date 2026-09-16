# Analyse de la carte officielle du resort — écarts avec les cards actuelles

La carte (plan VN, points 1 à 22) donne la position physique réelle de chaque lieu ainsi que les quatre étages : Thiên Đường (Heaven), Bầu Trời (Sky), Trái Đất (Earth), Biển Cả (Sea). Comparaison avec les 44 cards actuellement en base.

## 1. Lieux de la carte sans card (à créer)

| Carte | Lieu | Niveau proposé |
|---|---|---|
| 7 | Moulin Rouge Karaoke Club | Heaven |
| 10 | Vọng lâu thư giãn — Pavillon panoramique de détente | Heaven |
| 3 | Parking / arrivée (à fusionner avec le Jardin de sculptures APEC, déjà présent) | Heaven |
| — | Mur de lanternes (spot photo E) et Bain à remous Jacuzzi (spot photo F) | Earth |
| — | Top 9 spots photo (carte séparée type « Instagrammable ») | transversal |

## 2. Cards mal positionnées par rapport à la carte

- **Citron (8) et Tingara (9)** : actuellement en Sky. Sur la carte ils sont juste à côté des chambres 501-567, donc au niveau **Heaven**.
- **L_O_N_G Pool, L_O_N_G Bar, Soar Gym, Planet Trekkers (17)** : actuellement en Earth. Sur la carte ils sont en bord de plage, donc au niveau **Sea**.
- **Yoga Pavilion (19)** et **Marine Recreation Centre (18)** : le centre marin est déjà en Sea ; le pavillon de yoga est en Earth alors qu'il est sur la plage → **Sea**.
- **Terra Mare / B Lounge (13)**, piscines famille/enfants et jacuzzi de jardin (14) : restent en **Earth** (cohérent avec la carte).
- **The Nail & Hair Studio (15)** : la carte le décrit explicitement « tại tầng Biển cả » → **Sea** (déjà correct).
- **Mi Sol Spa (22)** et son accueil (16) : le spa est au lagon → **Sea** (correct) ; l'accueil peut être mentionné dans la fiche du spa plutôt qu'en card séparée.

## 3. Doublons et incohérences de contenu

- **The Summit** et **Conference · Cinema · M-Club** correspondent au même point 2 de la carte → fusionner en une seule card « The Summit ».
- **Tingara** est typé `bar` alors que c'est un restaurant japonais (Omakase, Teppanyaki, Sushi) → type `restaurant`.
- **Heritage Village (11)** doit clairement regrouper Bensley Gallery, Kate McCoy et Sammy's Boutique (aujourd'hui trois cards sœurs sans lien) → garder les trois cards mais les rattacher au Heritage Village dans la description.
- **Sports Centre (1)** : préciser tennis, pickleball et terrain de football, absents de la description.
- **Plages** : la carte distingue trois plages (Club InterContinental, Famille, Rặng Dừa/Coconut) → déjà les trois cards, descriptions à aligner sur la carte.

## 4. Descriptions officielles à reprendre

La page 2 du plan fournit un texte officiel court pour Citron, Tingara, Buffalo Bar, La Maison 1888, Terra Mare, L_O_N_G Bar, The Summit, Club Lounge, Moulin Rouge, Bensley Gallery, Nail & Hair Studio, Planet Trekkers, Soar Gym, Centre marin, Pavillon yoga et Mi Sol Spa. Ces textes peuvent remplacer ou enrichir les descriptions actuelles (version VN d'origine, traduite en EN/RU/ZH).

## 5. Mise en œuvre

1. Migration SQL : mise à jour des `level_id` (Citron, Tingara, L_O_N_G Pool/Bar, Soar Gym, Planet Trekkers, Yoga Pavilion), correction du type Tingara, fusion Summit/M-Club, renumérotation des `display_order` par niveau.
2. Insertion des nouvelles cards (Moulin Rouge, Pavillon de détente, spots photo) avec description, type, ordre et visuel généré.
3. Mise à jour des descriptions officielles issues du plan, plus traductions VI/RU/ZH dans `src/i18n/destinations.ts`.
4. Mise à jour du fallback `src/data/resort.ts` pour rester synchrone avec la base.
5. Vérification : build, puis parcours mobile des quatre niveaux.

## Point à confirmer

Les étages de la carte désignent les niveaux de chambres. Je propose de suivre strictement l'altitude physique des lieux (donc Citron/Tingara en Heaven, piscine L_O_N_G en Sea). Dis-moi si tu préfères garder la répartition éditoriale actuelle pour certains lieux.
