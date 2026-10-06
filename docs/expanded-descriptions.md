# Descriptions des fiches agrandies

## Deux textes indépendants

- `destinations.short_description` reste l’accroche des cards à swiper et des résultats de recherche.
- `destinations.detail_description` contient le paragraphe de la fiche agrandie.
- `destination_translations.description` et `source_description` concernent l’accroche.
- `destination_translations.detail_description` et `source_detail_description` concernent la fiche agrandie, avec les mêmes identifiant, langue et statut de publication.

La migration `20261006170000_expanded_card_descriptions.sql` a été appliquée en production le 6 octobre 2026 : 73 fiches publiques, 365 traductions longues (VI, RU, ZH, KO, JA). Elle est transactionnelle, ne supprime aucune card et ne modifie aucun droit. Ne pas rejouer les migrations historiques sur cette base.

Les paragraphes anglais comportent environ 30 à 40 mots. L’objectif est environ quatre lignes sur mobile ; le nombre réel dépend de la largeur et de la langue. Le texte reste intégral, sans limite de lignes ni points de suspension. Il utilise une taille de 16 px et un interligne de 1,65.

Les accroches sont conservées, sauf deux corrections factuelles : Tingara est un restaurant japonais de teppanyaki et Kate McCoy propose de la joaillerie, pas des vêtements.

## Modifier et traduire

1. Modifier `destinations.detail_description` pour la version anglaise.
2. Pour chacune des cinq langues, relire et modifier `destination_translations.detail_description`, puis copier la source anglaise exacte dans `source_detail_description`.
3. Publier la ligne après relecture et lancer `bun run i18n:audit:database` avec les variables publiques Supabase.

Une traduction longue vide, absente, non publiée ou dont la source ne correspond plus est remplacée par l’anglais courant. La comparaison est indépendante de celle de l’accroche. Une ligne non publiée masque toutefois ses deux textes traduits. Une fiche sans paragraphe long conserve son accroche comme repli.

Les nouveaux champs sont lus avec le catalogue public existant : aucune requête supplémentaire ni catalogue de textes intégré au JavaScript. La version du cache du catalogue change pour éviter de conserver une ancienne structure après déploiement. Les traductions proposées restent à relire par les locuteurs de l’équipe marketing.

## Sources et informations temporaires

Les descriptions sont originales, basées sur les pages officielles vérifiées le 6 octobre 2026 et les informations existantes du catalogue. Le [registre des sources par card](expanded-description-sources.json) conserve les liens de référence. Les horaires, tarifs et conditions détaillées restent dans leurs données dédiées ou sur le site officiel.

Les informations temporaires de La Maison 1888 et Buffalo Bar sont séparées des descriptions dans [les actualités des destinations](destination-notices.md). Cela ne change pas les positions permanentes de la carte. Revoir les dates de l’offre Enchanted Holiday à son expiration.

Pour B Lounge, Nursery, Spirit House et Relaxation Pavilion, aucune page officielle dédiée suffisamment détaillée n’a été trouvée : les textes restent prudents, fondés sur le catalogue, et invitent à confirmer les modalités avec l’équipe. Ils n’inventent pas d’horaires, de prestations garanties ou de capacités.
