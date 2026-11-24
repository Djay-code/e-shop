// Page de modération : la clé reste dans cet onglet (sessionStorage) et n'est envoyée
// que dans l'en-tête x-avis-key. Le texte des avis est inséré avec textContent.
(function () {
  var form = document.getElementById("cleForm");
  var champ = document.getElementById("cle");
  var etat = document.getElementById("etat");
  var liste = document.getElementById("liste");
  try { champ.value = sessionStorage.getItem("avisCle") || ""; } catch (e) {}

  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

  function appel(methode, corps) {
    var o = { method: methode, headers: { "x-avis-key": champ.value } };
    if (corps) { o.headers["Content-Type"] = "application/json"; o.body = JSON.stringify(corps); }
    return fetch(methode === "GET" ? "/api/avis?attente=1" : "/api/avis", o).then(function (r) {
      if (r.status === 403) throw new Error("Clé incorrecte.");
      if (!r.ok) throw new Error("Erreur " + r.status + ".");
      return r.json();
    });
  }

  function charger() {
    etat.textContent = "Chargement…";
    appel("GET").then(function (d) {
      try { sessionStorage.setItem("avisCle", champ.value); } catch (e) {}
      liste.textContent = "";
      etat.textContent = d.avis.length ? d.avis.length + " avis en attente." : "Aucun avis en attente.";
      d.avis.forEach(function (a) {
        var li = el("li", "avis-item");
        li.appendChild(el("p", null, "★".repeat(a.note) + " " + a.note + "/5 · " + a.produit + " · page " + a.page + " · " + a.date));
        li.appendChild(el("p", "avis-texte", a.texte));
        li.appendChild(el("p", "avis-qui", a.nom));
        ["publier", "refuser"].forEach(function (action) {
          var b = el("button", "btn", action === "publier" ? "Publier" : "Refuser");
          b.type = "button";
          b.style.marginRight = "12px";
          b.addEventListener("click", function () {
            b.disabled = true;
            appel("POST", { action: action, id: a.id }).then(function () { li.remove(); }).catch(function (e) { etat.textContent = e.message; b.disabled = false; });
          });
          li.appendChild(b);
        });
        liste.appendChild(li);
      });
    }).catch(function (e) { etat.textContent = e.message; });
  }

  form.addEventListener("submit", function (ev) { ev.preventDefault(); charger(); });
  if (champ.value) charger();
})();
