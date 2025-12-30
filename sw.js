/* ============================================
   SERVICE WORKER
   Sistema de Asistencia Biométrica
   ============================================ */

const CACHE_NAME = 'asistencia-v1.0.0';
const RUNTIME_CACHE = 'asistencia-runtime';

// Archivos para cachear en la instalación
const PRECACHE_URLS = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/js/config.js',
    '/js/api.js',
    '/js/camera.js',
    '/js/ui.js',
    '/js/app.js',
    '/js/pwa.js',
    '/manifest.json'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
    console.log('[SW] Instalando Service Worker...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Pre-caching archivos...');
                return cache.addAll(PRECACHE_URLS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
    console.log('[SW] Activando Service Worker...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
                            console.log('[SW] Eliminando cache antigua:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Intercepción de peticiones
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Ignorar peticiones que no sean GET
    if (request.method !== 'GET') {
        return;
    }

    // Ignorar peticiones a la API (siempre ir a la red)
    if (url.origin.includes('workers.dev') || url.origin.includes('script.google.com')) {
        event.respondWith(
            fetch(request)
                .catch(() => {
                    // Si falla, mostrar página offline personalizada
                    return new Response(
                        JSON.stringify({
                            success: false,
                            message: 'Sin conexión a internet'
                        }),
                        {
                            headers: { 'Content-Type': 'application/json' }
                        }
                    );
                })
        );
        return;
    }

    // Estrategia: Cache First, luego Network
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    // Encontrado en cache, pero actualizar en background
                    event.waitUntil(updateCache(request));
                    return cachedResponse;
                }

                // No está en cache, ir a la red
                return fetch(request)
                    .then((response) => {
                        // Si es válido, guardar en cache runtime
                        if (response && response.status === 200) {
                            const responseClone = response.clone();
                            caches.open(RUNTIME_CACHE)
                                .then((cache) => {
                                    cache.put(request, responseClone);
                                });
                        }
                        return response;
                    })
                    .catch(() => {
                        // Si todo falla, mostrar página offline
                        return caches.match('/index.html');
                    });
            })
    );
});

// Actualiza el cache en background
async function updateCache(request) {
    const cache = await caches.open(CACHE_NAME);
    
    try {
        const response = await fetch(request);
        if (response && response.status === 200) {
            await cache.put(request, response);
        }
    } catch (error) {
        console.log('[SW] Error actualizando cache:', error);
    }
}

// Manejo de mensajes desde el cliente
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => caches.delete(cacheName))
                );
            })
        );
    }
});

console.log('[SW] Service Worker cargado correctamente');