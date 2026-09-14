# Perspective isométrique des cartes Heaven

## Résultat
Transformer uniquement la pile Heaven en une scène 3D éditoriale inspirée de la direction choisie, sans toucher aux autres niveaux.

## Modifications
- Ajouter un mode `heaven` à la pile universelle et l’activer depuis le chapitre Heaven.
- Conserver une grande carte active, avec trois cartes suivantes fortement superposées vers la droite.
- Donner aux cartes Heaven une profondeur isométrique cohérente : rotation légère sur les trois axes, décalage en profondeur, ombres architecturales et bord lumineux discret.
- Faire évoluer angle, lumière, saturation et parallaxe pendant le balayage, tout en conservant le toucher pour ouvrir la fiche.
- Garder la pile actuelle inchangée pour Sky, Earth et Sea.
- Respecter la réduction des animations et vérifier le résultat au format smartphone.

## Détails techniques
- Étendre `CardStack` avec une variante visuelle pilotée par le niveau.
- Étendre l’interpolation des positions avec rotation X/Y/Z et profondeur Z pour Heaven.
- Ajouter uniquement les nouveaux styles et tokens nécessaires dans la feuille globale.
- Vérifier compilation, erreurs d’affichage et capture mobile finale.
