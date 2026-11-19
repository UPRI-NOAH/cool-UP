/* ================================================================
   Cool UP — Service worker
   - App shell + heat-relief data: precached, stale-while-revalidate
   - Leaflet from the CDN: cached on first use
   - Map tiles: cached as you browse (capped), so visited areas work offline
   Bump VERSION whenever app files change so clients pick up the update.
================================================================ */
const VERSION = 'v1';
const SHELL_CACHE = `coolup-shell-${VERSION}`;
const CDN_CACHE   = 'coolup-cdn';
const TILE_CACHE  = 'coolup-tiles';
const MAX_TILES   = 400;

const SHELL = [
  './',
  'index.html',
  'css/style.css',
  'js/config.js',
  'js/app.js',
  'data/heat-relief.js',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/favicon-32.png',
];

// Must match the <script>/<link> tags in index.html
const CDN = [
  'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css',
  'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js',
  'https://cdn.jsdelivr.net/npm/leaflet.markercluster@1.5.3/dist/MarkerCluster.css',
  'https://cdn.jsdelivr.net/npm/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css',
  'https://cdn.jsdelivr.net/npm/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(Promise.all([
    caches.open(SHELL_CACHE).then((c) => c.addAll(SHELL)),
    // CDN failures shouldn't block install; they'll be cached on next use
    caches.open(CDN_CACHE).then((c) => c.addAll(CDN)).catch(() => {}),
  ]));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter((k) => k.startsWith('coolup-shell-') && k !== SHELL_CACHE)
      .map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.hostname.endsWith('tile.openstreetmap.org')) {
    event.respondWith(tileFirst(req));
  } else if (url.hostname === 'cdn.jsdelivr.net') {
    event.respondWith(cacheFirst(req, CDN_CACHE));
  } else if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(req));
  }
});

async function staleWhileRevalidate(req) {
  const cache = await caches.open(SHELL_CACHE);
  // Navigations with query strings (e.g. ?source=pwa) should still hit the cached page
  const cached = await cache.match(req, { ignoreSearch: req.mode === 'navigate' });
  const network = fetch(req)
    .then((res) => { if (res.ok) cache.put(req, res.clone()); return res; })
    .catch(() => null);
  return cached || (await network) || new Response('Offline', { status: 503 });
}

async function cacheFirst(req, name) {
  const cache = await caches.open(name);
  const cached = await cache.match(req);
  if (cached) return cached;
  const res = await fetch(req);
  if (res.ok) cache.put(req, res.clone());
  return res;
}

async function tileFirst(req) {
  const cache = await caches.open(TILE_CACHE);
  const cached = await cache.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res.ok) {
      await cache.put(req, res.clone());
      trimTiles(cache);
    }
    return res;
  } catch (_) {
    return new Response('', { status: 504 });
  }
}

async function trimTiles(cache) {
  const keys = await cache.keys();
  // Cache keys come back in insertion order, so drop the oldest first
  for (let i = 0; i < keys.length - MAX_TILES; i++) await cache.delete(keys[i]);
}
