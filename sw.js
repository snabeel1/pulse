/* Pulse service worker — the "works with no signal" half of the brief.
   Precaches the entire app shell + data; serves cache-first so the app opens
   instantly with airplane mode on. Relative paths keep it working under a
   GitHub Pages project path. */

const CACHE = 'pulse-v5';
const SHELL = [
  './',
  './index.html',
  './css/styles.css',
  './js/data.js',
  './js/covers.js',
  './js/store.js',
  './js/live.js',
  './js/radar.js',
  './js/app.js',
  './manifest.webmanifest',
  './icons/icon.svg',
];
// Landmark photos are 4K (~35 MB total), so they are NOT precached — the
// runtime cache below stores each one the first time it scrolls into view,
// and the generated SVG art underneath covers anything unseen offline.

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const FONT_HOSTS = ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'];

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((hit) =>
      hit ||
      fetch(e.request).then((res) => {
        // Runtime-cache same-origin responses (and webfonts) so they work
        // offline on the next run. First offline visit falls back to the
        // system font stack — by design.
        const origin = new URL(e.request.url).origin;
        if (res.ok && (origin === location.origin || FONT_HOSTS.includes(origin))) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      }).catch(() => {
        // Offline fallback only for our own pages — a failed cross-origin
        // API call (e.g. map search) must fail, not masquerade as HTML.
        if (e.request.mode === 'navigate' || new URL(e.request.url).origin === location.origin)
          return caches.match('./index.html');
        return Response.error();
      })
    )
  );
});
