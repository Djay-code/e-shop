// Avis des visiteurs : affiche les avis publiés du guide et envoie les nouveaux avis.
// Le texte des visiteurs est toujours inséré avec textContent, jamais comme du HTML.
(function () {
  var bloc = document.querySelector("section.avis[data-page]");
  if (!bloc) return;
  var page = bloc.getAttribute("data-page");
  var liste = bloc.querySelector(".avis-liste");
  var resume = bloc.querySelector(".avis-resume");
  var form = bloc.querySelector("form.avis-form");
  var etat = bloc.querySelector(".avis-etat");
  var choix = form.querySelector("select[name=produit]");

  // Produits du guide, dans l'ordre de la page
  var vus = {};
  document.querySelectorAll(".pick a.prod[data-nom]").forEach(function (a) {
    var n = a.getAttribute("data-nom");
    if (vus[n]) return;
    vus[n] = 1;
    var o = document.createElement("option");
    o.value = n; o.textContent = n;
    choix.appendChild(o);
  });

  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  function etoiles(n) { return "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n); }

  fetch("/api/avis?page=" + encodeURIComponent(page))
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) {
      bloc.hidden = false;
      if (!d || !d.total) { resume.textContent = "Aucun avis pour l’instant. Soyez le premier à donner le vôtre."; return; }
      resume.textContent = d.moyenne.toString().replace(".", ",") + " sur 5, d’après " + d.total + " avis de lecteurs";
      d.avis.forEach(function (a) {
        var li = el("li", "avis-item");
        var tete = el("p", "avis-tete");
        var s = el("span", "avis-note", etoiles(a.note));
        s.setAttribute("aria-label", a.note + " sur 5");
        tete.appendChild(s);
        tete.appendChild(el("strong", null, " " + a.produit));
        li.appendChild(tete);
        li.appendChild(el("p", "avis-texte", a.texte));
        li.appendChild(el("p", "avis-qui", a.nom + ", " + new Date(a.date).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })));
        liste.appendChild(li);
      });
    })
    .catch(function () { bloc.hidden = false; });

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var f = new FormData(form);
    var bouton = form.querySelector("button[type=submit]");
    bouton.disabled = true;
    etat.textContent = "Envoi…";
    fetch("/api/avis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page: page, produit: f.get("produit"), note: Number(f.get("note")), nom: f.get("nom"), texte: f.get("texte"), site: f.get("site") })
    })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (x) {
        if (x.ok) { form.reset(); etat.textContent = "Merci ! Votre avis sera publié après relecture."; }
        else { etat.textContent = (x.d && x.d.error) || "L’envoi n’a pas abouti. Réessayez dans un moment."; bouton.disabled = false; }
      })
      .catch(function () { etat.textContent = "L’envoi n’a pas abouti. Réessayez dans un moment."; bouton.disabled = false; });
  });
})();
