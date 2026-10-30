# Images gérées par le prototype

Le manifeste `src/data/image-variants.json` relie les anciennes références exactes aux versions optimisées dans le bucket public `hub-images`. Il conserve les dimensions natives, l’original de régénération, les variantes WebP et les AVIF des couvertures agrandies et galeries. Les variantes gardent le cadrage et la transparence ; aucun agrandissement artificiel n’est appliqué. Les logos restent vectoriels.

`resolveImage` normalise les images du catalogue avant affichage. Les miniatures, couvertures, galeries, fonds de niveaux, hero, publications natives, illustrations et aperçus YouTube passent par le même manifeste. Les anciennes URL WordPress restent seulement des alias de compatibilité avec un catalogue en cache : elles ne sont plus utilisées comme `src`, `srcset` ou repli des images connues. Une nouvelle référence non inventoriée conserve sa source jusqu’à une nouvelle préparation.

Le contenu interne des lecteurs Instagram, YouTube, PDF et sites tiers reste géré par leurs fournisseurs. Héberger leur aperçu ne transforme pas leur lecteur en contenu local.

## Préparer un remplacement

1. Exporter les 23 tables du CMS et les métadonnées Storage avec `supabase/manual/export-cms-recovery.sql`. Sauvegarder et vérifier les fichiers avec `scripts/rehearse-cms-recovery.ts` ; inclure les contenus inactifs dans l’inventaire.
2. Actualiser `scripts/image-source-inventory.json` avec les sources publiques réellement utilisées (couvertures, galeries, niveaux, hero, publications natives, illustrations et aperçus). Un rôle `Fiche agrandie` ou `Galerie` demande aussi les AVIF HD.
3. Exécuter `bun run images:variants /chemin/inventaire.json /chemin/sauvegarde-verifiee /chemin/staging`. Le dossier de préparation doit être hors du dépôt. Cette commande lit les sources et prépare les fichiers ; elle ne publie et ne supprime rien.
4. Inspecter les images et comparer les dimensions. Le dossier `masters` conserve les originaux exacts ; `upload` contient les nouveaux objets aux noms dérivés du contenu. Les objets déjà présents et identiques sont réutilisés.
5. Importer les objets dans `hub-images` sans écraser de fichiers existants. `upload.json` fournit les tailles et empreintes attendues. Contrôler les réponses GET, les empreintes et les types de tous les objets avant de publier le manifeste.
6. Copier `managed-images.json` dans `src/data/image-variants.json`, vérifier les tests et les affichages mobile/tablette/desktop. Mettre à jour les champs du CMS avec des conditions sur leur ancienne valeur pour conserver toute modification concurrente.

Sharp utilise WebP qualité 85/effort 5 et AVIF qualité 60/effort 4. Les tailles proposées sont 320, 640, 960, 1280 et 1600 pixels, toujours limitées par la taille source, plus la définition native. La version WebP existante est conservée si elle est déjà plus légère que la nouvelle compression.

## Cache et nettoyage

### Hero HD réservé au desktop

Le réglage public `site_settings.hero_image_desktop` sélectionne la photographie sur les écrans paysage d'au moins 1200 pixels. Les réglages `hero_image` (portrait/mobile) et `hero_image_landscape` (tablette paysage) restent indépendants et inchangés. En l'absence de réglage desktop, la source paysage existante reste le repli.

Le lot du 30 octobre part du fichier de lobby avec lustre déjà agrandi par Real-ESRGAN à 6144 × 4096 pixels ; ce n'est pas une nouvelle prise de vue HD native. Le master `adj-0f78b754bd10acded9be37bb-original.png` reste dans Storage pour régénération et n'entre ni dans les candidats du navigateur ni dans la liste du cache `/media/`. Les versions d'affichage, encodées avec Sharp, sont limitées à 1920, 2560 et 3840 pixels : AVIF qualité 65/effort 4, WebP qualité 88/effort 5. Le maximum servi est donc 3840 × 2560, jamais le PNG de 36 Mo.

| Largeur |           AVIF |           WebP |
| ------- | -------------: | -------------: |
| 1920 px | 141 500 octets | 241 486 octets |
| 2560 px | 200 776 octets | 340 458 octets |
| 3840 px | 338 438 octets | 558 676 octets |

Le `picture` et les préchargements serveur partagent les mêmes tailles et des media queries distinctes pour le desktop, la tablette paysage et le portrait. Le navigateur choisit une seule variante en fonction de la fenêtre et de sa densité de pixels ; aucune image basse définition préalable n'est téléchargée pour ce hero. La photo reste visible dès son décodage natif, sans attente de JavaScript ou fondu masquant le LCP. Le zoom d'entrée de 8 % est supprimé sur desktop ; le recadrage nécessaire pour remplir le cadre reste actif. Les nuages et le logo de la PR 208 sont conservés.

Les sept objets ont été contrôlés par GET et SHA-256 avant publication du manifeste. Storage annonce une heure de cache ; `/media/` applique le cache versionné du hub. Aucun objet existant n'a été remplacé ou supprimé. Pour revenir au fond desktop précédent, retirer uniquement le réglage `hero_image_desktop` ; conserver les objets pendant la durée des caches et des anciennes versions.

Les noms changent avec le contenu. L’API Storage permet `cacheControl: "31536000"` pour ces objets immuables. L’import depuis le tableau de bord utilise toutefois son réglage par défaut : **une heure a été observée sur les réponses GET du lot du 26 octobre**, et non un an. Ne pas annoncer un cache long sans le vérifier sur un GET réel ; le HEAD peut renvoyer une politique différente.

Ne pas ouvrir de politique d’écriture publique. Conserver les originaux nécessaires à la régénération, les alias encore utilisés et les objets référencés par les versions déployées. Avant toute suppression définitive, recouper toutes les tables, le code, les manifestes et les scripts, archiver les octets et leurs empreintes, puis vérifier la liste finale. Storage n’a pas de corbeille.

`images:check`, `images:audit` et `images:cache` concernent uniquement les **26 objets historiques** de `scripts/storage-manifest.json`. Ils ne représentent pas l’audit complet du catalogue. Ne pas rejouer `activate-images.sql` ni les anciennes migrations d’activation sur la production.
