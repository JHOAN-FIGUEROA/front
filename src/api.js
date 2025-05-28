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
    }
    
    // Si la respuesta principal indica éxito
    if (response.data && response.data.success === true) {
      let rolesArray = [];
      let paginacionData = null;

      // Intentar extraer el array de roles de diferentes estructuras
      if (response.data.data && Array.isArray(response.data.data)) { // Nueva estructura con lista en .data.data
          rolesArray = response.data.data;
          if (response.data.paginacion) { // Y posible paginación en el nivel superior
              paginacionData = response.data.paginacion;
          }
      } else if (response.data.data && response.data.data.roles && Array.isArray(response.data.data.roles)) { // Estructura paginada anterior con lista en .data.data.roles
          rolesArray = response.data.data.roles;
          if (response.data.data.paginacion) { // Y paginación en .data.data.paginacion
              paginacionData = response.data.data.paginacion;
          }
      } else if (response.data.roles && Array.isArray(response.data.roles)) { // Estructura anterior con lista en .data.roles
          rolesArray = response.data.roles;
          if (response.data.paginacion) { // Y posible paginación en el nivel superior
               paginacionData = response.data.paginacion;
          } else if (response.data.data && response.data.data.paginacion) { // O paginación en .data.data.paginacion
              paginacionData = response.data.data.paginacion;
          }
      } else if (Array.isArray(response.data)) { // Si response.data es directamente el array (para selector o no paginado)
           rolesArray = response.data;
      }

      // Si llegamos aquí y success es true, pero no encontramos un array, asumimos lista vacía.
      // Esto maneja { success: true, message: '...', data: {} } y otros casos inesperados de éxito.
      return { success: true, data: { roles: rolesArray, paginacion: paginacionData } };
    }
    
    
     // Si la respuesta no indica éxito o tiene un formato inesperado para un caso de error
     console.error('Formato de respuesta inesperado de getRoles:', response.data);
     return { error: true, status: response.status || 500, detalles: 'Formato de respuesta inesperado del servidor' };
    

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

// Funciones para la gestión de clientes
export const getClientes = async (page = 1, limit = 5, searchTerm = '') => {
  try {
    const response = await api.get('/api/clientes', {
      params: {
        page,
        limit,
        search: searchTerm,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    if (error.response) {
      return { error: true, status: error.response.status, detalles: error.response.data.detalles || error.response.data.error || `Error HTTP ${error.response.status}` };
    } else {
      return { error: true, status: 500, detalles: error.message || 'Error al conectar con el servidor' };
    }
  }
};

export const getClientesTodos = async (searchTerm = '') => {
  try {
    const response = await api.get('/api/clientes/todos', {
      params: { search: searchTerm }
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener todos los clientes:', error);
    if (error.response) {
      return { error: true, status: error.response.status, detalles: error.response.data.detalles || error.response.data.error || `Error HTTP ${error.response.status}` };
    } else {
      return { error: true, status: 500, detalles: error.message || 'Error al conectar con el servidor' };
    }
  }
};

export const getClienteById = async (id, incluirVentas = false) => {
  try {
    const response = await api.get(`/api/clientes/${id}`, {
      params: {
        incluirVentas: incluirVentas
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener cliente por documento:', error);
    if (error.response) {
      throw new Error(error.response.data.detalles || error.response.data.error || `Error HTTP ${error.response.status}`);
    } else {
      throw new Error(error.message || 'Error al conectar con el servidor');
    }
  }
};

export const createCliente = async (data) => {
  try {
    const response = await api.post('/api/clientes', {
      tipodocumento: data.tipodocumento,
      documentocliente: data.documentocliente,
      nombre: data.nombre,
      apellido: data.apellido,
      email: data.email,
      password: data.password,
      telefono: data.telefono,
      municipio: data.municipio,
      complemento: data.complemento,
      direccion: data.direccion,
      barrio: data.barrio
    });
    return response.data;
  } catch (error) {
    console.error('Error al crear cliente:', error);
    if (error.response) {
      throw new Error(error.response.data.detalles || error.response.data.error || `Error HTTP ${error.response.status}`);
    } else {
      throw new Error(error.message || 'Error al conectar con el servidor');
    }
  }
};

export const updateCliente = async (id, data) => {
  try {
    // Asumimos que la API espera PATCH o PUT en /api/clientes/{documento}
    const response = await api.patch(`/api/clientes/${id}`, data); // O api.put
    return response.data;
  } catch (error) {
    console.error('Error al actualizar cliente por documento:', error);
    if (error.response) {
      throw new Error(error.response.data.detalles || error.response.data.error || `Error HTTP ${error.response.status}`);
    } else {
      throw new Error(error.message || 'Error al conectar con el servidor');
    }
  }
};

export const updateEstadoCliente = async (id, estado) => {
  try {
    // Asumimos que la API espera PATCH en /api/clientes/estado/{documento}
    const response = await api.patch(`/api/clientes/estado/${id}`, { estado });
    return response.data;
  } catch (error) {
    console.error('Error al cambiar estado de cliente por documento:', error);
    if (error.response) {
      throw new Error(error.response.data.detalles || error.response.data.error || `Error HTTP ${error.response.status}`);
    } else {
      throw new Error(error.message || 'Error al conectar con el servidor');
    }
  }
};

export const deleteCliente = async (id) => {
  try {
    // Asumimos que la API espera DELETE en /api/clientes/{documento}
    const response = await api.delete(`/api/clientes/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar cliente por documento:', error);
    if (error.response) {
      throw new Error(error.response.data.detalles || error.response.data.error || `Error HTTP ${error.response.status}`);
    } else {
      throw new Error(error.message || 'Error al conectar con el servidor');
    }
  }
};

// Asegúrate de que la instancia de axios se exporta correctamente
export { api };
