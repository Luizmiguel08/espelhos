/* Service worker dos Espelhos de Vendas 3.0: abre sem internet, guarda as fotos das fichas e mostra os avisos de venda,
   reserva e buscas salvas. A casca é a do app do corretor; os avisos são os mesmos do app anterior. */
const VERSAO = 'espelhos-casca-b2bbf50d6d';
const FOTOS = 'espelhos-fotos';
const MAX_FOTOS = 250;
const CASCA = [
  './', 'index.html', 'app.css?v=b2bbf50d6d', 'app.js?v=b2bbf50d6d', 'manifest.webmanifest', 'fonts/mona-sans.woff2',
  'img/logo-fortal.png', 'icons/icon-192.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-64.png'
];
const ESCOPO = new URL('./', self.location).pathname;

self.addEventListener('install', ev => {
  ev.waitUntil(caches.open(VERSAO).then(c => c.addAll(CASCA)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', ev => {
  // só mexe nos caches deste app (o do corretor, no mesmo site, usa o prefixo corretor-)
  ev.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('espelhos-') && k !== VERSAO && k !== FOTOS).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

async function aparar(){
  const c = await caches.open(FOTOS), ks = await c.keys();
  for(let i = 0; i < ks.length - MAX_FOTOS; i++) await c.delete(ks[i]);
}

self.addEventListener('fetch', ev => {
  const req = ev.request;
  if(req.method !== 'GET') return;                       // consultas ao servidor (POST) passam direto
  const url = new URL(req.url);
  if(url.origin === location.origin && url.pathname.startsWith(ESCOPO)){
    const rel = url.pathname.slice(ESCOPO.length);
    if(req.mode === 'navigate'){
      // só a casca do app: a página do cliente (s.html), a central (nex/) e a versão anterior passam direto
      if(rel !== '' && rel !== 'index.html') return;
      ev.respondWith(fetch(req).then(r => { if(r.ok){ const cp = r.clone(); ev.waitUntil(caches.open(VERSAO).then(c => c.put('index.html', cp))); } return r; })
        .catch(() => caches.match('index.html', {ignoreSearch: true}).then(r => r || Response.error())));
      return;
    }
    if(/^(app\.(css|js)|manifest\.webmanifest|fonts\/|icons\/|img\/)/.test(rel)){
      ev.respondWith(caches.match(req).then(r => r || fetch(req).then(res => {
        if(res.ok){ const cp = res.clone(); caches.open(VERSAO).then(c => c.put(req, cp)); }
        return res;
      })));
      return;
    }
    // fotos e fichas da central (nex/): usa a salva e atualiza por trás; a ficha (json) prefere a da rede
    if(/^nex\//.test(rel) && /\.(jpg|jpeg|png|webp|json)$/i.test(url.pathname)){
      ev.respondWith(caches.open(FOTOS).then(async c => {
        const salvo = await c.match(req);
        const rede = fetch(req).then(res => { if(res.ok){ c.put(req, res.clone()).then(aparar); } return res; }).catch(() => salvo || Response.error());
        if(/\.json$/i.test(url.pathname)) return rede;
        if(salvo){ ev.waitUntil(rede.catch(() => {})); return salvo; }
        return rede;
      }));
    }
    return;
  }
  if(url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com'){   // versão anterior do app
    ev.respondWith(caches.match(req).then(m => m || fetch(req).then(r => { const cp = r.clone(); caches.open(VERSAO).then(c => c.put(req, cp)); return r; })));
  }
});

// ---- avisos (mesmo formato do servidor: {title, body, tag, url, projeto})
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { title: 'Espelhos de Vendas', body: e.data ? e.data.text() : '' }; }
  e.waitUntil((async () => {
    await self.registration.showNotification(d.title || 'Espelhos de Vendas', {
      body: d.body || '',
      icon: './icons/icon-192.png',
      badge: './icons/badge-96.png',
      tag: d.tag || undefined,
      renotify: !!d.tag,
      data: { url: d.url || './', projeto: d.projeto || null },
    });
    const cs = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    cs.forEach(c => c.postMessage({ tipo: 'atualizar' }));
  })());
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const alvo = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope);
  const raiz = new URL('./', self.registration.scope).pathname;
  const doApp = p => p === raiz || p === raiz + 'index.html';
  e.waitUntil((async () => {
    const cs = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const mesmo = cs.find(c => { try { return new URL(c.url).pathname === alvo.pathname; } catch (_) { return false; } })
      || (doApp(alvo.pathname) ? cs.find(c => { try { return doApp(new URL(c.url).pathname); } catch (_) { return false; } }) : null);
    if (mesmo) {
      await mesmo.focus();
      mesmo.postMessage({ tipo: 'abrir', url: alvo.href });
      return;
    }
    await self.clients.openWindow(alvo.href);
  })());
});
