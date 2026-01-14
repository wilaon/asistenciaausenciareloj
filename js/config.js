/* ============================================
   CONFIGURACIÓN GLOBAL
   Sistema de Asistencia Biométrica
   ============================================ */

const CONFIG = {
    // API Configuration
    API: {
        BASE_URL: 'https://asistencia-api.wavilanuez.workers.dev/', // Cambiar por tu URL de Cloudflare Worker
        TIMEOUT: 30000, // 30 segundos
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 1000 // 1 segundo
    },

    // Camera Configuration
    CAMERA: {
        WIDTH: 1280,
        HEIGHT: 960,
        FACING_MODE: 'user', // 'user' para frontal, 'environment' para trasera
        MAX_FILE_SIZE: 500 * 1024, // 500KB
        QUALITY: 0.8, // Calidad JPEG (0-1)
        FORMAT: 'image/jpeg'
    },

    // Form Validation
    VALIDATION: {
        DNI_LENGTH: 15,
        DNI_PATTERN: /^\d{4}-\d{4}-\d{5}$/,
        MAX_COLABORADORES_OPERATIVO: 50,
        MIN_COLABORADORES_OPERATIVO: 1,
        MAX_OBSERVACIONES_LENGTH: 500
    },

    // UI Configuration
    UI: {
        TOAST_DURATION: 3000, // 4 segundos
        MODAL_ANIMATION_DURATION: 300, // 0.3 segundos
        DEBOUNCE_DELAY: 500, // 0.5 segundos
        DATE_TIME_UPDATE_INTERVAL: 1000 // 1 segundo
    },

    // Local Storage Keys
    STORAGE: {
        LAST_SEDE: 'asistencia_last_sede',
        LAST_CUADRILLA: 'asistencia_last_cuadrilla',
        USER_PREFERENCES: 'asistencia_user_preferences',
        OFFLINE_QUEUE: 'asistencia_offline_queue'
    },

    // Messages
    MESSAGES: {
        ERROR: {
            NETWORK: 'Error de conexión. Por favor, verifique su conexión a internet.',
            CAMERA_NOT_SUPPORTED: 'Su navegador no soporta acceso a la cámara.',
            CAMERA_PERMISSION_DENIED: 'Debe permitir el acceso a la cámara para continuar.',
            CAMERA_NOT_FOUND: 'No se encontró ninguna cámara disponible.',
            INVALID_DNI: 'El DNI debe contener exactamente 8 dígitos.',
            COLABORADOR_NOT_FOUND: 'Colaborador no encontrado en el sistema.',
            NO_SEDE_SELECTED: 'Debe seleccionar una sede.',
            NO_CUADRILLA_SELECTED: 'Debe seleccionar una cuadrilla.',
            NO_COLABORADORES: 'Debe agregar al menos un colaborador.',
            NO_PHOTO: 'Debe capturar una fotografía.',
            COLABORADOR_DUPLICADO: 'Este colaborador ya fue agregado.',
            GENERIC: 'Ha ocurrido un error. Por favor, intente nuevamente.'
        },
        SUCCESS: {
            REGISTRO_ENTRADA: 'Entrada registrada exitosamente.',
            REGISTRO_SALIDA: 'Salida registrada exitosamente.',
            FOTO_CAPTURADA: 'Fotografía capturada correctamente.',
            COLABORADOR_AGREGADO: 'Colaborador agregado a la lista.'
        },
        INFO: {
            LOADING_SEDES: 'Cargando sedes...',
            LOADING_CUADRILLAS: 'Cargando cuadrillas...',
            LOADING_COLABORADOR: 'Buscando colaborador...',
            PROCESSING: 'Procesando registro...',
            INICIANDO_CAMARA: 'Iniciando cámara...'
        }
    }

};

// Freeze configuration to prevent modifications
Object.freeze(CONFIG);
Object.freeze(CONFIG.API);
Object.freeze(CONFIG.CAMERA);
Object.freeze(CONFIG.VALIDATION);
Object.freeze(CONFIG.UI);
Object.freeze(CONFIG.STORAGE);
Object.freeze(CONFIG.MESSAGES);


// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}