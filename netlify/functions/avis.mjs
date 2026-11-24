// Avis des visiteurs sur les produits des guides.
//
// Un avis envoyé n'est jamais publié directement : il attend votre relecture sur
// https://bureau-malin.netlify.app/moderation/ (clé = variable d'environnement AVIS_KEY,
// ou STATS_KEY si AVIS_KEY n'existe pas).
//
// Routes :
//   GET  /api/avis?page=clavier                 avis publiés d'un guide (public)
//   POST /api/avis  {page, produit, note, nom, texte, site}   nouvel avis (public)
//   GET  /api/avis?attente=1   + en-tête x-avis-key           avis à relire
//   POST /api/avis  {action: "publier"|"refuser", id} + x-avis-key
//
// Sécurité : n'importe qui peut écrire ici, donc la fonction se protège elle-même :
// envois venus du site seulement, taille et fréquence limitées, champ piège contre les robots,
// file d'attente plafonnée, texte nettoyé et jamais interprété comme du HTML.
// Rien de personnel n'est stocké (ni IP, ni e-mail).
import { getStore } from "@netlify/blobs";
import { createHash, randomUUID, timingSafeEqual } from "node:crypto";

const PAGES = ["clavier", "souris", "ecran", "casque", "webcam", "hub", "accessoires"];
const TAILLE_MAX = 3000;     // octets par envoi
const ATTENTE_MAX = 200;     // avis en attente au maximum
const PUBLIES_MAX = 100;     // avis affichés par guide

const json = (data, status = 200, cache = "no-store") =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": cache } });

const cleValide = (donnee) => {
  const attendue = process.env.AVIS_KEY || process.env.STATS_KEY;
  if (!attendue || typeof donnee !== "string" || !donnee) return false;
  const h = (x) => createHash("sha256").update(x).digest();
  return timingSafeEqual(h(donnee), h(attendue));
};

const memeSite = (req) => {
  const src = req.headers.get("origin") || req.headers.get("referer");
  if (!src) return false;
  try { return new URL(src).host === new URL(req.url).host; } catch { return false; }
};

// Texte simple : sans caractères de contrôle, espaces réduits, longueur bornée
const texte = (s, n) => String(s ?? "").normalize("NFC").replace(/[\u0000-\u0008\u000B-\u001F\u007F-\u009F​-‏‪-‮⁦-⁩]/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, n);
const idValide = (id) => typeof id === "string" && /^[0-9a-f-]{36}$/.test(id);

async function lister(store, prefixe) {
  const { blobs } = await store.list({ prefix: prefixe });
  const avis = [];
  for (const b of blobs) {
    const a = await store.get(b.key, { type: "json" });
    if (a) avis.push(a);
  }
  return avis.sort((x, y) => (y.date || "").localeCompare(x.date || ""));
}

export default async (req) => {
  const store = getStore("avis");
  const u = new URL(req.url);
  const cle = req.headers.get("x-avis-key");

  if (req.method === "GET") {
    if (u.searchParams.has("attente")) {
      if (!cleValide(cle)) return json({ error: "Accès refusé" }, 403);
      return json({ avis: await lister(store, "attente/") });
    }
    const page = u.searchParams.get("page");
    if (!PAGES.includes(page)) return json({ error: "Page inconnue" }, 400);
    const avis = (await lister(store, `publie/${page}/`)).slice(0, PUBLIES_MAX)
      .map(({ produit, note, nom, texte, date }) => ({ produit, note, nom, texte, date }));
    const moyenne = avis.length ? Math.round((avis.reduce((s, a) => s + a.note, 0) / avis.length) * 10) / 10 : null;
    return json({ total: avis.length, moyenne, avis }, 200, "public, max-age=60");
  }

  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);

  let e;
  try {
    const brut = await req.text();
    if (brut.length > TAILLE_MAX) return json({ error: "Envoi trop long" }, 413);
    e = JSON.parse(brut);
  } catch { return json({ error: "Envoi illisible" }, 400); }
  if (!e || typeof e !== "object") return json({ error: "Envoi illisible" }, 400);

  // Modération (vous seul, avec la clé)
  if (e.action) {
    if (!cleValide(cle)) return json({ error: "Accès refusé" }, 403);
    if (!idValide(e.id)) return json({ error: "Avis inconnu" }, 400);
    const a = await store.get(`attente/${e.id}`, { type: "json" });
    if (!a) return json({ error: "Avis inconnu" }, 404);
    if (e.action === "publier") await store.setJSON(`publie/${a.page}/${a.id}`, a);
    else if (e.action !== "refuser") return json({ error: "Action inconnue" }, 400);
    await store.delete(`attente/${e.id}`);
    return json({ ok: true });
  }

  // Nouvel avis d'un visiteur
  if (!memeSite(req)) return json({ error: "Accès refusé" }, 403);
  if (/bot|crawl|spider|slurp|headless/i.test(req.headers.get("user-agent") || "")) return json({ ok: true }, 202);
  if (e.site) return json({ ok: true }, 202); // champ piège rempli : un robot, on fait semblant d'accepter

  const page = e.page;
  const note = Number(e.note);
  const produit = texte(e.produit, 80);
  const nom = texte(e.nom, 40).replace(/\n/g, " ") || "Anonyme";
  const avisTexte = texte(e.texte, 1000);
  if (!PAGES.includes(page)) return json({ error: "Page inconnue" }, 400);
  if (!Number.isInteger(note) || note < 1 || note > 5) return json({ error: "Choisissez une note de 1 à 5." }, 400);
  if (!produit) return json({ error: "Choisissez un produit." }, 400);
  if (avisTexte.length < 20) return json({ error: "Votre avis doit faire au moins 20 caractères." }, 400);
  if (/https?:\/\/|www\./i.test(avisTexte + nom)) return json({ error: "Les liens ne sont pas acceptés dans les avis." }, 400);

  const { blobs } = await store.list({ prefix: "attente/" });
  if (blobs.length >= ATTENTE_MAX) return json({ error: "Trop d’avis en attente, réessayez plus tard." }, 503);

  const id = randomUUID();
  await store.setJSON(`attente/${id}`, { id, page, produit, note, nom, texte: avisTexte, date: new Date().toISOString().slice(0, 10) });
  return json({ ok: true }, 202);
};

export const config = {
  path: "/api/avis",
  rateLimit: { windowLimit: 20, windowSize: 60, aggregateBy: ["ip", "domain"] },
};
