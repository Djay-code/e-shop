# Djay Distribution – comparateur bureautique (portail client, v1)

Application web statique publiée comme un projet Netlify distinct de Bureau Malin.

## Fonctions
- Catalogue par catégorie (claviers, souris, webcams, écrans, casques, hubs USB-C), filtres par usage et budget, tri.
- Comparaison de 2 à 4 produits côte à côte, avec les différences surlignées et un lien partageable.
- « Ma sélection » : quantités, total indicatif, conservée sur l’appareil du client.
- Demande de devis par e-mail, pré-remplie avec la sélection.

## Modifier le catalogue
Tout est dans `catalogue.json` : produits, prix (euros TTC), caractéristiques, usages, adresse e-mail de la société.
Une nouvelle catégorie s’ajoute dans `categories`, puis ses produits avec `"categorie": "<id>"`.

## Prochaines étapes possibles
- Comptes clients (connexion, historique des devis et des commandes).
- Prix par client (remises professionnelles) et paiement en ligne avec Stripe.
- Catalogue géré depuis une interface d’administration au lieu du fichier JSON.
