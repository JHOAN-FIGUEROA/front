import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
// import { api } from '../api'; // Ya no se usa directamente aquí
// import PropTypes from 'prop-types'; // Ya no se necesita si usamos useAuth y no pasamos el usuario directamente
import { useAuth } from '../hooks/useAuth'; // Importar el hook useAuth
import { ROUTE_PERMISSIONS } from '../constants/permissions'; // Importar el mapeo de permisos

// interface ProtectedRouteProps {
//   requiredPermission: string; // Ya no se pasa como prop
//   children: React.ReactNode;
// }

const ProtectedRoute = ({ 
  children,
  // requiredPermission, // Ya no se desestructura aquí
}) => {
  const { user, loading, hasPermission } = useAuth();
  const location = useLocation();
  
  // Obtener el permiso requerido basado en la ruta actual
  const requiredPermission = ROUTE_PERMISSIONS[location.pathname];

  if (loading) {
    // Mostrar un indicador de carga mientras se verifica el estado de autenticación
    return <div>Cargando...</div>; // O un spinner más elaborado
  }

  if (!user) {
    // Si no hay usuario autenticado, redirigir al login, guardando la ubicación actual
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si la ruta no requiere un permiso específico O si el usuario tiene el permiso requerido
  // Nota: Si requiredPermission es undefined, la ruta no está en ROUTE_PERMISSIONS y no se considera protegida por permiso.
  if (requiredPermission && !hasPermission(requiredPermission)) {
    // Si la ruta requiere un permiso y el usuario NO lo tiene, redirigir a una página de acceso denegado
    return <Navigate to="/unauthorized" replace />; // Asegúrate de tener una ruta /unauthorized configurada
  }

  // Si está autenticado y tiene el permiso (o la ruta no requiere permiso específico), renderizar los hijos
  return <>{children}</>;
};

// Ya no necesitamos PropTypes si usamos el hook para manejar el usuario y permisos.
// ProtectedRoute.propTypes = {
//   requiredPermission: PropTypes.string.isRequired,
//   children: PropTypes.node.isRequired,
// };

export default ProtectedRoute; 