# Audit du code, de la dette technique et de la sécurité

Date : 14 octobre 2026. Base analysée : `4f05298d54692b631af2255a729cb7ca8129ae7e` (`main`, PR 106).

## Bilan

Le hub n'a pas besoin d'une réécriture. Les protections et les tests déjà en place sont utiles. Le nettoyage porte sur les variantes du modèle de cards qui ne sont plus utilisées, les limites de confiance des liens externes et les permissions publiques de la base. Les fonctionnalités et la présentation approuvées sont conservées.

Les corrections applicatives ont été fusionnées dans la PR 107 et déployées. La migration de restriction des droits `20261014220000` a été appliquée durablement et vérifiée en production. Voir le [suivi de fiabilisation](reliability-followup-2026-10-14.md) pour la réconciliation de l’historique, les tests de reconstruction et les protections complémentaires. Cet audit ne prétend ni supprimer toute dette ni certifier l'absence de toute vulnérabilité.

## Périmètre et méthode

- Inventaire des 310 fichiers suivis, dont 107 fichiers source TypeScript/TSX/CSS et 58 migrations SQL au départ.
- Recherche des imports, exports, fichiers et dépendances inutilisés avec Knip ; contrôle TypeScript strict et ESLint.
- Revue ciblée des frontières de sécurité : chargement Supabase, publication, cache serveur, validation des paramètres, URL et médias tiers, lecteur PDF, gestion des erreurs, CSP, isolation des fenêtres intégrées, stockage navigateur et chaîne CI.
- Recherche de motifs de secrets dans les fichiers suivis : clés privées, jetons GitHub, secrets Supabase, clés AWS et Stripe. Ce contrôle ne couvre pas tout l'historique Git ni les secrets des comptes externes.
- Audit des dépendances installées avec Bun ; vérification des migrations et de leur journal réel.
- Inspection SQL administrative de Supabase en lecture seule, puis tests de permissions dans des transactions annulées. Aucune ligne éditoriale n'est modifiée.
- Lecture de l'API publique : 74 cards actives visibles, aucune inactive, 139 posts Instagram (130 posts et 9 reels), 38 vidéos. Les 17 noms de réglages publics correspondent aux usages du hub.
- Tests unitaires et suite mobile WebKit avec API de test indépendante de la production. Les tests médias simulent les fournisseurs externes ; ils ne garantissent pas leur disponibilité sur chaque réseau mobile.

## Constats et corrections

| Priorité                     | Constat vérifié                                                                                                                                                                                                                              | Correction et état                                                                                                                                                                                                                                                                                      |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Moyenne                      | Les posts Instagram acceptaient une URL non vide ; la détection d'embed utilisait une expression non ancrée et le lien de secours ne passait pas par la validation commune.                                                                  | Validation HTTPS et hôtes Instagram exacts, distinction entre profil et permalink, rejet des URL trompeuses et des protocoles actifs. Les posts incorrects sont omis sans retirer les autres. Réalisé et testé.                                                                                         |
| Moyenne                      | Certaines validations de liens divergeaient : identifiants dans l'URL, caractères de contrôle, hôtes ou ports alternatifs.                                                                                                                   | Un module commun couvre les actions, traductions de liens, Instagram, YouTube, pages intégrées et messageries. Les paramètres de réservation, sujets d'e-mail et numéros de téléphone formatés restent utilisables. Réalisé et testé.                                                                   |
| Moyenne                      | `destination_videos` et `published_destination_notices` possédaient 24 privilèges SQL publics autres que SELECT, malgré l'absence de politique RLS d'écriture. Dix fonctions internes étaient exécutables par les rôles visiteurs.           | Migration `20261014220000_public_read_only_privileges.sql` : lecture seule sur les deux objets, fonctions internes réservées à l'administration, droits par défaut restreints pour les futurs objets créés par `postgres`. Appliquée et vérifiée durablement en production après fusion de la PR 107. |
| Faible                       | Le proxy PDF acceptait tout type MIME commençant par `application/pdf`, y compris un suffixe incorrect.                                                                                                                                      | Comparaison exacte du type MIME, insensible à la casse et compatible avec les paramètres. Tests des refus et des documents valides ajoutés.                                                                                                                                                             |
| Faible                       | Les options `neutral`, `embedded`, `bare` et `fitToScreen` maintenaient des chemins devenus inutiles après généralisation du nouveau modèle.                                                                                                 | Suppression de ces variantes, du champ d'historique neutre et du composant relais. `DestinationDetail` contient désormais le modèle commun. La taille des embeds et les palettes ne changent pas.                                                                                                       |
| Faible                       | Plusieurs fonctions et types internes étaient exportés inutilement ; un type de traduction n'était plus utilisé. Une exception ESLint ciblait un répertoire supprimé.                                                                        | Exports et type inutiles retirés, exception supprimée. Knip ne remonte plus aucun problème. Aucun paquet n'a été retiré arbitrairement : aucun n'était signalé inutilisé.                                                                                                                               |
| Élevée pour les déploiements | Deux fichiers SQL partageaient `20261006170000`. Le journal de production ne contient que 41 versions, jusqu'au 30 septembre ; 17 fichiers plus récents ne sont pas enregistrés alors que leurs effets sont au moins partiellement présents. | Le fichier des descriptions est renuméroté `20261006170001`, SQL identique ; aucun des deux numéros n'était enregistré en production. Un contrôle des identifiants entre en CI. Journal ensuite réconcilié avec les 64 versions de main, sans rejouer les contenus (voir le suivi).                                                      |
| Faible                       | La documentation décrivait encore des fiches neutres, trois filtres de recherche, une vidéo initiale unique et dix lectures du catalogue.                                                                                                    | Documentation actualisée. La vieille procédure de réparation du journal est explicitement marquée historique, sans être supprimée.                                                                                                                                                                      |

Le retrait des privilèges SQL complète les règles de publication existantes : les écritures via l'API n'étaient pas autorisées par RLS. Aucun accès illégitime ni exploitation n'a été démontré. Les opérations globales comme TRUNCATE ne sont toutefois pas couvertes par les politiques par ligne, ce qui justifie de retirer ce droit inutile. [Documentation PostgreSQL](https://www.postgresql.org/docs/current/ddl-rowsecurity.html).

Les droits par défaut PostgreSQL s'additionnent entre portée globale et portée par schéma. Le retrait du droit EXECUTE hérité de PUBLIC doit donc aussi intervenir au niveau global pour les futures fonctions créées par `postgres`. Les droits explicites de `service_role` et les objets existants hors du périmètre ne sont pas retirés. [Documentation des privilèges par défaut](https://www.postgresql.org/docs/current/sql-alterdefaultprivileges.html).

## Protections confirmées et conservées

- Toutes les tables du schéma public ont RLS activé. Aucune politique d'écriture publique n'est présente dans `public` ou `storage`. Les rôles visiteurs ne peuvent pas créer d'objets dans `public`.
- Aucune fonction `SECURITY DEFINER` n'est présente dans le schéma public inspecté. Les dix fonctions internes ont un `search_path` fixé.
- Les trois vues marketing ne sont pas lisibles par `anon` ; leurs vues et celle des notifications utilisent `security_invoker=true`.
- Les médias sont chargés pour la card ouverte, avec recontrôle de sa publication. Le cache expire strictement après deux minutes et ne ressuscite pas un ancien catalogue après une panne.
- Le lecteur public Supabase utilise une clé publiable, valide les formes des données, détecte les réponses tronquées et borne les lectures à huit secondes.
- Les paramètres serveur des fiches sont validés. La protection CSRF de TanStack est conservée. Aucun rendu HTML brut de contenu éditorial, `eval` ou `new Function` n'a été trouvé dans les sources.
- Le proxy PDF conserve ses hôtes exacts, ses chemins publics, le refus des redirections, la limite de 32 Mio, le délai de 30 secondes et l'annulation des téléchargements.
- Les pages intégrées restent isolées ; l'exception d'encadrement ADJ reste limitée aux deux pages de démonstration. HSTS, nosniff, politique de référent et restrictions des permissions sont conservés.
- Les actions GitHub sont épinglées à des commits, l'installation utilise le verrou de dépendances et ignore les scripts d'installation ; les permissions du workflow restent en lecture.

## Sujets de suivi identifiés lors de l’audit

### Journal Supabase — priorité haute

Sur la révision de départ, `Supabase Preview` échoue avec la politique déjà existante `Published destination hours`. Cloudflare et le workflow de validation réussissent. Le renommage local et le contrôle des doublons ne suffisent pas à réparer cet écart entre journal et schéma.

État initial, résolu dans le suivi du 14 octobre : la réconciliation devait se faire sur sauvegarde/clone : comparer chaque migration manquante au schéma, aux contraintes, aux fonctions et aux contenus actuels, puis enregistrer uniquement les versions dont les effets sont prouvés. Les scripts historiques contiennent des mises à jour éditoriales qui pourraient écraser des corrections plus récentes. Ne pas utiliser un `db push` global ni remplir les 17 versions sur la seule base de leur présence dans Git. La nouvelle restriction des permissions peut être appliquée seule, sans exécuter les anciennes migrations.

### CSP et dépendance aux médias tiers — priorité moyenne

Les protections d'encadrement, de base d'URL et d'objets sont bloquantes. La politique des ressources reste en mode rapport et n'a pas de collecte serveur. La rendre entièrement bloquante demande une validation des scripts Instagram/YouTube et des réservations réelles ; le faire sans cette étape pourrait supprimer des fonctionnalités. L'audit ne résout pas les limites d'Instagram, ses refus d'embed ou les ouvertures de son application.

### Analyse SonarCloud — revue complémentaire

Le contrôle de la révision de départ de `main` était marqué `cancelled` avec « analysis failed ». L'analyse de la PR 107 réussit ensuite son Quality Gate, avec zéro Security Hotspot. Les 11 remarques ont été consultées dans la session SonarQube connectée : elles concernent toutes la maintenabilité, pas une vulnérabilité détectée.

Cinq corrections sont ajoutées : props Instagram en lecture seule, trois gardes TypeScript utilisant l'accès optionnel, et ordre SQL `ASC` explicite. Les six remarques restantes portent sur des littéraux SQL répétés : quatre dans les requêtes administratives indépendantes de l'audit et deux dans la migration historique des descriptions. Les premières rendent chaque requête lisible et exécutable séparément ; les secondes sont conservées pour garder le SQL historique identique. Aucun avertissement n'est masqué ni marqué résolu artificiellement.

Le scanner affiche également un avertissement d'encodage. La relecture UTF-8 des fichiers texte suivis ne révèle aucun fichier invalide ; la cause précise demande les journaux du scanner et reste à confirmer.

### Maintenabilité — priorité basse

Les fichiers les plus longs concernent surtout l'illustration SVG et la géométrie de la map. Ils ne sont pas assimilables à du code mort. Leur découpage pourra accompagner de prochaines modifications ciblées. Les clés d'images locales, anciens alias d'URL, compatibilités de données et snapshots de traduction nécessaires aux outils sont conservés. Les anciens scripts SQL restent un historique, pas du code à supprimer en masse.

## Validation

- Avant modifications : **119 tests unitaires réussis**.
- Après modifications : **125 tests unitaires réussis**, dont nouveaux cas de liens trompeurs, URL de médias, conservation des liens valides et types MIME PDF.
- **47 tests mobiles WebKit réussis** : les quatre palettes, cards directes, descriptions, relations bilatérales, swipes, retour au contexte précédent, recherche dont hébergements, six langues, horaires, notifications, benefits, PDF, map et affichage conditionnel des stations.
- Embeds : aperçu de légende, largeur du carrousel, proximité des points, lenteur et nouvelle tentative après échec du script vérifiés.
- TypeScript, ESLint, contrôle des traductions et contrôle des images : réussis.
- Construction de production et simulation du déploiement Cloudflare : réussies.
- Audit Bun : **0 vulnérabilité connue parmi 450 paquets** au moment du contrôle.
- Knip après nettoyage : **0 problème signalé**. Aucun nouveau paquet ajouté.
- Contrôle des migrations : **59 fichiers, aucun identifiant en double**, nouvelle migration comprise.
- SQL : test transactionnel de la restriction des droits, lectures anonymes et conservation des droits d'administration ; annulation ensuite. Aucun contenu modifié.
- Après la revue SonarQube : les 125 tests unitaires, TypeScript, ESLint et le build passent à nouveau ; les cinq tests mobiles ciblés Instagram et swipe réussissent.

## Mise en production et retour arrière

La PR 107 a été fusionnée à la demande de l’utilisateur. Le code est déployé ; la migration de restriction des droits a été appliquée seule puis vérifiée avec `supabase/manual/audit-public-security.sql`. La chaîne historique n’a pas été rejouée.

Un retour applicatif utilise un commit de revert normal. Le renommage SQL ne modifie pas les descriptions. Les changements de permissions sont indépendants du rendu et n'enlèvent ni contenus, ni traductions, ni liens.

## Requêtes Cloudflare au repos

Contrôle complémentaire sur le site de production le 14 octobre, dans deux navigateurs WebKit au format iPhone : accueil et La Maison avec les cinq embeds Instagram chargés. Après le chargement initial, chaque page reste sans interaction pendant 150 secondes, au-delà du TTL du cache. Aucune nouvelle requête vers le domaine du hub n'est observée. L'accueil ne déclenche aucune requête supplémentaire ; La Maison déclenche six requêtes supplémentaires directement vers Instagram et son CDN, dont quatre vers son endpoint `/ajax/bz`.

Le code ne configure ni polling réseau, ni rafraîchissement de jeton Supabase, ni tâche cron. Le cache de 120 secondes expire passivement : seule une nouvelle demande charge à nouveau les données si nécessaire. La recherche travaille sur le catalogue déjà reçu. Les médias se chargent pour la card ouverte ; les appels des iframes Instagram vont au fournisseur. Ce constat ne mesure pas tous les accès au compte Cloudflare : visiteurs, robots et éventuels moniteurs configurés hors du dépôt nécessitent les statistiques du compte.

## PR de contenus — état lors de l’audit

Les PR 97 à 101 ajoutent uniquement des migrations de contenu, déjà appliquées en production selon leur historique. Une vérification indépendante de l'API publique confirme les 54 associations attendues : 20 vidéos pour la PR 97, 22 posts pour la 98, six posts pour la 99, trois posts pour la 100 et trois vidéos pour la 101. Toutes sont actives, uniques par association et conservent les métadonnées prévues. Leur état ouvert correspond donc à une absence de fusion dans Git, pas à une absence de publication de ces contenus. Les PR 97 à 101 ont depuis été fusionnées à la demande de l’utilisateur ; le journal a été réconcilié sans rejouer leurs contenus.
