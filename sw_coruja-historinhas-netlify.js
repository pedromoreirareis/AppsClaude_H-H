/* Coruja — Historinhas · funcionamento offline
   Ao publicar uma versao nova, troque o numero da versao abaixo (v67 -> v68 ...).
   Isso faz o aparelho baixar os arquivos novos em vez de usar os antigos.

   v68: adiciona os 3 arquivos compartilhados da Escola São Pedro
   (nuvem-config.js, nuvem-sync.js, escola-pwa.js) — nuvem-config.js e
   buscado sempre na internet primeiro (rede-primeiro), para que uma troca
   de configuracao feita pelo Pedro chegue aos celulares sem precisar
   publicar o app de novo. As conversas com o Firebase (outro endereco)
   nunca passam pelo cache — vao sempre direto pela internet. */
const C = 'coruja-historinhas-v68';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png',
                './nuvem-sync.js', './escola-pwa.js'];
/* nuvem-config.js e buscado sempre na internet primeiro (se o Pedro trocar
   a configuracao, os celulares pegam a nova na hora) */
const REDE_PRIMEIRO = ['nuvem-config.js'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(C)
      .then(c => c.addAll(FILES).then(() => c.add('./nuvem-config.js').catch(() => {})))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  /* conversa com o Firebase (outro endereco): nunca guardar, sempre direto
     na internet — cachear isso quebraria o login/sincronizacao */
  if (url.origin !== self.location.origin) return;

  if (REDE_PRIMEIRO.some(n => url.pathname.endsWith('/' + n))) {
    e.respondWith(
      fetch(e.request).then(n => {
        if (n && n.ok) { const cl = n.clone(); caches.open(C).then(c => c.put(e.request, cl)); }
        return n;
      }).catch(() => caches.match(e.request, { ignoreSearch: true }))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(r =>
      r || fetch(e.request).then(n => {
        if (n && n.ok) { const cl = n.clone(); caches.open(C).then(c => c.put(e.request, cl)); }
        return n;
      }).catch(() => caches.match('./index.html'))
    )
  );
});
