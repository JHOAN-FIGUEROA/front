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
      localStorage.removeItem('user');
      // Ya no redirigimos automáticamente
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
    // console.error('Error al obtener usuarios:', error); // Comentado para evitar log en consola
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
    // console.error('Error al obtener usuario por ID:', error); // Comentado para evitar log en consola
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
    // console.error('Error al actualizar usuario:', error); // Comentado para evitar log en consola
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
    // console.error('Error al cambiar estado de usuario:', error); // Comentado para evitar log en consola
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
    // console.error('Error al eliminar usuario:', error); // Comentado para evitar log en consola
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
    // console.error('Error al crear usuario:', error); // Comentado para evitar log en consola
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
       // console.error('Formato de respuesta inesperado de getRoles:', response.data); // Comentado
       return { error: true, status: response.status || 500, detalles: 'Formato de respuesta inesperado del servidor' };
    }

  } catch (error) {
    // console.error('Error en getRoles API call:', error); // Comentado para evitar log en consola
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
    // console.error('Error al crear rol:', error); // Comentado para evitar log en consola
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
    // console.error('Error al actualizar rol:', error); // Comentado para evitar log en consola
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
    // console.error('Error al eliminar rol:', error); // Comentado para evitar log en consola
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
    // console.error('Error al cambiar estado de rol:', error); // Comentado para evitar log en consola
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
    // console.error('Error al obtener rol por ID:', error); // Comentado para evitar log en consola
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
    return { success: true, data: response.data.data };
  } catch (error) {
    // console.error('Error en getProveedores API call:', error);
    if (error.response) {
      return { error: true, status: error.response.status, detalles: error.response.data.detalles || error.response.data.error || `Error HTTP ${error.response.status}` };
    } else {
      return { error: true, status: 500, detalles: error.message || 'Error desconocido al obtener proveedores' };
    }
  }
};

export const solicitarTokenRecuperacion = async (data) => {
  try {
    const response = await api.post('/api/usuarios/auth/recuperar-password', data);
    return { success: true, data: response.data };
  } catch (error) {
    // console.error('Error al solicitar token de recuperación:', error); // Comentado
    if (error.response) {
      return { error: true, status: error.response.status, message: error.response.data.message || error.response.data.error || `Error HTTP ${error.response.status}` };
    } else {
      return { error: true, status: 500, message: error.message || 'Error al conectar con el servidor' };
    }
  }
};

export const restablecerPassword = async (token, nuevaPassword) => {
  try {
    const response = await api.post('/api/usuarios/auth/restablecer-password', {
      token,
      nuevaPassword
    });
    return { success: true, data: response.data };
  } catch (error) {
    // console.error('Error al restablecer contraseña:', error); // Comentado
    if (error.response) {
      return { error: true, status: error.response.status, message: error.response.data.message || error.response.data.error || `Error HTTP ${error.response.status}` };
    } else {
      return { error: true, status: 500, message: error.message || 'Error al conectar con el servidor' };
    }
  }
};

// Puedes agregar más funciones para otras entidades (clientes, productos, etc.) siguiendo el mismo patrón

// Asegúrate de que la instancia de axios se exporta correctamente
export { api };




// CATEGORÍAS

/**
 * Obtiene listado de categorías con paginación y búsqueda
 * @param {number} page - Página actual
 * @param {number} limit - Límite por página
 * @param {string} searchTerm - Término de búsqueda
 * @returns {Promise<Object>} - Respuesta de la API
 */
export const getCategorias = async (page = 1, limit = 5, searchTerm = '') => {
  try {
    const response = await api.get('/api/categoria', {
      params: {
        page,
        limit,
        search: searchTerm
      }
    });

    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    if (error.response) {
      return {
        error: true,
        status: error.response.status,
        detalles: error.response.data.detalles || error.response.data.error || `Error HTTP ${error.response.status}`
      };
    } else {
      return {
        error: true,
        status: 500,
        detalles: error.message || 'Error al conectar con el servidor'
      };
    }
  }
};

/**
 * Crea una nueva categoría
 * @param {FormData} formData - Datos de la categoría (incluye imagen)
 * @returns {Promise<Object>} - Respuesta de la API
 */
export const createCategoria = async (formData) => {
  try {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    };

    const response = await api.post('/api/categoria', formData, config);
    return response.data;
  } catch (error) {
    console.error('Error al crear categoría:', error);
    if (error.response) {
      throw new Error(error.response.data.detalles || error.response.data.error || `Error HTTP ${error.response.status}`);
    } else {
      throw new Error(error.message || 'Error al conectar con el servidor');
    }
  }
};

/**
 * Actualiza una categoría existente
 * @param {number} id - ID de la categoría
 * @param {FormData} formData - Datos actualizados
 * @returns {Promise<Object>} - Respuesta de la API
 */
export const updateCategoria = async (id, formData) => {
  try {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    };

    const response = await api.put(`/api/categoria/${id}`, formData, config);
    return response.data;
  } catch (error) {
    console.error('Error al actualizar categoría:', error);
    if (error.response) {
      throw new Error(error.response.data.detalles || error.response.data.error || `Error HTTP ${error.response.status}`);
    } else {
      throw new Error(error.message || 'Error al conectar con el servidor');
    }
  }
};

/**
 * Elimina una categoría
 * @param {number} id - ID de la categoría
 * @returns {Promise<Object>} - Respuesta de la API
 */
export const deleteCategoria = async (id) => {
  try {
    const response = await api.delete(`/api/categoria/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar categoría:', error);
    if (error.response) {
      throw new Error(error.response.data.detalles || error.response.data.error || `Error HTTP ${error.response.status}`);
    } else {
      throw new Error(error.message || 'Error al conectar con el servidor');
    }
  }
};

/**
 * Cambia el estado de una categoría (activo/inactivo)
 * @param {number} id - ID de la categoría
 * @param {boolean|string} estado - Nuevo estado (booleano real o string)
 * @returns {Promise<Object>} - Respuesta de la API
 */
export const updateEstadoCategoria = async (id, estado) => {
  try {
    const estadoBooleano = estado === true || estado === 'true';
    const response = await api.patch(`/api/categoria/estado/${id}`, {
      estado: estadoBooleano
    });

    return response.data;
  } catch (error) {
    console.error('Error al cambiar estado de categoría:', error);
    if (error.response) {
      throw new Error(
        error.response.data.detalles ||
        error.response.data.error ||
        `Error HTTP ${error.response.status}`
      );
    } else {
      throw new Error(error.message || 'Error al conectar con el servidor');
    }
  }
};

/**
 * Obtiene todas las categorías (sin paginación)
 * @returns {Promise<Object>} - Respuesta de la API
 */
export const getTodasCategorias = async () => {
  try {
    const response = await api.get('/api/categoria/todas');
    return response.data;
  } catch (error) {
    console.error('Error al obtener todas las categorías:', error);
    if (error.response) {
      throw new Error(error.response.data.detalles || error.response.data.error || `Error HTTP ${error.response.status}`);
    } else {
      throw new Error(error.message || 'Error al conectar con el servidor');
    }
  }
};

export const createProveedor = async (data) => {
  try {
    const response = await api.post('/api/proveedores', data);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.detalles || error.response.data.error || `Error HTTP ${error.response.status}`);
    } else {
      throw new Error(error.message || 'Error al conectar con el servidor');
    }
  }
};

export const deleteProveedor = async (nitproveedor) => {
  try {
    const response = await api.delete(`/api/proveedores/${nitproveedor}`);
    return response.data;
  } catch (error) {
    // console.error('Error al eliminar proveedor:', error); // Comentado para evitar log en consola
    if (error.response) {
      throw new Error(error.response.data.detalles || error.response.data.error || `Error HTTP ${error.response.status}`);
    } else {
      throw new Error(error.message || 'Error al conectar con el servidor');
    }
  }
};

// Cambiar estado de proveedor
export const updateEstadoProveedor = async (nitproveedor, estado) => {
  try {
    const response = await api.put(`/api/proveedores/estado/${nitproveedor}`, { estado });
    return response.data;
  } catch (error) {
    // console.error('Error al cambiar estado de proveedor:', error); // Comentado para evitar log en consola
    if (error.response) {
      throw new Error(error.response.data.detalles || error.response.data.error || `Error HTTP ${error.response.status}`);
    } else {
      throw new Error(error.message || 'Error al conectar con el servidor');
    }
  }
};

export const getProveedorByNit = async (nitproveedor) => {
  try {
    const response = await api.get(`/api/proveedores/${nitproveedor}`);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.detalles || error.response.data.error || `Error HTTP ${error.response.status}`);
    } else {
      throw new Error(error.message || 'Error al conectar con el servidor');
    }
  }
};
