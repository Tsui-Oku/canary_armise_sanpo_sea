// 一度開くと、ネットがなくても遊べるように、ファイルを端末に保存する
const CACHE = 'walk3d-v3';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE).then(() => c.add('music/tracks.json').catch(() => {}))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url); if (u.origin !== location.origin) return;
  // 曲の一覧：ネットがつながるときは最新を、つながらないときは保存したものを
  if (u.pathname.endsWith('/music/tracks.json')) {
    e.respondWith(fetch(r).then(res => { const c = res.clone(); caches.open(CACHE).then(x => x.put(r, c)); return res; }).catch(() => caches.match(r)));
    return;
  }
  // 曲のファイル：一度ひらいた曲は、保存して次からすぐ・オフラインでも流す
  e.respondWith(caches.match(r, { ignoreSearch: true }).then(hit => hit || fetch(r).then(res => {
    if (res.ok && res.status === 200) { const c = res.clone(); caches.open(CACHE).then(x => x.put(r, c)); }
    return res;
  }).catch(() => (r.mode === 'navigate' ? caches.match('index.html') : Response.error()))));
});
