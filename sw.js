// 一度開くと、ネットがなくても遊べるように、ファイルを端末に保存する
const SHELL = 'walk3d-v5';        // アプリ本体（新しくするときは、この番号を上げる）
const MUSIC = 'walk3d-music';     // 曲（アプリを新しくしても残す）
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(CORE)).then(() => caches.open(MUSIC)).then(c => c.add('music/tracks.json').catch(() => {})).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== SHELL && k !== MUSIC).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url); if (u.origin !== location.origin) return;
  const isMusic = u.pathname.includes('/music/');
  // 曲の一覧：ネットがつながるときは最新を、つながらないときは保存したものを
  if (u.pathname.endsWith('/music/tracks.json')) {
    e.respondWith(fetch(r).then(res => { const c = res.clone(); caches.open(MUSIC).then(x => x.put(r, c)); return res; }).catch(() => caches.match(r)));
    return;
  }
  e.respondWith(caches.match(r, { ignoreSearch: true }).then(hit => hit || fetch(r).then(res => {
    if (res.ok && res.status === 200) { const c = res.clone(); caches.open(isMusic ? MUSIC : SHELL).then(x => x.put(r, c)); }
    return res;
  }).catch(() => (r.mode === 'navigate' ? caches.match('index.html') : Response.error()))));
});
