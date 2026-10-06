/* Provinha · Tia Irene — versão 30
   (cadastro nome + 8 bichinhos · histórico completo de provas na nuvem Firebase ·
    folha "Questões para praticar" · tela sempre acesa · convite para instalar)
   Ao publicar uma versão nova, troque o número abaixo (v30 -> v31 ...). */
const C='provinha-v30';
const FILES=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-512-maskable.png','./nuvem-sync.js','./escola-pwa.js'];
/* nuvem-config.js é buscado sempre na internet primeiro (se o Pedro
   trocar a configuração, os celulares pegam a nova na hora) */
const REDE_PRIMEIRO=['nuvem-config.js'];
/* fontes do Google: guardadas para funcionar sem internet */
const FONTES=['fonts.googleapis.com','fonts.gstatic.com'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>
  c.addAll(FILES).then(()=>c.add('./nuvem-config.js').catch(()=>{}))
).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  const url=new URL(e.request.url);
  if(url.origin!==self.location.origin){
    /* conversa com o Firebase (outro endereço): nunca guardar, sempre direto na internet */
    if(FONTES.indexOf(url.hostname)<0) return;
    e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(n=>{
      if(n&&(n.ok||n.type==='opaque')){const cl=n.clone(); caches.open(C).then(c=>c.put(e.request,cl));}
      return n;
    })));
    return;
  }
  if(REDE_PRIMEIRO.some(n=>url.pathname.endsWith('/'+n))){
    e.respondWith(fetch(e.request).then(n=>{
      if(n&&n.ok){const cl=n.clone(); caches.open(C).then(c=>c.put(e.request,cl));}
      return n;
    }).catch(()=>caches.match(e.request,{ignoreSearch:true})));
    return;
  }
  e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(r=>r||fetch(e.request).then(n=>{
    if(n&&n.ok){const cl=n.clone(); caches.open(C).then(c=>c.put(e.request,cl));}
    return n;
  }).catch(()=>caches.match('./index.html'))));
});
