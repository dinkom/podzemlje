// Podzemlje — service worker
// Mreža prvo: pri svakom otvaranju igra uzme najnovije datoteke s GitHub Pagesa.
// Spremljena kopija služi samo kad nema interneta (ili mreža ne odgovori u 4 s).
const VERSION = 'podzemlje-v10';
const FILES = [
  './', './index.html', './manifest.webmanifest',
  './lib/phaser.min.js',
  './js/sfx.js', './js/art.js', './js/tiles.js', './js/level.js', './js/suma.js', './js/game.js', './js/ui.js', './js/main.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION)
    .then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('podzemlje-') && k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 4000);
      // no-cache: uvijek pitaj server ima li novije (nepromijenjene datoteke vrate brzi 304)
      const res = await fetch(req, { cache: 'no-cache', signal: ctrl.signal });
      clearTimeout(t);
      if (res.ok) cache.put(req, res.clone());
      return res;
    } catch (err) {
      const hit = await cache.match(req, { ignoreSearch: true });
      return hit || Response.error();
    }
  })());
});
