# Complément du catalogue officiel — 6 octobre 2026

La PR #73 de classification éditoriale est fusionnée. Cette migration de contenu complète les cards depuis les pages officielles du resort. Elle ne crée ni table ni catalogue local et ne modifie pas les positions de la carte.

## Publication

La migration `20261006140000_complete_official_destination_cards.sql` a été appliquée en production le 6 octobre 2026. Elle publie les cinq cards demandées — Shuttle, Experience More, Nam Tram Dining Journey, Airport Lounge et Bill Bensley Digital Design Tour — ainsi qu’une card Club InterContinental distincte du lounge existant.

Le 6 octobre 2026, l'utilisateur a explicitement demandé de publier toutes les catégories d'hébergement, remplaçant sa préférence antérieure de masquer chambres et suites. Quinze catégories sont présentes sur [la page officielle Accommodation](https://www.danang.intercontinental.com/accommodation/). Trois fiches sont réutilisées : `rooms`, `penthouses`, `spa-lagoon-villas`. Douze autres sont ajoutées. Aucun doublon générique d'hébergement n'est créé ; les anciennes adresses des trois fiches restent valables.

Au total : 18 nouvelles lignes et 3 fiches précisées. Chaque fiche traitée reçoit cinq traductions de description, avec le texte anglais source correspondant, soit 105 traductions publiées.

## Contenu et sources

| ID stable                               | Nom                                     | Famille      | Source officielle                                                                                             |
| --------------------------------------- | --------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------- |
| shuttle                                 | Shuttle to Hoi An                       | resort       | [Page](https://www.danang.intercontinental.com/wp-content/uploads/2025/12/Shuttle-Bus-Schedule-to-Hoi-An.pdf) |
| experience-more                         | Experience More                         | offer        | [Page](https://www.danang.intercontinental.com/offers/experience-more-offer/)                                 |
| nam-tram-dining                         | Nam Tram Dining Journey                 | resort       | [Page](https://www.danang.intercontinental.com/dining/nam-tram-dining-journey/)                               |
| airport-lounge                          | InterContinental Airport Lounge         | resort       | [Page](https://www.danang.intercontinental.com/amenities/airport-lounges/)                                    |
| design-digital-tour                     | Bill Bensley Digital Design Tour        | storytelling | [Page](https://www.danang.intercontinental.com/bensley-digital-design-tour/)                                  |
| club-intercontinental                   | Club InterContinental                   | resort       | [Page](https://www.danang.intercontinental.com/amenities/club-intercontinental/)                              |
| rooms                                   | Resort Classic Room Oceanview           | resort       | [Page](https://www.danang.intercontinental.com/room-suites/resort-classic-room-oceanview/)                    |
| resort-classic-panoramic-room-oceanview | Resort Classic Panoramic Room Oceanview | resort       | [Page](https://www.danang.intercontinental.com/room-suites/resort-classic-panoramic-room-oceanview/)          |
| club-panoramic-room-oceanview           | Club Panoramic Room Oceanview           | resort       | [Page](https://www.danang.intercontinental.com/room-suites/club-panoramic-room-oceanview/)                    |
| resort-terrace-suite-oceanview          | Resort Terrace Suite Oceanview          | resort       | [Page](https://www.danang.intercontinental.com/room-suites/resort-terrace-suite-oceanview/)                   |
| club-terrace-suite-panoramic-oceanview  | Club Terrace Suite Panoramic Oceanview  | resort       | [Page](https://www.danang.intercontinental.com/room-suites/club-terrace-suite-panoramic-oceanview/)           |
| penthouses                              | One-Bedroom Heavenly Penthouse          | resort       | [Page](https://www.danang.intercontinental.com/room-suites/one-bedroom-heavenly-penthouse/)                   |
| one-bedroom-seaside-villa-by-the-beach  | One-Bedroom Seaside Villa on the Beach  | resort       | [Page](https://www.danang.intercontinental.com/room-suites/one-bedroom-seaside-villa-by-the-beach/)           |
| one-bedroom-seaside-villa-on-the-rocks  | One-Bedroom Seaside Villa on the Rocks  | resort       | [Page](https://www.danang.intercontinental.com/room-suites/one-bedroom-seaside-villa-on-the-rocks/)           |
| spa-lagoon-villas                       | One-Bedroom Spa Lagoon Villa            | resort       | [Page](https://www.danang.intercontinental.com/room-suites/one-bedroom-spa-lagoon-villa/)                     |
| two-bedroom-seaside-villa-on-the-rocks  | Two-Bedroom Seaside Villa on the Rocks  | resort       | [Page](https://www.danang.intercontinental.com/room-suites/two-bedroom-seaside-villa-on-the-rocks/)           |
| two-bedroom-royal-residence-by-the-sea  | Two-Bedroom Royal Residence by the Sea  | resort       | [Page](https://www.danang.intercontinental.com/room-suites/two-bedroom-royal-residence-by-the-sea/)           |
| two-bedroom-sun-peninsula-residence     | Two-Bedroom Sun Peninsula Residence     | resort       | [Page](https://www.danang.intercontinental.com/room-suites/two-bedroom-sun-peninsula-residence/)              |
| three-bedroom-sun-peninsula-residence   | Three-Bedroom Sun Peninsula Residence   | resort       | [Page](https://www.danang.intercontinental.com/room-suites/three-bedroom-sun-peninsula-residence/)            |
| three-bedroom-bai-bac-bay-villa         | Three-Bedroom Bai Bac Bay Villa         | resort       | [Page](https://www.danang.intercontinental.com/room-suites/three-bedroom-bai-bac-bay-villa/)                  |
| four-bedroom-pool-villa                 | Four-Bedroom Pool Villa                 | resort       | [Page](https://www.danang.intercontinental.com/room-suites/four-bedroom-pool-villa/)                          |

## Liens, photos et localisation

Les liens Discovery sont les pages officielles propres à chaque expérience ou catégorie. Seules les variantes linguistiques déclarées par ces pages sont insérées. Le Design Tour reste sur la page anglaise, qui ne déclare pas les cinq variantes. La navette a une action Menu intitulée « Shuttle schedule » ouvrant le PDF officiel dans le lecteur du hub. Ses photos illustrent Hoi An, destination de la navette, sans présenter un véhicule non vérifié.

Les nouveaux champs photo utilisent des images réelles du site officiel ; les variantes de 1024 pixels sont préférées lorsqu'elles sont présentes dans la page. Les photos déjà validées de Spa Lagoon Villas sont conservées. Les images génériques des anciennes cards Rooms et Penthouses sont remplacées par celles des catégories précises. Les photos restent administrables indépendamment avec `image_key` et `detail_image_key`. Elles ne sont pas transférées dans Supabase Storage par cette migration.

Lounge du Club : card existante `club-lounge`, collection Dining, lieu physique. Club InterContinental : nouvelle card de services/privilèges, collection Experiences. Airport Lounge : service hors du terrain du resort, sans repère inventé sur l'atlas. Nam Tram Dining : expérience Dining distincte du transport Nam Tram. Design Tour : Storytelling / resort, distinct du package commercial Bensley.

Les chambres et suites gardent le regroupement éditorial Heaven des anciennes cards d'hébergement ; ce rattachement n'est pas une localisation de chaque chambre. Les villas côtières sont regroupées en Sea, la Four-Bedroom Pool Villa en Earth (niveau explicitement donné par sa page officielle). Aucun numéro de chambre ni repère géographique non vérifié n'est ajouté. Les recherches du hub retrouvent les catégories par leur nom et description.

Les horaires du Club restent à confirmer en raison des divergences déjà documentées. Le site anglais Airport Lounge indique 06:00–21:00, tandis que plusieurs variantes indiquent encore 07:00–19:00 : aucune nouvelle plage horaire n'est publiée par cette migration. Le PDF Shuttle reste la référence pour les horaires, points de rendez-vous et conditions de réservation. Experience More est classée `ongoing` sans date de fin inventée ; le crédit quotidien expire chaque nuit et ne se cumule pas.

## Vérification

Vérifier après application : 15 cards actives de type `accommodation`, les six nouvelles cards de services/offre/tour, 105 traductions publiées conformes à leur texte source, et leurs actions actives. Les trois anciennes adresses d'hébergement doivent rester accessibles. Recharger le hub après l'expiration du cache public (maximum deux minutes).

Résultat SQL de production : 21 fiches traitées actives, 15 catégories d’hébergement actives, 105 traductions à jour et 75 lignes au total. Les 42 URL photo sélectionnées répondent avec HTTP 200 et un type image.

Contrôle dans le navigateur en production : les 21 adresses directes affichent la fiche attendue, dont les trois adresses historiques conservées. Les descriptions traduites et les liens officiels sont visibles.
