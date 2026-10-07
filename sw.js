// Espelhos de Vendas — service worker (app offline + notificações)
const V = 'espelhos-202610071818';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './badge-96.png', './favicon-64.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('espelhos-') && k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

const ESCOPO = new URL('./', self.location).pathname;

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (u.origin === self.location.origin) {
    const rel = u.pathname.startsWith(ESCOPO) ? u.pathname.slice(ESCOPO.length) : u.pathname;
    if (rel.includes('/')) return;                       // subpastas (ex.: nex/) não são do app: não guarda nem intercepta
    if (req.mode === 'navigate') {
      if (rel !== '' && rel !== 'index.html') return;
      e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(V).then(c => c.put('./index.html', cp)); return r; })
        .catch(() => caches.match('./index.html')));
      return;
    }
    e.respondWith(caches.match(req).then(m => {
      const net = fetch(req).then(r => { if (r.ok) { const cp = r.clone(); caches.open(V).then(c => c.put(req, cp)); } return r; }).catch(() => m);
      return m || net;
    }));
    return;
  }
  if (u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.match(req).then(m => m || fetch(req).then(r => { const cp = r.clone(); caches.open(V).then(c => c.put(req, cp)); return r; })));
  }
});

self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { title: 'Espelhos de Vendas', body: e.data ? e.data.text() : '' }; }
  e.waitUntil((async () => {
    await self.registration.showNotification(d.title || 'Espelhos de Vendas', {
      body: d.body || '',
      icon: './icon-192.png',
      badge: './badge-96.png',
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
    const mesma = cs.find(c => { const p = new URL(c.url).pathname; return p === alvo.pathname || (doApp(p) && doApp(alvo.pathname)); });
    if (mesma) { await mesma.focus(); mesma.postMessage({ tipo: 'abrir', url: alvo.href }); return; }
    await self.clients.openWindow(alvo.href);
  })());
});
