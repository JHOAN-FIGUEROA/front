import axios from 'axios';
import { useAuth } from './hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL;

// Configuración base de Axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Interceptores ==============================================================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    // Si es FormData, no establecer Content-Type manualmente y loguear los pares
    if (config.data instanceof FormData) {
      // Elimina Content-Type si existe
      if (config.headers['Content-Type']) {
        delete config.headers['Content-Type'];
      }
      // Log de depuración para ver los pares de FormData
      for (let pair of config.data.entries()) {
        console.log('[FormData]', pair[0], pair[1]);
      }
    } else {
      config.headers['Content-Type'] = 'application/json';
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

// Autenticación ==============================================================
export const loginUser = async (credentials) => {
  try {
    const response = await api.post('/api/usuarios/login', credentials);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const solicitarTokenRecuperacion = async (data) => {
  try {
    const response = await api.post('/api/usuarios/auth/recuperar-password', data);
    return { success: true, data: response.data };
  } catch (error) {
    if (error.response) {
      return { 
        error: true, 
        status: error.response.status, 
        message: error.response.data.message || error.response.data.error || `Error HTTP ${error.response.status}` 
      };
    } else {
      return { 
        error: true, 
        status: 500, 
        message: error.message || 'Error al conectar con el servidor' 
      };
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
    if (error.response) {
      return { 
        error: true, 
        status: error.response.status, 
        message: error.response.data.message || error.response.data.error || `Error HTTP ${error.response.status}` 
      };
    } else {
      return { 
        error: true, 
        status: 500, 
        message: error.message || 'Error al conectar con el servidor' 
      };
    }
  }
};

// Usuarios ===================================================================
export const getUsuarios = async (page = 1, limit = 5, searchTerm = '') => {
  try {
    const response = await api.get('/api/usuarios', { params: { page, limit, search: searchTerm } });
    return { success: true, data: response.data };
  } catch (error) {
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

export const getUsuarioById = async (id) => {
  try {
    const response = await api.get(`/api/usuarios/${id}`);
    return response.data;
  } catch (error) {
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
    if (error.response) {
      throw new Error(error.response.data.detalles || error.response.data.error || `Error HTTP ${error.response.status}`);
    } else {
      throw new Error(error.message || 'Error al conectar con el servidor');
    }
  }
};

// Roles ======================================================================
export const getRoles = async (page = 1, limit = 5, searchTerm = '', forSelector = false) => {
  try {
    let url = forSelector ? '/api/rol/r' : '/api/rol';
    const params = forSelector ? {} : { pagina: page, limit, search: searchTerm };

    const response = await api.get(url, { params });

    if (forSelector && Array.isArray(response.data)) {
      return { success: true, data: response.data };
    } else if (!forSelector && response.data) {
      return { success: true, data: response.data };
    } else {
      return { 
        error: true, 
        status: response.status || 500, 
        detalles: 'Formato de respuesta inesperado del servidor' 
      };
    }
  } catch (error) {
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
        detalles: error.message || 'Error desconocido al obtener roles' 
      };
    }
  }
};

export const getRolById = async (id) => {
  try {
    const response = await api.get(`/api/rol/${id}`);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.detalles || error.response.data.error || `Error HTTP ${error.response.status}`);
    } else {
      throw new Error(error.message || 'Error al conectar con el servidor');
    }
  }
};

export const createRol = async (data) => {
  try {
    const response = await api.post('/api/rol', data);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.detalles || error.response.data.error || `Error HTTP ${error.response.status}`);
    } else {
      throw new Error(error.message || 'Error al conectar con el servidor');
    }
  }
};

export const updateRol = async (id, data) => {
  try {
    const response = await api.put(`/api/rol/${id}`, data);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.detalles || error.response.data.error || `Error HTTP ${error.response.status}`);
    } else {
      throw new Error(error.message || 'Error al conectar con el servidor');
    }
  }
};

export const updateEstadoRol = async (id, estado) => {
  try {
    const response = await api.put(`/api/rol/estado/${id}`, { estado });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.detalles || error.response.data.error || `Error HTTP ${error.response.status}`);
    } else {
      throw new Error(error.message || 'Error al conectar con el servidor');
    }
  }
};

export const deleteRol = async (id) => {
  try {
    const response = await api.delete(`/api/rol/${id}`);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.detalles || error.response.data.error || `Error HTTP ${error.response.status}`);
    } else {
      throw new Error(error.message || 'Error al conectar con el servidor');
    }
  }
};

// Proveedores ================================================================
export const getProveedores = async (page = 1, limit = 5) => {
  try {
    const response = await api.get('/api/proveedores', { params: { pagina: page, limit } });
    return { success: true, data: response.data.data };
  } catch (error) {
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
        detalles: error.message || 'Error desconocido al obtener proveedores' 
      };
    }
  }
};

export const getProveedorByNit = async (nit) => {
  try {
    const response = await api.get(`/api/proveedores/${nit}`);
    return response.data;
  } catch (error) {
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

export const updateProveedor = async (nit, data) => {
  try {
    const response = await api.put(`/api/proveedores/${nit}`, data);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.detalles || error.response.data.error || `Error HTTP ${error.response.status}`);
    } else {
      throw new Error(error.message || 'Error al conectar con el servidor');
    }
  }
};

export const updateEstadoProveedor = async (nitproveedor, estado) => {
  try {
    const response = await api.put(`/api/proveedores/estado/${nitproveedor}`, { estado });
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
    if (error.response) {
      throw new Error(error.response.data.detalles || error.response.data.error || `Error HTTP ${error.response.status}`);
    } else {
      throw new Error(error.message || 'Error al conectar con el servidor');
    }
  }
};

export const getProveedoresActivos = async () => {
  try {
    // Traer todos los productos (hasta 1000)
    const response = await api.get('/api/productos', { params: { page: 1, limit: 1000 } });
    let productos = [];
    if (response.data && response.data.data && Array.isArray(response.data.data.productos)) {
      productos = response.data.data.productos.filter(p => p.estado === true || p.estado === 1 || p.estado === 'true');
    }
    return { success: true, data: { productos } };
  } catch (error) {
    return {
      error: true,
      detalles: error.response?.data?.detalles || error.response?.data?.error || error.message || 'Error desconocido'
    };
  }
};

// Categorías =================================================================
export const getCategorias = async (page = 1, limit = 5, searchTerm = '') => {
  try {
    const response = await api.get('/api/categoria', { params: { page, limit, search: searchTerm } });
    return { success: true, data: response.data };
  } catch (error) {
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

export const getTodasCategorias = async () => {
  try {
    const response = await api.get('/api/categoria/todas');
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.detalles || error.response.data.error || `Error HTTP ${error.response.status}`);
    } else {
      throw new Error(error.message || 'Error al conectar con el servidor');
    }
  }
};

export const createCategoria = async (formData) => {
  try {
    const response = await api.post('/api/categoria', formData);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.detalles || error.response.data.error || `Error HTTP ${error.response.status}`);
    } else {
      throw new Error(error.message || 'Error al conectar con el servidor');
    }
  }
};

export const updateCategoria = async (id, formData) => {
  try {
    const response = await api.put(`/api/categoria/${id}`, formData);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.detalles || error.response.data.error || `Error HTTP ${error.response.status}`);
    } else {
      throw new Error(error.message || 'Error al conectar con el servidor');
    }
  }
};

export const updateEstadoCategoria = async (id, estado) => {
  try {
    const estadoBooleano = estado === true || estado === 'true';
    const response = await api.patch(`/api/categoria/estado/${id}`, { estado: estadoBooleano });
    return response.data;
  } catch (error) {
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

export const deleteCategoria = async (id) => {
  try {
    const response = await api.delete(`/api/categoria/${id}`);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.detalles || error.response.data.error || `Error HTTP ${error.response.status}`);
    } else {
      throw new Error(error.message || 'Error al conectar con el servidor');
    }
  }
};

export const getProductosActivos = async (soloConStock = false) => {
  try {
    // Traer todos los productos (hasta 1000)
    const params = { page: 1, limit: 1000 };
    if (soloConStock) params.soloConStock = true;
    const response = await api.get('/api/productos', { params });
    let productos = [];
    if (response.data && response.data.data && Array.isArray(response.data.data.productos)) {
      productos = response.data.data.productos.filter(p => p.estado === true || p.estado === 1 || p.estado === 'true');
    }
    return { success: true, data: { productos } };
  } catch (error) {
    return {
      error: true,
      detalles: error.response?.data?.detalles || error.response?.data?.error || error.message || 'Error desconocido'
    };
  }
};

// Clientes ===================================================================
export const getClientes = async (page = 1, limit = 5, searchTerm = '') => {
  try {
    const response = await api.get('/api/clientes', { params: { page, limit, search: searchTerm } });
    return { success: true, data: response.data };
  } catch (error) {
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
        detalles: error.message || 'Error desconocido al obtener clientes' 
      };
    }
  }
};

export const getClienteById = async (id) => {
  try {
    const response = await api.get(`/api/clientes/${id}`);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.detalles || error.response.data.error || `Error HTTP ${error.response.status}`);
    } else {
      throw new Error(error.message || 'Error al conectar con el servidor');
    }
  }
};

export const createCliente = async (data) => {
  try {
    const response = await api.post('/api/clientes/registro', data);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.detalles || error.response.data.error || `Error HTTP ${error.response.status}`);
    } else {
      throw new Error(error.message || 'Error al conectar con el servidor');
    }
  }
};

export const updateCliente = async (id, data) => {
  try {
    const response = await api.put(`/api/clientes/${id}`, data);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.detalles || error.response.data.error || `Error HTTP ${error.response.status}`);
    } else {
      throw new Error(error.message || 'Error al conectar con el servidor');
    }
  }
};

export const updateEstadoCliente = async (id, estado) => {
  try {
    const response = await api.patch(`/api/clientes/${id}/estado`, { estado });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.detalles || error.response.data.error || `Error HTTP ${error.response.status}`);
    } else {
      throw new Error(error.message || 'Error al conectar con el servidor');
    }
  }
};

export const deleteCliente = async (id) => {
  try {
    const response = await api.delete(`/api/clientes/${id}`);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.detalles || error.response.data.error || `Error HTTP ${error.response.status}`);
    } else {
      throw new Error(error.message || 'Error al conectar con el servidor');
    }
  }
};

export const getClientesActivos = async () => {
  try {
    // Traer todos los clientes (hasta 1000)
    const response = await api.get('/api/clientes', { params: { page: 1, limit: 1000 } });
    let clientes = [];
    if (response.data && response.data.data && Array.isArray(response.data.data.clientes)) {
      clientes = response.data.data.clientes.filter(c => c.estado === true || c.estado === 1 || c.estado === 'true');
    }
    return { success: true, data: { clientes } };
  } catch (error) {
    return {
      error: true,
      detalles: error.response?.data?.detalles || error.response?.data?.error || error.message || 'Error desconocido'
    };
  }
};

// Productos ==================================================================
export const getProductos = async (page = 1, limit = 100) => {
  try {
    const response = await api.get('/api/productos', { params: { page, limit } });
    return { success: true, data: response.data };
  } catch (error) {
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

export const getProductoById = async (id) => {
  try {
    const response = await api.get(`/api/productos/${id}`);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.detalles || error.response.data.error || `Error HTTP ${error.response.status}`);
    } else {
      throw new Error(error.message || 'Error al conectar con el servidor');
    }
  }
};

export const createProducto = async (formData) => {
  try {
    const response = await api.post('/api/productos', formData);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.detalles || error.response.data.error || `Error HTTP ${error.response.status}`);
    } else {
      throw new Error(error.message || 'Error al conectar con el servidor');
    }
  }
};

export const updateProducto = async (id, formData) => {
  try {
    const response = await api.put(`/api/productos/${id}`, formData);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.detalles || error.response.data.error || `Error HTTP ${error.response.status}`);
    } else {
      throw new Error(error.message || 'Error al conectar con el servidor');
    }
  }
};

export const updateEstadoProducto = async (id, estado) => {
  try {
    const estadoBooleano = estado === true || estado === 'true';
    const response = await api.patch(`/api/productos/${id}/estado`, { estado: estadoBooleano });
    return response.data;
  } catch (error) {
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

export const deleteProducto = async (id) => {
  try {
    const response = await api.delete(`/api/productos/${id}`);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.detalles || error.response.data.error || `Error HTTP ${error.response.status}`);
    } else {
      throw new Error(error.message || 'Error al conectar con el servidor');
    }
  }
};

export const getCategoriasActivas = async () => {
  try {
    const response = await api.get('/api/categoria/todas');
    return { success: true, data: response.data.data };
  } catch (error) {
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

// Unidades ===================================================================
export const getUnidades = async (page = 1, limit = 5) => {
  try {
    const response = await api.get('/api/unidades', { params: { pagina: page, limit } });
    return { success: true, data: response.data.data };
  } catch (error) {
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
        detalles: error.message || 'Error desconocido al obtener unidades'
      };
    }
  }
};

export const createUnidad = async (data) => {
  try {
    const response = await api.post('/api/unidades', data);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.detalles || error.response.data.error || `Error HTTP ${error.response.status}`);
    } else {
      throw new Error(error.message || 'Error al conectar con el servidor');
    }
  }
};

export const deleteUnidad = async (id) => {
  try {
    const response = await api.delete(`/api/unidades/${id}`);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.detalles || error.response.data.error || `Error HTTP ${error.response.status}`);
    } else {
      throw new Error(error.message || 'Error al conectar con el servidor');
    }
  }
};

export const updateUnidad = async (idpresentacion, data) => {
  try {
    const response = await api.put(`/api/unidades/${idpresentacion}`, data);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.detalles || error.response.data.error || `Error HTTP ${error.response.status}`);
    } else {
      throw new Error(error.message || 'Error al conectar con el servidor');
    }
  }
};

// Buscar producto por código de barras
export const getProductoByCodigo = async (codigoproducto) => {
  try {
    const response = await api.get('/api/productos/buscar', { params: { codigoproducto } });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.detalles || error.response.data.error || `Error HTTP ${error.response.status}`);
    } else {
      throw new Error(error.message || 'Error al conectar con el servidor');
    }
  }
};

// Dashboard ==================================================================
export const getDashboardStats = async () => {
  try {
    const response = await api.get('/api/dashboard');
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.detalles || error.response.data.error || `Error HTTP ${error.response.status}`);
    } else {
      throw new Error(error.message || 'Error al conectar con el servidor');
    }
  }
};

// Compras ====================================================================
export const getCompras = async (page = 1, limit = 5, searchTerm = '', estado) => {
  try {
    const params = { page, limit, search: searchTerm };
    if (estado !== undefined && estado !== '') params.estado = estado;
    const response = await api.get('/api/compras', { params });
    return { success: true, data: response.data.data };
  } catch (error) {
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
        detalles: error.message || 'Error desconocido al obtener compras' 
      };
    }
  }
};

export const getCompraById = async (id) => {
  try {
    const response = await api.get(`/api/compras/${id}`);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.detalles || error.response.data.error || `Error HTTP ${error.response.status}`);
    } else {
      throw new Error(error.message || 'Error al conectar con el servidor');
    }
  }
};

export const createCompra = async (data) => {
  try {
    const response = await api.post('/api/compras', data);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.detalles || error.response.data.error || `Error HTTP ${error.response.status}`);
    } else {
      throw new Error(error.message || 'Error al conectar con el servidor');
    }
  }
};

export const anularCompra = async (id, motivo) => {
  try {
    const response = await api.put(`/api/compras/${id}/anular`, { motivo_anulacion: motivo });
    return response.data;
  } catch (error) {
    if (error.response) {
      return { 
        success: false, 
        error: true,
        message: error.response.data.error || error.response.data.detalles || `Error HTTP ${error.response.status}`
      };
    } else {
      return { 
        success: false, 
        error: true,
        message: error.message || 'Error al conectar con el servidor' 
      };
    }
  }
};

export const getCompraPDF = async (id) => {
  try {
    const response = await api.get(`/api/compras/${id}/pdf`, { responseType: 'blob' });
    return { success: true, data: response.data };
  } catch (error) {
    return {
      error: true,
      detalles: error.response?.data?.detalles || error.response?.data?.error || error.message || 'Error al obtener el PDF'
    };
  }
};

// Ventas =====================================================================
export const getVentas = async (page = 1, limit = 5, searchTerm = '', estado) => {
  try {
    const params = { page, limit, search: searchTerm };
    if (estado !== undefined && estado !== '') params.estado = estado;
    const response = await api.get('/api/ventas', { params });
    return { success: true, data: response.data.data };
  } catch (error) {
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
        detalles: error.message || 'Error desconocido al obtener ventas' 
      };
    }
  }
};

export const getVentaById = async (id) => {
  try {
    const response = await api.get(`/api/ventas/${id}`);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.detalles || error.response.data.error || `Error HTTP ${error.response.status}`);
    } else {
      throw new Error(error.message || 'Error al conectar con el servidor');
    }
  }
};

export const createVenta = async (data) => {
  try {
    const response = await api.post('/api/ventas', data);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.detalles || error.response.data.error || `Error HTTP ${error.response.status}`);
    } else {
      throw new Error(error.message || 'Error al conectar con el servidor');
    }
  }
};

export const anularVenta = async (id, motivo) => {
  try {
    const response = await api.put(`/api/ventas/${id}/anular`, { motivo_anulacion: motivo });
    return response.data;
  } catch (error) {
    if (error.response) {
      return { 
        success: false, 
        error: true,
        message: error.response.data.error || error.response.data.detalles || `Error HTTP ${error.response.status}`
      };
    } else {
      return { 
        success: false, 
        error: true,
        message: error.message || 'Error al conectar con el servidor' 
      };
    }
  }
};

export const confirmarVenta = async (id) => {
  try {
    const response = await api.put(`/api/ventas/${id}/confirmar`);
    return response.data;
  } catch (error) {
    if (error.response) {
      return { 
        success: false, 
        error: true,
        message: error.response.data.error || error.response.data.detalles || `Error HTTP ${error.response.status}`
      };
    } else {
      return { 
        success: false, 
        error: true,
        message: error.message || 'Error al conectar con el servidor' 
      };
    }
  }
};

export const getVentaPDF = async (id) => {
  try {
    const response = await api.get(`/api/ventas/${id}/pdf`, { responseType: 'blob' });
    return { success: true, data: response.data };
  } catch (error) {
    return {
      error: true,
      detalles: error.response?.data?.detalles || error.response?.data?.error || error.message || 'Error al obtener el PDF'
    };
  }
};

// Buscar unidad/presentación por código de barras
export const buscarUnidadPorCodigo = async (codigo, soloConStock = false) => {
  try {
    const params = { codigobarras: codigo };
    if (soloConStock) params.soloConStock = true;
    const response = await api.get('/api/unidades/buscar', { params });
    return { success: true, data: response.data };
  } catch (error) {
    return {
      error: true,
      detalles: error.response?.data?.detalles || error.response?.data?.error || error.message || 'Error al buscar unidad por código'
    };
  }
};

// Exportación final ===========================================================
export { api };