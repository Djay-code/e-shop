(function(){
  // Colle ici le lien de paiement de ta plateforme (Payhip, Gumroad, Lemon Squeezy ou Stripe Payment Link)
  var LIEN_PAIEMENT="";
  var b=document.getElementById("buy");
  if(LIEN_PAIEMENT){b.href=LIEN_PAIEMENT;}
  else{
    b.textContent="Bientôt disponible";
    b.removeAttribute("href");
    b.setAttribute("aria-disabled","true");
    b.style.opacity=".55";
    b.addEventListener("click",function(e){e.preventDefault();});
    document.getElementById("buyNote").textContent="Le kit sera en vente très bientôt.";
  }
  function suivre(d){if(/^(localhost|127\.)/.test(location.hostname))return;try{navigator.sendBeacon("/api/suivi",JSON.stringify(d));}catch(e){}}
  suivre({t:"v"});
  b.addEventListener("click",function(){if(LIEN_PAIEMENT)suivre({t:"kit"});});
})();
