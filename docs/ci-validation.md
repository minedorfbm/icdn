# Validation GitHub : parallélisme et diagnostic

## Le coût mesuré

La dernière validation de la PR 205 a duré environ 17 minutes
([exécution 40871239155](https://github.com/minedorfbm/icdn/actions/runs/40871239155)).
Les contrôles de code/données ont duré 49 secondes. Le chemin critique était
la suite WebKit instrumentée : 14 min 43 s pour les tests, après 44 secondes de
préparation. La validation finale et SonarCloud ont ajouté environ 80 secondes.
L’installation Bun prenait deux ou trois secondes ; un cache supplémentaire
n’aurait pas résolu cette attente.

## Organisation

Les mêmes scénarios restent exécutés sur les quatre combinaisons :

- construction de production, iPhone/WebKit ;
- construction de production, Android/Chromium ;
- construction instrumentée, iPhone/WebKit ;
- construction instrumentée, Android/Chromium.

Chaque combinaison utilise trois shards Playwright natifs, sur trois runners
distincts. Un seul worker est conservé par runner : les compteurs du serveur
Supabase fictif et les caches du Worker ne sont donc pas partagés entre des
tests simultanés. Les fichiers de tests restent séquentiels à l’intérieur de
leur shard. Aucun test n’est filtré par nom ou par chemin modifié ; les nouveaux
scénarios entrent automatiquement dans la répartition.

Les contrôles unitaires, migrations, sécurité des dépendances, traductions,
images, types, lint, contrôle du paquet de déploiement et absence
d’instrumentation dans la construction de production sont conservés. Les six
collections de couverture navigateur portent des noms distincts ; le job final
les fusionne avec les mêmes contrôles de sources exécutées et le même périmètre
SonarCloud. `validate` échoue si un des douze shards ou le job de code échoue,
est annulé ou est ignoré. Les seuils SonarCloud et le nombre de reprises ne
changent pas.

L’annulation des anciennes révisions d’une même PR reste active. Les exécutions
de `main` sont conservées ; elles ne sont pas remplacées par le résultat d’une
autre révision. Les permissions du workflow et l’isolation des secrets restent
inchangées.

## Résultats et diagnostic

Chaque shard produit un rapport JSON, avec les scénarios, durées, reprises et
statuts. Les rapports et les traces d’échec sont conservés dans
`browser-results-<mode>-<project>-<shard>` pendant sept jours, même après un
échec des tests. Les snapshots de couverture sont conservés quatorze jours.
Cela permet d’examiner un défaut sans devoir relancer toute la validation pour
obtenir sa trace.

Pour une panne indépendante de l’application, relancer uniquement le job
concerné depuis GitHub. Une révision de code différente doit avoir sa propre
validation ; ne pas réutiliser des résultats verts d’un ancien commit.

## Vérification de la répartition

Depuis une installation verrouillée, pour chaque projet :

```sh
node node_modules/@playwright/test/cli.js test --project=iphone-webkit --list --reporter=json
node node_modules/@playwright/test/cli.js test --project=iphone-webkit --shard=1/3 --list --reporter=json
node node_modules/@playwright/test/cli.js test --project=iphone-webkit --shard=2/3 --list --reporter=json
node node_modules/@playwright/test/cli.js test --project=iphone-webkit --shard=3/3 --list --reporter=json
```

Comparer les identifiants de scénarios : l’union des trois shards doit être
exactement la liste complète, sans chevauchement ni scénario omis. Répéter pour
`android-chrome`. La CI exécutera ensuite réellement les douze shards et
fusionnera leur couverture ; une liste statique ne remplace pas cette exécution.

## Mesurer le gain

Comparer la durée totale du workflow et le plus lent des douze shards avec la
référence ci-dessus, en séparant l’attente de runner, l’installation, les tests
et SonarCloud. La réduction dépend de l’équilibrage des fichiers et du nombre de
runners disponibles : trois shards ne garantissent pas une division exacte
par trois. Le parallélisme peut augmenter légèrement les minutes de runner
cumulées, car la préparation est répétée sur davantage de machines.

Référence : [sharding Playwright](https://playwright.dev/docs/test-sharding).
