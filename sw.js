// Офлайн: игра запоминается в телефоне. Сначала свежая версия из сети, без сети — из памяти.
const CACHE = 'moto-stunt-v1';
const CORE = ['./', 'index.html', 'style.css', 'manifest.json', 'icon-192.png', 'icon-512.png',
  'js/data.js', 'js/physics.js', 'js/draw.js', 'js/audio.js', 'js/game.js', 'js/ui.js', 'music/menu.m4a'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  const music = url.pathname.includes('/music/');
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (music) { const hit = await cache.match(req, { ignoreSearch: true }); if (hit) return hit; }
    try {
      const res = await fetch(req);
      if (res.ok && !req.headers.has('range')) cache.put(req, res.clone()).catch(() => {});
      return res;
    } catch (err) {
      const hit = await cache.match(req, { ignoreSearch: true }) || (req.mode === 'navigate' && await cache.match('index.html'));
      if (hit) return hit;
      throw err;
    }
  })());
});
