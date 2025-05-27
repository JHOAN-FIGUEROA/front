import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
});

// Interceptor para añadir el token en las peticiones (si existe)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    config.headers['Content-Type'] = 'application/json'; // Asegurar Content-Type por defecto
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta (incluyendo 401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Limpiar datos de sesión
      localStorage.removeItem('token');
      localStorage.removeItem('user'); // Asumiendo que guardas el usuario aquí también
      // Redirigir al login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const loginUser = async (credentials) => {
  try {
    const response = await api.post('/api/usuarios/login', credentials);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getUsuarios = async (page = 1, limit = 5, searchTerm = '') => {
  try {
    const response = await api.get('/api/usuarios', {
      params: {
        page,
        limit,
        search: searchTerm,
      },
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    if (error.response) {
      return { error: true, status: error.response.status, detalles: error.response.data.detalles || error.response.data.error || `Error HTTP ${error.response.status}` };
    } else {
      return { error: true, status: 500, detalles: error.message || 'Error al conectar con el servidor' };
    }
  }
};

export const getUsuarioById = async (id) => {
  try {
    const response = await api.get(`/api/usuarios/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener usuario por ID:', error);
    if (error.response) {
      throw new Error(error.response.data.detalles || error.response.data.error || `Error HTTP ${error.response.status}`);
    } else {
      throw new Error(error.message || 'Error al conectar con el servidor');
    }
  }
};

export const updateUsuario = async (id, data) => {
  try {
    const response = await api.put(`/api/usuarios/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    if (error.response) {
      throw new Error(error.response.data.detalles || error.response.data.error || `Error HTTP ${error.response.status}`);
    } else {
      throw new Error(error.message || 'Error al conectar con el servidor');
    }
  }
};

export const updateEstadoUsuario = async (id, estado) => {
  try {
    const response = await api.patch(`/api/usuarios/estado/${id}`, { estado });
    return response.data;
  } catch (error) {
    console.error('Error al cambiar estado de usuario:', error);
    if (error.response) {
      throw new Error(error.response.data.detalles || error.response.data.error || `Error HTTP ${error.response.status}`);
    } else {
      throw new Error(error.message || 'Error al conectar con el servidor');
    }
  }
};

export const deleteUsuario = async (id) => {
  try {
    const response = await api.delete(`/api/usuarios/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    if (error.response) {
      throw new Error(error.response.data.detalles || error.response.data.error || `Error HTTP ${error.response.status}`);
    } else {
      throw new Error(error.message || 'Error al conectar con el servidor');
    }
  }
};

export const createUsuario = async (data) => {
  try {
    const response = await api.post('/api/usuarios/registrar', data);
    return response.data;
  } catch (error) {
    console.error('Error al crear usuario:', error);
    if (error.response) {
      throw new Error(error.response.data.detalles || error.response.data.error || `Error HTTP ${error.response.status}`);
    } else {
      throw new Error(error.message || 'Error al conectar con el servidor');
    }
  }
};

// Obtener roles
export const getRoles = async (page = 1, limit = 5, searchTerm = '', forSelector = false) => {
  try {
    let url = '/api/rol';
    let params = {};

    if (forSelector) {
      url = '/api/rol/r'; // Nuevo endpoint para selector
      // No se envían parámetros de paginación ni búsqueda en este modo
    } else {
      // Modo paginado (para tablas)
      params = {
        pagina: page,
        limit,
        search: searchTerm,
      };
    }

    const response = await api.get(url, {
      params,
    });

    // Ajustar el formato de respuesta esperado si es para selector (devolver el array directo)
    if (forSelector && response.data && Array.isArray(response.data)) {
        return { success: true, data: response.data };
    } else if (!forSelector && response.data && (response.data.roles || Array.isArray(response.data))) { // Mantener compatibilidad con respuesta paginada y la anterior no paginada en Usuarios
       return { success: true, data: response.data };
    }
     else {
       console.error('Formato de respuesta inesperado de getRoles:', response.data);
       return { error: true, status: response.status || 500, detalles: 'Formato de respuesta inesperado del servidor' };
    }

  } catch (error) {
    console.error('Error en getRoles API call:', error);
    if (error.response) {
      return { error: true, status: error.response.status, detalles: error.response.data.detalles || error.response.data.error || `Error HTTP ${error.response.status}` };
    } else {
      return { error: true, status: 500, detalles: error.message || 'Error desconocido al obtener roles' };
    }
  }
};

// Crear rol
export const createRol = async (data) => {
  try {
    const response = await api.post('/api/rol', data);
    return response.data;
  } catch (error) {
    console.error('Error al crear rol:', error);
    if (error.response) {
      throw new Error(error.response.data.detalles || error.response.data.error || `Error HTTP ${error.response.status}`);
    } else {
      throw new Error(error.message || 'Error al conectar con el servidor');
    }
  }
};

// Editar rol
export const updateRol = async (id, data) => {
  try {
    const response = await api.put(`/api/rol/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error al actualizar rol:', error);
    if (error.response) {
      throw new Error(error.response.data.detalles || error.response.data.error || `Error HTTP ${error.response.status}`);
    } else {
      throw new Error(error.message || 'Error al conectar con el servidor');
    }
  }
};

// Eliminar rol
export const deleteRol = async (id) => {
  try {
    const response = await api.delete(`/api/rol/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar rol:', error);
    if (error.response) {
      throw new Error(error.response.data.detalles || error.response.data.error || `Error HTTP ${error.response.status}`);
    } else {
      throw new Error(error.message || 'Error al conectar con el servidor');
    }
  }
};

// Cambiar estado de rol (PUT)
export const updateEstadoRol = async (id, estado) => {
  try {
    const response = await api.put(`/api/rol/estado/${id}`, { estado });
    return response.data;
  } catch (error) {
    console.error('Error al cambiar estado de rol:', error);
    if (error.response) {
      throw new Error(error.response.data.detalles || error.response.data.error || `Error HTTP ${error.response.status}`);
    } else {
      throw new Error(error.message || 'Error al conectar con el servidor');
    }
  }
};

// Obtener detalle de rol
export const getRolById = async (id) => {
  try {
    const response = await api.get(`/api/rol/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener rol por ID:', error);
    if (error.response) {
      throw new Error(error.response.data.detalles || error.response.data.error || `Error HTTP ${error.response.status}`);
    } else {
      throw new Error(error.message || 'Error al conectar con el servidor');
    }
  }
};

// Obtener proveedores
export const getProveedores = async (page = 1, limit = 5) => {
  try {
    const response = await api.get('/api/proveedores', {
      params: {
        pagina: page,
        limit,
      },
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error en getProveedores API call:', error);
    if (error.response) {
      return { error: true, status: error.response.status, detalles: error.response.data.detalles || error.response.data.error || `Error HTTP ${error.response.status}` };
    } else {
      return { error: true, status: 500, detalles: error.message || 'Error desconocido al obtener proveedores' };
    }
  }
};

export const getProveedorByNit = async (nit) => {
  try {
    const response = await api.get(`/api/proveedores/nit/${nit}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener proveedor por NIT:', error);
    if (error.response) {
      throw new Error(error.response.data.detalles || error.response.data.error || `Error HTTP ${error.response.status}`);
    } else {
      throw new Error(error.message || 'Error al conectar con el servidor');
    }
  }
};

// Puedes agregar más funciones para otras entidades (clientes, productos, etc.) siguiendo el mismo patrón

// Asegúrate de que la instancia de axios se exporta correctamente
export { api };
