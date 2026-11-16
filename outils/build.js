// Génère les pages statiques du site à partir de _source/site.html.
// Usage : node outils/build.js   (depuis la racine du dépôt)
//
// La page source contient tout le site et du JavaScript qui fabrique les guides
// et les illustrations. Ce script l'exécute dans un navigateur, puis écrit une
// vraie page HTML par guide, avec son seul contenu : Google lit tout sans JavaScript.
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const SITE = "https://bureau-malin.netlify.app";
const SRC = path.join(ROOT, "_source");
const META = JSON.parse(fs.readFileSync(path.join(SRC, "pages.json"), "utf8"));
const VIEWS = ["accueil", "clavier", "webcam", "ecran", "souris", "casque", "hub", "accessoires", "handicap", "transparence"];
const EXTRA = ["mentions-legales", "cgv"];
const url = (v) => (v === "accueil" ? "/" : "/" + v + "/");

const NAV = [
  ["/", "Guides"],
  ["/configurateur/", "Configurateur"],
  ["/handicap/", "Accessibilité"],
  ["/kit/", "Le kit"],
  ["/transparence/", "Transparence"],
];

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

function head(v) {
  const m = META[v];
  const u = SITE + url(v);
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(m.title)}</title>
<meta name="description" content="${esc(m.description)}">
<link rel="canonical" href="${u}">
<meta property="og:type" content="${v === "accueil" ? "website" : "article"}">
<meta property="og:site_name" content="Bureau Malin">
<meta property="og:locale" content="fr_FR">
<meta property="og:title" content="${esc(m.title)}">
<meta property="og:description" content="${esc(m.description)}">
<meta property="og:url" content="${u}">
<meta property="og:image" content="${SITE}/assets/partage.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Source+Sans+3:wght@400;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/site.css">
</head>`;
}

function header(v) {
  const cur = url(v);
  return `<header class="top">
  <div class="wrap">
    <a class="logo" href="/"><span></span>Bureau Malin</a>
    <nav aria-label="Menu principal">
${NAV.map(([h, t]) => `      <a href="${h}"${h === cur ? ' aria-current="page"' : ""}>${t}</a>`).join("\n")}
    </nav>
  </div>
</header>`;
}

const FOOTER = `<footer>
  <div class="wrap">
    <span>© 2026 Bureau Malin</span>
    <span class="links"><a href="/transparence/">Transparence et affiliation</a> <a href="/mentions-legales/">Mentions légales</a> <a href="/cgv/">Conditions de vente</a></span>
  </div>
</footer>`;

// Bouton de l'assistant : caché par défaut, site.js l'affiche si la fonction répond
const ASSISTANT = `<div class="ai-dock" hidden>
  <div class="ai-panel" id="aiPanel" role="dialog" aria-label="Assistant d’achat" hidden>
    <div class="ai-head"><strong>Assistant Bureau Malin</strong><button class="ai-x" id="aiClose" type="button" aria-label="Fermer l’assistant">×</button></div>
    <div class="ai-log" id="aiLog" aria-live="polite"><div class="ai-msg bot">Bonjour ! Dites-moi votre budget et votre usage, je vous aide à choisir votre matériel.</div></div>
    <form class="ai-form" id="aiForm"><input id="aiIn" type="text" maxlength="500" placeholder="Ex. : une webcam à moins de 80 €" aria-label="Votre question" autocomplete="off"><button type="submit" id="aiSend">Envoyer</button></form>
    <p class="ai-note">Réponses générées par IA avec Perplexity, à vérifier.</p>
  </div>
  <button class="ai-fab" id="aiOpen" type="button" aria-expanded="false" aria-controls="aiPanel">Demander à l’assistant</button>
</div>`;

const CSS_EXTRA = `
/* Ajouts des pages générées */
.ai-dock[hidden]{display:none}
nav a[aria-current="page"]{color:var(--accent)}
footer .links a{margin-left:16px}
[data-a-completer]{background:var(--hl);color:#1E2A2F;padding:0 4px;border-radius:3px}
/* Module Kit Bureau Malin */
.kit-promo{display:grid;grid-template-columns:150px 1fr;gap:22px;align-items:center;margin:36px 0 8px;padding:22px;background:var(--surface);border:1px solid var(--neon2);border-radius:16px;box-shadow:0 0 18px rgba(255,43,214,.18)}
.kit-promo-cover{aspect-ratio:3/4;border-radius:10px;padding:14px 12px;display:flex;flex-direction:column;justify-content:flex-end;color:#fff;background:linear-gradient(160deg,#1F2E45,#141A1C);box-shadow:0 0 0 1px rgba(0,229,255,.5),0 0 18px rgba(0,229,255,.25)}
.kit-promo-cover small{color:#FF7BE5;font-weight:600;letter-spacing:.06em;text-transform:uppercase;font-size:.68rem}
.kit-promo-cover strong{font-family:"Bricolage Grotesque",sans-serif;font-size:1.05rem;line-height:1.1;margin-top:.3em}
.kit-promo-hook{margin:0 0 .4em;color:var(--muted)}
.kit-promo h2{font-size:1.35rem;margin:0 0 .4em}
.kit-promo ul{margin:0 0 16px;padding-left:1.1em}
.kit-promo li{margin:.15em 0}
@media (max-width:560px){.kit-promo{grid-template-columns:1fr}.kit-promo-cover{aspect-ratio:auto;min-height:110px;max-width:220px}}
.legal h2{font-size:1.35rem;margin-top:1.4em}
@media (max-width:820px){
  nav{overflow:visible;white-space:normal;display:flex;flex-wrap:wrap;gap:4px 16px}
  nav a{margin:0}
  footer .links a{margin:0 16px 0 0}
}
`;

// Module « Kit Bureau Malin » : encart de promotion inséré automatiquement sur l'accueil
// et à la fin de chaque guide. Pour changer le texte ou le prix, c'est ici.
const KIT = {
  prix: "9 €",
  url: "/kit/",
  // Pages qui reçoivent l'encart, avec une accroche adaptée au sujet
  accroches: {
    accueil: "Le matériel ne fait pas tout : un écran trop bas ou une fenêtre mal placée suffisent à gâcher une journée.",
    clavier: "Un bon clavier mal placé fatigue quand même les poignets.",
    souris: "Une souris ergonomique ne suffit pas si le bureau est trop haut.",
    ecran: "Hauteur, distance, lumière : un écran se règle autant qu’il se choisit.",
    webcam: "La lumière compte plus que la webcam pour être net en visio.",
    casque: "Un bon son en visio commence par les bons réglages.",
    hub: "Un seul câble pour brancher son bureau, c’est bien. Un poste bien réglé, c’est mieux.",
    accessoires: "Les petits accessoires marchent mieux sur un bureau bien réglé.",
    handicap: "Préparez la discussion avec votre employeur et l’Agefiph avec un plan clair.",
  },
};

function kitModule(v) {
  const accroche = KIT.accroches[v];
  if (!accroche) return "";
  return `<aside class="kit-promo" aria-label="Kit Bureau Malin">
  <div class="kit-promo-cover" aria-hidden="true"><small>Guide PDF</small><strong>Kit Bureau Malin</strong></div>
  <div class="kit-promo-body">
    <p class="kit-promo-hook">${esc(accroche)}</p>
    <h2>Un bureau bien réglé en 30 minutes</h2>
    <ul>
      <li>Les bonnes hauteurs et distances, faciles à vérifier</li>
      <li>Une checklist d’installation à cocher</li>
      <li>Un plan d’achat par étapes et les aides au financement</li>
    </ul>
    <a class="btn" href="${KIT.url}" data-kit="${v}">Découvrir le kit · ${KIT.prix}</a>
  </div>
</aside>`;
}

// Place l'encart : après le bouton du configurateur sur l'accueil, en fin d'article ailleurs
function avecKit(v, html) {
  const bloc = kitModule(v);
  if (!bloc) return html;
  if (v === "accueil") {
    const ancre = "Composer mon setup en 5 questions</a></p>";
    if (html.includes(ancre)) return html.replace(ancre, ancre + "\n" + bloc);
    return html + bloc;
  }
  const i = html.lastIndexOf("</article>");
  return i < 0 ? html + bloc : html.slice(0, i) + bloc + "\n" + html.slice(i);
}

function page(v, main, defs) {
  return `${head(v)}
<body>
${defs || ""}
${header(v)}

<main>
${main}
</main>

${FOOTER}
${ASSISTANT}
<script src="/assets/site.js" defer></script>
</body>
</html>
`;
}

(async () => {
  const browser = await chromium.launch();
  const p = await browser.newPage();
  // Pas de réseau pendant la génération (polices, mesure d'audience)
  await p.route(/^https?:/, (r) => r.abort());
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + path.join(SRC, "site.html"));
  await p.waitForTimeout(300);
  if (errors.length) throw new Error("Erreur dans la page source : " + errors.join(" / "));

  const out = await p.evaluate((VIEWS) => {
    const url = (v) => (v === "accueil" ? "/" : "/" + v + "/");
    // Liens internes en # vers les vraies adresses
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      const v = a.getAttribute("href").slice(1);
      if (VIEWS.includes(v)) a.setAttribute("href", url(v));
    });
    const defs = document.querySelector('body > svg[width="0"]');
    const res = { css: document.querySelector("style").textContent, defs: defs ? defs.outerHTML : "", views: {} };
    VIEWS.forEach((v) => {
      const s = document.getElementById("v-" + v);
      s.classList.remove("view", "on");
      if (!s.className) s.removeAttribute("class");
      res.views[v] = s.outerHTML;
    });
    return res;
  }, VIEWS);

  fs.writeFileSync(path.join(ROOT, "assets/site.css"), out.css.trim() + "\n" + CSS_EXTRA);

  for (const v of VIEWS) {
    const dir = v === "accueil" ? ROOT : path.join(ROOT, v);
    fs.mkdirSync(dir, { recursive: true });
    // Les dégradés des illustrations ne servent que sur les pages qui en ont
    const defs = out.views[v].includes("url(#p") ? out.defs : "";
    fs.writeFileSync(path.join(dir, "index.html"), page(v, avecKit(v, out.views[v]), defs));
  }
  for (const v of EXTRA) {
    const dir = path.join(ROOT, v);
    fs.mkdirSync(dir, { recursive: true });
    const body = fs.readFileSync(path.join(SRC, "extra", v + ".html"), "utf8");
    fs.writeFileSync(path.join(dir, "index.html"), page(v, `<section>\n<article class="legal">\n${body}</article>\n</section>`));
  }

  // Page d'erreur 404 (Netlify l'affiche pour toute adresse inconnue)
  META["404"] = { title: "Page introuvable | Bureau Malin", description: "Cette page n’existe pas ou a été déplacée." };
  fs.writeFileSync(path.join(ROOT, "404.html"), page("404", `<section>\n<article>\n<h1>Page introuvable</h1>\n<p>Cette page n’existe pas ou a été déplacée.</p>\n<p><a class="btn" href="/">Retour aux guides</a> <a href="/configurateur/">ou composez votre setup en 5 questions</a></p>\n</article>\n</section>`).replace(/<link rel="canonical"[^>]*>\n/, '<meta name="robots" content="noindex">\n'));

  // Image d'aperçu pour les partages sur les réseaux sociaux
  const og = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await og.setContent(`<body style="margin:0;width:1200px;height:630px;display:flex;flex-direction:column;justify-content:center;padding:0 90px;box-sizing:border-box;background:linear-gradient(135deg,#141A1C,#1F2E45);color:#fff;font-family:system-ui,sans-serif">
    <div style="display:flex;align-items:center;gap:22px;font-size:44px;font-weight:800;letter-spacing:-1px"><span style="width:40px;height:40px;border-radius:6px;background:#00E5FF;box-shadow:0 0 20px #00E5FF,0 0 50px #FF2BD6"></span>Bureau Malin</div>
    <div style="font-size:76px;font-weight:800;line-height:1.05;letter-spacing:-2px;margin-top:36px;max-width:960px">Le bon matériel pour travailler de chez soi.</div>
    <div style="font-size:32px;color:#9AA8AD;margin-top:28px">Comparatifs, configurateur de bureau et guide d’accessibilité</div></body>`);
  await og.screenshot({ path: path.join(ROOT, "assets/partage.png") });

  await browser.close();

  const todo = EXTRA.filter((v) => fs.readFileSync(path.join(SRC, "extra", v + ".html"), "utf8").includes("data-a-completer"));
  console.log("Pages générées :", VIEWS.length + EXTRA.length);
  if (todo.length) console.log("À compléter avant publication :", todo.join(", "));
})().catch((e) => { console.error(e); process.exit(1); });
