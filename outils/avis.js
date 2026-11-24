// Bloc « Avis des lecteurs » ajouté en bas des guides produits.
// Le bloc reste caché sans JavaScript ; assets/avis.js l'affiche, charge les avis publiés
// et envoie les nouveaux à /api/avis (netlify/functions/avis.mjs).
//
// Utilisé par outils/build.js, et en ligne de commande :
//   node outils/avis.js clavier/index.html souris/index.html
const fs = require("fs");
const path = require("path");

const PAGES = ["clavier", "souris", "ecran", "casque", "webcam", "hub", "accessoires"];

const bloc = (page) => `<section class="avis" data-page="${page}" hidden>
  <div class="wrap-avis">
    <h2 id="avis-titre">Avis des lecteurs</h2>
    <p class="avis-resume" aria-live="polite"></p>
    <ul class="avis-liste"></ul>
    <form class="avis-form" aria-labelledby="avis-donner">
      <h3 id="avis-donner">Donnez votre avis</h3>
      <label>Produit <select name="produit" required><option value="">Choisir…</option></select></label>
      <fieldset class="avis-etoiles"><legend>Votre note</legend>
        <label><input type="radio" name="note" value="1" required> 1 ★</label>
        <label><input type="radio" name="note" value="2"> 2 ★</label>
        <label><input type="radio" name="note" value="3"> 3 ★</label>
        <label><input type="radio" name="note" value="4"> 4 ★</label>
        <label><input type="radio" name="note" value="5"> 5 ★</label>
      </fieldset>
      <label>Prénom ou pseudo (facultatif) <input name="nom" type="text" maxlength="40" autocomplete="nickname"></label>
      <label>Votre avis <textarea name="texte" rows="4" minlength="20" maxlength="1000" required placeholder="Ce que vous en pensez après l’avoir utilisé"></textarea></label>
      <label class="avis-piege" aria-hidden="true">Ne pas remplir <input name="site" type="text" tabindex="-1" autocomplete="off"></label>
      <p class="avis-info">Votre avis est publié après relecture. Pas de lien, pas d’informations personnelles.</p>
      <button type="submit" class="btn">Envoyer mon avis</button>
      <p class="avis-etat" role="status"></p>
    </form>
  </div>
</section>`;

// Ajoute (ou remplace) le bloc dans une page complète, si c'est un guide produits
function ajouterAvis(adresse, html) {
  const page = adresse.replace(/\//g, "");
  let propre = html.replace(/<section class="avis"[\s\S]*?<\/section>\n?/g, "").replace(/<script src="\/assets\/avis\.js" defer><\/script>\n?/g, "");
  if (!PAGES.includes(page)) return propre;
  propre = propre.replace("</main>", bloc(page) + "\n</main>");
  return propre.replace("</body>", '<script src="/assets/avis.js" defer></script>\n</body>');
}

const CSS = `
/* Avis des lecteurs */
.avis[hidden]{display:none}
.avis{max-width:760px;margin:48px auto;padding:0 20px}
.avis-resume{color:var(--muted)}
.avis-liste{list-style:none;padding:0;margin:16px 0 32px;display:grid;gap:12px}
.avis-item{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:14px 18px}
.avis-item p{margin:4px 0}
.avis-note{color:#E0A400;letter-spacing:2px}
.avis-texte{white-space:pre-line}
.avis-qui{color:var(--muted);font-size:.9rem}
.avis-form{display:grid;gap:14px;background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:20px}
.avis-form h3{margin:0}
.avis-form label{display:grid;gap:6px;font-weight:600}
.avis-form input[type=text],.avis-form select,.avis-form textarea{font:inherit;padding:10px 12px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--ink);min-height:44px;box-sizing:border-box}
.avis-etoiles{border:0;padding:0;margin:0;display:flex;flex-wrap:wrap;gap:8px 16px}
.avis-etoiles legend{font-weight:600;margin-bottom:6px}
.avis-etoiles label{display:inline-flex;align-items:center;gap:6px;font-weight:400;min-height:44px}
.avis-piege{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}
.avis-info,.avis-etat{margin:0;color:var(--muted);font-size:.9rem}
.avis-form button{justify-self:start}
`;

module.exports = { ajouterAvis, CSS, PAGES };

if (require.main === module) {
  const ROOT = path.resolve(__dirname, "..");
  for (const f of process.argv.slice(2)) {
    const p = path.join(ROOT, f);
    const dossier = path.dirname(f);
    fs.writeFileSync(p, ajouterAvis(dossier === "." ? "/" : "/" + dossier + "/", fs.readFileSync(p, "utf8")));
    console.log("Bloc d’avis :", f);
  }
}
