# InterContinental Danang — Digital Hub

Le hub mobile s’ouvre depuis le QR code intégré à une œuvre d’Art Digital Journey. Le visiteur parcourt les niveaux **Heaven → Sky → Earth → Sea**, fait défiler les cards et ouvre les fiches, menus et liens de réservation.

**Production :** <https://icdn.artdigitaljourney.com/> (alias : <https://icdnd.artdigitaljourney.com/>). Le rendu serveur et les fichiers statiques sont hébergés sur Cloudflare Workers. Le contenu public et les traductions éditoriales viennent du projet Supabase indépendant ; les images publiées sont dans le bucket public `hub-images`. La landing page <https://artdigitaljourney.com/> possède son propre dépôt et son propre Worker.

## Démarrer en local

Prérequis : Node.js 22.12+ et Bun 1.4.2.

```sh
cp .env.example .env.local
bun install --frozen-lockfile --ignore-scripts
bun run dev
```

Renseigner dans `.env.local` l’URL du projet Supabase et sa **clé publiable**. Ce fichier est ignoré par Git. Les mêmes valeurs publiques de production et de prévisualisation sont déclarées dans `wrangler.json` ; modifier `.env.local` ne modifie pas le Worker déployé. Les traductions éditoriales publiées sont toujours lues dans Supabase ; aucun mode de contenu embarqué n’est utilisé.

Le site ne demande ni compte utilisateur ni clé secrète pour lire le contenu. Les politiques RLS limitent les lectures publiques aux lignes autorisées et aucune écriture publique n’est accordée. Une clé secrète Supabase sert uniquement à une opération d’administration locale, par exemple la mise à jour du cache des images ; elle ne doit jamais être ajoutée au dépôt ni aux variables du Worker.

## Vérifier une modification

```sh
bun run security:audit
bun run migrations:check
bun run i18n:check
bun run images:check
bun run test
bun run test:mobile:install # une fois, pour installer WebKit
bun run build
bun run test:mobile
bun run typecheck
bun run lint
bun run deploy:check
```

Le workflow [Validate hub](.github/workflows/ci.yml) exécute ces contrôles sur les pull requests et `main`. `bun run preview:cloudflare` permet ensuite de tester le Worker construit en local. Les gestes tactiles et le rendu responsive doivent aussi être vérifiés dans un navigateur et sur téléphone.

Le dernier [audit du code et de la sécurité](docs/audits/code-security-2026-10-14.md) détaille les corrections, les vérifications et la dette de synchronisation Supabase restante.

## Modifier le contenu

Supabase est la source de vérité du catalogue. Les tables principales sont `levels`, `destinations`, `destination_links`, `destination_photos`, `destination_events`, `destination_posts`, `destination_videos`, `destination_opening_hours` et `site_settings`. Les descriptions et événements traduits se trouvent dans `destination_translations` et `event_translations`. Les anciennes migrations du dépôt décrivent l’historique Lovable ; **ne pas les rejouer sur la base de production déjà importée**.

Les horaires des fiches sont liés à `destinations.id` dans `destination_opening_hours` : services, jours, heures locales, dernière commande, source et date de vérification. Seules les lignes publiées sont affichées, sous la description, dans les six langues. La migration `20261006090000_destination_opening_hours.sql` a été appliquée en production le 6 octobre 2026. Voir [la gestion des horaires](docs/opening-hours.md).

Les fiches agrandies utilisent `destinations.detail_description`, tandis que les cards à swiper conservent `short_description`. Les textes longs et leurs cinq traductions ont été ajoutés aux 73 cards publiques le 6 octobre 2026. Voir [la gestion des descriptions enrichies](docs/expanded-descriptions.md).

Les actualités temporaires sont séparées dans `destination_notices` et leurs traductions dans `destination_notice_translations`. Publication et dates contrôlent l’encart de la fiche sans changer sa description. Voir [la gestion des actualités](docs/destination-notices.md).

Les familles éditoriales sont `resort`, `offer` et `storytelling`, avec audiences, durée des offres et sujet du storytelling. Trois vues marketing séparent leur gestion sans dupliquer les cards. La recherche de la map conserve uniquement les lieux du resort. Voir [la classification éditoriale](docs/editorial-taxonomy.md).

Pour modifier une card, mettre à jour sa ligne dans `destinations`. Les actions affichées et leur ordre viennent des lignes actives de `destination_links` : la card en montre au plus trois, la fiche toutes. Le hub propose l’anglais, le vietnamien, le russe, le chinois simplifié, le coréen et le japonais. Après un changement de texte anglais, vérifier les traductions associées avec `bun run i18n:audit` ; une traduction dont le texte source ne correspond plus est écartée au profit du texte anglais courant. Les nouveaux textes ne sont pas traduits automatiquement. Procédure détaillée : [traductions](docs/translations.md).

Les quatre niveaux partagent trois collections : **DINING · WELLNESS · EXPERIENCES**. Seules les collections contenant des cards publiées sont affichées. Leur ordre vient de `levels.clusters`, l’appartenance de chaque card de `destinations.cluster`. Une card sans collection reste accessible dans « More » ; l’index « All places » permet d’ouvrir directement chaque lieu. Voir [la gestion des collections](docs/database.md#collections-et-navigation).

La recherche globale, à côté des langues, propose Dining, Wellness, Experiences et Accommodation. Elle indexe uniquement les cards actives déjà chargées depuis Supabase : noms, descriptions traduites et sources, types, niveaux et événements. Les mots saisis sont combinés, les accents ignorés et les petites erreurs sur les noms tolérées ; les correspondances exactes de nom passent en premier. Le filtre Accommodation utilise le type hébergement ; les autres reprennent `destinations.cluster`. Ouvrir une fiche conserve la recherche et son défilement au retour. Aucun index externe ni migration SQL n’est nécessaire.

Chaque card active dispose d’une adresse directe basée sur son `destinations.id` : `/tingara`, `/citron`, `/la-maison-1888`, `/mi-sol-spa`, etc. L’ouverture depuis Journey, Surprise me ou l’atlas met à jour l’adresse ; Retour restaure le contexte de navigation. Un lien ouvert directement ou rechargé affiche la fiche correspondante avec ses données Supabase et les traductions du hub. Les identifiants doivent rester stables pour préserver les liens et QR codes. Une adresse inconnue ou une card dépubliée renvoie une page 404 ; aucune migration de base n’est nécessaire.

Les pages HTTPS du site InterContinental (avec ou sans `www`), leurs documents et les réservations TableCheck de La Maison 1888/Tingara s’ouvrent dans une fenêtre plein écran du hub. La croix revient à la card et à sa position de lecture ; « Ouvrir dans le navigateur » garde un accès direct à l’URL d’origine. Les autres destinations et les clics avec une touche de modification conservent leur ouverture habituelle. Les URL et leur ordre restent gérés dans Supabase, sans nouvelle migration.

La liste des destinations intégrables est centralisée dans `src/lib/resort-browser.ts`. Les pages web sont isolées par un `sandbox`. Les PDF sont affichés avec PDF.js : pages successives, zoom tactile et rendu des pages proches de l’écran. Le proxy n’accepte que les hôtes HTTPS du resort et leurs fichiers PDF publics, sans suivre les redirections. Le téléchargement est interrompu après 30 secondes, au-delà de 32 Mio ou quand le visiteur ferme la requête. Le streaming est activé ; les requêtes partielles restent désactivées. Une restriction d’intégration d’un site externe ne peut pas être détectée de façon fiable par `iframe.onload` : l’ouverture externe reste disponible.

Le fil Nam Tram reste compact à droite : quatre points et une cabine indiquent la progression. Un toucher ouvre le sélecteur des quatre niveaux. Une zone dédiée évite le chevauchement avec les collections ; la taille des cards reste inchangée.

Les vidéos YouTube des fiches agrandies viennent de `destination_videos`. Les vidéos classiques et Shorts publiés sont affichés dans l’ordre défini par la base ; toute nouvelle ligne est inactive par défaut. Voir [la procédure de publication](docs/database.md#vidéos-youtube) avant d'activer une autre vidéo.

La [procédure de maintenance de la base](docs/database.md) décrit les protections de publication. Les boutons utilisent uniquement `destination_links`. La migration historique `20260924120000_retire_legacy_action_columns.sql` retire les anciennes colonnes d’URL ; ne pas la rejouer sans vérifier l’état de la base.

Les photos des cards, niveaux et galeries sont référencées par URL publique Supabase Storage. Pour remplacer une image, publier un WebP optimisé sous un **nouveau nom**, puis changer son URL dans la ligne concernée. Pour l’image d’accueil seulement, `site_settings.hero_image` peut remplacer l’image locale de secours. Les objets déjà publiés et leur cache sont documentés dans le [guide des images](docs/images.md).

Le cache Cloudflare conserve séparément les réglages de l’accueil, le catalogue et les médias de chaque card pendant au maximum deux minutes à partir du début de leur lecture. Une seule implémentation applique cette expiration stricte à chaque clé. À expiration, aucune ancienne réponse n’est réutilisée en cas de panne. La lecture groupée du catalogue est atomique : une erreur rend cette lecture indisponible, sans réutiliser une ancienne publication. Le lecteur historique, utilisé seulement si la fonction SQL n’est pas encore installée, peut omettre une collection secondaire indisponible ; les collections lues avec succès restent applicables, y compris une liste vide ou une dépublication. Si les destinations ou les niveaux sont indisponibles, l’accueil reste visible et propose de réessayer le chargement du catalogue. Aucun catalogue local ne peut réintroduire une card. Un onglet déjà ouvert doit être rechargé pour garantir une nouvelle lecture.

La page d’accueil attend seulement `site_settings` (une lecture hors cache), puis charge le catalogue en arrière-plan après son affichage. Celui-ci comprend les collections nécessaires aux cards, à la recherche, aux traductions et aux correspondances avec la map. La migration additive des horaires porte cette lecture à douze collections publiques. La fonction SQL `published_hub_catalogue_v1()` les regroupe dans une seule requête GET Supabase, sans ajouter de galerie ni modifier le contenu. Elle est `STABLE`, `SECURITY INVOKER`, avec un chemin de recherche fixe et des colonnes explicites : les politiques RLS du visiteur restent applicables. L’agrégation JSON conserve toutes les lignes, même au-delà de la limite REST. La migration `20261024120000_public_catalogue_snapshot.sql` installe cette fonction et recharge le schéma PostgREST ; elle ne modifie aucune donnée. Tant que cette migration est absente, seule l’erreur de fonction manquante (`PGRST202`) déclenche les onze lectures historiques. Une panne, une permission refusée ou une réponse invalide ne déclenche ni nouvelle salve de lectures ni tentative automatique. Ce changement réduit le nombre de requêtes réseau hors cache ; son gain de temps doit être mesuré sur le déploiement utilisant réellement la fonction SQL. Les réponses dynamiques exposent dans `Server-Timing` la durée des réglages et du catalogue, avec leur provenance (`cache`, `database`, `rpc` ou `compatibility`). Chaque mesure appartient uniquement à sa requête ; elle ne contient ni URL, ni identifiant de lieu, ni clé. Le temps du catalogue inclut l’accès au cache, sa validation et, au besoin, la lecture et la mise en cache des données. Comparer les réponses `rpc` entre elles pour mesurer les lectures hors cache ; une réponse `cache` ne prouve pas que la nouvelle fonction SQL est installée. Les galeries photo, posts Instagram et vidéos sont lus uniquement pour la card ouverte, après vérification que le lieu est actif. Les liens directs vers une card conservent leur rendu et leurs métadonnées côté serveur. La map interactive et le lecteur PDF restent chargés à la demande. Les images des niveaux éloignés n’ont pas encore de `src` ; les deux images voisines du swipe sont préparées à basse priorité.

Les tests mobiles ralentissent volontairement le catalogue de 3,5 secondes : ils vérifient que le hero est déjà visible et que le sélecteur de langue fonctionne, puis testent la reprise après une panne du catalogue et des médias. Les lectures Supabase ont une limite de huit secondes et ne cumulent plus les tentatives automatiques du SDK ; le visiteur peut relancer la lecture. Ces mesures locales ne constituent pas une garantie de temps de chargement en production.

Les formes des données publiques sont validées côté serveur dans `src/lib/hub-schema.ts` et servent aussi à inférer les types TypeScript. Une réponse mal formée ou tronquée par la limite Supabase est considérée indisponible. Ce contrat décrit les champs lus par le hub ; il ne remplace pas un export administrateur du schéma SQL complet.

Les tests WebKit utilisent un profil iPhone 13 et une API locale fictive : aucune clé de production n’est nécessaire. Ils couvrent l’ouverture directe, le PDF multipage et le zoom, le retour, les gestes de navigation, ainsi que la recherche et les langues avec stockage navigateur refusé. La sensation tactile et les médias tiers nécessitent toujours une vérification sur appareil réel.

Les réponses du Worker interdisent par défaut l’encadrement par une origine tierce (`frame-ancestors 'self'`), les objets intégrés et les changements de base d’URL externes. Seules les réponses HTML publiques réussies à `/` et `/la-maison-1888` sur `icdn.artdigitaljourney.com` autorisent aussi `https://artdigitaljourney.com`, pour la démonstration intégrée au site ADJ. Ces réponses utilisent la liste exacte CSP sans l’en-tête contradictoire `X-Frame-Options`; les autres réponses conservent `SAMEORIGIN`. La politique de ressources est appliquée en mode bloquant. Chaque réponse reçoit un nonce de 128 bits : seuls les scripts inline du framework et de récupération portant ce nonce sont autorisés. Les scripts externes locaux et les fournisseurs Instagram/YouTube approuvés restent permis ; les gestionnaires inline et l’évaluation dynamique restent interdits. Les styles inline nécessaires aux composants et aux lecteurs restent autorisés. Les pages HTML ne sont pas mises en cache partagé ; les caches de données publiques et d’images gardent leurs règles existantes. Le nonce est conservé par le framework pendant la navigation du document et change au rechargement. Référence : [point d’entrée serveur TanStack Start](https://tanstack.com/start/latest/docs/framework/react/guide/server-entry-point).

## Découvertes après le hero

Trois entrées permettent de continuer la descente, ouvrir la carte ou découvrir les cards en ordre aléatoire (« Surprise me »). Le mode surprise réutilise les cards, médias, traductions et gestes du hub ; seules les destinations actives y figurent. L’ordre et la card courante sont conservés dans la session de l’onglet, avec un fonctionnement en mémoire si le stockage est indisponible. Les nouveaux lieux sont ajoutés à la suite et les lieux dépubliés disparaissent. Un nouveau mélange est disponible après la dernière card. Aucun changement de schéma Supabase n’est nécessaire.

## Carte interactive

L’atlas plein écran s’ouvre depuis l’écran de découverte après le hero, le sélecteur Nam Tram, le pied de page ou « View on map » dans une fiche associée. Il propose recherche, filtres par collection/niveau, zoom et déplacement, repères photo, sentiers et parcours Bensley. Toucher un lieu ouvre les **mêmes cards Supabase** que le hub, avec leurs médias et traductions.

Les positions sont dans `map_places` et les associations dans `map_destination_links`. Le niveau et la collection des destinations du hub font autorité ; aucune copie éditoriale du projet de carte n’est utilisée. Une offre sans position vérifiée ne reçoit pas de repère inventé. Voir [la maintenance de la carte](docs/resort-map.md).

## Déploiement et structure

Les changements fusionnés dans `main` sont construits pour le Worker `icdnd`. Nitro génère `.output/server/wrangler.json` et `.output/public` ; le site nécessite le rendu serveur et ne se publie pas comme un simple dossier statique. Les paramètres du Worker, des prévisualisations et du domaine sont dans le [guide Cloudflare](docs/cloudflare.md).

- `src/routes/_hub.tsx` : parcours persistant et progression Nam Tram.
- `src/routes/_hub.$destinationId.tsx` : fiches partageables par identifiant Supabase.
- `src/components/hub/` : cards, fiches, images et navigation.
- `src/lib/hub.functions.ts` : lectures et cache des données Supabase côté serveur.
- `src/data/hub-value.ts` : préparation du contenu Supabase, sans catalogue de secours.
- `src/i18n/` : libellés de l’interface et résolution des traductions Supabase.
- `src/assets/` : images locales de remplacement pour les références historiques ; `tests/` : tests unitaires ; `e2e/` : parcours mobiles.
- `scripts/translation-snapshot/` : archive des traductions initiales pour audit/export, jamais chargée par le site.

Le projet reste connecté à Lovable pour son historique Git. Travailler sur une branche et ouvrir une pull request ; ne pas forcer un push ni réécrire des commits déjà publiés. Le [brief créatif historique](docs/design-brief.md) reste disponible séparément.

Les boutons **Discover** et **Website** peuvent avoir une URL différente selon la langue, gérée dans Supabase avec retour au lien commun si la variante manque. Menus et réservations conservent leurs liens partagés. Voir [la gestion des liens multilingues](docs/localized-links.md).

### Interface palette

`src/brand.css` centralizes the neutral interface theme, based on the public
[InterContinental Danang website](https://www.danang.intercontinental.com/)
observed on 28 September 2026: white `#ffffff`, off-white `#f3f3f1`, charcoal
`#3d3935`, rose sand `#d8bdb4` and accent `#d3b5a3`. Darker neutral text keeps
small controls readable; sand is used for backgrounds and borders.

This theme covers the welcome/discovery interface, map controls, Surprise me,
language menu, concierge button, footer and embedded browser/PDF chrome.
All expanded destination cards use the shared template and their level's palette,
whether opened from Journey, search, Surprise me or the map. The four Journey
worlds, Nam Tram and illustrated map artwork keep their colors and visual identity.
All hub typography, including the Journey and its cards, uses the shared brand font stacks.
The footer social URLs are configured by `site_settings.youtube`, `site_settings.x`,
`site_settings.facebook` and `site_settings.linkedin`;
Dining and Spa remain in settings but are not displayed in the footer.
The favicon and Apple touch icon use the official resort website’s InterContinental mark.

Typography uses locally available Baskerville/Georgia and Gill Sans/Arial.
The site's proprietary New Baskerville/Gill Sans webfont files are not bundled;
exact brand typography would require approved, licensed font assets. This is
alignment with the public site's visual language, not a certified group brand kit.

Le [complément du catalogue officiel du 6 octobre 2026](docs/official-catalogue-completion.md) distingue Club et lounge, ajoute les dernières expériences et publie les quinze catégories d’hébergement en conservant les identifiants existants.

## Images et fluidité des fiches

Une visite directe sur une fiche attend uniquement ses réglages et `published_hub_destination_card_v1(id)`. Cette lecture publique ciblée contient la destination publiée, ses actions, événements, traductions et correspondances avec la map. Elle conserve les colonnes publiques et les règles RLS ; une fiche non publiée retourne `null`. La migration `20261024160000_public_destination_card_snapshot.sql` n’altère aucun contenu. Seule son absence (`PGRST202`) utilise une lecture fraîche du catalogue complet comme compatibilité, sans reprojeter un ancien cache dans un nouveau délai de deux minutes. Le cache ciblé a la même expiration stricte de deux minutes ; les pannes et les destinations absentes ne sont pas conservées. Si la fiche ciblée n’est pas en cache mais qu’un catalogue complet est encore valide, le serveur en extrait uniquement cette fiche sans relire Supabase. Cette réutilisation apparaît comme `catalogue-cache` dans `Server-Timing`. Elle ne crée aucune nouvelle entrée et ne renouvelle pas l’expiration du catalogue. Une fois celui-ci expiré, la lecture ciblée reprend normalement ; son chemin hors cache reste inchangé.

Les migrations `20261025010000_initial_public_opening_hours.sql` et `20261025010001_card_initial_public_opening_hours.sql` ajoutent les horaires publiés, respectivement au catalogue et à la fiche, avec les mêmes colonnes publiques et règles RLS. Elles ne changent ni les données ni les droits. Les horaires sont présents dans le HTML initial de la fiche, sans attendre la lecture des galeries, posts ou vidéos. Les anciens snapshots sans ce champ conservent le chargement média habituel ; une liste vide publiée reste vide, y compris pendant une nouvelle tentative après une erreur de galerie. Les caches changent de version sans prolonger leur expiration.

Une fiche ouverte par son URL ou rechargée est visible dès le premier rendu. Le fondu existant de 420 ms est conservé pour les navigations dans le hub : clic sur une card, swipe, lien vers la suivante et retour entre fiches. Le même état initial est utilisé côté serveur et lors de l’hydratation, sans réactiver le fondu à l’arrivée des données secondaires.

Le document HTML de la fiche est complet, sans attendre ni streamer le catalogue complet. Celui-ci charge après l’affichage avec une priorité réseau basse lors du chargement de fond initial ; une nouvelle tentative demandée par le visiteur utilise la priorité normale. Les appels partagent toujours la même requête en cours. Les navigateurs qui ignorent cette indication conservent le comportement de chargement existant. Les données ciblées portent explicitement le périmètre `card` et ne peuvent pas amorcer le cache du catalogue complet. Recherche, sous-cards et map attendent un catalogue complet et proposent de réessayer en cas d’échec. Les fournisseurs restent montés pendant cet enrichissement, y compris lorsqu’une demande de map quitte la fiche avant la fin du chargement. Les swipes précoces attendent la même lecture complète, sans boucle dans un sous-ensemble d’une seule fiche.

Le navigateur partage pendant 30 secondes les lectures publiques du catalogue, des fiches ciblées, des réglages et des médias, y compris les requêtes en cours. Le rendu serveur continue d’utiliser son cache public de deux minutes. Les réponses incomplètes et les erreurs ne sont pas mémorisées ; une nouvelle tentative relit les médias. Les médias commencent au clic, sans charger les embeds des autres fiches.

Les variantes de `src/data/image-variants.json` sont générées depuis les photos publiées et servies dans `public/images/optimized/`. Les vignettes ont leur propre fichier ; les cards utilisent `srcSet` et conservent l’original HD comme plus grand candidat. Les photos agrandies disposent aussi de variantes AVIF 960/1280 px et d’un AVIF à leur définition native, sélectionnés par `<picture>` avec repli WebP/original ; leur préchargement SSR utilise exactement les mêmes candidats et la même géométrie `object-fit: cover`. Un écran dense conserve le candidat HD nécessaire. Le cadrage reste identique. Une nouvelle URL CMS inconnue utilise directement son original.

Après l’ajout ou le remplacement de photos, suivre [la procédure images](docs/images.md). `bun run images:variants /inventaire.json /sauvegarde-verifiee /nouveau-dossier` prépare les originaux et les dérivés Sharp hors du dépôt. Cette commande ne publie et ne supprime rien. Vérifier les fichiers, les importer dans le bucket, contrôler leurs réponses publiques, puis inclure le manifeste dans une PR. Les noms dépendent du contenu : conserver les versions encore référencées et ne jamais écraser une photo publiée.

Les pages HTML officielles sont ouvertes sur leur hôte canonique `www.danang.intercontinental.com` ; les URL des PDF restent exactes car leur proxy refuse les redirections. Le lecteur PDF est préparé uniquement à l’ouverture ou sur une intention clavier/souris. La bibliothèque est une dépendance du module différé du lecteur pour éviter une seconde chaîne d’import ; aucun PDF n’est téléchargé au survol. Les collections photos/posts/vidéos appartiennent exclusivement au chargement média par destination, pas au catalogue. La fonction SQL `published_hub_destination_media_v1` vérifie la publication et lit, en une requête anonyme, les six collections de la fiche ouverte (galerie, posts, vidéos, horaires, actualités et sous-cards). Elle conserve les règles RLS et les colonnes publiques existantes. Pendant un déploiement indépendant de la base et du frontend, seule une fonction absente utilise le lecteur historique ; les erreurs restent relançables. Le diagnostic public `Server-Timing` distingue la lecture RPC, le cache et cette compatibilité, sans identifiants ni données privées. Il inclut validation et cache, pas uniquement le temps SQL.
