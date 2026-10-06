# Classification éditoriale des cards

La table `destinations` reste la source commune. Aucun texte, média, lien ou traduction n'est dupliqué pour séparer les espaces marketing.

## Champs

| Champ                              | Valeurs / rôle                                                     |
| ---------------------------------- | ------------------------------------------------------------------ |
| `content_family`                   | `resort`, `offer`, `storytelling`                                  |
| `cluster`                          | Collections existantes : `DINING`, `WELLNESS`, `EXPERIENCES`       |
| `type`                             | Type détaillé existant : restaurant, bar, spa, kids, etc.          |
| `audience_tags`                    | `all` seul, `adult`, `kids`, ou `adult` + `kids` pour les familles |
| `offer_duration`                   | Offres uniquement : `limited` ou `ongoing`                         |
| `offer_starts_on`, `offer_ends_on` | Dates vérifiées facultatives pour les offres limitées              |
| `storytelling_scope`               | Storytelling uniquement : `resort` ou `destination`                |
| `minimum_age`, `maximum_age`       | Limites d'âge vérifiées ; null = information non vérifiée          |

L'audience est un classement éditorial, pas une règle d'admission. Un futur Kids Space pourra sélectionner les cards portant explicitement `kids`. Une card `all` n'est pas automatiquement une activité destinée aux enfants.

Les dates ne publient et ne dépublient pas automatiquement une offre : `active` reste la commande de publication. Une offre limitée peut dépendre d'une saison ou d'un quota sans dates connues. Ne pas inventer de dates. Les offres permanentes ont des dates nulles.

## Espaces marketing

Trois vues PostgreSQL reprennent les mêmes lignes : `marketing_resort`, `marketing_offers`, `marketing_storytelling`. Elles sont modifiables par SQL avec les droits d'administration existants. Leur `WITH CHECK OPTION` interdit de déplacer silencieusement une card dans une autre famille depuis la vue. Un changement de famille se fait dans `destinations`, en ajustant ses champs spécifiques dans la même modification.

Dans le Table Editor Supabase, si une vue est présentée en lecture seule, modifier `destinations` avec un filtre sur `content_family`. Ces vues ne constituent pas un nouvel outil de gestion avec connexion marketing : aucun compte, rôle utilisateur ou droit d'édition public n'a été ajouté. Les vues utilisent `security_invoker` et ne sont pas accessibles aux rôles publics `anon` / `authenticated`. Les autres tables restent liées par `destination_id`.

Pour créer une offre, fournir `content_family = offer` et `offer_duration`. Pour créer une histoire, fournir `content_family = storytelling` et `storytelling_scope`. Conserver des identifiants stables pour les liens des cards.

## Répartition initiale — 6 octobre 2026

La migration `20261006110000_destination_editorial_taxonomy.sql` est appliquée en production. Elle classe les 57 cards, y compris les cards non actives, sans changer leur publication ni leurs collections.

- Resort : 47 cards, dont les cours de cuisine et Người Dẫn Lối.
- Offers : 5 cards — Bensley Package, Daycation, Enchanted Holiday, IHG One Rewards, Weddings. Enchanted Holiday est limitée ; les autres sont permanentes. Les dates restent à renseigner lorsqu'elles sont confirmées.
- Storytelling : 5 cards — Destination, Hoi An, Instagram Spots, Nature, Things to Do. Les deux premières concernent la destination, les autres le resort.

Les types `kids` et Kids Pool sont tagués `kids`. Family Beach, Family Pool et Enchanted Holiday portent `adult` + `kids`. Les bars, Mi Sol Spa, Nail & Hair et SOAR Gym portent `adult` ; les autres `all`. Les âges vérifiés initiaux sont 14 ans pour Mi Sol Spa et 16 ans pour Nail & Hair. Ces tags peuvent être affinés par l'équipe éditoriale.

## Compatibilité du hub

La recherche générale conserve toutes les cards actives. La recherche de la map ne conserve que `content_family = resort` ; offres et storytelling n'y apparaissent pas. Les positions et associations de la map restent inchangées.

Le champ historique `content_kind` est une projection binaire calculée par un trigger (`resort → place`, autres → offer). Il assure la compatibilité avec les Workers déjà déployés pendant la mise à jour ; ne pas l'éditer. Le nouveau code utilise `content_family` et accepte temporairement les anciennes réponses sans cette colonne. Le cache du catalogue change de version pour relire les nouveaux champs après déploiement.
