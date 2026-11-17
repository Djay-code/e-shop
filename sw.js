// Application Bureau Malin : ce fichier permet d'installer le site comme une application
// et de relire hors connexion les pages déjà visitées.
//
// Règles :
// - pages : on prend toujours la version en ligne ; la copie locale ne sert que sans réseau ;
// - fichiers de /assets/ : copie locale affichée tout de suite, puis mise à jour en arrière-plan ;
// - /api/ (assistant, mesure d'audience) et les autres sites : jamais gardés en mémoire.
//
// Changer VERSION efface les anciennes copies chez les visiteurs.
const VERSION = "bm-1";
const PAGES = "pages-" + VERSION;
const FICHIERS = "fichiers-" + VERSION;
const HORS_LIGNE = "/hors-ligne.html";
const DEPART = ["/", "/configurateur/", HORS_LIGNE, "/assets/site.css", "/assets/site.js", "/assets/app.js", "/assets/configurateur.js", "/assets/favicon.svg", "/assets/icones/icone-192.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(PAGES).then((c) => c.addAll(DEPART)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((noms) => Promise.all(noms.filter((n) => n !== PAGES && n !== FICHIERS).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

// On ne garde que les réponses normales du site lui-même
const gardable = (r) => r && r.ok && r.type === "basic";

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/.netlify/")) return;

  // Pages : réseau d'abord, copie locale en secours, page « hors ligne » en dernier recours
  if (req.mode === "navigate") {
    const cle = url.origin + url.pathname; // sans les paramètres : une seule copie par page
    e.respondWith(
      fetch(req)
        .then((r) => {
          if (gardable(r)) { const copie = r.clone(); e.waitUntil(caches.open(PAGES).then((c) => c.put(cle, copie))); }
          return r;
        })
        .catch(() => caches.match(cle).then((r) => r || caches.match(HORS_LIGNE)))
    );
    return;
  }

  // Fichiers du site (styles, scripts, images) : copie locale, rafraîchie en arrière-plan
  if (url.pathname.startsWith("/assets/")) {
    e.respondWith(
      caches.match(req).then((local) => {
        const frais = fetch(req)
          .then((r) => {
            if (gardable(r)) { const copie = r.clone(); caches.open(FICHIERS).then((c) => c.put(req, copie)); }
            return r;
          })
          .catch(() => local);
        if (local) { e.waitUntil(frais); return local; }
        return frais;
      })
    );
  }
});
