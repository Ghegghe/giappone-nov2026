// sw.js — service worker del sito. Bumpare CACHE_VERSION a ogni deploy che cambia file statici.
const CACHE_VERSION = 'v18';
const STATIC_CACHE = `giappone-static-${CACHE_VERSION}`;
const DATA_CACHE = `giappone-data-${CACHE_VERSION}`;

// Lista esplicita (path relativi alla cartella di sw.js). tools/check_site.py verifica che esistano.
// PRECACHE-BEGIN
const PRECACHE = [
  './',
  'index.html',
  'agenda.html',
  'giorno.html',
  'trasporti.html',
  'alloggi.html',
  'luoghi.html',
  'guide.html',
  'luogo.html',
  'budget.html',
  'conto.html',
  '404.html',
  'manifest.webmanifest',
  'assets/css/base.css',
  'assets/css/agenda.css',
  'assets/css/pages.css',
  'assets/css/home.css',
  'assets/css/pages-b.css',
  'assets/css/budget.css',
  'assets/css/charts.css',
  'assets/css/guide.css',
  'assets/css/luogo.css',
  'assets/css/options.css',
  'assets/css/themes/washi.css',
  'assets/css/themes/neutral.css',
  'assets/css/themes/night.css',
  'assets/js/app.js',
  'assets/js/theme-boot.js',
  'assets/js/agenda.js',
  'assets/js/agenda-day.js',
  'assets/js/day-strip.js',
  'assets/js/view-switch.js',
  'assets/js/view-boot.js',
  'assets/js/agenda-gaps.js',
  'assets/js/pages.js',
  'assets/js/pages-home.js',
  'assets/js/pages-trasporti.js',
  'assets/js/pages-alloggi.js',
  'assets/js/pages-luoghi.js',
  'assets/js/pages-budget.js',
  'assets/js/pages-guide.js',
  'assets/js/pages-luogo.js',
  'assets/js/place-details.js',
  'assets/js/place-options.js',
  'assets/js/charts.js',
  'assets/js/conto.js',
  'assets/icons/sprite.svg',
  'assets/icons/favicon.svg',
  'assets/icons/icon.svg',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
  // foto delle schede dei locali (SPEC §12): nomi stabili <placeId>-<hash URL>.webp, li controlla tools/check_site.py
  'assets/img/luoghi/mouriya-sannomiya-56828ac9.webp',
  'assets/img/luoghi/mouriya-sannomiya-8baf6cc9.webp',
  // foto delle guide (SPEC §10): assets/img/guide/<guideId>-<hash URL>.webp, a mano come sopra; check_site.py segnala
  // le foto usate in guides.json che mancano qui e i file orfani
  'assets/img/guide/cena-compleanno-kyoto-004958f7.webp',
  'assets/img/guide/cena-compleanno-kyoto-03bea6f3.webp',
  'assets/img/guide/cena-compleanno-kyoto-055a029f.webp',
  'assets/img/guide/cena-compleanno-kyoto-0a68d028.webp',
  'assets/img/guide/cena-compleanno-kyoto-0aa5abff.webp',
  'assets/img/guide/cena-compleanno-kyoto-0cde6226.webp',
  'assets/img/guide/cena-compleanno-kyoto-0ef90384.webp',
  'assets/img/guide/cena-compleanno-kyoto-0f0dd028.webp',
  'assets/img/guide/cena-compleanno-kyoto-0f9d8eef.webp',
  'assets/img/guide/cena-compleanno-kyoto-13c229e0.webp',
  'assets/img/guide/cena-compleanno-kyoto-1438d89b.webp',
  'assets/img/guide/cena-compleanno-kyoto-14989925.webp',
  'assets/img/guide/cena-compleanno-kyoto-152bd406.webp',
  'assets/img/guide/cena-compleanno-kyoto-1934d06d.webp',
  'assets/img/guide/cena-compleanno-kyoto-1e41b52c.webp',
  'assets/img/guide/cena-compleanno-kyoto-1e9e7b4c.webp',
  'assets/img/guide/cena-compleanno-kyoto-224bbdfc.webp',
  'assets/img/guide/cena-compleanno-kyoto-24483c4c.webp',
  'assets/img/guide/cena-compleanno-kyoto-262eb7aa.webp',
  'assets/img/guide/cena-compleanno-kyoto-29ae084d.webp',
  'assets/img/guide/cena-compleanno-kyoto-29ee82ab.webp',
  'assets/img/guide/cena-compleanno-kyoto-2a46ab3f.webp',
  'assets/img/guide/cena-compleanno-kyoto-2b9737f0.webp',
  'assets/img/guide/cena-compleanno-kyoto-2cd47580.webp',
  'assets/img/guide/cena-compleanno-kyoto-320a2847.webp',
  'assets/img/guide/cena-compleanno-kyoto-37372d85.webp',
  'assets/img/guide/cena-compleanno-kyoto-394b1824.webp',
  'assets/img/guide/cena-compleanno-kyoto-3c7be5bf.webp',
  'assets/img/guide/cena-compleanno-kyoto-3c7c86ca.webp',
  'assets/img/guide/cena-compleanno-kyoto-400059ea.webp',
  'assets/img/guide/cena-compleanno-kyoto-40957e4e.webp',
  'assets/img/guide/cena-compleanno-kyoto-42b0b72b.webp',
  'assets/img/guide/cena-compleanno-kyoto-42d60105.webp',
  'assets/img/guide/cena-compleanno-kyoto-44ca209c.webp',
  'assets/img/guide/cena-compleanno-kyoto-457dbdb5.webp',
  'assets/img/guide/cena-compleanno-kyoto-468f4e28.webp',
  'assets/img/guide/cena-compleanno-kyoto-4dfada3e.webp',
  'assets/img/guide/cena-compleanno-kyoto-523fd730.webp',
  'assets/img/guide/cena-compleanno-kyoto-5611ac56.webp',
  'assets/img/guide/cena-compleanno-kyoto-59202fad.webp',
  'assets/img/guide/cena-compleanno-kyoto-59ec7c0e.webp',
  'assets/img/guide/cena-compleanno-kyoto-5aa3f72d.webp',
  'assets/img/guide/cena-compleanno-kyoto-5c110eba.webp',
  'assets/img/guide/cena-compleanno-kyoto-5c815de6.webp',
  'assets/img/guide/cena-compleanno-kyoto-5ea39d01.webp',
  'assets/img/guide/cena-compleanno-kyoto-5fbfa70c.webp',
  'assets/img/guide/cena-compleanno-kyoto-67ba3523.webp',
  'assets/img/guide/cena-compleanno-kyoto-6ae95df2.webp',
  'assets/img/guide/cena-compleanno-kyoto-6b4aafe2.webp',
  'assets/img/guide/cena-compleanno-kyoto-6cbd973f.webp',
  'assets/img/guide/cena-compleanno-kyoto-6d8154cb.webp',
  'assets/img/guide/cena-compleanno-kyoto-728a653e.webp',
  'assets/img/guide/cena-compleanno-kyoto-744970d6.webp',
  'assets/img/guide/cena-compleanno-kyoto-755f0710.webp',
  'assets/img/guide/cena-compleanno-kyoto-75aa72a2.webp',
  'assets/img/guide/cena-compleanno-kyoto-764809dc.webp',
  'assets/img/guide/cena-compleanno-kyoto-779a9441.webp',
  'assets/img/guide/cena-compleanno-kyoto-7b373db4.webp',
  'assets/img/guide/cena-compleanno-kyoto-7c7ad05f.webp',
  'assets/img/guide/cena-compleanno-kyoto-835129d9.webp',
  'assets/img/guide/cena-compleanno-kyoto-83eee99e.webp',
  'assets/img/guide/cena-compleanno-kyoto-841f2fe9.webp',
  'assets/img/guide/cena-compleanno-kyoto-8af486b9.webp',
  'assets/img/guide/cena-compleanno-kyoto-8cb8db75.webp',
  'assets/img/guide/cena-compleanno-kyoto-8e97b8c1.webp',
  'assets/img/guide/cena-compleanno-kyoto-91469975.webp',
  'assets/img/guide/cena-compleanno-kyoto-95b7f3d0.webp',
  'assets/img/guide/cena-compleanno-kyoto-95fffee9.webp',
  'assets/img/guide/cena-compleanno-kyoto-9fa44862.webp',
  'assets/img/guide/cena-compleanno-kyoto-a21f84d0.webp',
  'assets/img/guide/cena-compleanno-kyoto-a35449ce.webp',
  'assets/img/guide/cena-compleanno-kyoto-a4409a94.webp',
  'assets/img/guide/cena-compleanno-kyoto-aae3c623.webp',
  'assets/img/guide/cena-compleanno-kyoto-ad263258.webp',
  'assets/img/guide/cena-compleanno-kyoto-af367c6b.webp',
  'assets/img/guide/cena-compleanno-kyoto-b0387bb3.webp',
  'assets/img/guide/cena-compleanno-kyoto-b1e6f6b3.webp',
  'assets/img/guide/cena-compleanno-kyoto-b445bce7.webp',
  'assets/img/guide/cena-compleanno-kyoto-b54cccbe.webp',
  'assets/img/guide/cena-compleanno-kyoto-b620f802.webp',
  'assets/img/guide/cena-compleanno-kyoto-b73e178d.webp',
  'assets/img/guide/cena-compleanno-kyoto-baa04e01.webp',
  'assets/img/guide/cena-compleanno-kyoto-c01b0de6.webp',
  'assets/img/guide/cena-compleanno-kyoto-c302e186.webp',
  'assets/img/guide/cena-compleanno-kyoto-c4cf1c7c.webp',
  'assets/img/guide/cena-compleanno-kyoto-c5f2df7e.webp',
  'assets/img/guide/cena-compleanno-kyoto-cbfa88dd.webp',
  'assets/img/guide/cena-compleanno-kyoto-d14dc47c.webp',
  'assets/img/guide/cena-compleanno-kyoto-d2ca59a8.webp',
  'assets/img/guide/cena-compleanno-kyoto-db62897d.webp',
  'assets/img/guide/cena-compleanno-kyoto-e1286907.webp',
  'assets/img/guide/cena-compleanno-kyoto-e29e70b2.webp',
  'assets/img/guide/cena-compleanno-kyoto-e3fc63be.webp',
  'assets/img/guide/cena-compleanno-kyoto-e6c9ee68.webp',
  'assets/img/guide/cena-compleanno-kyoto-e804a542.webp',
  'assets/img/guide/cena-compleanno-kyoto-e84a0047.webp',
  'assets/img/guide/cena-compleanno-kyoto-e9608443.webp',
  'assets/img/guide/cena-compleanno-kyoto-e9a0ac3c.webp',
  'assets/img/guide/cena-compleanno-kyoto-f1905433.webp',
  'assets/img/guide/cena-compleanno-kyoto-f1ca4ef3.webp',
  'assets/img/guide/cena-compleanno-kyoto-f66ddb92.webp',
  'assets/img/guide/cena-compleanno-kyoto-f6a0a2ca.webp',
  'assets/img/guide/cena-compleanno-kyoto-f7c527ca.webp',
  'assets/img/guide/cena-compleanno-kyoto-fa106c3f.webp',
  'assets/img/guide/cena-compleanno-kyoto-fb12f1ba.webp',
  'assets/img/guide/cena-compleanno-kyoto-fb59df94.webp',
  'assets/img/guide/cena-compleanno-kyoto-fbe33191.webp',
  'assets/img/guide/cena-compleanno-kyoto-fea1ed8a.webp',
  'assets/img/guide/cena-compleanno-kyoto-fecb7f32.webp',
  'assets/img/guide/lovelive-numazu-0c3eb103.webp',
  'assets/img/guide/lovelive-numazu-0cb8d277.webp',
  'assets/img/guide/lovelive-numazu-0e58e893.webp',
  'assets/img/guide/lovelive-numazu-12359541.webp',
  'assets/img/guide/lovelive-numazu-15fa8707.webp',
  'assets/img/guide/lovelive-numazu-22d7e95a.webp',
  'assets/img/guide/lovelive-numazu-232eb9f7.webp',
  'assets/img/guide/lovelive-numazu-320de74d.webp',
  'assets/img/guide/lovelive-numazu-3620fc3c.webp',
  'assets/img/guide/lovelive-numazu-4005f769.webp',
  'assets/img/guide/lovelive-numazu-60761972.webp',
  'assets/img/guide/lovelive-numazu-65d77a4f.webp',
  'assets/img/guide/lovelive-numazu-66f14074.webp',
  'assets/img/guide/lovelive-numazu-68495a4d.webp',
  'assets/img/guide/lovelive-numazu-6dfeda00.webp',
  'assets/img/guide/lovelive-numazu-7247dfc7.webp',
  'assets/img/guide/lovelive-numazu-743dcede.webp',
  'assets/img/guide/lovelive-numazu-76efcad4.webp',
  'assets/img/guide/lovelive-numazu-789e8dbe.webp',
  'assets/img/guide/lovelive-numazu-7ef55b2e.webp',
  'assets/img/guide/lovelive-numazu-87bc7680.webp',
  'assets/img/guide/lovelive-numazu-88d2c952.webp',
  'assets/img/guide/lovelive-numazu-8968b2ec.webp',
  'assets/img/guide/lovelive-numazu-8f582df2.webp',
  'assets/img/guide/lovelive-numazu-9df18627.webp',
  'assets/img/guide/lovelive-numazu-9f6f8456.webp',
  'assets/img/guide/lovelive-numazu-a17642ca.webp',
  'assets/img/guide/lovelive-numazu-a2ed5637.webp',
  'assets/img/guide/lovelive-numazu-a3fa7228.webp',
  'assets/img/guide/lovelive-numazu-abcba852.webp',
  'assets/img/guide/lovelive-numazu-adb3a335.webp',
  'assets/img/guide/lovelive-numazu-b1806719.webp',
  'assets/img/guide/lovelive-numazu-bae3f40e.webp',
  'assets/img/guide/lovelive-numazu-c9b98183.webp',
  'assets/img/guide/lovelive-numazu-d308ac38.webp',
  'assets/img/guide/lovelive-numazu-d88f08bd.webp',
  'assets/img/guide/lovelive-numazu-d8b3859e.webp',
  'assets/img/guide/lovelive-numazu-e82a43bc.webp',
  'assets/img/guide/lovelive-numazu-f641eef4.webp',
  'assets/img/guide/lovelive-numazu-f70259f3.webp',
  'assets/img/guide/lovelive-numazu-f7121ffc.webp',
  'assets/img/guide/lovelive-numazu-f980b600.webp',
];
// PRECACHE-END

// JSON precaricati (best effort) così l'app funziona offline già dalla prima visita.
// DATA-BEGIN
const DATA_FILES = ['trip', 'agenda', 'transport', 'lodging', 'places', 'budget', 'guides', 'place-details'].map((n) => `data/${n}.json`);
// DATA-END

const BASE = new URL('./', self.location).href;
const IS_LOCAL = ['localhost', '127.0.0.1', '[::1]'].includes(self.location.hostname);

// Aggiunge uno per uno: un file mancante non fa fallire l'installazione (viene solo loggato).
async function addAllSafe(cacheName, paths) {
  const cache = await caches.open(cacheName);
  await Promise.all(paths.map(async (p) => {
    const url = new URL(p, BASE).href;
    try {
      const res = await fetch(url, { cache: 'reload' });
      if (res.ok) await cache.put(url, res);
      else console.warn('[sw] precache', res.status, p);
    } catch (e) { console.warn('[sw] precache fallito', p, e); }
  }));
}

self.addEventListener('install', (event) => {
  event.waitUntil(Promise.all([addAllSafe(STATIC_CACHE, PRECACHE), addAllSafe(DATA_CACHE, DATA_FILES)]).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('giappone-') && k !== STATIC_CACHE && k !== DATA_CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    clients.forEach((c) => c.postMessage({ type: 'SW_ACTIVATED', version: CACHE_VERSION }));
  })());
});

async function networkFirst(req, cacheName, ignoreSearch = false) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch (e) {
    const hit = await cache.match(req, { ignoreSearch });
    if (hit) return hit;
    if (req.mode === 'navigate') {
      const fb = await caches.match(new URL('index.html', BASE).href);
      if (fb) return fb;
    }
    throw e;
  }
}

async function cacheFirst(req, ignoreSearch) {
  const hit = await caches.match(req, { ignoreSearch });
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (res.ok && res.type === 'basic') {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(req, res.clone());
    }
    return res;
  } catch (e) {
    if (req.mode === 'navigate') {
      const fb = await caches.match(new URL('index.html', BASE).href);
      if (fb) return fb;
    }
    throw e;
  }
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || !url.href.startsWith(BASE)) return; // esterni (Maps ecc.): rete
  const path = url.href.slice(BASE.length);
  if (path.startsWith('dev/')) return; // dev/ e fixture: mai in cache
  const isPage = req.mode === 'navigate';

  if (path.startsWith('data/') && path.endsWith('.json')) {
    event.respondWith(networkFirst(req, DATA_CACHE));
  } else if (IS_LOCAL) {
    // sviluppo: sempre la versione fresca, cache solo come fallback offline
    event.respondWith(networkFirst(req, STATIC_CACHE, isPage));
  } else {
    // le pagine ignorano la query (giorno.html?d=… → giorno.html in cache)
    event.respondWith(cacheFirst(req, isPage));
  }
});
