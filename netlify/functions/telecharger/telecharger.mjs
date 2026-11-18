// Téléchargement sécurisé du Kit Bureau Malin.
// Stripe renvoie l'acheteur sur /kit/merci/?session_id=cs_… ; le bouton de cette page appelle
// /.netlify/functions/telecharger?session_id=cs_…
// La fonction vérifie auprès de Stripe que la commande est payée et porte bien sur le kit,
// puis déchiffre le PDF (stocké chiffré dans le dépôt) et l'envoie.
//
// Variables d'environnement (Netlify > Project configuration > Environment variables, portée Functions) :
//   STRIPE_SECRET_KEY : clé Stripe à accès limité, avec seulement « Checkout Sessions : lecture »
//   KIT_KEY           : clé de déchiffrement du PDF (64 caractères hexadécimaux)
import { readFile } from "node:fs/promises";
import { createDecipheriv } from "node:crypto";

const PRODUIT = "Kit Bureau Malin";
const VALIDITE_JOURS = 30; // durée pendant laquelle le lien de téléchargement reste valable
const FICHIER = new URL("./kit.enc", import.meta.url);

function page(titre, message, status) {
  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>${titre} | Bureau Malin</title><link rel="stylesheet" href="/assets/site.css"></head>
<body><main><section><article><h1>${titre}</h1><p>${message}</p>
<p><a href="/mentions-legales/">Nous contacter</a> · <a href="/">Retour au site</a></p></article></section></main></body></html>`;
  return new Response(html, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}

async function sessionStripe(id, cle) {
  const u = `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(id)}?expand[]=line_items`;
  const r = await fetch(u, { headers: { Authorization: `Bearer ${cle}` }, signal: AbortSignal.timeout(10000) });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`Stripe ${r.status} ${(await r.text()).slice(0, 200)}`);
  return r.json();
}

function contientLeKit(s) {
  if (s.metadata?.produit === "kit-bureau-malin") return true;
  return (s.line_items?.data || []).some((l) => (l.description || "").trim() === PRODUIT);
}

async function dechiffrer(cle) {
  const buf = await readFile(FICHIER);
  const d = createDecipheriv("aes-256-gcm", Buffer.from(cle, "hex"), buf.subarray(0, 12));
  d.setAuthTag(buf.subarray(12, 28));
  return Buffer.concat([d.update(buf.subarray(28)), d.final()]);
}

export default async (req) => {
  if (req.method !== "GET") return page("Méthode non autorisée", "Cette adresse sert uniquement au téléchargement.", 405);

  const stripeKey = Netlify.env.get("STRIPE_SECRET_KEY");
  const kitKey = Netlify.env.get("KIT_KEY");
  if (!stripeKey || !kitKey || kitKey.length !== 64) {
    console.error("telecharger : STRIPE_SECRET_KEY ou KIT_KEY manquante");
    return page("Téléchargement momentanément indisponible", "Votre achat est bien enregistré. Écrivez-nous avec votre reçu Stripe et nous vous envoyons le guide.", 503);
  }

  const id = new URL(req.url).searchParams.get("session_id") || "";
  if (!/^cs_(live|test)_[A-Za-z0-9]{10,200}$/.test(id)) {
    return page("Lien de téléchargement invalide", "Ce lien n’est pas valide. Utilisez le bouton de la page affichée juste après votre paiement.", 400);
  }

  let s;
  try { s = await sessionStripe(id, stripeKey); } catch (e) {
    console.error("telecharger :", e.message);
    return page("Vérification impossible pour le moment", "Nous n’avons pas pu vérifier votre paiement. Réessayez dans quelques minutes, ou écrivez-nous avec votre reçu Stripe.", 502);
  }
  if (!s || s.status !== "complete" || s.payment_status !== "paid" || !contientLeKit(s)) {
    return page("Paiement introuvable", "Nous ne trouvons pas de paiement confirmé pour ce lien. Si vous venez de payer, réessayez dans une minute ; sinon, écrivez-nous avec votre reçu Stripe.", 403);
  }
  if (Date.now() / 1000 - s.created > VALIDITE_JOURS * 86400) {
    return page("Lien expiré", `Ce lien de téléchargement était valable ${VALIDITE_JOURS} jours. Écrivez-nous avec votre reçu Stripe et nous vous renvoyons le guide.`, 410);
  }

  let pdf;
  try { pdf = await dechiffrer(kitKey); } catch (e) {
    console.error("telecharger : déchiffrement impossible", e.message);
    return page("Téléchargement momentanément indisponible", "Votre paiement est bien confirmé. Écrivez-nous avec votre reçu Stripe et nous vous envoyons le guide.", 500);
  }
  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="Kit-Bureau-Malin.pdf"',
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
};
