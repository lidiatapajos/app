const CACHE_NAME = 'boletos-app-v1';
const urlsToCache = [
  './',
  './login.html',
  './login.css',
  './home.html',
  './home.css',
  './app.js',
  './adm.html',
  './adm.css',
  './adm.js',
  './boletos.html',
  './configurar-boletos.html',
  './configurar-boletos.js',
  './manifest.json',
  './escola.png',
  // Inclua outros arquivos relevantes, como favicon ou ícones se existirem
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
