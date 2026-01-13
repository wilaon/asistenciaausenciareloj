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
                        if (cacheName !== CACHE_NAME) {
                            console.log('[SW] Eliminando cache antigua:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Intercepción de peticiones (estrategia simple: Network First)
self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Ignorar peticiones que no sean GET
    if (request.method !== 'GET') {
        return;
    }

    // Ignorar peticiones a APIs externas (siempre ir a la red)
    const url = new URL(request.url);
    if (url.origin.includes('workers.dev') || 
        url.origin.includes('script.google.com') ||
        url.origin.includes('drive.google.com')) {
        return;
    }

    // Estrategia: Network First, luego Cache
    event.respondWith(
        fetch(request)
            .then((response) => {
                // Si la respuesta es válida, guardar en cache
                if (response && response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(request, responseClone);
                        });
                }
                return response;
            })
            .catch(() => {
                // Si falla la red, intentar cache
                return caches.match(request)
                    .then((cachedResponse) => {
                        return cachedResponse || caches.match('/index.html');
                    });
            })
    );
});

console.log('[SW] Service Worker cargado (modo básico)');