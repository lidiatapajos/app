const CACHE_NAME = 'PassPay-cache-v1';
const urlsToCache = [
  './',
  './view/index.html',
  './view/home.html',
  './view/editar-contato.html',
  './view/adm.html',
  './view/comprovantes.html',
  './view/configurar-boletos.html',
  './view/manifest.json',
  './api/server.js',
  './public/css/adm.css',
  './public/css/home.css',
  './public/css/login.css',
  './public/app.min.js',
  './public/utils.js',
  './public/utils/tutorial.js',
  './publicc/adm.min.js',
  './public/home.min.js',
  './public/adm.js',
  './public/img/icon-192.png',
  './public/img/icon-512.png',
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
