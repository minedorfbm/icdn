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

Les deux nouveaux seeds ont été exécutés sur une copie exacte des contenus publiés : aucun changement dans les 21 tables. Les migrations historiques corrigées ne doivent pas être rejouées en production ; les corrections servent aux bases neuves. L’ensemble comporte désormais 66 migrations.

## Protections des contenus intégrés

La CSP impose désormais les origines autorisées pour les iframes (Instagram, YouTube, site du resort, TableCheck), les workers locaux/blob utilisés par le PDF et le rejet des gestionnaires JavaScript dans les attributs HTML. L’exception d’intégration du site ADJ reste limitée aux deux pages publiques prévues.

Les restrictions des scripts, connexions, images et polices restent en observation. Les essais automatisés simulent les fournisseurs : ils valident les frontières et les interactions, pas la disponibilité des réseaux tiers. Un durcissement supplémentaire demandera une observation de leurs chaînes de ressources réelles.

## Map

Le panneau de lieu est isolé dans `MapPreview.tsx`. Son ouverture, le glissement, les liens de cards, les numéros de chambres et le rendu sont conservés. L’illustration et la géométrie ne sont pas réécrites.

## SonarCloud

Cause confirmée de l’échec de l’analyse complète : quota de l’organisation. Le dernier échec indique 44 427 lignes utilisées sur 50 000, pour une analyse du hub de 24 935 lignes, remplaçant une ancienne analyse d’environ 5 600 lignes. Les analyses de PR réussies ne prouvaient pas que l’analyse complète était à jour. Aucun fichier applicatif ou SQL de sécurité n’est exclu pour masquer ce dépassement.

Les 16 autres projets SonarCloud ont été supprimés après demande et confirmation explicites de l’utilisateur. La liste de l’organisation affiche désormais uniquement `icdn`. La page de quota affiche 15 543 lignes utilisées sur 50 000 et 34 457 disponibles. Les dépôts GitHub et les déploiements sont conservés. La nouvelle analyse complète reste à vérifier ; les anciens résultats de `main` datent encore du 25 septembre.

## Validation

- 66 migrations reconstruites ; contrôle des privilèges et du rejet des liens ambigus réussi.
- 125 tests unitaires réussis ; TypeScript, ESLint, traductions et images validés.
- 47/48 tests mobiles réussis au premier passage ; le test de retour au contexte d’accueil a présenté un échec intermittent sur une transition, puis réussi trois fois consécutives sans modification. Le nouveau test CSP et les parcours map/PDF/Instagram/YouTube réussissent.
- Build et préparation Cloudflare réussis.
- Audit npm autorisé par l’utilisateur : aucune vulnérabilité connue parmi 451 paquets au moment du contrôle.

## Exploitation

Les futures migrations doivent être appliquées par le flux de déploiement qui enregistre leur version. Pour une intervention manuelle, conserver la preuve des préconditions, appliquer le SQL puis enregistrer immédiatement cette seule version. Ne pas relancer une chaîne de migrations de contenu sur une production déjà éditée.

Une base reconstruite retrouve le schéma et les seeds versionnés ; elle ne constitue pas une sauvegarde du catalogue vivant. Les sauvegardes Supabase restent nécessaires pour les éditions faites dans le CMS.
