/* ============================================
   UI SERVICE
   Sistema de Asistencia Biométrica
   ============================================ */

const UIService = {
    currentSection: 'sectionTipoUsuario',
    dateTimeInterval: null,

    /**
     * Inicializa el servicio de UI
     */
    init() {
        this.updateDateTime();
        this.startDateTimeUpdate();
        this.hideLoadingScreen();
    },

    /**
     * Oculta la pantalla de carga
     */
    hideLoadingScreen() {
        setTimeout(() => {
            document.getElementById('loadingScreen').style.display = 'none';
            document.getElementById('app').style.display = 'flex';
        }, 1000);
    },

    /**
     * Actualiza la fecha y hora actual
     */
    updateDateTime() {
        const now = new Date();
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        };
        
        const dateTimeString = now.toLocaleDateString('es-ES', options);
        const element = document.getElementById('currentDateTime');
        
        if (element) {
            element.textContent = dateTimeString;
        }
    },

    /**
     * Inicia la actualización automática de fecha/hora
     */
    startDateTimeUpdate() {
        this.dateTimeInterval = setInterval(() => {
            this.updateDateTime();
        }, CONFIG.UI.DATE_TIME_UPDATE_INTERVAL);
    },

    /**
     * Detiene la actualización automática de fecha/hora
     */
    stopDateTimeUpdate() {
        if (this.dateTimeInterval) {
            clearInterval(this.dateTimeInterval);
        }
    },

    /**
     * Cambia a una sección específica
     */
    showSection(sectionId) {
        // Ocultar todas las secciones
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });

        // Mostrar la sección solicitada
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionId;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    },

    /**
     * Muestra un toast notification
     */
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>',
            error: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>',
            warning: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>',
            info: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>'
        };

        toast.innerHTML = `
            <div class="toast-icon">${icons[type]}</div>
            <div class="toast-message">${message}</div>
            <button class="toast-close">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
            </button>
        `;

        container.appendChild(toast);

        // Auto-remove after duration
        const timeout = setTimeout(() => {
            this.removeToast(toast);
        }, CONFIG.UI.TOAST_DURATION);

        // Close button handler
        toast.querySelector('.toast-close').addEventListener('click', () => {
            clearTimeout(timeout);
            this.removeToast(toast);
        });
    },

    /**
     * Remueve un toast
     */
    removeToast(toast) {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    },

    /**
     * Muestra el modal de confirmación
     */
    showModalConfirmacion(titulo, mensaje, resultados = null) {
        const modal = document.getElementById('modalConfirmacion');
        const modalIcon = modal.querySelector('.modal-icon');
        document.getElementById('modalTitulo').textContent = titulo;
        document.getElementById('modalMensaje').textContent = mensaje;

        const resultadosContainer = document.getElementById('modalResultados');
        resultadosContainer.innerHTML = '';

        if (titulo.includes('Parcial') || titulo.includes('⚠️')) {
        // Icono de advertencia para registro parcial
        modalIcon.className = 'modal-icon warning';
        modalIcon.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <path d="M12 9v4M12 17h.01"/>
            </svg>
        `;
        } else {
            // Icono de éxito para registro completo
            modalIcon.className = 'modal-icon success';
            modalIcon.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <path d="M22 4L12 14.01l-3-3"/>
                </svg>
            `;
        }

        if (resultados && resultados.length > 0) {
            resultados.forEach(resultado => {
                const item = document.createElement('div');
                item.className = `resultado-item ${resultado.success ? 'success' : 'error'}`;
                
                const icon = resultado.success 
                    ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>'
                    : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>';

                item.innerHTML = `
                    <div class="resultado-icon ${resultado.success ? 'success' : 'error'}">${icon}</div>
                    <div class="resultado-text">
                        <strong>${resultado.nombre}</strong><br>
                        <small>${resultado.message}</small>
                    </div>
                `;
                
                resultadosContainer.appendChild(item);
            });
        }

        modal.classList.add('active');
    },

    /**
     * Oculta el modal de confirmación
     */
    hideModalConfirmacion() {
        const modal = document.getElementById('modalConfirmacion');
        modal.classList.remove('active');
    },

    /**
     * Muestra el modal de error
     */
    showModalError(mensaje) {
        const modal = document.getElementById('modalError');
        document.getElementById('errorMensaje').textContent = mensaje;
        modal.classList.add('active');
    },

    /**
     * Oculta el modal de error
     */
    hideModalError() {
        const modal = document.getElementById('modalError');
        modal.classList.remove('active');
    },

    /**
     * Deshabilita el botón de submit y muestra loading
     */
    setSubmitLoading(isLoading) {
        const btn = document.getElementById('btnSubmit');
        const span = btn.querySelector('span');
        const svg = btn.querySelector('svg');

        if (isLoading) {
            btn.disabled = true;
            span.textContent = 'Procesando...';
            svg.style.animation = 'spin 1s linear infinite';
        } else {
            btn.disabled = false;
            span.textContent = 'Registrar Asistencia';
            svg.style.animation = 'none';
        }
    },

    /**
     * Puebla un select con opciones
     */
    populateSelect(selectId, options, valueKey = null, textKey = null, placeholder = 'Seleccione una opción...') {
        const select = document.getElementById(selectId);
        select.innerHTML = `<option value="">${placeholder}</option>`;

        options.forEach(option => {
            const optionElement = document.createElement('option');
            
            if (typeof option === 'string') {
                optionElement.value = option;
                optionElement.textContent = option;
            } else {
                optionElement.value = valueKey ? option[valueKey] : option.id;
                optionElement.textContent = textKey ? option[textKey] : option.nombre;
            }
            
            select.appendChild(optionElement);
        });
    },

    /**
     * Limpia un select
     */
    clearSelect(selectId, placeholder = 'Seleccione una opción...') {
        const select = document.getElementById(selectId);
        select.innerHTML = `<option value="">${placeholder}</option>`;
    },

    /**
     * Actualiza el badge de colaboradores
     */
    updateColaboradoresBadge(count) {
        const badge = document.getElementById('badgeColaboradores');
        badge.textContent = count;
    },

    /**
     * Actualiza el indicador de estado de conexión
     */
    updateConnectionStatus(isOnline) {
        const indicator = document.getElementById('statusIndicator');
        const text = document.getElementById('statusText');

        if (isOnline) {
            indicator.classList.remove('offline');
            text.textContent = 'Conectado';
        } else {
            indicator.classList.add('offline');
            text.textContent = 'Sin conexión';
        }
    },

    /**
     * Debounce helper
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Scroll suave a un elemento
     */
    scrollToElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIService;
}