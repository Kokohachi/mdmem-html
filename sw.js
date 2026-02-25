const CACHE_NAME = 'anki-note-v1';

// キャッシュするファイル（配列の安全な書き方を採用）
const STATIC_ASSETS = new Array(
    './',
    './index.html',
    './manifest.json',
    './icon.png'
);

// インストール時にアプリ本体を保存
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
    );
    self.skipWaiting();
});

// 古いキャッシュを削除
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

// オフライン時は保存したデータ（キャッシュ）を返す
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(event.request).then((networkResponse) => {
                // TailwindやVueなどのCDNファイルも自動的にキャッシュに保存する
                if (event.request.url.startsWith('http')) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // オフラインで未キャッシュのものにアクセスした時の安全策
                console.log('Offline: cannot load ' + event.request.url);
            });
        })
    );
});
