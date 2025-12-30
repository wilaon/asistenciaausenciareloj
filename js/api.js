/* ============================================
   API SERVICE
   Sistema de Asistencia Biométrica
   ============================================ */

const ApiService = {
    /**
     * Realiza una petición HTTP con reintentos
     */
    async fetchWithRetry(url, options = {}, retries = CONFIG.API.RETRY_ATTEMPTS) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.API.TIMEOUT);

            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();

        } catch (error) {
            if (retries > 0 && error.name !== 'AbortError') {
                await this.delay(CONFIG.API.RETRY_DELAY);
                return this.fetchWithRetry(url, options, retries - 1);
            }
            throw error;
        }
    },

    /**
     * Delay helper para reintentos
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * Realiza una petición POST al backend
     */
    async post(action, data = {}) {
        try {
            const payload = {
                action,
                ...data
            };

            const response = await this.fetchWithRetry(CONFIG.API.BASE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            return response;

        } catch (error) {
            console.error('API Error:', error);
            throw new Error(CONFIG.MESSAGES.ERROR.NETWORK);
        }
    },

    /**
     * Obtiene la lista de sedes disponibles
     */
    async getSedes() {
        return await this.post('getSedes');
    },

    /**
     * Obtiene las cuadrillas de una sede específica
     */
    async getCuadrillas(sede) {
        return await this.post('getCuadrillas', { sede });
    },

    /**
     * Busca un colaborador por DNI
     */
    async getColaborador(dni) {
        return await this.post('getColaborador', { dni });
    },

    /**
     * Obtiene registros pendientes de salida
     */
    async getRegistrosPendientes(sede, cuadrilla, fecha = null) {
        return await this.post('getRegistrosPendientes', {
            sede,
            cuadrilla,
            fecha: fecha || new Date().toISOString().split('T')[0]
        });
    },

    /**
     * Registra entrada de colaboradores
     */
    async registrarEntrada(data) {
        const {
            colaboradores,
            sede,
            area,
            cuadrilla,
            fotoBase64,
            observaciones,
            latitud,
            longitud
        } = data;

        return await this.post('registrarEntrada', {
            colaboradores,
            sede,
            area,
            cuadrilla,
            fotoBase64,
            observaciones,
            latitud,
            longitud,
            usuarioRegistro: 'Sistema Web',
            tipoUsuario: cuadrilla ? 'Operativo' : 'Administrativo'
        });
    },

    /**
     * Registra salida de colaboradores
     */
    async registrarSalida(data) {
        const {
            colaboradores,
            sede,
            cuadrilla,
            fotoBase64,
            observaciones,
            latitud,
            longitud
        } = data;

        return await this.post('registrarSalida', {
            colaboradores,
            sede,
            cuadrilla,
            fotoBase64,
            observaciones,
            latitud,
            longitud,
            usuarioRegistro: 'Sistema Web'
        });
    },

    /**
     * Obtiene la geolocalización del usuario
     */
    async getGeolocation() {
        if (!CONFIG.GEOLOCATION.ENABLED) {
            return { latitud: null, longitud: null };
        }

        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                resolve({ latitud: null, longitud: null });
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitud: position.coords.latitude,
                        longitud: position.coords.longitude
                    });
                },
                (error) => {
                    console.warn('Geolocation error:', error);
                    resolve({ latitud: null, longitud: null });
                },
                {
                    timeout: CONFIG.GEOLOCATION.TIMEOUT,
                    maximumAge: CONFIG.GEOLOCATION.MAX_AGE,
                    enableHighAccuracy: CONFIG.GEOLOCATION.HIGH_ACCURACY
                }
            );
        });
    },

    /**
     * Verifica la conectividad con el servidor
     */
    async checkConnection() {
        try {
            const response = await fetch(CONFIG.API.BASE_URL, {
                method: 'GET',
                signal: AbortSignal.timeout(5000)
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiService;
}