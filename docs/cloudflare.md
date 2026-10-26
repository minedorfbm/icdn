# Hébergement Cloudflare Workers

Le hub est déjà en production sur <https://icdn.artdigitaljourney.com/>. Le Worker `icdnd` est relié au dépôt `minedorfbm/icdn`, branche `main`. Cloudflare sert à la fois le rendu serveur TanStack Start et les fichiers statiques. La landing page `artdigitaljourney.com` relève d’un autre dépôt et d’un autre Worker.

## Construction et déploiement

La configuration du dépôt est dans `wrangler.json`. Le build `bun run build` génère `.output/server/wrangler.json` et `.output/public` ; `bun run deploy` déploie cette sortie. Le Worker ne doit pas être remplacé par une publication du seul dossier statique.

Pour reproduire la configuration du build Cloudflare :

- Node.js 22.12 ou supérieur et Bun 1.4.2 ;
- installation : `bun install --frozen-lockfile --ignore-scripts` ;
- build : `bun run build` ;
- déploiement : `bun run deploy`.

Le workflow GitHub Actions valide les pull requests et `main`. `bun run deploy:check` vérifie le paquet local sans le publier. `bun run preview:cloudflare` démarre le Worker construit dans le moteur local de Cloudflare.

Le site et les prévisualisations utilisent `SUPABASE_URL` et `SUPABASE_PUBLISHABLE_KEY` définis dans `wrangler.json`. La clé est **publique** et les lectures restent limitées par les politiques RLS. Ne jamais ajouter de clé secrète Supabase au Worker ou au dépôt. Les fichiers `.env.local` ne concernent que le développement local.

## Vérifier une publication

Après un déploiement, ouvrir le domaine de production et contrôler les quatre niveaux, le swipe dans les deux sens, l’ouverture d’une fiche, ses liens et les traductions. Vérifier également qu’aucune erreur `[hub]` ne signale une lecture Supabase indisponible dans les logs du Worker. Une modification du contenu en base peut prendre environ deux minutes à se refléter, car les données publiques sont mises en cache dans le cache du centre de données Cloudflare, avec des clés distinctes pour les réglages, le catalogue et les médias de chaque card, sans prolongation en cas de panne. Recharger un onglet déjà ouvert pour vérifier la nouvelle publication.

Le domaine personnalisé est configuré dans Cloudflare et n’est pas recréé par `wrangler.json`. Le DNS du domaine racine et les enregistrements de messagerie OVH (MX, SPF, DKIM, DMARC) ne sont pas modifiés par ce dépôt.

Le preset Nitro est `cloudflare-module`. `@lovable.dev/vite-tanstack-config` reste une dépendance de compilation, mais l’exécution du site ne dépend plus de l’hébergement Lovable.

## Dépendances de construction

`@lovable.dev/vite-tanstack-config` compose Vite, React, Tailwind, TanStack Start et Nitro. Nitro cible `cloudflare-module` ; sa version beta est verrouillée par `bun.lock`. Cette configuration est active, pas du code mort : ne pas doubler ses plugins. Une extraction future doit être une migration dédiée, validée par le build Worker et les tests WebKit. Aucun changement de moteur de construction n’est nécessaire pour le nettoyage actuel.

## Politique de sécurité des contenus

Le Worker applique les restrictions de ressources précédemment testées en observation : scripts locaux, Instagram et YouTube ; connexions locales et Instagram ; iframes limitées aux fournisseurs approuvés. Les PDF passent par le serveur du hub, les lectures Supabase restent côté serveur et le lecteur PDF utilise un worker local/blob. Les styles Google Fonts et leurs polices restent autorisés. Les images et médias HTTPS restent possibles pour le catalogue.

Le rendu serveur autorise ses scripts inline avec un nonce propre à chaque réponse, sans permission générale `unsafe-inline` pour les scripts. Les gestionnaires inline (`onclick`, etc.) et l’évaluation dynamique (`eval`/`Function`) restent bloqués. Cette politique limite les ressources chargées ; elle ne garantit ni l’absence de vulnérabilité ni la disponibilité des services tiers.

L’ancien en-tête `Content-Security-Policy-Report-Only` est retiré. Aucun collecteur de rapports, suivi supplémentaire ou requête récurrente n’est ajouté. L’exception d’intégration par `artdigitaljourney.com` reste limitée aux deux pages de démonstration prévues. Toute nouvelle origine de script, connexion ou iframe doit être vérifiée avant d’être autorisée dans `src/lib/security-headers.ts`.

## Pilote de placement des prévisualisations

Les prévisualisations activent `placement.mode = "smart"`. La production garde son placement actuel : la section `previews` est une configuration distincte. Ce pilote cherche à réduire le trajet entre le Worker et Supabase lorsque les caches sont froids. Il ne change ni les lectures publiques, ni les règles RLS, ni l’expiration des caches, ni la présentation.

Mesures du 25 octobre 2026 sur trois fiches publiques (Citron, Tingara, Wine Cellar), puis une seconde lecture des mêmes fiches :

| Mesure                                            | Résultat                                                | Portée                                                                                                         |
| ------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Lecture `card` fraîche vue depuis le Worker       | 487–1 202 ms, médiane 623 ms                            | Trois appels, inclut réseau, traitement et cache ; pas seulement SQL                                           |
| Lecture `card` avec cache serveur valide          | 6–90 ms, médiane 7 ms                                   | Trois appels, durée serveur ; pas le rendu complet                                                             |
| Requête PostgREST de fiche dans Query Performance | Moyenne 20 ms, minimum 4 ms, maximum 338 ms, 370 appels | Statistiques accumulées de production, période de remise à zéro non déterminée ; plusieurs révisions possibles |
| Temps amont annoncé par la passerelle Supabase    | 36–46 ms                                                | Trois lectures anonymes directes ; inclut le traitement amont et son réseau local                              |

Ces chiffres rendent le trajet réseau prioritaire à examiner. Ils ne prouvent pas qu’un placement différent accélérera le site. Les requêtes du poste sont entrées par le point Cloudflare MRS ; elles ne représentent pas un parcours mesuré au Vietnam ni un LCP mobile. Aucun pourcentage de gain visiteur n’est établi.

### Référence géographique : Da Nang

Le public prioritaire utilise le site depuis Da Nang, Vietnam. Le tableau Supabase du projet confirme actuellement **Oceania (Sydney), `ap-southeast-2`**. Ne pas déduire la région de la base du seul nom de domaine Supabase ou de son adresse IP publique.

Les mesures entrées par MRS sont un diagnostic de couches, pas une validation locale. Le critère d’acceptation doit inclure un réseau Wi-Fi de Da Nang et un réseau mobile vietnamien, sur un appareil physique. Conserver la date, le type de connexion et le point d’entrée réseau observé, sans enregistrer l’adresse IP du visiteur. Une mesure située à Singapour peut servir de repère régional, mais doit rester étiquetée comme telle.

Le placement Smart ne déplace pas la base hors de Sydney et peut rester au réglage par défaut s’il n’observe aucun gain. Ne pas forcer le Worker à Sydney : les lectures avec cache valide pourraient alors payer un trajet supplémentaire. Une migration Supabase vers une autre région est un chantier distinct qui nécessite comparaison depuis Da Nang, sauvegarde, validation des contenus et des URL Storage, ainsi qu’un plan de bascule et de retour. Ce pilote ne crée pas de nouveau projet et ne modifie pas le projet actuel.

### Conditions de validation

Selon la [documentation Cloudflare du placement](https://developers.cloudflare.com/workers/configuration/placement/), Smart Placement a besoin de trafic provenant de plusieurs emplacements et peut prendre jusqu’à quinze minutes pour établir une décision. Une prévisualisation déployée ou un seul poste de mesure ne prouvent pas que le placement a été optimisé. Si l’état est `INSUFFICIENT_INVOCATIONS`, le pilote est non concluant.

Avant toute activation en production, relever le statut de placement dans le tableau Cloudflare et comparer des lectures fraîches et en cache sur les mêmes fiches, à plusieurs heures et depuis les zones utilisées par les visiteurs. Comparer le TTFB complet et les métriques `Server-Timing`, séparément des temps d’exécution SQL. Vérifier aussi les erreurs et les lecteurs PDF/pages externes. Ne pas allonger les caches pour produire un gain apparent, ni vider les caches de production pour le test.

Les ressources statiques restent servies au plus près du visiteur avec la configuration actuelle d’Assets : ne pas ajouter `run_worker_first: true`. Voir la [documentation Assets et Smart Placement](https://developers.cloudflare.com/workers/static-assets/binding/#smart-placement). Un accès explicite via la liaison `ASSETS` peut suivre le lieu du Worker ; le pilote doit donc mesurer aussi les chemins de lecture concernés.

Le retour au réglage précédent consiste à retirer `previews.placement` et redéployer la prévisualisation. Un déploiement de production ne doit pas être décrit comme optimisé tant que son propre placement et ses mesures ne l’ont pas confirmé.

Le sens de `x-envoy-upstream-service-time` est décrit dans la [documentation Envoy](https://www.envoyproxy.io/docs/envoy/latest/configuration/http/http_filters/router_filter#x-envoy-upstream-service-time) ; il ne remplace pas un plan d’exécution SQL.

## Transfert des photos de fiche sur WebKit

La photo principale connue est préparée dès le clic, pendant la lecture fraîche des données. Lors d’une navigation côté navigateur, WebKit pouvait aussi demander le WebP de secours avant que le nouvel élément `img` ne soit associé aux sources de son `picture`. Le remplacement de sources dans un même `picture` pouvait également déclencher l’ancien secours.

Le `picture` conserve désormais une identité liée à ses deux sources et les attributs de secours sont appliqués après son attachement, avant le premier affichage. Le préchargement commence toujours dès le clic. Un accès direct rendu côté serveur garde immédiatement les attributs complets et son secours original, même sans JavaScript ; l’image principale n’est pas marquée `loading="lazy"`.

La régression réseau couvre une source CMS inconnue, une source AVIF connue aux tailles mobile/tablette/desktop, les changements de photo et une dépublication. Elle exige une seule requête pour l’image principale par sélection ; les petites vignettes visibles du sélecteur restent intentionnelles. Ce contrôle des transferts ne donne pas un nouveau LCP global et ne remplace pas la validation physique à Da Nang.

## Séparer la validation serveur de la présentation navigateur

Les schémas des fiches, horaires, collections, annonces et avantages restent validés au serveur. Leurs fonctions d'affichage et d'adaptation importent uniquement les types des schémas ; elles ne construisent pas de validateurs dans le navigateur. Les lecteurs et leurs règles de publication, de sécurité et de cache restent inchangés.

Comparaison locale du 26 octobre 2026 avec le même verrou de dépendances et le même build de production : fichier d'entrée de 480 257 à 386 536 octets, et de 146 786 à 120 564 octets avec la même compression gzip locale. L'analyse des sourcemaps temporaires ne trouve plus Zod ni l'initialisation `jitless` dans les chunks client. Ce relevé de poids ne représente pas un gain LCP mesuré, ni le transfert Brotli réel de Cloudflare. Les sourcemaps servent seulement à l'analyse locale ; elles ne sont pas activées dans la configuration publiée.

`tests/presentation-boundary.test.ts` construit les fonctions de présentation pour le navigateur et vérifie qu'elles ne réintroduisent ni import Zod ni initialisation de la validation. Les tests de données continuent de vérifier les mêmes schémas et rejets au serveur.

## Cache des photos publiques versionnées

Les variantes raster publiées dans `image-variants-runtime.json` dont le nom commence par `adj-<empreinte>` sont livrées par `/media/<fichier>` sur le domaine du hub. Supabase `hub-images` reste leur origine. Le Worker ne réencode pas les fichiers et ne modifie ni le cadrage ni les candidats responsive. Les anciennes adresses non versionnées et nouvelles photos CMS hors inventaire conservent leur livraison existante. Les trois SVG officiels du logo sont également servis par ce cache : seuls leurs noms et empreintes SHA-256 complets, inspectés et inscrits dans le code, sont acceptés. La lecture est limitée à 64 Kio ; un contenu modifié, tronqué ou trop volumineux échoue sans entrer dans le cache. La réponse SVG bloque les scripts et les ressources externes, tout en permettant le JPEG intégré de l’emblème doré et ses styles de présentation. Le fichier reste identique à celui de Supabase.

La route accepte uniquement GET/HEAD et les fichiers de la liste publiée, sans paramètres. Elle ne transmet aucun cookie, jeton ou en-tête du visiteur à Supabase, refuse les redirections et les types inattendus, et ne met en cache que les réponses 200. Une erreur reste `no-store`. Les réponses réussies utilisent `public, max-age=31536000, immutable` et une empreinte comme ETag ; une nouvelle image doit donc avoir un nouveau nom, jamais écraser un fichier publié.

`x-image-cache` indique HIT, MISS ou BYPASS. Le remplissage utilise `Request.waitUntil`, fourni par l’adaptateur Cloudflare de Nitro, pour ne pas retarder le flux vers le navigateur. Le cache ne concerne pas les documents HTML avec nonce ni les réponses du catalogue.

La [Cache API Cloudflare](https://developers.cloudflare.com/workers/runtime-apis/cache/) est locale au centre de données et n’utilise pas Tiered Cache. Un MISS sur un nouveau centre est normal. Ne pas comparer deux requêtes comme un couple froid/chaud si leurs centres diffèrent. Le pilote Smart Placement des prévisualisations reste distinct du placement de production ; vérifier les réponses et les temps sur le domaine final après fusion avant de conclure à un gain local à Da Nang. Le cache peut être évincé avant sa durée maximale.
