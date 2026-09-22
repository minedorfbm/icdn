# Héberger le hub sur Cloudflare Workers

Le changement de serveurs DNS ne déplace pas l'hébergement. Ce dépôt prépare un Worker nommé `icdnd`, avec le rendu serveur TanStack Start, les fichiers statiques et la lecture du Supabase indépendant.

## Configuration Cloudflare

Après fusion de cette branche, créer un projet **Workers** depuis GitHub, dépôt `minedorfbm/icdnd`, branche `main`, racine `/` :

- Version Node : 22.12 ou supérieure ; Bun : 1.4.2 (`BUN_VERSION`).
- Installation : `bun install --frozen-lockfile --ignore-scripts`.
- Build : `bun run build`.
- Déploiement : `bun run deploy`.
- Nom du Worker : `icdnd`, identique à `wrangler.json`.

Nitro génère `.output/server/wrangler.json` et `.output/public`. Le script de déploiement utilise cette configuration générée, qui contient les bons chemins. Ce projet nécessite le serveur : ne pas publier uniquement les fichiers statiques dans Pages.

Les variables serveur publiques Supabase sont versionnées dans `wrangler.json`. Le fichier `.env` fournit les variables publiques `VITE_*` de compilation. Aucune clé administrateur ni `service_role` n'est nécessaire. Ne pas recopier les anciennes variables Lovable dans Cloudflare.

## Vérifications avant bascule

```sh
bun install --frozen-lockfile --ignore-scripts
bun run test
bun run typecheck
bun run lint
bun run build
bun run deploy:check
bun run preview:cloudflare
```

`deploy:check` vérifie le paquet sans publier et sans authentification Cloudflare. `preview:cloudflare` exécute le build dans le moteur local de Cloudflare ; `preview` conserve l'aperçu Vite existant.

Tester d'abord l'adresse `workers.dev` obtenue après le déploiement : les quatre niveaux, les cards, les fiches, les menus et les réservations. Vérifier dans les logs qu'il n'y a pas de message `[hub]` indiquant une indisponibilité Supabase ou l'utilisation des données de secours.

Ensuite seulement, ajouter `icdnd.artdigitaljourney.com` dans les domaines personnalisés du Worker. Aucun domaine de production n'est défini dans le dépôt : publier une version ne bascule pas automatiquement le domaine existant. Conserver les anciens enregistrements web pour pouvoir revenir à l'hébergement précédent en cas de problème.

La landing page `artdigitaljourney.com` utilise son propre dépôt et son propre Worker. Les enregistrements de messagerie OVH (MX, SPF, DKIM et DMARC) restent dans le DNS Cloudflare ; le déploiement de ce dépôt ne les modifie pas.

## Compilation

Le preset Nitro est explicitement `cloudflare-module`. La bibliothèque `@lovable.dev/vite-tanstack-config` reste une dépendance de compilation ; le Worker produit s'exécute chez Cloudflare et ne nécessite pas un serveur Lovable.
