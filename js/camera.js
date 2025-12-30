/* ============================================
   CAMERA SERVICE
   Sistema de Asistencia Biométrica
   ============================================ */

const CameraService = {
    stream: null,
    videoElement: null,
    canvasElement: null,
    capturedImageElement: null,
    isStreaming: false,
    capturedPhoto: null,

    /**
     * Inicializa el servicio de cámara
     */
    init() {
        this.videoElement = document.getElementById('video');
        this.canvasElement = document.getElementById('canvas');
        this.capturedImageElement = document.getElementById('capturedImage');
    },

    /**
     * Verifica si el navegador soporta getUserMedia
     */
    isSupported() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    },

    /**
     * Inicia el stream de la cámara
     */
    async start() {
        if (!this.isSupported()) {
            throw new Error(CONFIG.MESSAGES.ERROR.CAMERA_NOT_SUPPORTED);
        }

        if (this.isStreaming) {
            return;
        }

        try {
            const constraints = {
                video: {
                    width: { ideal: CONFIG.CAMERA.WIDTH },
                    height: { ideal: CONFIG.CAMERA.HEIGHT },
                    facingMode: CONFIG.CAMERA.FACING_MODE
                },
                audio: false
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.videoElement.srcObject = this.stream;
            this.isStreaming = true;

            // Esperar a que el video esté listo
            return new Promise((resolve) => {
                this.videoElement.onloadedmetadata = () => {
                    this.videoElement.play();
                    resolve();
                };
            });

        } catch (error) {
            console.error('Camera start error:', error);
            
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                throw new Error(CONFIG.MESSAGES.ERROR.CAMERA_PERMISSION_DENIED);
            } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                throw new Error(CONFIG.MESSAGES.ERROR.CAMERA_NOT_FOUND);
            } else {
                throw new Error(CONFIG.MESSAGES.ERROR.CAMERA_NOT_SUPPORTED);
            }
        }
    },

    /**
     * Detiene el stream de la cámara
     */
    stop() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        if (this.videoElement) {
            this.videoElement.srcObject = null;
        }

        this.isStreaming = false;
    },

    /**
     * Captura una foto del video stream
     */
    capture() {
        if (!this.isStreaming) {
            throw new Error('La cámara no está activa');
        }

        // Configurar el canvas con las dimensiones del video
        const width = this.videoElement.videoWidth;
        const height = this.videoElement.videoHeight;
        
        this.canvasElement.width = width;
        this.canvasElement.height = height;

        // Dibujar el frame actual del video en el canvas
        const context = this.canvasElement.getContext('2d');
        context.drawImage(this.videoElement, 0, 0, width, height);

        // Convertir a base64 con compresión
        const dataUrl = this.canvasElement.toDataURL(
            CONFIG.CAMERA.FORMAT,
            CONFIG.CAMERA.QUALITY
        );

        // Verificar tamaño del archivo
        const sizeInBytes = this.getBase64Size(dataUrl);
        
        if (sizeInBytes > CONFIG.CAMERA.MAX_FILE_SIZE) {
            console.warn(`Photo size (${sizeInBytes} bytes) exceeds limit. Compressing...`);
            return this.compressImage(dataUrl);
        }

        this.capturedPhoto = dataUrl;
        return dataUrl;
    },

    /**
     * Comprime una imagen si excede el tamaño máximo
     */
    compressImage(dataUrl, quality = 0.7) {
        const img = new Image();
        img.src = dataUrl;

        return new Promise((resolve) => {
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Mantener proporción, reducir si es necesario
                let width = img.width;
                let height = img.height;
                const maxDimension = 1024;

                if (width > maxDimension || height > maxDimension) {
                    if (width > height) {
                        height = (height / width) * maxDimension;
                        width = maxDimension;
                    } else {
                        width = (width / height) * maxDimension;
                        height = maxDimension;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                const compressed = canvas.toDataURL(CONFIG.CAMERA.FORMAT, quality);
                const newSize = this.getBase64Size(compressed);

                // Si aún es muy grande, comprimir más
                if (newSize > CONFIG.CAMERA.MAX_FILE_SIZE && quality > 0.3) {
                    resolve(this.compressImage(dataUrl, quality - 0.1));
                } else {
                    this.capturedPhoto = compressed;
                    resolve(compressed);
                }
            };
        });
    },

    /**
     * Calcula el tamaño en bytes de una imagen base64
     */
    getBase64Size(base64String) {
        const stringLength = base64String.length - 'data:image/jpeg;base64,'.length;
        const sizeInBytes = 4 * Math.ceil(stringLength / 3) * 0.5624896334383812;
        return sizeInBytes;
    },

    /**
     * Muestra la foto capturada
     */
    showCapturedImage(dataUrl) {
        this.capturedImageElement.src = dataUrl;
        this.videoElement.style.display = 'none';
        this.capturedImageElement.style.display = 'block';
        this.stop();
    },

    /**
     * Oculta la foto capturada y muestra el video
     */
    hideCapturedImage() {
        this.capturedImageElement.style.display = 'none';
        this.videoElement.style.display = 'block';
        this.capturedPhoto = null;
    },

    /**
     * Resetea el estado de la cámara
     */
    reset() {
        this.stop();
        this.hideCapturedImage();
        this.capturedPhoto = null;
    },

    /**
     * Obtiene la foto capturada actual
     */
    getCapturedPhoto() {
        return this.capturedPhoto;
    },

    /**
     * Verifica si hay una foto capturada
     */
    hasPhoto() {
        return this.capturedPhoto !== null;
    },

    /**
     * Cambia la cámara (frontal/trasera)
     */
    async switchCamera() {
        const currentFacingMode = CONFIG.CAMERA.FACING_MODE;
        CONFIG.CAMERA.FACING_MODE = currentFacingMode === 'user' ? 'environment' : 'user';
        
        this.stop();
        await this.start();
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CameraService;
}