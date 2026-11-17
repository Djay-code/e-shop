(function(){
  var AMAZON_TAG="bureau-malin-21";

  // Catalogue : les modèles des comparatifs, avec un prix indicatif en euros
  var P={
    clavier:{label:"Clavier",guide:"/clavier/",t:[
      {n:"Logitech K380",a:"B013SL1ZQ0",p:40,w:"Compact, silencieux et multi-appareils."},
      {n:"Keychron K2",p:90,w:"Mécanique, agréable pour taper beaucoup.",tag:"code"},
      {n:"Logitech MX Keys S",a:"B07W5JK4VS",p:110,w:"Frappe douce et silencieuse, rétroéclairé."}]},
    souris:{label:"Souris",guide:"/souris/",t:[
      {n:"Logitech M720 Triathlon",a:"B01KZVQB42",p:45,w:"Confortable, passe d’un appareil à l’autre."},
      {n:"Logitech Lift",a:"B07W4DGC27",p:70,w:"Verticale, soulage le poignet.",tag:"poignet"},
      {n:"Logitech MX Master 3S",a:"B07W5JKHFZ",p:100,w:"Sculptée pour la main, clics silencieux."}]},
    ecran:{label:"Écran",guide:"/ecran/",t:[
      {n:"Dell S2721DS",a:"B08GGG9BFJ",p:250,w:"27 pouces QHD, net pour le texte."},
      {n:"LG 27UP850",a:"B08YJMMYBX",p:430,w:"27 pouces 4K aux couleurs fidèles.",tag:"crea"},
      {n:"Dell P2723QE",a:"B09TY127B8",p:480,w:"27 pouces 4K, un seul câble USB-C pour tout."}]},
    webcam:{label:"Webcam",guide:"/webcam/",t:[
      {n:"Logitech C920",a:"B006A2Q81M",p:65,w:"La référence simple et fiable."},
      {n:"Razer Kiyo",a:"B076QK6489",p:80,w:"Anneau lumineux intégré pour les pièces sombres.",tag:"sombre"},
      {n:"Logitech Brio 500",a:"B07W5JKKFJ",p:110,w:"Bonne gestion du contre-jour, cache intégré."}]},
    casque:{label:"Casque",guide:"/casque/",t:[
      {n:"Logitech Zone Vibe 100",a:"B07W7JYN4P",p:90,w:"Léger, micro correct pour les visios."},
      {n:"Jabra Evolve2 65",a:"B086M57V71",p:200,w:"Micro sur perche très clair, voyant « occupé »."},
      {n:"Sony WH-1000XM5",a:"B09Y2MYL5C",p:330,w:"Réduction de bruit parmi les meilleures.",tag:"bruit"}]},
    hub:{label:"Hub USB-C",guide:"/hub/",t:[
      {n:"UGREEN 5-en-1",a:"B0BR3M8XHK",p:25,w:"HDMI et USB dans un format de poche."},
      {n:"Anker 341 (7-en-1)",a:"B0BMXR7B2Q",p:35,w:"HDMI, USB, cartes et recharge du laptop."},
      {n:"CalDigit TS4",a:"B09GFRPGWZ",p:380,w:"Station Thunderbolt : tout le bureau sur un câble."}]},
    support:{label:"Support de laptop",guide:"/accessoires/",t:[{n:"Support d’ordinateur portable",q:"support ordinateur portable réglable",p:30,w:"Remonte l’écran à hauteur des yeux."}]},
    repose:{label:"Repose-poignet",guide:"/accessoires/",t:[{n:"Repose-poignet mémoire de forme",q:"repose poignet clavier mémoire de forme",p:20,w:"Garde le poignet dans l’axe."}]},
    lampe:{label:"Barre lumineuse",guide:"/accessoires/",t:[{n:"Barre lumineuse d’écran",q:"barre lumineuse écran",p:40,w:"Éclaire le bureau sans reflet sur l’écran."}]},
    cables:{label:"Rangement des câbles",guide:"/accessoires/",t:[{n:"Organiseur de câbles",q:"goulotte câbles sous bureau",p:15,w:"Un bureau net, en vrai comme en visio."}]}
  };

  var Q=[
    {k:"poste",q:"Sur quoi travaillez-vous ?",o:[
      ["laptop","Un ordinateur portable","Je n’ai que lui pour l’instant."],
      ["laptop-ecran","Un portable et un écran","J’ai déjà un écran externe."],
      ["fixe","Un ordinateur fixe","Une tour ou un mini PC."]]},
    {k:"usage",q:"Votre journée type ?",o:[
      ["visio","Beaucoup de visios","Réunions, appels clients, formation."],
      ["texte","Écrire et analyser","Mails, documents, tableurs, code."],
      ["crea","Travail créatif","Photo, vidéo, design."]]},
    {k:"corps",q:"Une gêne à soulager ?",o:[
      ["aucune","Aucune","Tout va bien de ce côté."],
      ["poignet","Poignet ou avant-bras","Canal carpien, tendinite."],
      ["nuque","Nuque ou dos","Je finis la journée raide."]]},
    {k:"lieu",q:"Où travaillez-vous ?",o:[
      ["calme","Une pièce calme","Bureau dédié ou chambre."],
      ["bruit","Un endroit bruyant","Enfants, colocation, open space."],
      ["sombre","Une pièce sombre","Peu de lumière naturelle."]]},
    {k:"budget",q:"Votre budget total ?",o:[
      ["150","Moins de 150 €","L’essentiel."],
      ["400","Jusqu’à 400 €","Un vrai confort."],
      ["800","Jusqu’à 800 €","Un poste complet."],
      ["1500","Jusqu’à 1 500 €","Le haut de gamme."]]}
  ];

  var A={},i=0;
  var stepsEl=document.getElementById("steps"),bar=document.getElementById("bar"),stepN=document.getElementById("stepN");
  var prev=document.getElementById("prev"),next=document.getElementById("next"),form=document.getElementById("quiz");
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}

  function draw(){
    var s=Q[i];
    stepsEl.innerHTML='<fieldset><legend>'+esc(s.q)+'</legend><div class="opts">'+s.o.map(function(o){
      return '<label class="opt"><input type="radio" name="'+s.k+'" value="'+o[0]+'"'+(A[s.k]===o[0]?" checked":"")+'><span><strong>'+esc(o[1])+'</strong><small>'+esc(o[2])+'</small></span></label>';
    }).join("")+'</div></fieldset>';
    stepN.textContent="Question "+(i+1)+" sur "+Q.length;
    bar.style.width=(i/Q.length*100)+"%";
    prev.style.visibility=i?"visible":"hidden";
    next.textContent=i===Q.length-1?"Voir mon setup":"Suivant";
    next.disabled=!A[s.k];
  }
  stepsEl.addEventListener("change",function(e){
    A[e.target.name]=e.target.value;next.disabled=false;
    // Passe automatiquement à la question suivante après un choix à la souris
    if(e.target.matches(":focus-visible"))return;
    setTimeout(go,180);
  });
  function go(){
    if(!A[Q[i].k])return;
    if(i<Q.length-1){i++;draw();stepsEl.querySelector("input").focus({preventScroll:true});}
    else show();
  }
  form.addEventListener("submit",function(e){e.preventDefault();go();});
  prev.addEventListener("click",function(){if(i){i--;draw();}});

  // Construit le setup : ordre de priorité, puis montée en gamme tant que le budget le permet
  function build(a){
    var budget=+a.budget,prio=[];
    var laptop=a.poste==="laptop";
    // Sur portable, le support ne sert qu’avec un clavier et une souris externes
    if(laptop)prio.push("support","clavier","souris");
    // Un créatif sur portable a besoin d’un grand écran avant le reste
    if(laptop&&a.usage==="crea")prio.push("ecran","hub");
    if(a.usage==="visio"||a.lieu==="bruit")prio.push("casque");
    // Un portable a déjà une webcam : une externe passe après
    if(a.usage==="visio"&&!laptop)prio.push("webcam");
    if(!laptop)prio.push("clavier","souris");
    if(a.corps==="poignet")prio.push("repose");
    if(a.lieu==="sombre")prio.push("lampe");
    if(laptop)prio.push("ecran","hub");
    prio.push("casque","webcam","lampe","cables");
    prio=prio.filter(function(k,j){return prio.indexOf(k)===j;});

    // Modèle de départ (le moins cher) et modèle visé selon le profil
    function wanted(k){
      var t=P[k].t,want={poignet:a.corps==="poignet",bruit:a.lieu==="bruit",sombre:a.lieu==="sombre",crea:a.usage==="crea",code:a.usage==="texte"};
      for(var j=0;j<t.length;j++)if(t[j].tag&&want[t[j].tag])return j;
      return t.length-1;
    }
    var pick={},total=0;
    function add(k){
      // Un hub ne sert qu’avec un écran externe
      if(k in pick||(k==="hub"&&!("ecran" in pick)))return false;
      var c=P[k].t[0].p;
      if(total+c>budget)return false;
      pick[k]=0;total+=c;return true;
    }
    function upgrade(list){
      // Montée en gamme d’un cran à la fois, dans l’ordre des priorités, vers le modèle le plus adapté
      var changed=true;
      while(changed){
        changed=false;
        list.forEach(function(k){
          if(!(k in pick)||pick[k]>=wanted(k))return;
          // On saute les modèles spécialisés qui ne correspondent pas au profil (ex. souris verticale sans gêne au poignet)
          var t=P[k].t,tg=wanted(k),nxt=pick[k]+1;
          while(nxt<tg&&t[nxt].tag)nxt++;
          var diff=P[k].t[nxt].p-P[k].t[pick[k]].p;
          // La station Thunderbolt n’a de sens qu’avec un gros budget
          if(k==="hub"&&nxt===2&&budget<1500)return;
          if(total+diff<=budget){pick[k]=nxt;total+=diff;changed=true;}
        });
      }
    }
    // 1) les postes essentiels, montés en gamme d’abord
    var core=prio.slice(0,4);
    core.forEach(add);upgrade(core);
    // 2) le reste du bureau avec ce qui reste du budget
    var changed=true;
    while(changed){changed=false;prio.forEach(function(k){if(add(k))changed=true;});}
    upgrade(prio);
    var skipped=prio.filter(function(k){return !(k in pick);});
    return {prio:prio,pick:pick,total:total,skipped:skipped,budget:budget};
  }

  function link(it){
    // Lien direct vers la fiche produit quand on connaît sa référence Amazon (ASIN), sinon une recherche
    if(it.a)return "https://www.amazon.fr/dp/"+it.a+"?tag="+encodeURIComponent(AMAZON_TAG);
    return "https://www.amazon.fr/s?k="+encodeURIComponent(it.q||it.n)+"&tag="+encodeURIComponent(AMAZON_TAG);
  }
  function eur(n){return n.toLocaleString("fr-FR")+" €";}

  function show(){
    var r=build(A);
    bar.style.width="100%";
    form.classList.add("hidden");
    document.getElementById("result").classList.remove("hidden");
    document.getElementById("tot").textContent="≈ "+eur(r.total);
    document.getElementById("totNote").textContent="pour un budget de "+eur(r.budget)+(r.budget-r.total>=20?", il vous reste environ "+eur(r.budget-r.total):"");
    var html="";
    r.prio.forEach(function(k){
      if(!(k in r.pick))return;
      var it=P[k].t[r.pick[k]];
      html+='<li><div><div class="cat">'+esc(P[k].label)+'</div><h3>'+esc(it.n)+'</h3><p>'+esc(it.w)+' <a href="'+P[k].guide+'">Voir le comparatif</a></p></div>'+
        '<div class="side"><div class="price">≈ '+eur(it.p)+'</div><a class="btn" data-nom="'+esc(it.n)+'" href="'+link(it)+'" target="_blank" rel="sponsored nofollow noopener" aria-label="Voir '+esc(it.n)+' sur Amazon (nouvel onglet)">Voir sur Amazon</a></div></li>';
    });
    document.getElementById("items").innerHTML=html;
    document.getElementById("skipped").textContent=r.skipped.length?"Pour plus tard, quand le budget le permettra : "+r.skipped.map(function(k){return P[k].label.toLowerCase();}).join(", ")+".":"";
    var qs=Q.map(function(s){return s.k+"="+A[s.k];}).join("&");
    history.replaceState(null,"","?"+qs);
    suivre({t:"cfg",p:qs});
    document.getElementById("result").scrollIntoView({behavior:"smooth",block:"start"});
  }

  document.getElementById("restart").addEventListener("click",function(){
    A={};i=0;history.replaceState(null,"",location.pathname);
    document.getElementById("result").classList.add("hidden");form.classList.remove("hidden");draw();window.scrollTo(0,0);
  });
  document.getElementById("share").addEventListener("click",function(){
    var b=this,url=location.href;
    function ok(){b.textContent="Lien copié !";setTimeout(function(){b.textContent="Copier le lien de mon setup";},2000);}
    if(navigator.clipboard)navigator.clipboard.writeText(url).then(ok,function(){prompt("Copiez ce lien :",url);});
    else prompt("Copiez ce lien :",url);
  });

  // Mesure d’audience anonyme, sans cookie (même fonction que le reste du site)
  function suivre(d){if(/^(localhost|127\.)/.test(location.hostname))return;try{navigator.sendBeacon("/api/suivi",JSON.stringify(d));}catch(e){}}
  suivre({t:"v"});
  document.addEventListener("click",function(e){
    var a=e.target.closest("a.btn[data-nom]");
    if(a)suivre({t:"c",p:a.dataset.nom});
  });

  // Un lien partagé rouvre directement le résultat
  var p=new URLSearchParams(location.search),full=true;
  Q.forEach(function(s){var v=p.get(s.k);if(v&&s.o.some(function(o){return o[0]===v;}))A[s.k]=v;else full=false;});
  if(full)show();else{A={};draw();}
})();
