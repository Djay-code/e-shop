// Script commun à toutes les pages générées de Bureau Malin
(function(){
  var VIEWS=["clavier","webcam","ecran","souris","casque","hub","accessoires","handicap","transparence"];

  // Anciennes adresses en #clavier, #webcam… : on redirige vers la vraie page
  var h=location.hash.replace("#","");
  if(h==="accueil"){location.replace("/");return;}
  if(VIEWS.indexOf(h)>=0){location.replace("/"+h+"/");return;}

  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}

  // Légende du bureau interactif (accueil)
  var cap=document.getElementById("caption");
  if(cap){
    var texts={
      clavier:'<strong>Clavier</strong><a href="/clavier/">Lire le comparatif des claviers</a>',
      ecran:'<strong>Écran</strong><a href="/ecran/">Lire le comparatif des écrans</a>',
      webcam:'<strong>Webcam</strong><a href="/webcam/">Lire le comparatif des webcams</a>',
      souris:'<strong>Souris</strong><a href="/souris/">Lire le comparatif des souris</a>',
      casque:'<strong>Casque</strong><a href="/casque/">Lire le comparatif des casques</a>',
      tapis:'<strong>Tapis de bureau personnalisé</strong><a href="/accessoires/">Voir les accessoires</a>'
    };
    document.querySelectorAll(".desk .item").forEach(function(el){
      var show=function(){if(texts[el.dataset.k])cap.innerHTML=texts[el.dataset.k];};
      el.addEventListener("mouseenter",show);
      el.addEventListener("focus",show);
      el.addEventListener("click",show);
      el.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();show();}});
    });
  }

  // Mesure d’audience anonyme, sans cookie : visites et clics vers les marchands
  var SUIVI="/.netlify/functions/suivi";
  var local=/^(localhost|127\.)/.test(location.hostname);
  function suivre(d){
    if(local)return;
    d.u=location.pathname;
    try{navigator.sendBeacon(SUIVI,JSON.stringify(d));}catch(e){}
  }
  window.bmSuivre=suivre;
  suivre({t:"v"});
  document.addEventListener("click",function(e){
    var a=e.target.closest("a");
    if(!a||!/amazon\.|amzn\.to/.test(a.href))return;
    var pk=a.closest(".pick");
    suivre({t:"c",p:a.dataset.q||a.dataset.nom||(pk?pk.querySelector("h2").textContent.replace(/^\d+\.\s*/,""):a.textContent.trim())});
  });

  // Assistant d’achat : il n’apparaît que si la fonction Netlify répond et que la clé est configurée
  var dock=document.querySelector(".ai-dock");
  if(!dock)return;
  var ENDPOINT="/.netlify/functions/assistant";
  if(local){dock.remove();return;}
  fetch(ENDPOINT,{method:"GET"}).then(function(r){return r.ok?r.json():null;}).then(function(d){
    if(d&&d.ok){dock.hidden=false;brancher();}else dock.remove();
  }).catch(function(){dock.remove();});

  function brancher(){
    var hist=[],panel=document.getElementById("aiPanel"),log=document.getElementById("aiLog"),inp=document.getElementById("aiIn"),
        openB=document.getElementById("aiOpen"),send=document.getElementById("aiSend");
    function fmt(s){return esc(s).replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/\n/g,"<br>");}
    function add(cls,html){var d=document.createElement("div");d.className="ai-msg "+cls;d.innerHTML=html;log.appendChild(d);log.scrollTop=log.scrollHeight;return d;}
    function toggle(o){panel.hidden=!o;openB.setAttribute("aria-expanded",o?"true":"false");if(o)inp.focus();else openB.focus();}
    openB.addEventListener("click",function(){toggle(panel.hidden);});
    document.getElementById("aiClose").addEventListener("click",function(){toggle(false);});
    panel.addEventListener("keydown",function(e){if(e.key==="Escape")toggle(false);});
    document.getElementById("aiForm").addEventListener("submit",function(e){
      e.preventDefault();
      var q=inp.value.trim();
      if(!q){inp.focus();return;}
      inp.value="";
      add("me",fmt(q));
      hist.push({role:"user",content:q});
      hist=hist.slice(-8);
      while(hist.length&&hist[0].role!=="user")hist.shift();
      var wait=add("bot","Je cherche…");
      send.disabled=true;
      fetch(ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:hist})})
        .then(function(r){if(!r.ok)throw new Error(r.status);return r.json();})
        .then(function(d){
          var html=fmt(d.reply||"Je n’ai pas de réponse pour l’instant.");
          var src=(d.sources||[]).filter(function(u){return /^https?:\/\//.test(u);}).slice(0,4);
          if(src.length)html+='<div class="ai-src">Sources : '+src.map(function(u,i){return '<a href="'+esc(u)+'" target="_blank" rel="noopener">['+(i+1)+']</a>';}).join(" ")+'</div>';
          wait.innerHTML=html;
          hist.push({role:"assistant",content:d.reply||""});
        })
        .catch(function(){
          wait.innerHTML="Désolé, l’assistant ne répond pas pour le moment. Réessayez dans quelques minutes, ou utilisez le <a href=\"/configurateur/\">configurateur</a>.";
          hist.pop();
        })
        .then(function(){send.disabled=false;log.scrollTop=log.scrollHeight;});
    });
  }
})();
