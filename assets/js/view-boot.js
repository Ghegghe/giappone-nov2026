/* view-boot.js — script classico nell'<head> di agenda.html (SPEC §9.2 "Selettore di vista").
   Se l'ultima vista scelta è "Giorno" (localStorage agenda-view = day) e l'URL non chiede una vista precisa
   (niente #data, niente ?view=grid), va subito alla pagina del giorno prima di disegnare la griglia.
   giorno.html senza ?d= sceglie da sé oggi (in viaggio) o il primo giorno, e poi scrive ?d= nell'URL. */
(function () {
  var pref = null;
  try { pref = localStorage.getItem('agenda-view'); } catch (e) { /* storage non disponibile */ }
  if (pref !== 'day' || location.hash) return;
  var q = new URLSearchParams(location.search);
  if (q.get('view') === 'grid') return;
  var data = q.get('data');
  location.replace('giorno.html' + (data ? '?data=' + encodeURIComponent(data) : ''));
})();
