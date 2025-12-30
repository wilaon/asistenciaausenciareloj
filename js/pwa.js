/* ============================================
   PWA SERVICE WORKER & INSTALL
   Sistema de Asistencia Biométrica
   ============================================ */

const PWAService = {
    deferredPrompt: null,
    isInstalled: false,

    /**
     * Inicializa el servicio PWA
     */
    init() {
        // Registrar service worker
        this.registerServiceWorker();

        // Detectar si ya está instalado
        this.checkIfInstalled();

        // Manejar el evento de instalación
        this.handleInstallPrompt();

        // Manejar cambios en el estado de instalación
        this.handleAppInstalled();

        console.log('📱 PWA Service inicializado');
    },

    /**
     * Registra el service worker
     */
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('✅ Service Worker registrado:', registration.scope);

                // Actualizar service worker si hay uno nuevo
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // Hay una nueva versión disponible
                            this.showUpdateNotification();
                        }
                    });
                });

            } catch (error) {
                console.error('❌ Error registrando Service Worker:', error);
            }
        }
    },

    /**
     * Verifica si la app ya está instalada
     */
    checkIfInstalled() {
        // Verificar si está en modo standalone (instalado)
        if (window.matchMedia('(display-mode: standalone)').matches) {
            this.isInstalled = true;
            console.log('✅ App ejecutándose en modo instalado');
        }

        // Para iOS
        if (window.navigator.standalone === true) {
            this.isInstalled = true;
            console.log('✅ App ejecutándose en modo instalado (iOS)');
        }
    },

    /**
     * Maneja el evento beforeinstallprompt
     */
    handleInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            // Prevenir que Chrome muestre el prompt automáticamente
            e.preventDefault();
            
            // Guardar el evento para usarlo después
            this.deferredPrompt = e;
            
            console.log('💾 Prompt de instalación disponible');

            // Opcional: Mostrar un botón/banner personalizado para instalar
            // this.showInstallButton();
        });
    },

    /**
     * Maneja cuando la app es instalada
     */
    handleAppInstalled() {
        window.addEventListener('appinstalled', () => {
            console.log('✅ App instalada exitosamente');
            this.isInstalled = true;
            this.deferredPrompt = null;
            
            // Opcional: Mostrar mensaje de éxito
            if (typeof UIService !== 'undefined') {
                UIService.showToast('¡Aplicación instalada correctamente!', 'success');
            }
        });
    },

    /**
     * Muestra el prompt de instalación
     */
    async showInstallPrompt() {
        if (!this.deferredPrompt) {
            console.log('No hay prompt de instalación disponible');
            return false;
        }

        // Mostrar el prompt
        this.deferredPrompt.prompt();

        // Esperar la respuesta del usuario
        const { outcome } = await this.deferredPrompt.userChoice;
        
        console.log(`Usuario ${outcome === 'accepted' ? 'aceptó' : 'rechazó'} la instalación`);

        // Limpiar el prompt
        this.deferredPrompt = null;

        return outcome === 'accepted';
    },

    /**
     * Muestra notificación de actualización disponible
     */
    showUpdateNotification() {
        if (typeof UIService !== 'undefined') {
            const updateMessage = '¡Nueva versión disponible! Recargue la página para actualizar.';
            UIService.showToast(updateMessage, 'info');
        }

        // Opcional: Auto-recargar después de un tiempo
        // setTimeout(() => {
        //     window.location.reload();
        // }, 5000);
    },

    /**
     * Fuerza la actualización del service worker
     */
    async forceUpdate() {
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.getRegistration();
            
            if (registration) {
                await registration.update();
                console.log('🔄 Service Worker actualizado');
            }
        }
    },

    /**
     * Verifica si hay conexión (para modo offline)
     */
    isOnline() {
        return navigator.onLine;
    },

    /**
     * Maneja cambios en el estado de conexión
     */
    handleConnectionChange() {
        window.addEventListener('online', () => {
            console.log('✅ Conexión restaurada');
            if (typeof UIService !== 'undefined') {
                UIService.updateConnectionStatus(true);
                UIService.showToast('Conexión restaurada', 'success');
            }
        });

        window.addEventListener('offline', () => {
            console.log('⚠️ Sin conexión');
            if (typeof UIService !== 'undefined') {
                UIService.updateConnectionStatus(false);
                UIService.showToast('Sin conexión a internet', 'warning');
            }
        });
    }
};

// Inicializar PWA cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        PWAService.init();
        PWAService.handleConnectionChange();
    });
} else {
    PWAService.init();
    PWAService.handleConnectionChange();
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PWAService;
}