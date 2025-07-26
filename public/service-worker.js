const CACHE_NAME = 'boletos-app-v1';
const urlsToCache = [
  './',
  './public/index.html',
  './public/home.html',
  './public/editar-contato.html',
  './public/adm.html',
  ';/public/comprovantes.html',
  './public/configurar-boletos.html',
  './public/css/adm.css',
  './public/css/home.css',
  './public/css/login.css',
  './public/css/editar-contato.css',
  './public/app.js',
  './public/home.js',
  './public/adm.js',
  './public/manifest.json',
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
