/* Coruja Explica — versão 3.1
   (cadastro padrão nome + 8 bichinhos · nuvem Firebase · tela sempre acesa · convite para instalar) */
const C = 'coruja-explica-v3-1';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png',
               './nuvem-sync.js', './escola-pwa.js'];
/* nuvem-config.js é buscado sempre na internet primeiro (se o Pedro trocar a
   configuração, os celulares pegam a nova na hora); sem internet, vale a
   cópia guardada */
const REDE_PRIMEIRO = ['nuvem-config.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(C).then(cache =>
    cache.addAll(FILES).then(() => cache.add('./nuvem-config.js').catch(() => {}))
  ).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== C).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* A página principal (a navegação em si, o "./" e o index.html) usa
   "rede primeiro": sempre que há internet, busca a versão mais nova direto
   do Netlify e atualiza o cache. Só cai para a cópia salva no aparelho se a
   rede falhar de verdade — aí sim é o modo offline. Isso evita o problema
   clássico de PWA instalado: uma atualização "presa" mostrando a versão
   antiga. Ícones, manifesto e os arquivos compartilhados são "cache
   primeiro" para abrir mais rápido (mudam de versão junto com este arquivo). */
function ehPaginaPrincipal(req){
  if (req.mode === 'navigate') return true;
  var url = new URL(req.url);
  return url.pathname.endsWith('/') || url.pathname.endsWith('index.html');
}
/* Internet lenta (sinal fraco, Wi-Fi com login): se a resposta demorar mais
   que "espera", abre com a cópia guardada no aparelho e a busca continua por
   trás, atualizando a cópia para a próxima vez. Sem cópia guardada, espera a
   internet normalmente. */
function redePrimeiro(e, reserva, espera){
  let guardar = Promise.resolve();
  const rede = fetch(e.request).then(resp => {
    if (resp && resp.ok){ const copy = resp.clone(); guardar = caches.open(C).then(cache => cache.put(e.request, copy)); }
    return resp;
  });
  e.waitUntil(rede.then(() => guardar).catch(() => {}));
  const guardada = () => caches.match(e.request, { ignoreSearch: true })
    .then(c => c || (reserva ? caches.match(reserva) : undefined));
  e.respondWith(new Promise(resolve => {
    let feito = false;
    const entrega = r => { if (!feito && r){ feito = true; resolve(r); } };
    const t = setTimeout(() => { guardada().then(entrega); }, espera);
    rede.then(r => { clearTimeout(t); entrega(r); })
        .catch(() => { clearTimeout(t); guardada().then(c => { if (!feito){ feito = true; resolve(c || Response.error()); } }); });
  }));
}

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  /* conversa com o Firebase (outro endereço): nunca guardar, sempre direto
     na internet */
  if (url.origin !== self.location.origin) return;

  if (REDE_PRIMEIRO.some(n => url.pathname.endsWith('/' + n))){ redePrimeiro(e, null, 2500); return; }
  if (ehPaginaPrincipal(e.request)){ redePrimeiro(e, './index.html', 4000); return; }

  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        if (resp && resp.ok){ const copy = resp.clone(); caches.open(C).then(cache => cache.put(e.request, copy)); }
        return resp;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
