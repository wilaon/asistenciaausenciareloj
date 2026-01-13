/* ============================================
   PWA SERVICE WORKER & INSTALL
   Sistema de Asistencia Biométrica
   ============================================ */

const PWAService = {
    /**
     * Inicializa el servicio PWA (solo service worker básico)
     */
    init() {
        // Solo registrar service worker para cache básico
        this.registerServiceWorker();
        console.log('📱 PWA Service inicializado (modo básico)');
    },

    /**
     * Registra el service worker
     */
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('✅ Service Worker registrado:', registration.scope);
            } catch (error) {
                console.error('❌ Error registrando Service Worker:', error);
            }
        }
    }
};

// Inicializar PWA cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        PWAService.init();
    });
} else {
    PWAService.init();
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PWAService;
}