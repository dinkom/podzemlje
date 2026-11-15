// Podzemlje — service worker (povećaj VERSION kod svake izmjene datoteka)
const VERSION = 'podzemlje-v1';
const FILES = [
  './', './index.html', './manifest.webmanifest',
  './lib/phaser.min.js',
  './js/sfx.js', './js/art.js', './js/tiles.js', './js/level.js', './js/game.js', './js/ui.js', './js/main.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png',
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('podzemlje-') && k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request)));
});
