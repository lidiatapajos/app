const CACHE_NAME = 'PassPay-cache-v1';
caches.open(CACHE_NAME).then(async cache => {
  for (const url of urlsToCache) {
    try {
      await cache.add(url);
      console.log('✅ Cache OK:', url);
    } catch (e) {
      console.error('❌ Falha no cache:', url, e);
    }
  }
});

const urlsToCache = [
  '/',
  'index.html',
  'home.html',
  'editar-contato.html',
  'adm.html',
  'comprovantes.html',
  'configurar-boletos.html',
  'manifest.json',
  'public/css/adm.css',
  'public/css/home.css',
  'public/css/login.css',
  'public/app.min.js',
  'public/adm.min.js',
  'public/adm.js',
  'public/img/icon-192.png',
  'public/img/icon-512.png',
  'public/screenshots/home.png',
  'public/screenshots/tela-login.png'
];



// Instalando o service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Ativando e limpando caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

// Servindo os arquivos do cache
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    }).catch(() => {
      // Se offline e não achou no cache, pode retornar uma página fallback
    })
  );
});
