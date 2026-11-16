// Assistant d'achat de Bureau Malin : relaie les questions à Perplexity.
// La clé reste côté serveur : variable d'environnement PERPLEXITY_API_KEY
// (Netlify > Project configuration > Environment variables).
const MODELE = "sonar";

const CONSIGNE = `Tu es l'assistant d'achat du site Bureau Malin, spécialisé dans le matériel de télétravail.
Réponds en français, en 120 mots au maximum, avec des phrases simples.
Recommande en priorité les modèles testés par le site quand ils conviennent :
claviers Logitech MX Keys S, Keychron K2, Logitech K380 ;
souris Logitech MX Master 3S, Logitech Lift (verticale), Logitech M720 ;
webcams Logitech Brio 500, Razer Kiyo, Logitech C920 ;
écrans Dell P2723QE, LG 27UP850, Dell S2721DS ;
casques Jabra Evolve2 65, Sony WH-1000XM5, Logitech Zone Vibe 100 ;
hubs Anker 341, CalDigit TS4, UGREEN 5-en-1.
Donne des prix seulement comme ordre de grandeur. Pour une douleur ou un handicap, rappelle
que l'avis d'un médecin ou d'un ergothérapeute compte, et mentionne le guide https://bureau-malin.netlify.app/handicap/.
Si la question n'a rien à voir avec l'équipement d'un bureau, dis-le poliment et ramène la conversation au sujet.`;

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });

export default async (req) => {
  const key = process.env.PERPLEXITY_API_KEY;
  // Le site appelle GET pour savoir s'il doit afficher le bouton de l'assistant
  if (req.method === "GET") return json({ ok: Boolean(key) });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);
  if (!key) return json({ error: "Assistant non configuré" }, 503);

  let body;
  try { body = await req.json(); } catch { return json({ error: "Requête invalide" }, 400); }

  // On ne garde que des messages courts et bien formés, en alternance utilisateur / assistant
  const messages = (Array.isArray(body?.messages) ? body.messages : [])
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-8)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 600) }));
  while (messages.length && messages[0].role !== "user") messages.shift();
  if (!messages.length || messages[messages.length - 1].role !== "user") return json({ error: "Question manquante" }, 400);

  try {
    const r = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODELE, max_tokens: 400, messages: [{ role: "system", content: CONSIGNE }, ...messages] }),
      signal: AbortSignal.timeout(20000),
    });
    if (!r.ok) {
      console.error("Perplexity", r.status, (await r.text()).slice(0, 300));
      return json({ error: "Service indisponible" }, 502);
    }
    const d = await r.json();
    const reply = d?.choices?.[0]?.message?.content || "";
    const sources = (d.search_results || []).map((s) => s.url).concat(d.citations || []).filter((u, i, a) => typeof u === "string" && a.indexOf(u) === i);
    // Retire les renvois [1], [2] du texte : les sources sont affichées à part
    return json({ reply: reply.replace(/\s*\[\d+\]/g, "").trim(), sources: sources.slice(0, 4) });
  } catch (e) {
    console.error("Perplexity", e.message);
    return json({ error: "Service indisponible" }, 502);
  }
};
