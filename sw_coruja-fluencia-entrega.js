/* Coruja Fluência — service worker
   v1.4: relatório de fluência revisado — mostra e salva também as
   palavras lidas corretamente (OK), além das já existentes (silabou,
   ainda não, pulou), na tela, no PDF e na nuvem, pros 3 tipos de teste
   (palavras reais, pseudopalavras e frases).
   v1.3: nuvem (Firebase) — inclui nuvem-sync.js e escola-pwa.js no
   precache, busca nuvem-config.js sempre na internet primeiro (se a
   família trocar o código, os celulares pegam a versão nova na hora)
   e nunca guarda/intercepta pedidos pra outro endereço (Firebase). */
const CACHE = "coruja-fluencia-v1.4";
const ARQUIVOS = [
  "./", "./index.html", "./manifest.webmanifest",
  "./icon-192.png", "./icon-512.png", "./icon-512-maskable.png",
  "./nuvem-sync.js", "./escola-pwa.js",
];
/* nuvem-config.js é buscado sempre na internet primeiro */
const REDE_PRIMEIRO = ["nuvem-config.js"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ARQUIVOS).then(() => c.add("./nuvem-config.js").catch(() => {})))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((ks) =>
      Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);

  /* conversa com o Firebase (outro endereço): nunca guardar, sempre
     direto na internet */
  if (url.origin !== self.location.origin) return;

  if (REDE_PRIMEIRO.some((n) => url.pathname.endsWith("/" + n))) {
    e.respondWith(
      fetch(e.request).then((resp) => {
        if (resp && resp.ok) {
          const copia = resp.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copia));
        }
        return resp;
      }).catch(() => caches.match(e.request, { ignoreSearch: true }))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((r) => r || fetch(e.request).then((resp) => {
      const copia = resp.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copia)).catch(() => {});
      return resp;
    }).catch(() => caches.match("./index.html")))
  );
});
