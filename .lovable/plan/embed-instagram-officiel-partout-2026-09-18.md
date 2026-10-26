# Embed Instagram officiel partout

L'embed officiel (celui validé sur Weddings) devient LE rendu Instagram de toutes les fiches détaillées. La galerie photo maison ne sert plus que de repli.

## Ce qu'on va faire

1. **Règle d'affichage** : dans chaque fiche, si un post est renseigné en base → embed officiel. Sinon, si le lieu a un lien Instagram simple (compte) → carte « post » maison avec la première photo de la galerie + lien vers le compte. Plus de bande de photos quand un post est affiché, pour éviter la redondance.
2. **Suppression de la galerie photo maison (`InstagramStrip`)** dans la fiche lorsqu'un post existe ; elle reste le repli pour les lieux sans post renseigné.
3. **Tout est piloté par la base** : la table `destination_posts` existe déjà (lien du post, compte, légende, image, ordre, actif). Ajouter un post = insérer une ligne, rien d'autre.
4. **Pré-remplissage** : je renseigne dès maintenant les posts déjà connus (Weddings déjà fait ; j'ajoute les lieux dont le lien Instagram pointe vers un post précis — `/p/` ou `/reel/` — détectés automatiquement).

## Comment vous ajouterez des posts vous-même (plus tard)

Dans la table `destination_posts`, une ligne par post :
- `destination_id` : l'identifiant du lieu (ex. `la-maison-1888`)
- `post_url` : le lien du post Instagram (obligatoire)
- `account` : le compte (ex. `intercontinentaldanang`)
- `caption`, `image_url` : utilisés uniquement par la carte de repli si Instagram ne charge pas
- `display_order`, `active` : ordre et visibilité

Envoyez-moi simplement les liens quand vous les avez et je les insère — ou je vous montre la requête toute prête.

## Portée

- Toutes les fiches détaillées, tous niveaux (Heaven → Sea).
- Aucune modification des cards du fil principal.
- Libellés déjà traduits EN / VI / RU / ZH.

## Détails techniques

- `DestinationDetail.tsx` : rendu conditionnel — `InstagramPostEmbed` prioritaire, `InstagramStrip` seulement si aucun post.
- `hub-context.tsx` : l'inférence automatique (lien Instagram en `/p/` ou `/reel/` → post mis en avant) couvre déjà les lieux concernés sans toucher la base.
- Aucun changement de schéma : `destination_posts` existe et est déjà lue par `hub.functions.ts`.
