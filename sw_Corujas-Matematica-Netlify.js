const C = 'corujas-matematica-v12';
const FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './nuvem-sync.js',
  './escola-pwa.js',
  './nuvem-config.js',
  './gsap.min.js',
];
// nuvem-config.js é sempre buscado da internet primeiro (network-first):
// assim, se o Pedro precisar trocar o código da família ou a config do
// Firebase, basta atualizar esse arquivo no Netlify — o app pega a versão
// nova na próxima vez que abrir com internet, sem precisar publicar tudo
// de novo. Se estiver offline, cai para a cópia guardada no cache.
const NETWORK_FIRST = ['nuvem-config.js'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(C)
      .then((c) => c.addAll(FILES))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== C).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  const isNetworkFirst = NETWORK_FIRST.some((name) => e.request.url.includes(name));

  if (isNetworkFirst) {
    e.respondWith(
      fetch(e.request)
        .then((n) => {
          if (n && n.ok) {
            const cl = n.clone();
            caches.open(C).then((c) => c.put(e.request, cl));
          }
          return n;
        })
        .catch(() => caches.match(e.request, { ignoreSearch: true })),
    );
    return;
  }

  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(
      (r) =>
        r ||
        fetch(e.request)
          .then((n) => {
            if (n && n.ok) {
              const cl = n.clone();
              caches.open(C).then((c) => c.put(e.request, cl));
            }
            return n;
          })
          .catch(() => caches.match('./index.html')),
    ),
  );
});
