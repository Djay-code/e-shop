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

## Mise en ligne

Le site doit être déployé **depuis GitHub** (Netlify > Add new project > Import from Git) et non par glisser-déposer :
c’est la seule façon de publier les fonctions de l’assistant et de la mesure d’audience.

Variables d’environnement à créer dans Netlify (Project configuration > Environment variables) :

| Variable | Rôle |
|---|---|
| `PERPLEXITY_API_KEY` | Clé de l’API Perplexity pour l’assistant. Sans elle, le bouton de l’assistant ne s’affiche pas. |
| `STATS_KEY` | Mot de passe de votre choix pour lire les statistiques : `/.netlify/functions/suivi?cle=…&jours=30` |

## Avant de publier

- Compléter les champs surlignés en jaune dans `_source/extra/mentions-legales.html` et `cgv.html`, puis relancer le build.
- Coller le lien de paiement du kit dans `kit/index.html` (`LIEN_PAIEMENT`).
- Coller les liens produits Amazon (SiteStripe) dans `LIENS` de `_source/site.html`, puis relancer le build.
