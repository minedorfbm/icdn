# Traductions éditoriales

Les textes fixes d’interface restent dans `src/i18n/dictionary.ts`. Les descriptions et événements utilisent des traductions éditoriales en vietnamien, russe et chinois simplifié. Les marques et noms officiels ne sont pas renommés.

## Fonctionnement avant migration

La configuration actuelle utilise les traductions du dépôt : `destinations.ts` et `events.ts`. Les fichiers `sources.json` et `event-sources.json` conservent le texte anglais exact auquel elles correspondent. Si la description, le titre ou l’horaire source change, le site revient au contenu anglais courant ; il ne présente pas une ancienne traduction comme à jour.

`bun run i18n:check` vérifie la couverture du catalogue de référence dans la CI. `bun run i18n:audit` lit la base publique actuelle et signale les nouvelles fiches, traductions manquantes ou dépassées. Chaque contrôle écrit ses résultats dans `translation-audit.json` (ignoré par Git) et renvoie un échec si une traduction manque ou est dépassée. Ce second contrôle doit être exécuté après une modification éditoriale ; il n’est pas encore raccordé à une interface de publication ou à une surveillance périodique.

## Activer les traductions dans Supabase

La base importée n’a pas nécessairement le même historique de migrations que le dépôt. **Ne pas lancer aveuglément toutes les migrations historiques avec db push.**

1. Sauvegarder la base et exécuter uniquement `supabase/migrations/20260922130000_editorial_translations.sql` dans le SQL Editor du projet indépendant. Cette migration additive crée deux tables et leurs droits. Elle se lance une seule fois.
2. Générer le peuplement avec `bun scripts/export-translation-seed.ts > /tmp/editorial-seed.sql`, relire le résultat et exécuter ce fichier dans le même SQL Editor. Il importe les traductions déjà embarquées, uniquement lorsque la source anglaise correspond. Il préserve toute traduction déjà présente (ON CONFLICT DO NOTHING).
3. Exécuter `bun run i18n:audit:database`. Pour le catalogue du 22 septembre, on attend 141 descriptions publiées (47 × 3) et 12 événements traduits (4 × 3). Si un texte source a changé entre-temps, corriger et valider sa traduction avant de continuer.
4. Après validation, ajouter `"HUB_TRANSLATIONS_FROM_DATABASE": "true"` dans les `vars` de `wrangler.json`, puis déployer. Conserver cette valeur dans Git pour les prochains déploiements. Pour revenir au mode précédent, supprimer la variable ou la mettre à `"false"`, puis redéployer.

Aucune écriture en production n’est effectuée par le code du site. Aucun accès administrateur n’est nécessaire pour sa lecture. Les tables sont protégées par RLS : seuls les contenus publiés liés à une destination/un événement actif sont lisibles publiquement ; aucune écriture publique n’est accordée. Une erreur réseau utilise les traductions locales uniquement lorsque leur source correspond encore ; une collection vide lue avec succès reste vide et déclenche le retour au texte anglais.

## Modifier une traduction dans Supabase

- `destination_translations` : destination_id, locale, description, source_description, published.
- `event_translations` : event_id, locale, title, schedule, description, source_title, source_schedule, source_description, published.
- Par défaut : `published = false` (brouillon). Passer à `true` après relecture.
- Les colonnes source doivent contenir le texte anglais exact effectivement traduit. Ne pas les mettre à jour sans vérifier la traduction : elles servent à détecter les changements éditoriaux.
- Les événements utilisent leur identifiant stable, pas leur titre, en mode base.

Les nouveaux textes sont des propositions de traduction à relire par des locuteurs natifs, notamment les offres et conditions. Les montants, horaires et liens existants ont été conservés. La traduction automatique par IA et l’administration visuelle ne sont pas incluses dans cette étape. Les pages d’erreur, textes d’accessibilité, légendes et libellés personnalisés restent des éléments d’un chantier distinct ; ils ne sont pas couverts par les deux nouvelles tables.

## Prévisualisations Cloudflare

Le bloc `previews.vars` de `wrangler.json` configure la commande `wrangler preview` utilisée pour les branches. Il utilise volontairement le même catalogue public Supabase que le site, avec la clé publiable et les droits de lecture RLS ; aucune clé administrateur n’est fournie. Après activation du mode base, ajouter aussi `HUB_TRANSLATIONS_FROM_DATABASE` dans ce bloc pour tester le même comportement en prévisualisation.
