// Données structurées (schema.org, JSON-LD) ajoutées dans le <head> de chaque page.
// Elles aident Google à comprendre le site : nom du site, fil d'Ariane, liste des produits d'un guide.
// Aucune note ni étoile ici : Google n'accepte que des avis publiés sur le site lui-même.
//
// Utilisé par outils/build.js, et en ligne de commande pour les pages faites à la main :
//   node outils/donnees-structurees.js configurateur/index.html kit/index.html
const fs = require("fs");
const path = require("path");

const SITE = "https://bureau-malin.netlify.app";
const MARQUEUR = 'type="application/ld+json"';

const texte = (html) =>
  html.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();

// JSON sûr dans une balise <script> : « < » échappé, donc pas de </script> possible
const bloc = (obj) => `<script ${MARQUEUR}>${JSON.stringify(obj).replace(/</g, "\\u003c")}</script>`;

function donnees(adresse, html) {
  const u = SITE + adresse;
  const graphe = [];

  if (adresse === "/") {
    graphe.push(
      { "@type": "WebSite", "@id": SITE + "/#site", name: "Bureau Malin", url: SITE + "/", inLanguage: "fr-FR" },
      { "@type": "Organization", "@id": SITE + "/#organisation", name: "Bureau Malin", url: SITE + "/", logo: SITE + "/assets/icones/icone-apple-180.png" }
    );
  }

  // Fil d'Ariane, d'après le bloc « Guides / Claviers » de la page
  const ariane = html.match(/<div class="crumb">([\s\S]*?)<\/div>/);
  if (ariane) {
    const morceaux = ariane[1].split(" / ").map(texte).filter(Boolean);
    if (morceaux.length >= 2) {
      graphe.push({
        "@type": "BreadcrumbList",
        itemListElement: morceaux.map((nom, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: nom,
          item: i === 0 ? SITE + "/" : i === morceaux.length - 1 ? u : undefined,
        })),
      });
    }
  }

  // Produits retenus dans un guide (titres « 1. Nom du produit »)
  const produits = [...html.matchAll(/<div class="pick">\s*<h2>\s*(?:\d+\.\s*)?([\s\S]*?)<\/h2>/g)].map((m) => texte(m[1]));
  if (produits.length) {
    const titre = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
    graphe.push({
      "@type": "ItemList",
      name: titre ? texte(titre[1]) : undefined,
      url: u,
      numberOfItems: produits.length,
      itemListElement: produits.map((nom, i) => ({ "@type": "ListItem", position: i + 1, name: nom })),
    });
  }

  return graphe.length ? bloc({ "@context": "https://schema.org", "@graph": graphe }) : "";
}

// Ajoute (ou remplace) le bloc dans une page complète
function ajouter(adresse, page) {
  const echappe = MARQUEUR.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const propre = page.replace(new RegExp(`<script ${echappe}>[\\s\\S]*?</script>\\n?`, "g"), "");
  const ld = donnees(adresse, propre);
  return ld ? propre.replace("</head>", ld + "\n</head>") : propre;
}

module.exports = { donnees, ajouter };

if (require.main === module) {
  const ROOT = path.resolve(__dirname, "..");
  for (const f of process.argv.slice(2)) {
    const p = path.join(ROOT, f);
    const dossier = path.dirname(f);
    const adresse = dossier === "." ? "/" : "/" + dossier + "/";
    fs.writeFileSync(p, ajouter(adresse, fs.readFileSync(p, "utf8")));
    console.log("Données structurées :", f);
  }
}
