const API_URL = import.meta.env.VITE_API_URL;

export const loginUser = async (credentials) => {
  try {
    const response = await fetch(`${API_URL}/api/usuarios/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      throw response;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

export const getUsuarios = async (page = 1, limit = 5, searchTerm = '') => {
  try {
    let url = `${API_URL}/api/usuarios?page=${page}&limit=${limit}`;
    if (searchTerm) {
      url += `&search=${encodeURIComponent(searchTerm)}`;
    }
    url += `&_t=${Date.now()}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw response;
    }
    const data = await response.json();
    return { success: true, data: data };
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    } else {
      return { error: true, status: 500, detalles: error.message || 'Error al conectar con el servidor' };
    }
  }
};

export const getUsuarioById = async (id) => {
  try {
    const response = await fetch(`${API_URL}/api/usuarios/${id}`);
    if (!response.ok) {
      throw new Error('Error al obtener el detalle del usuario');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error(error.message || 'Error al conectar con el servidor');
  }
};

export const updateUsuario = async (id, data) => {
  try {
    const response = await fetch(`${API_URL}/api/usuarios/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al actualizar el usuario');
    }
    return await response.json();
  } catch (error) {
    throw new Error(error.message || 'Error al conectar con el servidor');
  }
};

export const updateEstadoUsuario = async (id, estado) => {
  try {
    const response = await fetch(`${API_URL}/api/usuarios/estado/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ estado }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al cambiar el estado del usuario');
    }
    return await response.json();
  } catch (error) {
    throw new Error(error.message || 'Error al conectar con el servidor');
  }
};

export const deleteUsuario = async (id) => {
  try {
    const response = await fetch(`${API_URL}/api/usuarios/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al eliminar el usuario');
    }
    return await response.json();
  } catch (error) {
    throw new Error(error.message || 'Error al conectar con el servidor');
  }
};

export const createUsuario = async (data) => {
  try {
    const response = await fetch(`${API_URL}/api/usuarios/registrar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al registrar el usuario');
    }
    return await response.json();
  } catch (error) {
    throw new Error(error.message || 'Error al conectar con el servidor');
  }
};

// Obtener roles
export const getRoles = async (page = 1, limit = 5, searchTerm = '') => {
  try {
    let url = `${API_URL}/api/rol?pagina=${page}&limit=${limit}`;
    if (searchTerm) {
      url += `&search=${encodeURIComponent(searchTerm)}`;
    }

    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al obtener los roles');
    }
    const data = await response.json();
    return { success: true, data: data };
  } catch (error) {
    console.error('Error en getRoles API call:', error);
    if (error instanceof Response) {
      try {
        const errorBody = await error.json();
        return { error: true, status: error.status, detalles: errorBody.message || `Error HTTP ${error.status}` };
      } catch (jsonError) {
        return { error: true, status: error.status, detalles: `Error HTTP ${error.status}` };
      }
    } else {
      return { error: true, status: 500, detalles: error.message || 'Error desconocido al obtener roles' };
    }
  }
};

// Crear rol
export const createRol = async (data) => {
  try {
    const response = await fetch(`${API_URL}/api/rol`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al crear el rol');
    }
    return await response.json();
  } catch (error) {
    throw new Error(error.message || 'Error al conectar con el servidor');
  }
};

// Editar rol
export const updateRol = async (id, data) => {
  try {
    const response = await fetch(`${API_URL}/api/rol/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al actualizar el rol');
    }
    return await response.json();
  } catch (error) {
    throw new Error(error.message || 'Error al conectar con el servidor');
  }
};

// Eliminar rol
export const deleteRol = async (id) => {
  try {
    const response = await fetch(`${API_URL}/api/rol/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al eliminar el rol');
    }
    return await response.json();
  } catch (error) {
    throw new Error(error.message || 'Error al conectar con el servidor');
  }
};

// Cambiar estado de rol (PATCH)
export const updateEstadoRol = async (id, estado) => {
  try {
    const response = await fetch(`${API_URL}/api/rol/estado/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ estado }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al cambiar el estado del rol');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error(error.message || 'Error al conectar con el servidor');
  }
};

// Obtener detalle de rol
export const getRolById = async (id) => {
  try {
    const response = await fetch(`${API_URL}/api/rol/${id}`);
    if (!response.ok) {
      throw new Error('Error al obtener el detalle del rol');
    }
    return await response.json();
  } catch (error) {
    throw new Error(error.message || 'Error al conectar con el servidor');
  }
};

// Obtener proveedores
export const getProveedores = async (page = 1, limit = 5) => {
  try {
    let url = `${API_URL}/api/proveedores?pagina=${page}&limit=${limit}`;
    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al obtener los proveedores');
    }
    const data = await response.json();
    return { success: true, data: data };
  } catch (error) {
    console.error('Error en getProveedores API call:', error);
    if (error instanceof Response) {
      try {
        const errorBody = await error.json();
        return { error: true, status: error.status, detalles: errorBody.message || `Error HTTP ${error.status}` };
      } catch (jsonError) {
        return { error: true, status: error.status, detalles: `Error HTTP ${error.status}` };
      }
    } else {
      return { error: true, status: 500, detalles: error.message || 'Error desconocido al obtener proveedores' };
    }
  }
};
