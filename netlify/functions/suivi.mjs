// Mesure d'audience anonyme, sans cookie : compte les pages vues et les clics vers les marchands.
// Rien de personnel n'est stocké (ni IP, ni identifiant) : seulement des compteurs par jour.
//
// Lire les chiffres : https://bureau-malin.netlify.app/.netlify/functions/suivi?cle=VOTRE_CLE&jours=30
// où VOTRE_CLE est la valeur de la variable d'environnement STATS_KEY (à créer dans Netlify).
import { getStore } from "@netlify/blobs";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data, null, 2), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });

const jour = (d = new Date()) => d.toISOString().slice(0, 10);
const propre = (s, n) => String(s || "").replace(/[^\p{L}\p{N} ./()’'+-]/gu, "").slice(0, n) || "?";

export default async (req) => {
  const store = getStore("suivi");

  if (req.method === "GET") {
    const u = new URL(req.url);
    if (!process.env.STATS_KEY || u.searchParams.get("cle") !== process.env.STATS_KEY) return json({ error: "Accès refusé" }, 403);
    const n = Math.min(Math.max(parseInt(u.searchParams.get("jours") || "30", 10) || 30, 1), 366);
    const total = { pages: {}, clics: {}, autres: {} }, parJour = {};
    for (let i = 0; i < n; i++) {
      const j = jour(new Date(Date.now() - i * 864e5));
      const d = await store.get(j, { type: "json" });
      if (!d) continue;
      parJour[j] = { vues: Object.values(d.pages || {}).reduce((a, b) => a + b, 0), clics: Object.values(d.clics || {}).reduce((a, b) => a + b, 0) };
      for (const k of ["pages", "clics", "autres"]) for (const [x, v] of Object.entries(d[k] || {})) total[k][x] = (total[k][x] || 0) + v;
    }
    const tri = (o) => Object.fromEntries(Object.entries(o).sort((a, b) => b[1] - a[1]));
    return json({ jours: n, parJour, pages: tri(total.pages), clics: tri(total.clics), autres: tri(total.autres) });
  }

  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);
  // On ignore les robots
  if (/bot|crawl|spider|slurp|headless/i.test(req.headers.get("user-agent") || "")) return new Response(null, { status: 204 });

  let e;
  try { e = JSON.parse(await req.text()); } catch { return new Response(null, { status: 400 }); }
  const j = jour();
  const d = (await store.get(j, { type: "json" })) || { pages: {}, clics: {}, autres: {} };
  if (e.t === "v") { const k = propre(e.u, 80); d.pages[k] = (d.pages[k] || 0) + 1; }
  else if (e.t === "c") { const k = propre(e.p, 80); d.clics[k] = (d.clics[k] || 0) + 1; }
  else { const k = propre(e.t, 20) + (e.p ? " " + propre(e.p, 120) : ""); d.autres[k] = (d.autres[k] || 0) + 1; }
  await store.setJSON(j, d);
  return new Response(null, { status: 204 });
};
