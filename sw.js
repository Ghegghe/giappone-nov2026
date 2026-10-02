// sw.js — service worker del sito. Bumpare CACHE_VERSION a ogni deploy che cambia file statici.
const CACHE_VERSION = 'v4';
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
  'budget.html',
  '404.html',
  'manifest.webmanifest',
  'assets/css/base.css',
  'assets/css/agenda.css',
  'assets/css/pages.css',
  'assets/css/themes/washi.css',
  'assets/css/themes/neutral.css',
  'assets/css/themes/night.css',
  'assets/js/app.js',
  'assets/js/theme-boot.js',
  'assets/js/agenda.js',
  'assets/js/agenda-day.js',
  'assets/js/agenda-gaps.js',
  'assets/js/pages.js',
  'assets/js/pages-home.js',
  'assets/js/pages-trasporti.js',
  'assets/js/pages-alloggi.js',
  'assets/js/pages-luoghi.js',
  'assets/js/pages-budget.js',
  'assets/icons/sprite.svg',
  'assets/icons/favicon.svg',
  'assets/icons/icon.svg',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
];
// PRECACHE-END

// JSON precaricati (best effort) così l'app funziona offline già dalla prima visita.
// DATA-BEGIN
const DATA_FILES = ['trip', 'agenda', 'transport', 'lodging', 'places', 'budget'].map((n) => `data/${n}.json`);
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
