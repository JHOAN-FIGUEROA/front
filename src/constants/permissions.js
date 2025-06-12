export const PERMISSIONS = {
  PROVEEDORES: 'Proveedores',
  CLIENTES: 'Clientes',
  ROLES: 'Roles',
  PRODUCTOS: 'Productos',
  CATEGORÍAS: 'Categorías',
  VENTAS: 'Ventas',
  COMPRAS: 'Compras',
  DASHBOARD: 'Dashboard',
  USUARIOS: 'Usuarios',
  UNIDADES: 'Productos',

} ;

export const ROUTE_PERMISSIONS = {
  '/api/proveedores': PERMISSIONS.PROVEEDORES,
  '/api/clientes': PERMISSIONS.CLIENTES,
  '/api/rol': PERMISSIONS.ROLES,
  '/api/productos': PERMISSIONS.PRODUCTOS,
  '/api/unidades': PERMISSIONS.PRODUCTOS,
  '/api/categorias': PERMISSIONS.CATEGORÍAS,
  '/api/ventas': PERMISSIONS.VENTAS,
  '/api/compras': PERMISSIONS.COMPRAS,
  '/dashboard': PERMISSIONS.DASHBOARD,
  '/config/usuarios': PERMISSIONS.USUARIOS,
  '/config/roles': PERMISSIONS.ROLES,
  '/compras/proveedores': PERMISSIONS.PROVEEDORES,
} ;

// Nota: La guía usaba 'as const', que es sintaxis de TypeScript.
// En JavaScript puro, simplemente exportamos los objetos. 