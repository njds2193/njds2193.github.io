// sw.js - Service Worker

// Nombre de la caché actualizado a v4 para optimización Android
const CACHE_NAME = 'agenda-pwa-cache-v4';

// Lista de archivos optimizada para Android
const urlsToCache = [
  '/',                      // Ruta raíz
  'index.html',             // Archivo HTML principal
  'manifest.json',          // El manifiesto de la aplicación
  'images/icon-192x192.png',// Icono de la PWA
  'images/icon-512x512.png', // Otro icono de la PWA
  'https://cdn.tailwindcss.com', // Tailwind CSS para estilos offline
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap' // Fuente Inter
];

// Evento 'install': se dispara cuando el Service Worker se instala por primera vez.
self.addEventListener('install', event => {
  console.log('Service Worker: Instalando v4 para Android...');
  event.waitUntil(
    caches.open(CACHE_NAME) 
      .then(cache => {
        console.log('Service Worker: Abriendo caché v4 y añadiendo archivos principales:', urlsToCache);
        // Manejo de errores individuales al cachear
        return Promise.all(
            urlsToCache.map(url => {
                return cache.add(url).catch(error => {
                    console.error(`Service Worker: Falló al cachear ${url}`, error);
                });
            })
        );
      })
      .then(() => {
        console.log('Service Worker: Archivos principales cacheados en v4.');
        return self.skipWaiting(); // Activar nuevo SW inmediatamente
      })
      .catch(error => {
        console.error('Service Worker: Falló la instalación general v4:', error);
      })
  );
});

// Evento 'activate': se dispara después de que el SW se instala y está listo para tomar control.
self.addEventListener('activate', event => {
  console.log('Service Worker: Activando v4 para Android...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          // Eliminar cachés antiguas que no coincidan con CACHE_NAME actual
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Borrando caché antigua:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activado v4 y cachés antiguas limpiadas.');
      return self.clients.claim(); // Tomar control inmediato
    })
  );
});

// Evento 'fetch': intercepta las solicitudes de red.
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return; // Solo manejar solicitudes GET
  }

  // Estrategia: Network Falling Back to Cache para navegación HTML
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(networkResponse => {
          // Cachear la respuesta válida de la red
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Si la red falla, intentar desde la caché
          console.log('Service Worker: Red falló para navegación, intentando caché:', event.request.url);
          return caches.match(event.request);
        })
    );
  } else {
    // Estrategia: Cache First para otros recursos (CSS, JS, imágenes, etc.)
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse; // Servir desde caché si existe
          }
          // Si no está en caché, ir a la red
          return fetch(event.request).then(
            networkResponse => {
              // Cachear la respuesta válida
              if (networkResponse && networkResponse.status === 200) {
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => {
                  cache.put(event.request, responseToCache);
                });
              }
              return networkResponse;
            }
          ).catch(error => {
            console.error('Service Worker: Error al buscar recurso (no navegación):', error, event.request.url);
            // Devolver una respuesta de error genérica
            return new Response("Recurso no disponible offline.", {
              status: 404, statusText: "Not Found", headers: { 'Content-Type': 'text/plain' }
            });
          });
        })
    );
  }
});

// Evento para manejar mensajes del cliente
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
