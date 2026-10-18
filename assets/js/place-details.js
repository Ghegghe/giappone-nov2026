// place-details.js — schede dei locali (SPEC §12): indice placeId → scheda, per il pulsante "Scheda" nelle tappe
// del giorno, nel pannello dell'agenda e nelle righe di Luoghi. Il file è facoltativo: se manca, nessun pulsante.
import { loadData } from './app.js';

/** Map placeId → {id, title, …} (senza toast se place-details.json non c'è, es. nelle fixture). */
export async function detailIndex() {
  const d = await loadData('place-details', { quiet: true });
  return new Map(((d && d.details) || []).filter((x) => x && x.id && x.placeId).map((x) => [x.placeId, x]));
}

/** Link relativo alla scheda (i chiamanti aggiungono ?data= con il proprio helper). */
export const detailHref = (id) => `luogo.html?id=${encodeURIComponent(id)}`;
