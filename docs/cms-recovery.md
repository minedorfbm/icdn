# Récupérer les contenus et les images du CMS

## Périmètre et constat du 25 octobre 2026

Le tableau de bord du projet `cxcffaegqyvbhrpzpowa` indique que son offre Free n’inclut pas de sauvegardes de projet restaurables. Une sauvegarde PostgreSQL inclurait les métadonnées Storage, **pas les fichiers** : [documentation Supabase](https://supabase.com/docs/guides/platform/backups).

Un exercice réel a été réalisé à partir d’un export en lecture seule du 25 octobre à **09:49:46 UTC**, avec le schéma du commit `60d419c374821f64e02c21e8fa79e962a342d9fc` :

- 23 tables publiques du CMS, **1 437 lignes**, y compris les brouillons et contenus inactifs ;
- 92 migrations archivées et rejouées uniquement dans PostgreSQL local jetable ;
- **118 objets** du bucket public `hub-images`, soit **30 755 254 octets** ;
- contenu restauré identique pour chaque table, vérifié par empreinte SHA-256 ;
- récupération des 118 fichiers depuis l’archive locale avec empreintes identiques ;
- lecture anonyme du catalogue, des fiches et des médias des **74 destinations publiées** ;
- RLS présente et aucun droit d’écriture visiteur sur les tables restaurées ;
- 85 références distinctes aux images du bucket et une référence `/images/` en base vérifiées, sans fichier manquant au moment du contrôle ;
- export incomplet et copie modifiée de l’archive refusés avant restauration.

Aucune donnée, règle ou configuration de production n’a été modifiée. Le test valide les contenus du CMS et les fichiers de ce bucket sur une **cible locale**. Il ne valide pas la restauration d’un projet Supabase complet, des comptes, secrets, réglages Auth, fonctions hébergées ou lecteurs externes. La concordance du journal des migrations ne prouve pas l’identité de tous les anciens corps SQL.

## Répéter l’export et l’archivage

1. Conserver le commit source correspondant et vérifier le journal des migrations selon [database.md](database.md). Les images et autres ressources du dossier Git `public/` doivent également être conservées avec le code.
2. Dans l’éditeur SQL autorisé du projet, exécuter **uniquement** [`export-cms-recovery.sql`](../supabase/manual/export-cms-recovery.sql). Cette instruction SELECT unique exporte les 23 tables en un même instantané, le journal des versions, les colonnes et l’inventaire du bucket. Elle ne lit pas Auth, Vault, les identifiants des comptes ou les clés. Ne pas la transformer en migration.
3. Utiliser **Export → Copy as JSON**, puis enregistrer le résultat complet dans un fichier local privé. Ne pas copier des cellules tronquées. Le format actuel contient 26 lignes d’export. Restaurer le texte précédent de l’éditeur sans enregistrer de nouvelle requête persistante si l’on a utilisé un éditeur existant.
4. Depuis le dépôt, lancer avec des chemins absolus, dans un dossier parent privé existant :

```sh
bun scripts/rehearse-cms-recovery.ts /chemin/prive/export.json /chemin/prive/nouvelle-archive
```

Le script refuse un dossier existant ou situé dans le dépôt Git. Il copie les migrations, télécharge anonymement les fichiers du seul bucket public du projet, vérifie leurs tailles et ETag, puis inscrit le manifeste avec leurs SHA-256. Les téléchargements sont bornés à quatre simultanés, 30 secondes par fichier, 64 Mio par objet et 1 Gio au total. Les limites sont des garde-fous pour cet exercice, pas des réglages du site.

Les dossiers sont créés privés (0700), les données et manifestes en 0600. Ne jamais committer un export réel, un dump de base ou des identifiants. Le script ne demande aucune clé privilégiée et ne peut ouvrir qu’une base PGlite en mémoire ; ses seuls appels distants sont des GET d’images publiques. Un arrêt avant la création de `archive.json` indique une archive incomplète. Ne pas la considérer comme récupérable ; corriger la cause, refaire un export si nécessaire et utiliser un nouveau dossier.

## Vérifier de nouveau hors ligne

```sh
bun scripts/rehearse-cms-recovery.ts --verify /chemin/prive/archive-existante
```

Ce mode n’effectue **aucune requête réseau**. Il relit l’archive et ses empreintes, rejoue ses migrations dans une base locale jetable, remplace seulement les données de cette base, puis compare chaque table. Une nouvelle sous-arborescence `recovery-*` contient les copies des images et `verification.json` ; une exécution antérieure n’est pas écrasée.

Le lien principal forme une référence circulaire entre les fiches et leurs liens. Les contraintes de clés étrangères sont donc temporairement différées **dans la base locale seulement**, puis toutes contrôlées et rétablies dans leur mode d’origine avant validation. Les triggers éditoriaux d’insertion peuvent recalculer une source de traduction : seuls les triggers USER locaux sont suspendus pendant l’import, puis réactivés. Les contrôles d’intégrité et RLS restent vérifiés après import. L’heure locale du poste est neutralisée par UTC pour comparer exactement les dates sauvegardées.

L’empreinte vérifie l’intégrité des fichiers par rapport au manifeste de confiance. Elle ne chiffre pas l’archive et ne prouve pas à elle seule son origine : protéger également le manifeste et conserver une copie indépendante de son empreinte. Le fichier de résultat donne le temps de l’exercice local ; ce n’est pas une estimation du temps de rétablissement d’un hébergement distant.

## Ce qui reste à organiser

- Conserver une deuxième copie **chiffrée et indépendante du poste**, à un emplacement choisi par le propriétaire ; un dossier local unique ne protège pas d’une perte du poste. Aucun envoi externe n’est réalisé par cet outil.
- Définir la fréquence de sauvegarde, la conservation et la perte de données acceptable. Cet exercice ponctuel n’installe aucune sauvegarde récurrente.
- Pour un futur rétablissement cloud, préparer une cible isolée et sa configuration avec le propriétaire. Les comptes, secrets, paramètres Auth, domaines, fonctions et règles Storage doivent faire l’objet de contrôles dédiés ; ne pas basculer le Worker de production avant validation.
- Les vidéos YouTube, publications Instagram et PDF/pages hébergés par le resort restent chez leurs éditeurs. Leur lecteur peut être testé séparément, mais cet export n’en constitue pas une sauvegarde.

## Protections contre les abus : état vérifié dans le code

Les lectures publiques utilisent des identifiants validés (1–120 caractères, minuscules/chiffres/tirets), des fonctions de lecture avec RLS et un cache public complet limité à deux minutes. Les appels Supabase sont bornés à huit secondes ; les erreurs ne déclenchent pas de boucle automatique de nouvelles tentatives. Ces protections bornent certaines opérations ; elles ne limitent pas le nombre de visiteurs ou de requêtes reçues.

Le proxy PDF refuse les URL hors des hôtes HTTPS exacts du resort, les redirections et les contenus non PDF. Il borne le flux à 32 Mio et 30 secondes, y compris sans `Content-Length`, et annule le téléchargement lorsque la requête est interrompue. Voir [`resort-pdf.server.ts`](../src/lib/resort-pdf.server.ts) et ses tests.

Le lecteur peut demander une seule plage fermée (`bytes=début-fin`) par requête ; les plages multiples, ouvertes, inversées ou dépassant le plafond sont refusées avant l'appel réseau. Une réponse partielle n'est transmise que si son `Content-Range`, sa taille totale et sa longueur concordent avec la demande. Les en-têtes de session du visiteur ne sont pas transmis. Les flux connus utilisent le `FixedLengthStream` de Workers pour préserver la longueur HTTP sans charger le document entier en mémoire. Les documents sans prise en charge des fragments conservent la lecture complète bornée ; le lecteur charge seulement les pages proches de l'écran et ne précharge pas les autres fragments. Aucun PDF n'est copié dans Supabase et aucun menu officiel n'est remplacé.

`wrangler.json` ne déclare pas de limiteur de débit applicatif. Un contrôle distinct du tableau de bord Cloudflare du domaine `artdigitaljourney.com`, le 25 octobre 2026, confirme zéro règle personnalisée et zéro règle de limitation de débit. Les protections DDoS réseau et SSL/TLS sont actives ; HTTP DDoS et le socle de règles gérées sont indiqués comme toujours actifs. Aucun réglage n'a été changé. Trois lectures de production confirment le refus HTTP 400 d'un domaine PDF externe, d'une adresse HTTP et d'un faux sous-domaine.

Ne pas ajouter un plafond par IP sans mesure : les clients du resort peuvent partager le même réseau. Le [limiteur Workers](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/) est approximatif et propre à chaque point de présence, pas une limite globale stricte.

Avant de choisir un seuil, relever le volume normal des routes de lecture et du proxy PDF, les téléchargements interrompus, erreurs et réponses 429 éventuelles. Cibler ensuite les routes coûteuses, garder un retour compréhensible en cas de limitation et vérifier les usages sur le Wi-Fi partagé. Aucune règle de compte, protection ou limite de débit n’a été modifiée ici.
