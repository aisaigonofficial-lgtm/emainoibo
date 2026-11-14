/* Êm Ái – Vận hành | Service Worker
   Chỉ cache phần vỏ giao diện. Mọi lời gọi API đều đi thẳng ra mạng,
   không bao giờ cache, để số liệu kho và đơn hàng luôn là mới nhất. */

const PHIEN_BAN = 'em-ai-v1';
const VO = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(PHIEN_BAN)
      .then(c => c.addAll(VO))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ds => Promise.all(ds.filter(k => k !== PHIEN_BAN).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;

  // Không đụng tới API Apps Script và mọi request không phải GET
  if (req.method !== 'GET') return;
  if (req.url.indexOf('script.google.com') > -1) return;
  if (req.url.indexOf('googleusercontent.com') > -1) return;

  // Trang: ưu tiên mạng để luôn lấy bản mới, hỏng mạng thì dùng bản đã lưu
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => {
          const ban = res.clone();
          caches.open(PHIEN_BAN).then(c => c.put('./index.html', ban));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Tài nguyên tĩnh: dùng bản đã lưu trước cho nhanh
  e.respondWith(
    caches.match(req).then(da => da || fetch(req).then(res => {
      if (res && res.status === 200 && res.type === 'basic') {
        const ban = res.clone();
        caches.open(PHIEN_BAN).then(c => c.put(req, ban));
      }
      return res;
    }).catch(() => da))
  );
});
