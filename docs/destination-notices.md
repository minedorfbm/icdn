# Actualités des destinations

Les descriptions présentent le lieu et son expérience. Les travaux, fermetures et changements temporaires restent dans des données distinctes.

## Gestion marketing

`destination_notices` contient une ligne par actualité : `id`, `destination_id`, `kind` (`information`, `relocation`, `closure`), `title`, `body`, `starts_at`, `ends_at`, `published`, `display_order`, `source_url`, `verified_on` et `updated_at`.

- Une card peut avoir plusieurs actualités, sans nouvelle card ni modification de sa description.
- Une même actualité peut apparaître sur plusieurs cards : `destination_notices.destination_id` désigne sa fiche principale, et `destination_notice_links` rattache les autres fiches. Le texte et ses traductions restent uniques. Masquer la fiche principale masque aussi cette actualité sur ses fiches associées.
- `published = false` masque une actualité sans la supprimer.
- `starts_at` programme son apparition ; `ends_at` arrête son affichage. Dates avec fuseau horaire, saisies en heure de Danang (UTC+7).
- Laisser `ends_at` vide tant qu’aucune date fiable n’est annoncée. Vérifier régulièrement la source et masquer l’annonce à la reprise du service.
- Les avis sont affichés dans un encart arrondi contrasté sous la description et avant les horaires. Ils n’altèrent ni les niveaux ni les coordonnées de la carte.

`destination_notice_translations` contient les cinq langues, avec `notice_id`, `locale`, `title`, `body`, `source_title`, `source_body`, `published` et `updated_at`. Publier après relecture. Les deux sources doivent correspondre exactement au titre et au texte anglais. Si elles changent, la traduction est écartée au profit de l’anglais courant jusqu’à sa révision.

## Publication et sécurité

La migration `20261006180000_destination_notices.sql` crée les tables avec RLS et lecture publique seulement. Les brouillons, annonces futures/expirées et annonces de cards inactives sont exclus. La vue `published_destination_notices` utilise `security_invoker=true`, conserve les droits RLS du lecteur et regroupe les traductions en une seule lecture.

Cette lecture est faite uniquement à l’ouverture d’une fiche, en parallèle des médias et horaires. Aucun appel ne s’ajoute au chargement de l’accueil. Le cache des fiches a une durée maximale de deux minutes ; le composant écarte aussi les annonces expirées de la réponse en cache. La version de ce cache change pour introduire les actualités.

La migration a été appliquée en production le 6 octobre 2026. La migration complémentaire `20261006183000_shared_destination_notices.sql` associe la même annonce de La Maison 1888 à The Wine Cellar sans copier les textes. `bun run i18n:audit:database` vérifie aussi les traductions des actualités publiques.

Deux annonces vérifiées le 6 octobre 2026 sont initialisées, chacune avec ses cinq traductions :

- La Maison 1888 : service temporaire au niveau Heaven, menu cinq services du Chef Christian Le Squer, réservation recommandée. [Source officielle](https://www.danang.intercontinental.com/dining/la-maison-1888/).
- Buffalo Bar : indisponible pendant les travaux de La Maison 1888 ; aucune date de réouverture annoncée. [Source officielle](https://www.danang.intercontinental.com/dining/buffalo-bar/).

La migration remplace également les trois descriptions longues de La Maison 1888, Buffalo Bar et The Wine Cellar par des textes pérennes, avec leurs traductions. Aucune fermeture de la cave n’est déduite sans annonce officielle. L’accroche courte reste inchangée.
