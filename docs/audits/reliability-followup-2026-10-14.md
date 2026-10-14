# Suivi de fiabilisation — 14 octobre 2026

Base : `93c50385f8d341f55162efcc5cf6067c996f8e2f` (PR 97–101 et 107 fusionnées).

## Historique Supabase

La base contenait les effets des migrations d’octobre, mais son journal n’enregistrait que 42 versions. Les 22 versions manquantes ont été rapprochées du schéma et des contenus avant d’être enregistrées, sans exécuter leurs corps SQL. Le journal contient désormais les 64 versions de `main`.

Contrôle indépendant après commit de la transaction : empreintes identiques sur les 21 tables publiques ; 74 cards actives, 139 posts Instagram actifs et 38 vidéos actives. La comparaison fixe explicitement le fuseau UTC et la collation C pour éviter des différences de représentation entre PostgreSQL local et hébergé. Le script ponctuel est conservé dans `supabase/manual/reconcile-ledger-20261014.sql` et refuse de repartir sur un état différent.

Comparaison avec une base reconstruite : mêmes 252 colonnes, mêmes 101 contraintes hors contraintes NOT NULL explicites propres à PostgreSQL 18, 21 politiques, 4 vues et 25 triggers. Les 10 fonctions correspondent après normalisation des espaces. Les écarts éditoriaux ultérieurs (résidence de six chambres, photos, liens, publications, numéros sur la map) sont conservés.

## Reconstruction depuis une base vide

Un nouveau contrôle `bun run migrations:test` exécute toute la chaîne avec PostgreSQL embarqué (PGlite 0.5.8, dépendance de développement uniquement), sans connexion à Supabase. Il est ajouté à la CI. Il vérifie aussi l’absence de droits publics d’écriture et le rejet des liens ambigus.

Le replay a révélé trois dépendances historiques manquantes :

- Yoga Pavilion appartenait encore à Earth quand la collection WELLNESS lui était affectée ; le passage transitoire doit donc autoriser cette collection sur Earth.
- Les traductions initiales vi/ru/zh avaient été saisies hors migrations. Leur seed utilise le snapshot déjà versionné, n’insère que les traductions absentes et ne publie que celles dont la source correspond.
- Deux liens génériques, le lien IHG et deux liens de menu créés dans l’éditeur manquaient avant les audits d’octobre. Un seed conservateur rétablit cette étape.

Les audits Discover, menus et remplacement vidéo utilisaient des UUID propres à la production. Ils gardent leurs contrôles sur ces UUID lorsqu’ils existent ; sinon, ils exigent une correspondance unique par destination et contenu audité. Une modification concurrente ou une correspondance ambiguë continue d’arrêter la migration.

Les deux blocs de bootstrap ont été vérifiés sur une copie exacte des contenus publiés : aucun changement dans les 21 tables. Ils sont intégrés aux migrations historiques correspondantes, déjà enregistrées dans le journal, pour servir uniquement aux reconstructions neuves. Aucune nouvelle migration antidatée n’est ajoutée à appliquer en production. Les migrations historiques corrigées ne doivent pas être rejouées en production. L’ensemble conserve 64 migrations.

## Protections des contenus intégrés

La CSP impose désormais les origines autorisées pour les iframes (Instagram, YouTube, site du resort, TableCheck), les workers locaux/blob utilisés par le PDF et le rejet des gestionnaires JavaScript dans les attributs HTML. L’exception d’intégration du site ADJ reste limitée aux deux pages publiques prévues.

Les restrictions des scripts, connexions, images et polices restent en observation. Les essais automatisés simulent les fournisseurs : ils valident les frontières et les interactions, pas la disponibilité des réseaux tiers. Un durcissement supplémentaire demandera une observation de leurs chaînes de ressources réelles.

## Map

Le panneau de lieu est isolé dans `MapPreview.tsx`. Son ouverture, le glissement, les liens de cards, les numéros de chambres et le rendu sont conservés. L’illustration et la géométrie ne sont pas réécrites.

## SonarCloud

Cause confirmée de l’échec de l’analyse complète : quota de l’organisation. Le dernier échec indique 44 427 lignes utilisées sur 50 000, pour une analyse du hub de 24 935 lignes, remplaçant une ancienne analyse d’environ 5 600 lignes. Les analyses de PR réussies ne prouvaient pas que l’analyse complète était à jour. Aucun fichier applicatif ou SQL de sécurité n’est exclu pour masquer ce dépassement.

Les 16 autres projets SonarCloud ont été supprimés après demande et confirmation explicites de l’utilisateur. La liste de l’organisation affiche désormais uniquement `icdn`. La page de quota affiche 15 543 lignes utilisées sur 50 000 et 34 457 disponibles. Les dépôts GitHub et les déploiements sont conservés. Le Quality Gate de la PR 108 réussit. Les 19 remarques consultées concernent des littéraux répétés dans les SQL et un `await` séquentiel dans le test des migrations : ce dernier est indispensable aux dépendances entre migrations. Elles ne sont pas masquées ; aucun Security Hotspot n’est signalé. La relance de `main` a été demandée dans GitHub mais aucun nouveau résultat complet n’est encore confirmé ; son ancien résultat remonte au 25 septembre. La fusion déclenchera une nouvelle analyse complète.

## Validation

- 64 migrations reconstruites ; contrôle des privilèges et du rejet des liens ambigus réussi.
- 125 tests unitaires réussis ; TypeScript, ESLint, traductions et images validés.
- 47/48 tests mobiles réussis au premier passage ; le test de retour au contexte d’accueil a présenté un échec intermittent sur une transition, puis réussi trois fois consécutives sans modification. Le nouveau test CSP et les parcours map/PDF/Instagram/YouTube réussissent. Le passage CI complet suivant a réussi les 48 tests.
- Build et préparation Cloudflare réussis.
- Audit npm autorisé par l’utilisateur : aucune vulnérabilité connue parmi 451 paquets au moment du contrôle.

## Exploitation

Les futures migrations doivent être appliquées par le flux de déploiement qui enregistre leur version. Pour une intervention manuelle, conserver la preuve des préconditions, appliquer le SQL puis enregistrer immédiatement cette seule version. Ne pas relancer une chaîne de migrations de contenu sur une production déjà éditée.

Une base reconstruite retrouve le schéma et les seeds versionnés ; elle ne constitue pas une sauvegarde du catalogue vivant. Les sauvegardes Supabase restent nécessaires pour les éditions faites dans le CMS.

## Analyse complète après fusion de la PR 108

La PR 108 est fusionnée en `d54d158495fe499eb1b19312e05e876fdaea294b`. Cloudflare, Supabase et la validation GitHub réussissent. Une lecture HTTP de la production confirme les nouvelles directives CSP bloquantes. L’analyse complète SonarCloud de ce commit réussit le 14 octobre à 23:22, heure de Danang (tâche `AaE7OJw1An0_fsDEdh_6`), après les précédents échecs de quota.

Le périmètre est d’environ 26 000 lignes. Sonar relève 238 issues distinctes : 0 de sécurité, 2 de fiabilité et 237 de maintenabilité (une issue relève de deux qualités). Aucun Security Hotspot. L’inventaire intégral des 238 lignes a été consulté : 198 concernent les SQL, 40 les sources applicatives, un fichier généré et les scripts. Le taux de duplication est de 0,8 %. Ces chiffres décrivent le contrôle statique, pas une garantie d’absence de vulnérabilité. La couverture de tests n’est pas importée dans SonarCloud.

Le Quality Gate de main reste « Not computed » pour une autre raison que le quota : aucune définition du nouveau code n’était choisie. Le projet est désormais configuré sur les 30 derniers jours, adapté à ses déploiements continus. Ce réglage prendra effet à la prochaine analyse ; les seuils du Quality Gate et les alertes existantes restent inchangés.

### Corrections applicatives complémentaires

- La surface des cards utilise le bouton HTML natif du titre, étendu visuellement à la card. Le conteneur générique ne déclenche plus l’ouverture. Les liens indépendants, les aperçus voisins, la restauration du focus et le rejet du clic consécutif au swipe sont conservés. Cette correction cible les deux issues de fiabilité.
- La page de secours SSR conservait un `onclick` en HTML, désormais bloqué par la CSP de la PR 108. Le bouton Réessayer utilise maintenant un gestionnaire enregistré par le script de la page. Un test WebKit applique la vraie politique du Worker au vrai HTML de secours et vérifie le rechargement. Les traductions restent testées, y compris lorsque le stockage local est refusé.
- Deux usages obsolètes de `inputValidator` passent à `validator`, qui appelle exactement la même fonction dans la version TanStack installée. Les schémas de validation et les contrôles de publication restent identiques.
- Les props non mutées sont déclarées en lecture seule ; les affectations de groupes de médias, les alias de routes et la mise en forme des erreurs sont rendus explicites. Les règles CSS des filtres de map sont regroupées avec leurs valeurs effectives existantes. Aucun contenu de base de données n’est modifié.

Les anciennes migrations ne sont pas réécrites pour retirer des littéraux éditoriaux répétés. Les autres observations à faible portée sont conservées visibles : fichier de routes généré, chargements séquentiels nécessaires, annonces `role="status"`, clés de listes sans état et nom volontaire du setter de langue. Elles n’ont pas été déclarées résolues ou exclues artificiellement. Le test des migrations doit rester séquentiel, car chaque migration dépend des précédentes.

Validation de ce suivi : 125 tests unitaires réussis, 50 tests mobiles WebKit réussis, TypeScript, ESLint, build et préparation Cloudflare réussis. Les deux tests supplémentaires couvrent l’activation native des cards et le bouton de récupération sous CSP. Les suites existantes vérifient aussi les quatre palettes, les médias, les relations, les langues, les filtres et le cadrage de la map. Aucun nouveau paquet ni nouvelle migration n’est ajouté.

## Suivi du 15 octobre — après fusion de la PR 109

La PR 109 est fusionnée en `dd2e555e1db53ba37068ecbc51d2b237fab14d08`. Les contrôles de validation, Cloudflare et Supabase réussissent. L’analyse complète SonarCloud de ce même commit affiche désormais un Quality Gate **Passed**, avec les notes A en sécurité, fiabilité et maintenabilité : zéro issue de sécurité, zéro issue de fiabilité et zéro Security Hotspot. La couverture des tests n’est toujours pas importée dans SonarCloud.

Le total est de 221 remarques de maintenabilité : 198 SQL, 13 TypeScript et 10 CSS. Les dix observations CSS sur `!important`, absentes du précédent inventaire, sont maintenant visibles. Quatre concernent les dimensions et marges injectées en style inline par Instagram ; les six autres garantissent la priorité de la préférence de mouvement réduit, y compris face aux styles inline des composants. Les retirer modifierait le rendu des embeds ou dégraderait cette préférence d’accessibilité. Leur raison est documentée dans les styles ; aucune règle Sonar ni exclusion d’analyse n’a été modifiée.

Le suivi applicatif traite quatre remarques sur les annonces d’état : les chargements de Benefits, du catalogue et du film Michelin utilisent l’élément natif `output`, avec son rôle de statut implicite. Le bouton de nouvelle tentative de Benefits reste indépendant du message annoncé. Les trois états de Benefits (chargement, résultat, indisponibilité) sont séparés pour retirer la condition imbriquée ; les données, traductions et contrôles serveur sont conservés. Un parcours mobile supplémentaire vérifie un chargement suspendu, son échec, la nouvelle tentative et la restauration du focus à la fermeture.

Les autres remarques TypeScript restent identifiées : un en-tête de routes généré, quatre traitements asynchrones séquentiels justifiés, deux clés par position de listes sans état et le nom explicite du setter interne de langue. Les listes concernées n’exposent pas d’identifiant durable ; remplacer leur position par leur texte ou leur image pourrait créer des clés dupliquées. Le traitement du journal des migrations doit rester séquentiel. Ces observations ne sont ni exclues ni déclarées résolues artificiellement.

Validation du suivi : 125 tests unitaires réussis ; TypeScript, ESLint, formatage, build et préparation Cloudflare réussis. Le passage mobile initial réussit 50 tests sur 51, dont le nouveau scénario Benefits. Le test de retour au contexte d’accueil retrouve une course déjà observée : l’URL change avant que le chargeur de route ait remplacé la card, et le second clic peut encore viser l’ancien bouton. Le test attend désormais la card rendue avant de poursuivre et vérifie explicitement chaque URL ; cinq passages consécutifs réussissent, sans temporisation arbitraire ni modification de la navigation applicative.

## Couverture et priorités restantes — 15 octobre

Le passage CI complet de la PR 110 confirme les 125 tests unitaires et les 51 parcours mobiles réussis. Le suivi ajoute `bun run test:coverage` : la CI exécute les mêmes tests une seule fois, génère le rapport LCOV et conserve son résumé dans le résultat GitHub ainsi qu’un artefact `unit-coverage` pendant 14 jours. Aucun service de suivi supplémentaire ni dépendance n’est ajouté.

La première mesure porte sur 34 fichiers applicatifs, avec 2 357 lignes exécutées sur 2 395 lignes mesurées (98,41 %). **Ce n’est pas la couverture de toute l’application.** Le rapport liste également les 62 autres fichiers parmi les 96 sources TypeScript/TSX écrites à la main. Bun ne mesure que les modules chargés ; les parcours mobiles WebKit et la reconstruction des migrations ne contribuent pas à ce LCOV. Les déclarations de types et le fichier de routes généré ne figurent pas dans cet inventaire ; les fixtures de tests ne gonflent pas la mesure.

Le réglage SonarCloud a été consulté : l’analyse automatique est activée. D’après [la documentation Sonar](https://docs.sonarsource.com/sonarqube-cloud/analyzing-source-code/test-coverage/javascript-typescript-test-coverage), elle ne peut pas importer la couverture. Le rapport est donc exploitable dans GitHub dès maintenant ; son import dans Sonar reste à réaliser avec une analyse CI authentifiée. Ne pas désactiver le contrôle actuel avant de disposer de son remplacement. Aucun seuil ni règle d’analyse n’a été abaissé pour cette mesure.

La page Database > Backups du projet Supabase a été consultée : elle affiche « Free Plan does not include project backups ». Aucune sauvegarde restaurable depuis ce tableau de bord n’est disponible avec le forfait actuel ; cela ne permet pas de conclure à l’absence d’une éventuelle sauvegarde indépendante. Les snapshots de travail et les migrations ne remplacent pas une sauvegarde complète et récente du catalogue vivant. Aucun changement d’abonnement, export de données privées ou restauration n’a été effectué. [Supabase recommande un export externe régulier pour le forfait gratuit](https://supabase.com/docs/guides/platform/backups) ; les fichiers Storage doivent aussi être conservés séparément, car une sauvegarde de base ne contient pas leurs octets.

Priorités restantes :

1. Choisir un stockage privé de sauvegarde et mettre en place un export complet, ou activer les sauvegardes du fournisseur après validation de l’abonnement. Vérifier une restauration dans un environnement isolé avant de considérer ce point terminé.
2. Observer les vrais parcours Instagram, YouTube, PDF et réservation pour terminer le durcissement des scripts et connexions CSP. Les restrictions déjà actives et leurs tests sont conservés.
3. Relier le rapport LCOV à Sonar avec une analyse CI authentifiée. Le rapport GitHub est disponible indépendamment de cette étape.
4. Reprendre l’avertissement d’encodage du scanner uniquement si une analyse récente le reproduit : tous les fichiers texte suivis avaient été validés en UTF-8, sans cause précise confirmée.

Les 198 remarques SQL ne justifient pas une réécriture globale des anciennes migrations. Une constante est pertinente pour une valeur logique partagée qui doit évoluer à un seul endroit ; une répétition éditoriale dans des données d’import peut rester plus lisible telle quelle. Le tri doit conserver cette distinction. L’illustration de la map et ses données géométriques sont du code utilisé, pas du code mort à supprimer.
