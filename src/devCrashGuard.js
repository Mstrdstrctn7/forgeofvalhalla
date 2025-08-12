(function(){
  function banner(kind, err){
    try{
      const el = document.createElement("div");
      el.style.cssText = "background:#200;color:#ffd6d6;padding:6px 10px;font:14px/1.3 system-ui,Arial;position:sticky;top:0;z-index:99999";
      const msg = (err && (err.message || err.reason || err)) || "(unknown error)";
      el.textContent = `[${kind}] ${msg}`;
      document.body.prepend(el);
    }catch(_){}
  }
  window.addEventListener("error", e => { console.error("[window.error]", e.error||e.message||e); banner("window.error", e.error||e.message||e); });
  window.addEventListener("unhandledrejection", e => { console.error("[unhandledrejection]", e.reason); banner("unhandledrejection", e.reason); });
})();
