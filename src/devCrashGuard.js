(function () {
  const box = document.createElement('div');
  box.id = 'dev-crash-guard';
  box.style.cssText = 'position:fixed;left:0;right:0;top:0;z-index:99999;background:#200;color:#fdd;padding:10px;font:12px/1.4 monospace;white-space:pre-wrap;display:none';
  document.addEventListener('DOMContentLoaded', () => document.body.appendChild(box));
  function show(e, type) {
    const msg = (e && (e.reason?.stack||e.reason?.message||e.stack||e.message||String(e))) || '(no message)';
    box.textContent = `[${type}] ${msg}`;
    box.style.display = 'block';
    console.error(`[${type}]`, e);
  }
  addEventListener('error', (e) => show(e.error || e, 'error'));
  addEventListener('unhandledrejection', (e) => show(e, 'unhandledrejection'));
})();
