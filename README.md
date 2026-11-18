# Bureau Malin

Site de guides d’achat pour le télétravail, financé par l’affiliation Amazon et la vente du Kit Bureau Malin.
En ligne : https://bureau-malin.netlify.app

## Organisation

| Dossier | Rôle |
|---|---|
| `_source/site.html` | **Source des guides** : textes, produits, liens Amazon (`LIENS`), photos (`PHOTOS`) |
| `_source/pages.json` | Titre et description de chaque page |
| `_source/extra/` | Mentions légales et conditions de vente |
| `outils/build.js` | Génère les pages statiques à partir de la source |
| `configurateur/`, `kit/` | Pages écrites à la main (configurateur et page de vente du kit) |
| `assets/` | Styles, script commun, icône, image de partage |
| `netlify/functions/` | Assistant IA (`assistant.mjs`) et mesure d’audience (`suivi.mjs`) |

Les dossiers `index.html`, `clavier/`, `webcam/`… sont **générés** : ne pas les modifier à la main.

## Modifier un guide

1. Modifier `_source/site.html` (ou `_source/extra/…`).
2. Lancer `node outils/build.js` (Playwright requis).
3. Commiter les fichiers générés.

## Module du kit

L’encart « Kit Bureau Malin » est ajouté automatiquement sur l’accueil et à la fin de chaque guide.
Son texte, son prix et les pages qui le reçoivent se règlent dans l’objet `KIT` de `outils/build.js`
(retirer une page de `accroches` retire l’encart de cette page). Les clics sont comptés dans les statistiques (`kit`).

## Vente du kit (Stripe)

1. Stripe (lien de paiement) encaisse les 9 € puis renvoie l’acheteur sur `/kit/merci/?session_id={CHECKOUT_SESSION_ID}`.
2. Le bouton de cette page appelle la fonction `telecharger`, qui vérifie auprès de Stripe que la commande est payée
   et porte sur le « Kit Bureau Malin », puis envoie le PDF. Le lien reste valable 30 jours.
3. Le PDF est stocké **chiffré** (`netlify/functions/telecharger/kit.enc`) : le dépôt public ne permet pas de le lire.
   Pour remplacer le guide : `KIT_KEY=… node outils/chiffrer-kit.js nouveau.pdf`, puis commiter `kit.enc`.

## Mise en ligne

Le site doit être déployé **depuis GitHub** (Netlify > Add new project > Import from Git) et non par glisser-déposer :
c’est la seule façon de publier les fonctions de l’assistant et de la mesure d’audience.

Variables d’environnement à créer dans Netlify (Project configuration > Environment variables) :

| Variable | Rôle |
|---|---|
| `PERPLEXITY_API_KEY` | Clé de l’API Perplexity pour l’assistant. Sans elle, le bouton de l’assistant ne s’affiche pas. |
| `STRIPE_SECRET_KEY` | Clé Stripe **à accès limité** (seulement « Checkout Sessions : lecture ») pour vérifier les paiements du kit. |
| `KIT_KEY` | Clé de déchiffrement du PDF du kit (64 caractères hexadécimaux). |
| `STATS_KEY` | Mot de passe de votre choix pour lire les statistiques : `/.netlify/functions/suivi?cle=…&jours=30` |

## Avant de publier

- Compléter les champs surlignés en jaune dans `_source/extra/mentions-legales.html` et `cgv.html`, puis relancer le build.
- Coller le lien de paiement du kit dans `kit/index.html` (`LIEN_PAIEMENT`).
- Coller les liens produits Amazon (SiteStripe) dans `LIENS` de `_source/site.html`, puis relancer le build.
