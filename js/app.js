/* ============================================
   APLICACIÓN PRINCIPAL
   Sistema de Asistencia Biométrica
   ============================================ */

const App = {
    // Estado de la aplicación
    state: {
        tipoUsuario: null,        // 'operativo' | 'administrativo'
        tipoRegistro: null,       // 'entrada' | 'salida'
        sede: null,
        cuadrilla: null,
        area: null,
        colaboradoresAgregados: [],
        fotoCapturada: null
    },

    /**
     * Inicializa la aplicación
     */
    async init() {
        console.log('🚀 Iniciando Sistema de Asistencia Biométrica...');

        try {
            // Inicializar servicios
            CameraService.init();
            UIService.init();

            // Verificar conexión
            await this.checkConnection();

            // Configurar event listeners
            this.setupEventListeners();

            // Cargar datos iniciales
            await this.loadInitialData();

            console.log('✅ Sistema iniciado correctamente');

        } catch (error) {
            console.error('❌ Error al iniciar:', error);
            UIService.showModalError(CONFIG.MESSAGES.ERROR.GENERIC);
        }
    },

    /**
     * Verifica la conexión con el servidor
     */
    async checkConnection() {
        const isOnline = await ApiService.checkConnection();
        UIService.updateConnectionStatus(isOnline);
        
        if (!isOnline) {
            UIService.showToast('No hay conexión con el servidor. Algunas funciones pueden no estar disponibles.', 'warning');
        }
    },

    /**
     * Carga datos iniciales (sedes)
     */
    async loadInitialData() {
        try {
            UIService.showToast(CONFIG.MESSAGES.INFO.LOADING_SEDES, 'info');
            const response = await ApiService.getSedes();
            
            if (response.success) {
                this.sedes = response.data;
                console.log('✅ Sedes cargadas:', this.sedes.length);
            }
        } catch (error) {
            console.error('Error cargando sedes:', error);
        }
    },

    /**
     * Configura todos los event listeners
     */
    setupEventListeners() {
        // Selección de tipo de usuario
        document.querySelectorAll('.card-option[data-tipo]').forEach(card => {
            card.addEventListener('click', (e) => {
                const tipo = e.currentTarget.dataset.tipo;
                this.selectTipoUsuario(tipo);
            });
        });

        // Selección de tipo de registro
        document.querySelectorAll('.card-option[data-registro]').forEach(card => {
            card.addEventListener('click', (e) => {
                const registro = e.currentTarget.dataset.registro;
                this.selectTipoRegistro(registro);
            });
        });

        // Botones de navegación
        document.getElementById('btnBackTipoRegistro').addEventListener('click', () => {
            this.resetState();
            UIService.showSection('sectionTipoUsuario');
        });

        document.getElementById('btnBackFormulario').addEventListener('click', () => {
            UIService.showSection('sectionTipoRegistro');
            this.resetFormulario();
        });

        // Botón de refresh
        document.getElementById('btnRefresh').addEventListener('click', () => {
            this.refresh();
        });

        // Select de sede
        document.getElementById('selectSede').addEventListener('change', (e) => {
            this.onSedeChange(e.target.value);
        });

        // Select de cuadrilla
        document.getElementById('selectCuadrilla').addEventListener('change', (e) => {
            this.state.cuadrilla = e.target.value;
            
            // Si es salida, cargar colaboradores pendientes
            if (this.state.tipoRegistro === 'salida' && e.target.value) {
                this.loadColaboradoresPendientes();
            }
        });

        // Búsqueda de colaborador por DNI
        document.getElementById('btnBuscarDNI').addEventListener('click', () => {
            this.buscarColaborador();
        });

        document.getElementById('inputDNI').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.buscarColaborador();
            }
        });

        // Solo permitir números en DNI
        document.getElementById('inputDNI').addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
        });

        // Agregar colaborador
        document.getElementById('btnAgregarColaborador').addEventListener('click', () => {
            this.agregarColaborador();
        });

        // Controles de cámara
        document.getElementById('btnIniciarCamara').addEventListener('click', () => {
            this.iniciarCamara();
        });

        document.getElementById('btnCapturar').addEventListener('click', () => {
            this.capturarFoto();
        });

        document.getElementById('btnRetomar').addEventListener('click', () => {
            this.retomarFoto();
        });

        // Submit del formulario
        document.getElementById('formRegistro').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        // Cerrar modales
        document.getElementById('btnCerrarModal').addEventListener('click', () => {
            UIService.hideModalConfirmacion();
            this.resetToInicio();
        });

        document.getElementById('btnCerrarError').addEventListener('click', () => {
            UIService.hideModalError();
        });

        // Cerrar modal al hacer click fuera
        document.getElementById('modalConfirmacion').addEventListener('click', (e) => {
            if (e.target.id === 'modalConfirmacion') {
                UIService.hideModalConfirmacion();
                this.resetToInicio();
            }
        });

        document.getElementById('modalError').addEventListener('click', (e) => {
            if (e.target.id === 'modalError') {
                UIService.hideModalError();
            }
        });

        // Verificar conexión periódicamente
        setInterval(() => {
            this.checkConnection();
        }, 30000); // Cada 30 segundos
    },

    /**
     * Selecciona el tipo de usuario
     */
    selectTipoUsuario(tipo) {
        this.state.tipoUsuario = tipo;
        console.log('Tipo de usuario seleccionado:', tipo);
        UIService.showSection('sectionTipoRegistro');
    },

    /**
     * Selecciona el tipo de registro
     */
    async selectTipoRegistro(registro) {
        this.state.tipoRegistro = registro;
        console.log('Tipo de registro seleccionado:', registro);

        // Actualizar títulos
        const titulo = registro === 'entrada' ? 'Registro de Entrada' : 'Registro de Salida';
        const subtitulo = this.state.tipoUsuario === 'operativo' 
            ? 'Complete los datos de la cuadrilla'
            : 'Complete sus datos personales';

        document.getElementById('tituloFormulario').textContent = titulo;
        document.getElementById('subtituloFormulario').textContent = subtitulo;

        // Configurar formulario según tipo de usuario
        this.setupFormulario();

        // Cargar sedes
        await this.loadSedes();

        UIService.showSection('sectionFormulario');
    },

    /**
     * Configura el formulario según el tipo de usuario
     */
    setupFormulario() {
        const groupCuadrilla = document.getElementById('groupCuadrilla');
        const selectCuadrilla = document.getElementById('selectCuadrilla');

        if (this.state.tipoUsuario === 'operativo') {
            groupCuadrilla.style.display = 'block';
            selectCuadrilla.required = true;
        } else {
            groupCuadrilla.style.display = 'none';
            selectCuadrilla.required = false;
        }

        // Limpiar formulario
        this.resetFormulario();
    },

    /**
     * Carga las sedes en el select
     */
    async loadSedes() {
        try {
            if (!this.sedes) {
                const response = await ApiService.getSedes();
                if (response.success) {
                    this.sedes = response.data;
                }
            }

            UIService.populateSelect('selectSede', this.sedes, null, null, 'Seleccione una sede...');

            // Restaurar última sede si existe
            const lastSede = localStorage.getItem(CONFIG.STORAGE.LAST_SEDE);
            if (lastSede && this.sedes.includes(lastSede)) {
                document.getElementById('selectSede').value = lastSede;
                await this.onSedeChange(lastSede);
            }

        } catch (error) {
            console.error('Error cargando sedes:', error);
            UIService.showToast(CONFIG.MESSAGES.ERROR.NETWORK, 'error');
        }
    },

    /**
     * Maneja el cambio de sede
     */
    async onSedeChange(sede) {
        this.state.sede = sede;

        if (!sede) {
            UIService.clearSelect('selectCuadrilla', 'Seleccione una cuadrilla...');
            return;
        }

        // Guardar última sede
        localStorage.setItem(CONFIG.STORAGE.LAST_SEDE, sede);

        // Si es operativo, cargar cuadrillas
        if (this.state.tipoUsuario === 'operativo') {
            await this.loadCuadrillas(sede);
        }
    },

    /**
     * Carga las cuadrillas de una sede
     */
    async loadCuadrillas(sede) {
        try {
            UIService.showToast(CONFIG.MESSAGES.INFO.LOADING_CUADRILLAS, 'info');
            
            const response = await ApiService.getCuadrillas(sede);
            
            if (response.success) {
                UIService.populateSelect(
                    'selectCuadrilla',
                    response.data,
                    'nombre',
                    'nombre',
                    'Seleccione una cuadrilla...'
                );

                // Guardar área de la primera cuadrilla (todas deberían tener la misma área por sede)
                if (response.data.length > 0) {
                    this.state.area = response.data[0].area;
                }

                console.log('✅ Cuadrillas cargadas:', response.data.length);
            }

        } catch (error) {
            console.error('Error cargando cuadrillas:', error);
            UIService.showToast(CONFIG.MESSAGES.ERROR.NETWORK, 'error');
        }
    },

    /**
     * Busca un colaborador por DNI
     */
    async buscarColaborador() {
        const dniInput = document.getElementById('inputDNI');
        const dni = dniInput.value.trim();

        // Validar DNI
        if (!CONFIG.VALIDATION.DNI_PATTERN.test(dni)) {
            UIService.showToast(CONFIG.MESSAGES.ERROR.INVALID_DNI, 'error');
            dniInput.focus();
            return;
        }

        try {
            UIService.showToast(CONFIG.MESSAGES.INFO.LOADING_COLABORADOR, 'info');
            
            const response = await ApiService.getColaborador(dni);
            
            if (response.success) {
                const colaborador = response.data;
                
                // Verificar si ya fue agregado
                const yaAgregado = this.state.colaboradoresAgregados.some(c => c.dni === dni);
                
                if (yaAgregado) {
                    UIService.showToast(CONFIG.MESSAGES.ERROR.COLABORADOR_DUPLICADO, 'warning');
                    return;
                }

                // Mostrar datos del colaborador
                document.getElementById('inputNombreColaborador').value = colaborador.nombreCompleto;
                document.getElementById('groupNombreColaborador').style.display = 'block';

                // Guardar colaborador temporal
                this.colaboradorTemporal = colaborador;

                UIService.showToast(`Colaborador encontrado: ${colaborador.nombreCompleto}`, 'success');

            } else {
                UIService.showToast(response.message || CONFIG.MESSAGES.ERROR.COLABORADOR_NOT_FOUND, 'error');
                document.getElementById('groupNombreColaborador').style.display = 'none';
            }

        } catch (error) {
            console.error('Error buscando colaborador:', error);
            UIService.showToast(CONFIG.MESSAGES.ERROR.NETWORK, 'error');
        }
    },

    /**
     * Agrega un colaborador a la lista
     */
    agregarColaborador() {
        if (!this.colaboradorTemporal) {
            return;
        }

        // Validar límite para operativos
        if (this.state.tipoUsuario === 'operativo') {
            if (this.state.colaboradoresAgregados.length >= CONFIG.VALIDATION.MAX_COLABORADORES_OPERATIVO) {
                UIService.showToast(`Máximo ${CONFIG.VALIDATION.MAX_COLABORADORES_OPERATIVO} colaboradores permitidos`, 'warning');
                return;
            }
        } else {
            // Para administrativos solo 1
            if (this.state.colaboradoresAgregados.length >= 1) {
                UIService.showToast('Solo puede registrar un colaborador a la vez', 'warning');
                return;
            }
        }

        // Agregar a la lista
        this.state.colaboradoresAgregados.push(this.colaboradorTemporal);
        
        // Renderizar lista
        this.renderColaboradoresList();

        // Limpiar campos
        document.getElementById('inputDNI').value = '';
        document.getElementById('inputNombreColaborador').value = '';
        document.getElementById('groupNombreColaborador').style.display = 'none';
        this.colaboradorTemporal = null;

        UIService.showToast(CONFIG.MESSAGES.SUCCESS.COLABORADOR_AGREGADO, 'success');
    },

    /**
     * Renderiza la lista de colaboradores agregados
     */
    renderColaboradoresList() {
        const lista = document.getElementById('listaColaboradores');
        lista.innerHTML = '';

        this.state.colaboradoresAgregados.forEach((colaborador, index) => {
            const item = document.createElement('div');
            item.className = 'colaborador-item';

            const iniciales = this.getIniciales(colaborador.nombreCompleto);

            item.innerHTML = `
                <div class="colaborador-info">
                    <div class="colaborador-avatar">${iniciales}</div>
                    <div class="colaborador-details">
                        <div class="colaborador-nombre">${colaborador.nombreCompleto}</div>
                        <div class="colaborador-dni">DNI: ${colaborador.dni}</div>
                    </div>
                </div>
                <button type="button" class="btn-remove" data-index="${index}">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                </button>
            `;

            // Event listener para eliminar
            item.querySelector('.btn-remove').addEventListener('click', () => {
                this.removerColaborador(index);
            });

            lista.appendChild(item);
        });

        // Actualizar badge
        UIService.updateColaboradoresBadge(this.state.colaboradoresAgregados.length);
    },

    /**
     * Obtiene las iniciales de un nombre
     */
    getIniciales(nombreCompleto) {
        const partes = nombreCompleto.split(' ');
        if (partes.length >= 2) {
            return (partes[0][0] + partes[1][0]).toUpperCase();
        }
        return nombreCompleto.substring(0, 2).toUpperCase();
    },

    /**
     * Remueve un colaborador de la lista
     */
    removerColaborador(index) {
        this.state.colaboradoresAgregados.splice(index, 1);
        this.renderColaboradoresList();
        UIService.showToast('Colaborador removido de la lista', 'info');
    },

    /**
     * Carga colaboradores con entrada pendiente (para registro de salida)
     */
    async loadColaboradoresPendientes() {
        if (!this.state.sede || !this.state.cuadrilla) {
            return;
        }

        try {
            UIService.showToast('Cargando colaboradores con entrada pendiente...', 'info');
            
            const response = await ApiService.getRegistrosPendientes(
                this.state.sede,
                this.state.cuadrilla
            );

            if (response.success && response.data.length > 0) {
                // Agregar automáticamente los colaboradores pendientes
                response.data.forEach(registro => {
                    const yaAgregado = this.state.colaboradoresAgregados.some(c => c.dni === registro.dni);
                    
                    if (!yaAgregado) {
                        this.state.colaboradoresAgregados.push({
                            dni: registro.dni,
                            nombreCompleto: registro.nombreCompleto
                        });
                    }
                });

                this.renderColaboradoresList();
                UIService.showToast(`${response.data.length} colaborador(es) con entrada pendiente cargados`, 'success');
            } else {
                UIService.showToast('No hay colaboradores con entrada pendiente', 'info');
            }

        } catch (error) {
            console.error('Error cargando pendientes:', error);
            UIService.showToast(CONFIG.MESSAGES.ERROR.NETWORK, 'error');
        }
    },

    /**
     * Inicia la cámara
     */
    async iniciarCamara() {
        try {
            UIService.showToast(CONFIG.MESSAGES.INFO.INICIANDO_CAMARA, 'info');
            
            await CameraService.start();
            
            document.getElementById('btnIniciarCamara').style.display = 'none';
            document.getElementById('btnCapturar').style.display = 'flex';
            
            UIService.showToast('Cámara iniciada correctamente', 'success');

        } catch (error) {
            console.error('Error iniciando cámara:', error);
            UIService.showToast(error.message, 'error');
        }
    },

    /**
     * Captura una foto
     */
    capturarFoto() {
        try {
            const photoData = CameraService.capture();
            CameraService.showCapturedImage(photoData);
            
            this.state.fotoCapturada = photoData;
            
            document.getElementById('btnCapturar').style.display = 'none';
            document.getElementById('btnRetomar').style.display = 'flex';
            
            UIService.showToast(CONFIG.MESSAGES.SUCCESS.FOTO_CAPTURADA, 'success');

        } catch (error) {
            console.error('Error capturando foto:', error);
            UIService.showToast('Error al capturar la foto', 'error');
        }
    },

    /**
     * Retoma una nueva foto
     */
    async retomarFoto() {
        try {
            CameraService.hideCapturedImage();
            this.state.fotoCapturada = null;
            
            await CameraService.start();
            
            document.getElementById('btnRetomar').style.display = 'none';
            document.getElementById('btnCapturar').style.display = 'flex';

        } catch (error) {
            console.error('Error retomando foto:', error);
            UIService.showToast(error.message, 'error');
        }
    },

    /**
     * Valida el formulario antes de enviar
     */
    validateForm() {
        // Validar sede
        if (!this.state.sede) {
            UIService.showToast(CONFIG.MESSAGES.ERROR.NO_SEDE_SELECTED, 'error');
            UIService.scrollToElement('selectSede');
            return false;
        }

        // Validar cuadrilla (solo para operativos)
        if (this.state.tipoUsuario === 'operativo' && !this.state.cuadrilla) {
            UIService.showToast(CONFIG.MESSAGES.ERROR.NO_CUADRILLA_SELECTED, 'error');
            UIService.scrollToElement('selectCuadrilla');
            return false;
        }

        // Validar colaboradores
        if (this.state.colaboradoresAgregados.length === 0) {
            UIService.showToast(CONFIG.MESSAGES.ERROR.NO_COLABORADORES, 'error');
            UIService.scrollToElement('inputDNI');
            return false;
        }

        // Validar foto
        if (!this.state.fotoCapturada) {
            UIService.showToast(CONFIG.MESSAGES.ERROR.NO_PHOTO, 'error');
            UIService.scrollToElement('btnIniciarCamara');
            return false;
        }

        return true;
    },

    /**
     * Maneja el envío del formulario
     */
    async handleSubmit() {
        // Validar formulario
        if (!this.validateForm()) {
            return;
        }

        try {
            UIService.setSubmitLoading(true);
            UIService.showToast(CONFIG.MESSAGES.INFO.PROCESSING, 'info');

            // Obtener geolocalización si está habilitada
            const { latitud, longitud } = await ApiService.getGeolocation();

            // Preparar datos
            const observaciones = document.getElementById('textareaObservaciones').value.trim();

            const data = {
                colaboradores: this.state.colaboradoresAgregados,
                sede: this.state.sede,
                area: this.state.area,
                cuadrilla: this.state.cuadrilla,
                fotoBase64: this.state.fotoCapturada,
                observaciones,
                latitud,
                longitud
            };

            // Enviar según tipo de registro
            let response;
            if (this.state.tipoRegistro === 'entrada') {
                response = await ApiService.registrarEntrada(data);
            } else {
                response = await ApiService.registrarSalida(data);
            }

            // Procesar respuesta
            if (response.success) {
                const mensaje = this.state.tipoRegistro === 'entrada'
                    ? CONFIG.MESSAGES.SUCCESS.REGISTRO_ENTRADA
                    : CONFIG.MESSAGES.SUCCESS.REGISTRO_SALIDA;

                UIService.showModalConfirmacion(
                    '¡Registro Exitoso!',
                    mensaje,
                    response.data
                );

                // Reproducir sonido de éxito (opcional)
                this.playSuccessSound();

            } else {
                UIService.showModalError(response.message || CONFIG.MESSAGES.ERROR.GENERIC);
            }

        } catch (error) {
            console.error('Error en registro:', error);
            UIService.showModalError(error.message || CONFIG.MESSAGES.ERROR.GENERIC);

        } finally {
            UIService.setSubmitLoading(false);
        }
    },

    /**
     * Reproduce un sonido de éxito (opcional)
     */
    playSuccessSound() {
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjaP1fPHdycFI3S98t2UPwoUWrHm653AFAU=');
            audio.volume = 0.3;
            audio.play().catch(e => console.log('Audio play failed:', e));
        } catch (error) {
            // Silenciar errores de audio
        }
    },

    /**
     * Refresca la página
     */
    async refresh() {
        UIService.showToast('Actualizando...', 'info');
        await this.checkConnection();
        await this.loadInitialData();
        UIService.showToast('Datos actualizados', 'success');
    },

    /**
     * Resetea el formulario
     */
    resetFormulario() {
        document.getElementById('formRegistro').reset();
        document.getElementById('inputDNI').value = '';
        document.getElementById('inputNombreColaborador').value = '';
        document.getElementById('groupNombreColaborador').style.display = 'none';
        document.getElementById('listaColaboradores').innerHTML = '';
        
        this.state.colaboradoresAgregados = [];
        this.state.fotoCapturada = null;
        this.colaboradorTemporal = null;

        UIService.updateColaboradoresBadge(0);

        // Resetear cámara
        CameraService.reset();
        document.getElementById('btnIniciarCamara').style.display = 'flex';
        document.getElementById('btnCapturar').style.display = 'none';
        document.getElementById('btnRetomar').style.display = 'none';
    },

    /**
     * Resetea todo el estado
     */
    resetState() {
        this.state = {
            tipoUsuario: null,
            tipoRegistro: null,
            sede: null,
            cuadrilla: null,
            area: null,
            colaboradoresAgregados: [],
            fotoCapturada: null
        };
        this.resetFormulario();
    },

    /**
     * Vuelve al inicio
     */
    resetToInicio() {
        this.resetState();
        UIService.showSection('sectionTipoUsuario');
    }
};

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
}