# Liens Discover et Website selon la langue

Le hub conserve une URL commune par bouton. Seuls `DISCOVER` et `WEBSITE` peuvent utiliser une variante pour la langue sélectionnée : anglais, vietnamien, russe, chinois simplifié, coréen ou japonais. Sans variante active et valide, l'URL commune reste utilisée. Les menus, PDF, `BOOK`, réseaux sociaux et les autres boutons ne changent pas de lien selon la langue.

## Modifier un lien dans Supabase

- Pour une card : ouvrir `destination_link_translations`. Choisir le `link_id` du bouton dans `destination_links`, la `locale` (`en`, `vi`, `ru`, `zh`, `ko`, `ja`) et l'URL HTTPS exacte. Passer `active` à `true` après vérification.
- Pour le bouton Website en bas du hub : utiliser `site_link_translations` avec `setting_key = website`, puis les mêmes champs de langue, URL et publication.
- `source_url`, `created_at` et `updated_at` sont renseignés automatiquement. Ne pas les modifier manuellement.
- Une seule variante est possible par bouton et par langue. Il n'est pas nécessaire de remplir les langues dont l'adresse est identique au lien commun.

Modifier l'URL commune (ou le type du bouton) dépublie ses variantes. Vérifier les nouveaux liens puis les republier explicitement. Masquer une card ou son bouton masque aussi toutes ses variantes dans l'API publique. Les visiteurs ne peuvent ni écrire ni supprimer ces données.

La sélection de langue reste instantanée : les variantes sont chargées avec le catalogue et partagent son cache. Après une modification en base, laisser quelques minutes aux caches pour expirer. Le lecteur intégré utilise l'adresse choisie ; sa croix conserve le retour à la card.

## Liens initialement vérifiés

La migration de contenu du 26 septembre 2026 utilise les équivalences `hreflang` annoncées par le site officiel et vérifie les pages correspondantes (réponse HTTP, langue et destination finale). Le site emploie `/vn/` et parfois `lang="vn"` pour le vietnamien ; la base conserve la locale standard `vi`. Les ancres des liens vers les villas sont préservées.

Pour le catalogue public observé : 167 variantes de liens de cards et 5 variantes du Website sont prévues. Certaines pages ne proposent pas toutes les langues ; aucun lien n'est inventé pour combler ces absences. Mi Sol Spa, Nail and Hair Studio et IHG One Rewards gardent notamment leur URL commune. Le contenu lui-même appartient au site externe : ces vérifications ne constituent pas une relecture linguistique de chaque page.

Les nouvelles pages et les changements du site externe ne sont pas importés automatiquement. Ajouter leurs adresses exactes dans Supabase après vérification. Les autres liens de pied de page (Dining, Spa, Resort Map…) restent partagés ; seule l'entrée Website est concernée.

## Déploiement

1. L'intégration Supabase/GitHub applique `20260926120000_localized_discover_links.sql` puis `20260926121000_seed_verified_link_translations.sql` à la fusion. Les migrations ont été testées dans une base isolée ; la création automatique de branches de prévisualisation est actuellement désactivée dans ce projet.
2. Ne pas rejouer l'historique des migrations ni relancer la création des tables. Si l'intégration a déjà appliqué ces fichiers, aucun script manuel n'est nécessaire.
3. Exécuter au besoin `supabase/manual/verify-localized-links.sql` : le dernier résultat doit être vide.
4. Tester Discover de Citron/La Maison 1888 et Website en japonais, puis en anglais. Les liens Menu et Book doivent conserver la même adresse.

L'ajout est compatible avec l'ancien Worker. Le nouveau conserve les URL communes si les tables de variantes ne sont pas encore disponibles.
