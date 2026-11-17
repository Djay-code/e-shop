// Mesure d'audience anonyme, sans cookie : compte les pages vues et les clics vers les marchands.
// Rien de personnel n'est stocké (ni IP, ni identifiant) : seulement des compteurs par jour.
//
// Lire les chiffres : https://bureau-malin.netlify.app/api/suivi?cle=VOTRE_CLE&jours=30
// où VOTRE_CLE est la valeur de la variable d'environnement STATS_KEY (à créer dans Netlify).
// La clé peut aussi être envoyée dans l'en-tête « x-stats-key » (elle n'apparaît alors dans aucun historique).
//
// Sécurité : la fonction est ouverte à tous les visiteurs, donc elle se protège elle-même :
// envois limités en taille et en fréquence, types d'événements connus seulement,
// nombre de lignes par jour plafonné (personne ne peut gonfler le stockage).
import { getStore } from "@netlify/blobs";
import { createHash, timingSafeEqual } from "node:crypto";

const TAILLE_MAX = 1000;   // octets par envoi
const LIGNES_MAX = 300;    // libellés différents par jour et par catégorie
const TYPES_AUTRES = ["cfg", "kit"]; // événements connus en dehors des vues (v) et des clics (c)

// Comparaison de la clé en temps constant (ne révèle rien sur la clé attendue)
const cleValide = (donnee) => {
  const attendue = process.env.STATS_KEY;
  if (!attendue || typeof donnee !== "string" || !donnee) return false;
  const h = (x) => createHash("sha256").update(x).digest();
  return timingSafeEqual(h(donnee), h(attendue));
};

// Compteurs sans propriétés héritées : un libellé comme « constructor » reste un simple libellé
const compteurs = (o) => {
  const c = Object.create(null);
  if (o && typeof o === "object") for (const [k, v] of Object.entries(o)) if (Number.isFinite(v)) c[k] = v;
  return c;
};
const ajouter = (c, k) => {
  if (!(k in c) && Object.keys(c).length >= LIGNES_MAX) k = "(autres)";
  c[k] = (c[k] || 0) + 1;
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data, null, 2), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });

const jour = (d = new Date()) => d.toISOString().slice(0, 10);
const propre = (s, n) => String(s || "").replace(/[^\p{L}\p{N} ./()’'+-]/gu, "").slice(0, n) || "?";

export default async (req) => {
  const store = getStore("suivi");

  if (req.method === "GET") {
    const u = new URL(req.url);
    if (!cleValide(req.headers.get("x-stats-key") || u.searchParams.get("cle"))) return json({ error: "Accès refusé" }, 403);
    const n = Math.min(Math.max(parseInt(u.searchParams.get("jours") || "30", 10) || 30, 1), 366);
    const total = { pages: compteurs(), clics: compteurs(), autres: compteurs() }, parJour = {};
    for (let i = 0; i < n; i++) {
      const j = jour(new Date(Date.now() - i * 864e5));
      const d = await store.get(j, { type: "json" });
      if (!d) continue;
      const c = { pages: compteurs(d.pages), clics: compteurs(d.clics), autres: compteurs(d.autres) };
      parJour[j] = { vues: Object.values(c.pages).reduce((a, b) => a + b, 0), clics: Object.values(c.clics).reduce((a, b) => a + b, 0) };
      for (const k of ["pages", "clics", "autres"]) for (const [x, v] of Object.entries(c[k])) total[k][x] = (total[k][x] || 0) + v;
    }
    const tri = (o) => Object.fromEntries(Object.entries(o).sort((a, b) => b[1] - a[1]));
    return json({ jours: n, parJour, pages: tri(total.pages), clics: tri(total.clics), autres: tri(total.autres) });
  }

  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);
  // On ignore les robots
  if (/bot|crawl|spider|slurp|headless/i.test(req.headers.get("user-agent") || "")) return new Response(null, { status: 204 });

  // Un envoi venu d'un autre site est ignoré
  const origine = req.headers.get("origin");
  if (origine) { try { if (new URL(origine).host !== new URL(req.url).host) return new Response(null, { status: 403 }); } catch { return new Response(null, { status: 403 }); } }

  let e;
  try {
    const brut = await req.text();
    if (brut.length > TAILLE_MAX) return new Response(null, { status: 413 });
    e = JSON.parse(brut);
  } catch { return new Response(null, { status: 400 }); }
  if (!e || typeof e !== "object") return new Response(null, { status: 400 });

  const j = jour();
  const lu = await store.get(j, { type: "json" });
  const d = { pages: compteurs(lu?.pages), clics: compteurs(lu?.clics), autres: compteurs(lu?.autres) };
  if (e.t === "v") ajouter(d.pages, propre(e.u, 80));
  else if (e.t === "c") ajouter(d.clics, propre(e.p, 80));
  else if (TYPES_AUTRES.includes(e.t)) ajouter(d.autres, e.t + (e.p ? " " + propre(e.p, 120) : ""));
  else return new Response(null, { status: 400 });
  await store.setJSON(j, d);
  return new Response(null, { status: 204 });
};

export const config = {
  path: "/api/suivi",
  rateLimit: { windowLimit: 60, windowSize: 60, aggregateBy: ["ip", "domain"] },
};
