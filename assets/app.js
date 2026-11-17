// Application Bureau Malin : active l'installation et la lecture hors connexion (voir /sw.js)
(function(){
  if(!("serviceWorker" in navigator))return;
  if(/^(localhost|127\.)/.test(location.hostname))return;
  window.addEventListener("load",function(){
    navigator.serviceWorker.register("/sw.js",{scope:"/"}).catch(function(){});
  });
})();
