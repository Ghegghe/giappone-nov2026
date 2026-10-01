/* theme-boot.js — script classico (non module) da includere nell'<head> SUBITO DOPO <link id="theme-css">.
   Applica tema e modo salvati prima del primo paint (niente flash). Nessuna dipendenza. */
(function () {
  // Elenco temi disponibili: per aggiungerne uno, aggiungere qui + assets/css/themes/<id>.css + PRECACHE in sw.js
  var THEMES = [
    { id: 'washi', label: 'Washi' },
    { id: 'neutral', label: 'Neutro' },
    { id: 'night', label: 'Notte' }
  ];
  var MODES = ['auto', 'light', 'dark'];
  window.GJ_THEMES = THEMES;

  var theme = 'washi', mode = 'auto';
  try {
    var t = localStorage.getItem('giappone.theme');
    var m = localStorage.getItem('giappone.mode');
    for (var i = 0; i < THEMES.length; i++) if (THEMES[i].id === t) theme = t;
    if (MODES.indexOf(m) >= 0) mode = m;
  } catch (e) { /* storage non disponibile: default */ }

  var html = document.documentElement;
  html.setAttribute('data-theme', theme);
  html.setAttribute('data-theme-mode', mode);

  var link = document.getElementById('theme-css');
  if (link) {
    var href = link.getAttribute('href') || '';
    var next = href.replace(/[^\/]+\.css(\?.*)?$/, theme + '.css');
    if (next !== href) link.setAttribute('href', next);
  }
})();
