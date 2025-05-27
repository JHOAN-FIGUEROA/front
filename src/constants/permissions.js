export const PERMISSIONS = {
  PROVEEDORES: 'Proveedores',
  CLIENTES: 'Clientes',
  ROLES: 'Roles',
  PRODUCTOS: 'Productos',
  CATEGORIAS: 'Categorias',
  VENTAS: 'Ventas',
  COMPRAS: 'Compras',
  DASHBOARD: 'Dashboard',
  USUARIOS: 'Usuarios',
} ;

export const ROUTE_PERMISSIONS = {
  '/api/proveedores': PERMISSIONS.PROVEEDORES,
  '/api/clientes': PERMISSIONS.CLIENTES,
  '/api/rol': PERMISSIONS.ROLES,
  '/api/productos': PERMISSIONS.PRODUCTOS,
  '/api/categorias': PERMISSIONS.CATEGORIAS,
  '/api/ventas': PERMISSIONS.VENTAS,
  '/api/compras': PERMISSIONS.COMPRAS,
  '/dashboard': PERMISSIONS.DASHBOARD,
  '/config/usuarios': PERMISSIONS.USUARIOS,
  '/config/roles': PERMISSIONS.ROLES,
  '/compras/proveedores': PERMISSIONS.PROVEEDORES,
} ;

// Nota: La guía usaba 'as const', que es sintaxis de TypeScript.
// En JavaScript puro, simplemente exportamos los objetos. 