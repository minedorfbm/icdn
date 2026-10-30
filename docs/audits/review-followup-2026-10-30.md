# Suites de la revue indépendante du 30 octobre 2026

Révision de départ : `cdaac1a4eaa5a70c8bf07cded2abde09b9268568`, après la
fusion de la PR 206. Les défauts avaient été reproduits sur
`3b1be1c7ee6313d6b0b76df72e66cd8f156561f3` ; le code applicatif était identique.

## F1 — Retour entre fiches après la map

La fermeture de la map conserve sa restauration explicite, nécessaire quand
le lecteur Bensley ajoute des entrées à l’historique commun des iframes. Le
retour à une fiche est marqué comme détaché des indices physiques du navigateur.
Dans ce cas, « Previous discovery » restaure la fiche et son état depuis le fil
logique des cards. Les instantanés du fil excluent le fil lui-même et l’état de
retour imbriqué de la map. Les navigations ordinaires conservent le retour natif.

L’écran d’origine est mémorisé pour retrouver l’accueil, la recherche, Surprise
me ou la map sans compter les entrées ajoutées par les lecteurs. Pour la
recherche, cet instantané utilise l’état courant du routeur : le résultat et la
requête sont enregistrés juste avant l’ouverture de la fiche, parfois avant le
prochain rendu du hook.

Le nouveau test ouvre Wine Cellar puis La Maison, vérifie Back/Forward avant
la map, effectue deux allers-retours sur la map, suit un lien dans le lecteur
Bensley, retourne à Wine Cellar, reprend puis remonte le fil et ferme la fiche.
Le parcours est exécuté depuis une URL directe et depuis une recherche dont la
requête doit être conservée.

## F2 — Position de lecture PDF lors d’une rotation

Le lecteur mémorise la page et la fraction de page au centre de la zone de
lecture lors du défilement, sans mise à jour React à chaque événement. Après un
changement de largeur ou de zoom, il replace ce même point au centre. Les
événements de défilement utilisant encore l’ancienne géométrie pendant une
rotation ne remplacent pas l’ancre conservée. Le pincement garde son propre
point d’ancrage ; l’ancrage automatique du navigateur est désactivé dans ce
lecteur lorsque le navigateur le prend en charge.

Le nouveau scénario utilise un vrai PDF local de deux pages. Sans zoom
préalable, il lit la page 2, passe en paysage, vérifie la page et la position à
quatre points de pourcentage près, puis revient en portrait.

## F3 — URL de l’image de partage

La métadonnée `og:image` résout les chemins locaux depuis l’origine publique
`https://icdn.artdigitaljourney.com`. Une URL déjà absolue conserve son origine.
Cela s’applique aussi au rendu serveur, avant exécution de JavaScript. Les
images affichées et leurs priorités de téléchargement ne changent pas.

Le test vérifie le HTML retourné directement par le serveur puis la métadonnée
dans le navigateur. Il ne certifie pas le cache de chaque plateforme de partage.

## I1 — Synchronisation du scénario WebKit

Le scénario de la revue utilise déjà un Instagram simulé. Sa trace montre
plusieurs déplacements du contrôle pendant le remplacement du squelette par
le lecteur. L’attente de l’URL suivante échoue avant le Back annoncé dans le
titre du scénario.

Ce test porte sur le fil et le retour à l’accueil. Avant chacun de ses deux
clics, il attend désormais que le lecteur simulé soit affiché et que sa
transition d’opacité soit terminée. Aucun délai fixe, clic forcé ou nombre de
reprises supplémentaire n’est ajouté. Dix répétitions WebKit consécutives
passent sans reprise automatique après ce changement de synchronisation.

Cette stabilisation du test ne prouve pas que tous les clics pendant le
redimensionnement d’un vrai embed sont exempts de défaut. La trace ne suffit
pas à attribuer chaque échec au code du site ou au moteur d’automatisation ;
la vérification sur appareil réel reste distincte. Aucun changement de mise en
page Instagram n’est inclus dans ces corrections.

## Vérifications locales avant publication de la PR

- Les trois scénarios de régression initiaux échouent contre la construction
  précédente, avec les symptômes attendus.
- Les quatre scénarios enrichis passent sur WebKit et Chromium : huit réussites,
  sans reprise automatique.
- Le scénario WebKit intermittent passe dix fois, sans reprise automatique.
- Les 298 tests unitaires passent ; types, lint, construction de production,
  contrôle du paquet et absence d’instrumentation en production sont vérifiés.
- La validation GitHub complète et SonarCloud restent nécessaires sur le commit
  publié, avec la répartition en lots introduite par la PR 206.

Les médias externes des tests sont simulés. Ces résultats ne mesurent ni la
performance du réseau à Danang ni la disponibilité réelle des fournisseurs.
