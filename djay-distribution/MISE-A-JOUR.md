# Mise à jour automatique du catalogue

Une tâche planifiée lance chaque semaine une session Claude qui suit **exactement** ces règles.
Le but : garder dans le comparateur les meilleurs produits actuels de chaque catégorie, sans jamais publier d’information douteuse.

## 1. Ce qu’il faut chercher, catégorie par catégorie
- Les **nouveaux modèles** sortis ou arrivés en France depuis la dernière mise à jour (`societe.majCatalogue`).
- Les produits **nettement meilleurs** qu’un produit du catalogue, pour le même usage et une gamme de prix proche.
- Les produits du catalogue qui ne sont **plus vendus** sur Amazon.fr, ou remplacés par une nouvelle génération.

## 2. Ce qui compte comme « meilleur »
Un produit n’entre que s’il remplit **toutes** ces conditions :
1. Il est recommandé par **au moins deux sources fiables et récentes** (moins de 12 mois) : tests de médias reconnus (Les Numériques, 01net, Frandroid, Rtings, The Verge, Wirecutter…), pas de simples fiches marchandes ni de sites de comparaison automatiques.
2. Il apporte un **avantage concret** sur le produit qu’il remplace (meilleure ergonomie, meilleur micro, USB-C, prix plus bas à qualité égale…), écrit en une phrase dans le journal.
3. Il est **disponible sur Amazon.fr**, avec une fiche dont on vérifie qu’elle correspond bien au modèle (titre de la fiche ouvert et lu). Pour un clavier, prendre la version **AZERTY française**.
4. Son prix indicatif est relevé sur une source récente et arrondi à l’euro.

Dans le doute, **ne rien changer**. Une semaine sans modification est un résultat normal.

## 3. Limites
- Au plus **3 changements par semaine** (ajout, remplacement ou retrait), toutes catégories confondues.
- Chaque catégorie garde **entre 2 et 5 produits**, dont au moins une option « Petit budget ».
- On peut mettre à jour les **prix** des produits existants sans limite, si la source est récente et fiable (écart de plus de 10 %).
- Ne jamais modifier `societe`, sauf `majCatalogue` (date du jour, au format AAAA-MM-JJ).
- Ne pas créer de catégorie ni de nouvel usage sans demande de la personne.

## 4. Format d’un produit
Reprendre exactement les champs des produits existants : `id`, `categorie`, `nom`, `marque`, `prix`, `pour`, `tags`,
`caracteristiques` (les **mêmes clés** que les autres produits de la catégorie), `description` (une phrase factuelle),
`plus` et `moins` (2 à 3 éléments chacun, courts), `asin`, et `ajouteLe` (date du jour) pour un produit ajouté.
N’écrire que des caractéristiques vérifiées dans les sources : ne rien inventer.

## 5. Publication
Le comparateur en ligne lit son catalogue sur la branche GitHub **`djay-catalogue`**
(`https://raw.githubusercontent.com/Djay-code/e-shop/djay-catalogue/djay-distribution/catalogue.json`).
Pousser sur cette branche suffit : le site affiche le nouveau catalogue en quelques minutes, sans republication.

1. Lancer `node djay-distribution/valider-catalogue.js` : la publication est interdite tant qu’il signale une erreur.
2. Ajouter en tête de `djay-distribution/JOURNAL.md` une entrée datée : chaque changement, sa raison et ses sources (liens).
   Ne jamais effacer d’entrée du journal : quand il dépasse 12 entrées détaillées, compacter les plus anciennes
   (par mois, en bas du fichier, sous « Archives compactées ») en gardant pour chacune la date, les produits
   ajoutés, retirés ou repricés, et la raison en une ligne. Les liens sources restent dans l’historique Git.
3. Commiter `catalogue.json` et `JOURNAL.md` et pousser sur la branche `djay-catalogue`
   (la créer à partir de l’état actuel si elle n’existe pas encore). Ne jamais réécrire son historique.
4. Si rien n’a changé (ni produit, ni prix), ne rien commiter.
