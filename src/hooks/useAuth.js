import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api'; // Asumiendo que api está exportado desde tu archivo api.js
import PropTypes from 'prop-types';

// Definir la estructura del usuario para PropTypes (similar a la interfaz TypeScrip)
// interface User {
//   id: number;
//   nombre: string;
//   email: string;
//   rol: number;
//   permisos: string[];
// }

export const useAuth = () => {
  // Intentar cargar el usuario desde localStorage al inicio
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        // Parsear el usuario almacenado. Si falla, limpiar y tratar como no logueado.
        const parsedUser = JSON.parse(storedUser);
        // Validar la estructura esencial del objeto usuario (sin incluir el token, que se guarda aparte)
        if (parsedUser && typeof parsedUser === 'object' && Array.isArray(parsedUser.permisos)){
             // Ahora la validación es correcta: el objeto parsedUser recuperado del localStorage
             // debe tener la propiedad 'permisos' que sea un array.
             setUser(parsedUser);
        } else {
            console.error('Invalid user structure in localStorage', parsedUser);
            localStorage.removeItem('user');
            localStorage.removeItem('token'); // Limpiar token también por si acaso
            setUser(null);
        }
      } catch (e) {
        console.error('Failed to parse user from localStorage', e);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      // Usar la instancia de api para el login. El interceptor de request añadirá el token
      // (aunque para login la primera vez no hay token, es para peticiones posteriores).
      // El interceptor de response manejará errores 401 y 403.
      const response = await api.post('/api/usuarios/login', {
        email,
        password,
      });

      // La guía dice que la respuesta exitosa tiene success: true y data: { usuario: {...}, token: '...' }
      if (response.data && response.data.success && response.data.data) {
        const { usuario, token } = response.data.data;

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(usuario));

        setUser(usuario); // Actualizar el estado del usuario en el hook
        return { success: true };
      } else if (response.data && response.data.success === false) {
         // Si response.data.success es false, esto ya es un error manejado por el backend
         // No necesitamos loggearlo aquí.
         // console.log('Login API error (handled by backend response): ', response.data);
         return { 
            success: false, 
            error: response.data.detalles || response.data.error || 'Error desconocido en la respuesta de login' 
         };
      }
       else {
           // Esto manejaría una estructura de respuesta inesperada que no es ni éxito ni error con success: false
           // console.error('Unexpected response structure from login:', response);
            return { success: false, error: 'Formato de respuesta de login inesperado.' };
       }
    } catch (error) {
        // Este catch maneja errores de red, errores 401/403 (aunque 401/403 son manejados por el interceptor para redirigir)
        // y otros errores no controlados específicamente por la respuesta del backend (ej: throw new Error en la api call)

        // console.error('Login API error (caught): ', error.response?.data || error.message || error);
         // Devolvemos el error para que el componente que llama (LoginForm) lo maneje en la UI.
         return { 
            success: false, 
            error: error.response?.data?.detalles || error.response?.data?.error || error.message || 'Error al iniciar sesión' 
        };
    }
  };

  const logout = () => {
    // Limpiar datos de sesión y redirigir
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login'); // Redirigir a la página de login
  };

  const hasPermission = (permission) => {
    // Verificar si el usuario existe y si su lista de permisos incluye el permiso requerido
    // Asumiendo que user es el objeto del usuario con la propiedad permisos: string[]
    return (user?.permisos && Array.isArray(user.permisos) && user.permisos.includes(permission)) ?? false;
  };
  
  const isLoggedIn = !!user; // Conveniencia para verificar si hay usuario logueado

  return {
    user,
    loading,
    isLoggedIn,
    login,
    logout,
    hasPermission
  };
};

// PropTypes para validar la forma del objeto usuario si se pasara como prop o similar,
// pero para el hook no es estrictamente necesario a menos que user sea pasado a otro lado.
// user shape validation could be done internally in the hook if needed.

// Opcional: Si decides exportar el Context y Provider para usar useAuth,
// necesitarías definir PropTypes para el contexto si no usas TypeScript. 