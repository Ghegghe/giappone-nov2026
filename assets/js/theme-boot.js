/* theme-boot.js — script classico (non module) da includere nell'<head> SUBITO DOPO <link id="theme-css">.
   Tema unico (neutral, DIRECTION 2 ott 2026): qui si applica solo il MODO salvato (auto/chiaro/scuro) prima del
   primo paint, così non c'è flash. Una vecchia scelta di tema in localStorage viene ignorata. */
(function () {
  var MODES = ['auto', 'light', 'dark'];
  window.GJ_THEMES = [{ id: 'neutral', label: 'Neutro' }];
  var mode = 'auto';
  try {
    var m = localStorage.getItem('giappone.mode');
    if (MODES.indexOf(m) >= 0) mode = m;
  } catch (e) { /* storage non disponibile: auto */ }
  var html = document.documentElement;
  html.setAttribute('data-theme', 'neutral');
  html.setAttribute('data-theme-mode', mode);
})();
