import Swal from 'sweetalert2';

// Configuración base para todos los alerts
const baseConfig = {
  confirmButtonColor: '#2E8B57',
  background: '#fff',
  customClass: {
    popup: 'animated fadeInDown'
  },
  zIndex: 99999,
  didOpen: (popup) => {
    popup.style.zIndex = 99999;
  }
};

// Función para mostrar alertas de éxito
export const showSuccessAlert = (title, text, timer = 2000) => {
  return Swal.fire({
    ...baseConfig,
    icon: 'success',
    title,
    text,
    timer,
    showConfirmButton: false,
    position: 'center'
  });
};

// Función para mostrar alertas de error
export const showErrorAlert = (title, text) => {
  return Swal.fire({
    ...baseConfig,
    icon: 'error',
    title,
    text,
    showConfirmButton: true
  });
};

// Función para mostrar alertas de confirmación
export const showConfirmAlert = (title, text) => {
  return Swal.fire({
    ...baseConfig,
    icon: 'warning',
    title,
    text,
    showCancelButton: true,
    confirmButtonText: 'Sí, continuar',
    cancelButtonText: 'Cancelar'
  });
};

// Función para mostrar alertas de información
export const showInfoAlert = (title, text) => {
  return Swal.fire({
    ...baseConfig,
    icon: 'info',
    title,
    text,
    showConfirmButton: true
  });
}; 