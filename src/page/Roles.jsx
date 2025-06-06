import { useEffect, useState, useCallback } from 'react';
import {
  Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert, IconButton, Stack, Pagination, Button, Snackbar, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Grid, TextField, Checkbox, Chip
} from '@mui/material';
import { getRoles, createRol, updateRol, deleteRol, updateEstadoRol, getRolById } from '../api';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import Buscador from '../components/Buscador';
import CambiarEstado from '../components/CambiarEstado';
import Eliminar from '../components/Eliminar';
import AddIcon from '@mui/icons-material/Add';
import { useSearchParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import InfoIcon from '@mui/icons-material/Info';
import SecurityIcon from '@mui/icons-material/Security';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

const ROLES_POR_PAGINA = 5;

const PERMISOS_DISPONIBLES = [
  { id: 1, nombre: "Dashboard" },
  { id: 2, nombre: "Usuarios" },
  { id: 3, nombre: "Roles" },
  { id: 4, nombre: "Compras" },
  { id: 5, nombre: "Proveedores" },
  { id: 6, nombre: "Categorías" },
  { id: 7, nombre: "Productos" },
  { id: 8, nombre: "Ventas" },
  { id: 9, nombre: "Clientes" }
];

const Roles = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(''); // Error para la carga principal de la lista
  
  const [searchParams, setSearchParams] = useSearchParams();
  const [pagina, setPagina] = useState(parseInt(searchParams.get('page')) || 1);
  const [busqueda, setBusqueda] = useState(searchParams.get('search') || '');

  const [totalPaginasAPI, setTotalPaginasAPI] = useState(1);
  
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const [eliminarOpen, setEliminarOpen] = useState(false);
  const [rolEliminar, setRolEliminar] = useState(null);
  
  const [crearOpen, setCrearOpen] = useState(false);
  const [nuevoRol, setNuevoRol] = useState({ nombre: '', descripcion: '', permisos_ids: [] });
  const [crearLoading, setCrearLoading] = useState(false);
  const [crearError, setCrearError] = useState(''); // Para Alert dentro del diálogo Crear

  const [editRolOpen, setEditRolOpen] = useState(false);
  const [rolAEditar, setRolAEditar] = useState(null);
  const [editRolData, setEditRolData] = useState({ nombre: '', descripcion: '', permisos_ids: [] });
  const [originalEditRolData, setOriginalEditRolData] = useState(null); // Nuevo estado para datos originales
  const [editRolLoading, setEditRolLoading] = useState(false);
  const [editRolError, setEditRolError] = useState(''); // Para Alert dentro del diálogo Editar

  const [verDetalleOpen, setVerDetalleOpen] = useState(false);
  const [rolDetalle, setRolDetalle] = useState(null);
  const [detalleLoading, setDetalleLoading] = useState(false);
  const [detalleError, setDetalleError] = useState(''); // Para Alert dentro del diálogo VerDetalle

  const showAlert = (message, severity = 'info') => {
    // console.log(`DEBUG Roles.jsx: showAlert - Message: "${message}", Severity: "${severity}"`);
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ open: false, message: '', severity: 'info' });
  };

  const fetchRolesCallback = useCallback(async (currentPage, currentSearch) => {
    setLoading(true);
    setError('');
    try {
      const result = await getRoles(currentPage, ROLES_POR_PAGINA, currentSearch);
      if (result.error) {
        setError(result.detalles || 'Error al cargar roles.');
        setRoles([]);
        setTotalPaginasAPI(1);
      } else if (result.success && result.data) {
        setRoles(result.data.roles || []);
        setTotalPaginasAPI(result.data.totalPaginas || result.data.paginacion?.totalPaginas || 1);
        if (currentPage > (result.data.totalPaginas || result.data.paginacion?.totalPaginas || 1) && (result.data.totalPaginas || result.data.paginacion?.totalPaginas || 1) > 0) {
            const newPage = result.data.totalPaginas || result.data.paginacion.totalPaginas;
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.set('page', newPage.toString());
            setSearchParams(newSearchParams, { replace: true });
        }
      } else {
        setError('No se recibieron datos de roles o el formato es incorrecto.');
        setRoles([]);
        setTotalPaginasAPI(1);
      }
    } catch (err) {
      setError('Error inesperado al cargar roles: ' + (err.message || ''));
      setRoles([]);
      setTotalPaginasAPI(1);
    } finally {
      setLoading(false);
    }
  }, [searchParams, setSearchParams]); 

  useEffect(() => {
    const pageFromUrl = parseInt(searchParams.get('page')) || 1;
    const searchFromUrl = searchParams.get('search') || '';

    if (pageFromUrl !== pagina) {
      setPagina(pageFromUrl);
    }
    if (searchFromUrl !== busqueda) {
      setBusqueda(searchFromUrl);
    }
    fetchRolesCallback(pageFromUrl, searchFromUrl);
  }, [searchParams, fetchRolesCallback]);

  const handleChangePagina = (event, value) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('page', value.toString());
    setSearchParams(newSearchParams);
  };

  const handleSearchChange = (e) => {
    const newSearchTerm = e.target.value;
    setBusqueda(newSearchTerm); 

    const newSearchParams = new URLSearchParams(searchParams);
    if (newSearchTerm) {
      newSearchParams.set('search', newSearchTerm);
    } else {
      newSearchParams.delete('search');
    }
    newSearchParams.set('page', '1');
    setSearchParams(newSearchParams);
  };

  const rolesFiltrados = roles.filter((rol) => {
    if (!busqueda) return true;
    const terminoBusquedaLower = busqueda.toLowerCase().trim();

    if (terminoBusquedaLower === "activo") {
      return rol.estado === true || rol.estado === 1 || rol.estado === 'true';
    }
    if (terminoBusquedaLower === "inactivo") {
      return !(rol.estado === true || rol.estado === 1 || rol.estado === 'true');
    }
    return (
      rol.nombre?.toLowerCase().includes(terminoBusquedaLower)
      // No buscar por descripción
    );
  });

  const handleEditarRol = async (rol) => {
    setRolAEditar(rol);
    setEditRolOpen(true);
    setEditRolLoading(true);
    setEditRolError('');
    try {
      const rolId = parseInt(rol.idrol, 10);
      if (isNaN(rolId)) {
          throw new Error("ID de rol inválido para editar.");
      }
      const data = await getRolById(rolId);
      // Convertir permisos asociados a un array de IDs
      const permisosIds = data.permisos_asociados ? data.permisos_asociados.map(p => parseInt(p.permisos_idpermisos || p.id, 10)).filter(id => !isNaN(id)) : [];
      
      const fetchedRolData = {
          nombre: data.nombre || '',
          descripcion: data.descripcion || '',
          permisos_ids: permisosIds // Usamos permisos_ids para mantener consistencia con el estado local
      };
      
      setEditRolData(fetchedRolData); // Establecer datos para el formulario
      setOriginalEditRolData(fetchedRolData); // Guardar datos originales

    } catch (err) {
      const errorMsg = 'Error al cargar los datos del rol para editar: ' + (err.message || '');
      setEditRolError(errorMsg);
      Swal.fire({
        icon: 'error',
        title: 'Error al Cargar Datos',
        text: errorMsg,
        confirmButtonColor: '#2E8B57',
        background: '#fff',
        customClass: {
          popup: 'animated fadeInDown'
        },
        zIndex: 99999,
        didOpen: (popup) => {
          popup.style.zIndex = 99999;
        }
      });
    } finally {
      setEditRolLoading(false);
    }
  };

  const handleEditRolFormChange = (e) => {
    const { name, value } = e.target;
    setEditRolData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditRolPermisoToggle = (id) => {
    setEditRolData(prev => {
      const yaSeleccionado = prev.permisos_ids.includes(id);
      return {
        ...prev,
        permisos_ids: yaSeleccionado
          ? prev.permisos_ids.filter(pid => pid !== id)
          : [...prev.permisos_ids, id]
      };
    });
  };

  const handleGuardarEdicionRol = async (e) => {
    e.preventDefault();
    if (!rolAEditar || !originalEditRolData) return;

    setEditRolLoading(true);
    setEditRolError('');

    const datosParaEnviar = {};
    let hasChanges = false;

    // Comparar nombre
    if (editRolData.nombre !== originalEditRolData.nombre) {
        datosParaEnviar.nombre = editRolData.nombre;
        hasChanges = true;
    }

    // Comparar descripción (considerando vacío vs null/undefined original)
    // Solo enviar si ha cambiado Y no está vacía en el formulario O estaba vacía/null/undefined originalmente y ahora tiene valor.
    const originalDesc = originalEditRolData.descripcion || ''; // Tratar null/undefined como vacío original
    const currentDesc = editRolData.descripcion || ''; // Tratar null/undefined como vacío actual
    
    if (currentDesc !== originalDesc) {
         // Si la descripción actual no está vacía, la incluimos.
         // Si estaba vacía y ahora está vacía, no hay cambio significativo para enviar.
         // Si tenía valor y ahora está vacía, enviamos null o una cadena vacía si el backend lo permite para borrarla.
         // Basándonos en la doc (opcional, solo enviar si se modifica), enviemos solo si tiene valor.
         // Si necesitas poder borrar la descripción, ajusta aquí para enviar null o ''.
        datosParaEnviar.descripcion = currentDesc; // Siempre enviar el valor actual si cambió
        hasChanges = true;
    }


    // Comparar permisos_ids (orden no importa en la comparación de arrays como conjuntos)
    const originalPermisos = originalEditRolData.permisos_ids.slice().sort(); // Clonar y ordenar para comparación
    const currentPermisos = editRolData.permisos_ids.slice().sort(); // Clonar y ordenar

    if (JSON.stringify(originalPermisos) !== JSON.stringify(currentPermisos)) {
        datosParaEnviar.permisos = editRolData.permisos_ids; // Usar la clave 'permisos' que espera el backend
        hasChanges = true;
    }

    if (!hasChanges) {
        Swal.fire({
            icon: 'info',
            title: 'Sin Cambios',
            text: 'No hay cambios para guardar',
            confirmButtonColor: '#2E8B57',
            background: '#fff',
            customClass: {
              popup: 'animated fadeInDown'
            },
            zIndex: 99999,
            didOpen: (popup) => {
              popup.style.zIndex = 99999;
            }
          });
          setEditRolLoading(false);
          return;
    }

    try {
      await updateRol(parseInt(rolAEditar.idrol, 10), datosParaEnviar);
      Swal.fire({
        icon: 'success',
        title: '¡Rol Actualizado!',
        text: 'Los cambios han sido guardados correctamente',
        timer: 2000,
        showConfirmButton: false,
        position: 'center',
        background: '#fff',
        customClass: {
          popup: 'animated fadeInDown'
        },
        zIndex: 99999,
        didOpen: (popup) => {
          popup.style.zIndex = 99999;
        }
      });
      setEditRolOpen(false);
      setRolAEditar(null);
      const currentPageFromUrl = parseInt(searchParams.get('page')) || 1;
      const currentSearchFromUrl = searchParams.get('search') || '';
      fetchRolesCallback(currentPageFromUrl, currentSearchFromUrl); 
    } catch (err) {
      const errorMsg = err.message || 'Error al guardar el rol.';
      setEditRolError(errorMsg);
      Swal.fire({
        icon: 'error',
        title: 'Error al Actualizar',
        text: errorMsg,
        confirmButtonColor: '#2E8B57',
        background: '#fff',
        customClass: {
          popup: 'animated fadeInDown'
        },
        zIndex: 99999,
        didOpen: (popup) => {
          popup.style.zIndex = 99999;
        }
      });
    } finally {
      setEditRolLoading(false);
    }
  };

  const handleCerrarEdicionRol = () => {
    setEditRolOpen(false);
    setRolAEditar(null);
    setEditRolData({ nombre: '', descripcion: '', permisos_ids: [] });
    setOriginalEditRolData(null); // Limpiar datos originales al cerrar
    setEditRolError('');
  };

  const handleVerDetalle = async (rol) => {
    setVerDetalleOpen(true);
    setDetalleLoading(true);
    setDetalleError('');
    try {
      const rolId = parseInt(rol.idrol, 10);
      if (isNaN(rolId)) {
          throw new Error("ID de rol inválido para ver detalle.");
      }
      const data = await getRolById(rolId);
      setRolDetalle(data);
    } catch (err) {
      const errorMsg = err.message || 'Error al cargar detalle del rol.';
      setDetalleError(errorMsg);
      Swal.fire({
        icon: 'error',
        title: 'Error al Cargar Detalle',
        text: errorMsg,
        confirmButtonColor: '#2E8B57',
        background: '#fff',
        customClass: {
          popup: 'animated fadeInDown'
        },
        zIndex: 99999,
        didOpen: (popup) => {
          popup.style.zIndex = 99999;
        }
      });
    } finally {
      setDetalleLoading(false);
    }
  };

  const handleCrearRol = async (e) => {
    e.preventDefault();
    setCrearLoading(true);
    setCrearError('');
    try {
      if (!nuevoRol.nombre) { 
        setCrearError('El nombre del rol es obligatorio.');
        setCrearLoading(false);
        return;
      }
      const payload = {
          nombre: nuevoRol.nombre,
          descripcion: nuevoRol.descripcion,
          permisos_ids: nuevoRol.permisos_ids
      };
      await createRol(payload);
      setCrearOpen(false);
      Swal.fire({
        icon: 'success',
        title: '¡Rol Creado!',
        text: 'El rol ha sido registrado correctamente',
        timer: 2000,
        showConfirmButton: false,
        position: 'center',
        background: '#fff',
        customClass: {
          popup: 'animated fadeInDown'
        },
        zIndex: 99999,
        didOpen: (popup) => {
          popup.style.zIndex = 99999;
        }
      });
      setNuevoRol({ nombre: '', descripcion: '', permisos_ids: [] }); 
      
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('page', '1');
      setSearchParams(newSearchParams);
    } catch (err) {
      const errorMsg = err.message || 'Error al crear el rol.';
      setCrearError(errorMsg);
      Swal.fire({
        icon: 'error',
        title: 'Error al Crear Rol',
        text: errorMsg,
        confirmButtonColor: '#2E8B57',
        background: '#fff',
        customClass: {
          popup: 'animated fadeInDown'
        },
        zIndex: 99999,
        didOpen: (popup) => {
          popup.style.zIndex = 99999;
        }
      });
    } finally {
      setCrearLoading(false);
    }
  };

  const handlePermisoToggle = (id) => {
    setNuevoRol(prev => {
      const yaSeleccionado = prev.permisos_ids.includes(id);
      return {
        ...prev,
        permisos_ids: yaSeleccionado
          ? prev.permisos_ids.filter(pid => pid !== id)
          : [...prev.permisos_ids, id]
      };
    });
  };

  const handleEliminadoExitoso = async (idRolEliminado) => {
    setEliminarOpen(false);
    Swal.fire({
      icon: 'success',
      title: '¡Rol Eliminado!',
      text: 'El rol ha sido eliminado correctamente',
      timer: 2000,
      showConfirmButton: false,
      position: 'center',
      background: '#fff',
      customClass: {
        popup: 'animated fadeInDown'
      },
      zIndex: 99999,
      didOpen: (popup) => {
        popup.style.zIndex = 99999;
      }
    });
    
    // No modificamos el estado local 'roles' directamente para paginación
    // setRoles((prev) => prev.filter(r => r.idrol !== idRolEliminado));

    // Re-obtener la lista y verificar la paginación
    const currentSearchFromUrl = searchParams.get('search') || '';
    let currentPageFromUrl = parseInt(searchParams.get('page')) || 1;

    // Obtener el nuevo total de páginas después de la eliminación
    // Una forma es hacer una pequeña llamada solo para obtener la paginación,
    // o simplemente refetching la página actual y manejar si está vacía.
    // La opción de refetch y manejar si está vacía es más simple.

    // Refetch la página actual. fetchRolesCallback ya maneja el caso de página vacía al ir a la última.
    fetchRolesCallback(currentPageFromUrl, currentSearchFromUrl);

  };

  // console.log("RENDER Roles.jsx - snackbar:", snackbar);

  return (
    <Box p={3} sx={{ position: 'relative' }}>
      <Typography variant="h5" gutterBottom>Roles Registrados</Typography>
      <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" mb={2} gap={2}>
        <Box sx={{ flexGrow: 1, width: {xs: '100%', sm: 350} }}>
          <Buscador
            value={busqueda}
            onChange={handleSearchChange}
            placeholder="Buscar rol (Nombre, Activo...)"
          />
        </Box>
        <Button
          variant="contained"
          color="success"
          onClick={() => { 
            setNuevoRol({ nombre: '', descripcion: '', permisos_ids: [] }); 
            setCrearError(''); // Limpiar error del diálogo al abrir
            setCrearOpen(true);
          }}
          sx={{ minWidth: 140, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}
          startIcon={<AddIcon />}
        >
          Registrar Rol
        </Button>
      </Box>
      <Box mb={2} height={40} display="flex" alignItems="center" justifyContent="center">
        {loading && <CircularProgress size={28} />}
        {error && !loading && <Alert severity="error" sx={{ width: '100%' }}>{error}</Alert>}
      </Box>
      <TableContainer 
        component={Paper} 
        sx={{ 
          boxShadow: 2,
          position: 'relative',
          zIndex: 1
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><b>#</b></TableCell>
              <TableCell><b>Nombre</b></TableCell>
              <TableCell align="center"><b>Estado</b></TableCell>
              <TableCell align="center"><b>Acciones</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading && rolesFiltrados.length === 0 && !error && (
              <TableRow>
                <TableCell colSpan={4} align="center"> 
                  {busqueda ? 'No se encontraron roles que coincidan con la búsqueda.' : 'No hay roles registrados.'}
                </TableCell>
              </TableRow>
            )}
            {rolesFiltrados.map((rol, idx) => {
              const rolActivo = rol.estado === true || rol.estado === 1 || rol.estado === 'true';
              return (
              <TableRow key={rol.idrol || idx}>
                <TableCell>{(pagina - 1) * ROLES_POR_PAGINA + idx + 1}</TableCell>
                <TableCell>{rol.nombre}</TableCell>
                <TableCell align="center">
                  <CambiarEstado
                    id={rol.idrol}
                      estadoActual={rolActivo}
                    onEstadoCambiado={(idRol, nuevoEstado, errorMsg) => {
                      if (errorMsg) {
                        showAlert(`Error al cambiar estado: ${errorMsg}`, 'error');
                      } else {
                        setRoles((prev) => prev.map(r => r.idrol === idRol ? { ...r, estado: nuevoEstado } : r));
                        showAlert(`Estado del rol ${rol.nombre} cambiado.`, 'success');
                      }
                    }}
                    updateEstadoApi={updateEstadoRol}
                  />
                </TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={0.5} justifyContent="center">
                    <IconButton color="info" size="small" onClick={() => handleVerDetalle(rol)}><VisibilityIcon /></IconButton>
                      {rolActivo && (
                        <>
                    <IconButton color="warning" size="small" onClick={() => handleEditarRol(rol)}><EditIcon /></IconButton>
                    {rol.idrol !== 1 && (
                      <IconButton color="error" size="small" onClick={() => { setRolEliminar(rol); setEliminarOpen(true); }}><DeleteIcon /></IconButton>
                          )}
                        </>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      {!loading && totalPaginasAPI > 1 && (
        <Stack direction="row" justifyContent="center" alignItems="center" mt={3}>
          <Pagination
            count={totalPaginasAPI}
            page={pagina}
            onChange={handleChangePagina}
            color="primary"
            showFirstButton 
            showLastButton
          />
        </Stack>
      )}
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.severity === 'error' ? 6000 : 3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        key={snackbar.message + snackbar.severity + snackbar.open.toString()} // Key más única
      >
        <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity} 
            sx={{ width: '100%' }}
        >
            {snackbar.message}
        </Alert>
      </Snackbar>

      <Dialog open={crearOpen} onClose={() => setCrearOpen(false)} maxWidth="md" fullWidth
        scroll="paper"
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          backgroundColor: '#f8f9fa',
          borderBottom: '1px solid #e0e0e0',
          py: 2.5
        }}>
          <AddIcon color="primary" sx={{ fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Registrar Nuevo Rol
          </Typography>
        </DialogTitle>
        <form onSubmit={handleCrearRol} autoComplete="off">
          <DialogContent dividers sx={{ p: 3, backgroundColor: '#fff', maxHeight: '70vh', overflowY: 'auto' }}>
            <Grid container spacing={3}>
              {/* Información General */}
              <Grid item xs={12} md={6}>
                <Paper elevation={0} sx={{ p: 3, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <InfoIcon color="primary" sx={{ fontSize: 24 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Información General</Typography>
                  </Box>
                  <Grid container spacing={2}>
              <Grid item xs={12}> 
                <TextField
                  label="Nombre del Rol"
                  name="nombre"
                  value={nuevoRol.nombre}
                  onChange={e => setNuevoRol(prev => ({ ...prev, nombre: e.target.value }))}
                  fullWidth
                  required
                  autoFocus
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Descripción del Rol"
                  name="descripcion"
                  value={nuevoRol.descripcion}
                  onChange={e => setNuevoRol(prev => ({ ...prev, descripcion: e.target.value }))}
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Ingrese una descripción detallada del rol..."
                />
              </Grid>
                  </Grid>
                </Paper>
              </Grid>
              {/* Permisos Asignados */}
              <Grid item xs={12} md={6}>
                <Paper elevation={0} sx={{ p: 3, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <SecurityIcon color="primary" sx={{ fontSize: 24 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Permisos Asignados</Typography>
                  </Box>
                  <Grid container spacing={2}>
                  {PERMISOS_DISPONIBLES.map(permiso => (
                      <Grid item xs={12} sm={6} md={6} key={permiso.id}>
                        <Paper
                          elevation={nuevoRol.permisos_ids.includes(permiso.id) ? 3 : 0}
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            border: nuevoRol.permisos_ids.includes(permiso.id) ? '2px solid #1976d2' : '1px solid #e0e0e0',
                            backgroundColor: nuevoRol.permisos_ids.includes(permiso.id) ? '#e3f2fd' : '#fff',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              boxShadow: '0 2px 8px rgba(25, 118, 210, 0.12)',
                              borderColor: '#1976d2',
                            },
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                          }}
                          onClick={() => handlePermisoToggle(permiso.id)}
                        >
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {permiso.nombre} (ID: {permiso.id})
                        </Typography>
                        </Paper>
                    </Grid>
                  ))}
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
            {crearError && <Alert severity="error" sx={{ mt: 2 }}>{crearError}</Alert>}
          </DialogContent>
          <DialogActions sx={{ p: 2.5, backgroundColor: '#f8f9fa', borderTop: '1px solid #e0e0e0' }}>
            <Button onClick={() => setCrearOpen(false)} color="secondary" disabled={crearLoading} sx={{ borderRadius: 2, textTransform: 'none', px: 3, py: 1, fontWeight: 600, boxShadow: 'none', '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' } }}>
              Cancelar
            </Button>
            <Button type="submit" color="primary" disabled={crearLoading} sx={{ borderRadius: 2, textTransform: 'none', px: 3, py: 1, fontWeight: 600, boxShadow: 'none', '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' } }}>
              {crearLoading ? <CircularProgress size={18} /> : 'Registrar Rol'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      
       {rolDetalle && (
        <Dialog open={verDetalleOpen} onClose={() => setVerDetalleOpen(false)} maxWidth="md" fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              overflow: 'hidden'
            }
          }}
        >
          <DialogTitle sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            backgroundColor: '#f8f9fa',
            borderBottom: '1px solid #e0e0e0',
            py: 2.5
          }}>
            <EditIcon color="primary" sx={{ fontSize: 28 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Detalle de Rol
            </Typography>
          </DialogTitle>
          <DialogContent dividers sx={{ p: 3, backgroundColor: '#fff' }}>
            {detalleLoading && <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px"><CircularProgress size={40} /></Box>}
            {detalleError && <Alert severity="error" sx={{ mb: 2 }}>{detalleError}</Alert>}
                {!detalleLoading && !detalleError && rolDetalle && (
              <Box mt={2}>
                <Grid container spacing={3}>
                  {/* Información General */}
                  <Grid item xs={12} md={6}>
                    <Paper elevation={0} sx={{ p: 3, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <InfoIcon color="primary" sx={{ fontSize: 24 }} />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>Información General</Typography>
                      </Box>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>ID del Rol</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>{rolDetalle.idrol}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>Nombre del Rol</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>{rolDetalle.nombre}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>Estado</Typography>
                          <Chip
                            icon={rolDetalle.estado ? <CheckCircleIcon /> : <CancelIcon />}
                            label={rolDetalle.estado ? 'Activo' : 'Inactivo'}
                            color={rolDetalle.estado ? 'success' : 'error'}
                            size="small"
                            sx={{ mt: 0.5, '& .MuiChip-label': { fontWeight: 500 } }}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>Descripción</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500, backgroundColor: '#fff', p: 2, borderRadius: 1, border: '1px solid #e0e0e0', minHeight: '60px' }}>
                            {rolDetalle.descripcion || 'Sin descripción'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                  {/* Permisos Asociados */}
                  <Grid item xs={12} md={6}>
                    <Paper elevation={0} sx={{ p: 3, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <SecurityIcon color="primary" sx={{ fontSize: 24 }} />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>Permisos Asociados</Typography>
                      </Box>
                        {rolDetalle.permisos_asociados && rolDetalle.permisos_asociados.length > 0 ? (
                        <Grid container spacing={2}>
                          {rolDetalle.permisos_asociados.map((p, idx) => (
                            <Grid item xs={12} sm={6} md={6} key={p.permisos_idpermisos || p.id || idx}>
                              <Paper elevation={0} sx={{ p: 2, backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: 1, height: '100%', transition: 'transform 0.2s, box-shadow 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' } }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                                  {p.permiso?.nombre || `ID: ${p.permisos_idpermisos || p.id}`}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {p.permiso?.descripcion || 'Sin descripción'}
                                </Typography>
                              </Paper>
                            </Grid>
                                ))}
                        </Grid>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ backgroundColor: '#fff', p: 2, borderRadius: 1, border: '1px solid #e0e0e0' }}>
                          No hay permisos asociados.
                        </Typography>
                      )}
                    </Paper>
                  </Grid>
                </Grid>
                    </Box>
                )}
            </DialogContent>
          <DialogActions sx={{ p: 2.5, backgroundColor: '#f8f9fa', borderTop: '1px solid #e0e0e0' }}>
            <Button onClick={() => setVerDetalleOpen(false)} variant="contained" color="primary" sx={{ borderRadius: 2, textTransform: 'none', px: 3, py: 1, fontWeight: 600, boxShadow: 'none', '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' } }}>
              Cerrar
            </Button>
            </DialogActions>
        </Dialog>
       )}

      <Dialog open={editRolOpen} onClose={handleCerrarEdicionRol} maxWidth="md" fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          backgroundColor: '#f8f9fa',
          borderBottom: '1px solid #e0e0e0',
          py: 2.5
        }}>
          <EditIcon color="primary" sx={{ fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Editar Rol
          </Typography>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3, backgroundColor: '#fff' }}>
          {editRolLoading && <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px"><CircularProgress size={40} /></Box>}
          {editRolError && <Alert severity="error" sx={{ mb: 2 }}>{editRolError}</Alert>}
            {!editRolLoading && !editRolError && rolAEditar && (
            <Box component="form" onSubmit={handleGuardarEdicionRol} noValidate>
              <Grid container spacing={3}>
                {/* Información General */}
                <Grid item xs={12} md={6}>
                  <Paper elevation={0} sx={{ p: 3, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <InfoIcon color="primary" sx={{ fontSize: 24 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>Información General</Typography>
                    </Box>
                    <Grid container spacing={2}>
                <Grid item xs={12}> 
                  <TextField
                    label="Nombre del Rol"
                    name="nombre"
                    value={editRolData.nombre}
                    onChange={handleEditRolFormChange}
                    fullWidth
                    required
                    autoFocus
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Descripción del Rol"
                    name="descripcion"
                    value={editRolData.descripcion}
                    onChange={handleEditRolFormChange}
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Ingrese una descripción detallada del rol..."
                  />
                </Grid>
                    </Grid>
                  </Paper>
                </Grid>
                {/* Permisos Asignados */}
                <Grid item xs={12} md={6}>
                  <Paper elevation={0} sx={{ p: 3, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <SecurityIcon color="primary" sx={{ fontSize: 24 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>Permisos Asignados</Typography>
                    </Box>
                    <Grid container spacing={2}>
                      {PERMISOS_DISPONIBLES.map(permiso => (
                        <Grid item xs={12} sm={6} md={6} key={permiso.id}>
                          <Paper
                            elevation={editRolData.permisos_ids.includes(permiso.id) ? 3 : 0}
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              border: editRolData.permisos_ids.includes(permiso.id) ? '2px solid #1976d2' : '1px solid #e0e0e0',
                              backgroundColor: editRolData.permisos_ids.includes(permiso.id) ? '#e3f2fd' : '#fff',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              '&:hover': {
                                boxShadow: '0 2px 8px rgba(25, 118, 210, 0.12)',
                                borderColor: '#1976d2',
                              },
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2,
                            }}
                            onClick={() => handleEditRolPermisoToggle(permiso.id)}
                          >
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                  {permiso.nombre} (ID: {permiso.id})
                              </Typography>
                          </Paper>
                          </Grid>
                      ))}
                      </Grid>
                    </Paper>
                  </Grid>
              </Grid>
            </Box>
            )}
          </DialogContent>
        <DialogActions sx={{ p: 2.5, backgroundColor: '#f8f9fa', borderTop: '1px solid #e0e0e0' }}>
          <Button onClick={handleCerrarEdicionRol} color="secondary" sx={{ borderRadius: 2, textTransform: 'none', px: 3, py: 1, fontWeight: 600, boxShadow: 'none', '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' } }}>
            Cancelar
              </Button>
          <Button type="submit" color="primary" sx={{ borderRadius: 2, textTransform: 'none', px: 3, py: 1, fontWeight: 600, boxShadow: 'none', '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' } }}>
            Guardar Cambios
          </Button>
          </DialogActions>
      </Dialog>
      <Eliminar
        id={rolEliminar?.idrol}
        open={eliminarOpen}
        onClose={() => setEliminarOpen(false)}
        onEliminado={handleEliminadoExitoso} // Para éxito
        onError={(errorMsg) => showAlert(`Error al eliminar rol: ${errorMsg}`, 'error')} // Para error
        nombre={rolEliminar ? rolEliminar.nombre : ''}
        tipoEntidad="rol"
        deleteApi={deleteRol}
      />
    </Box>
  );
};

// Agregar estilos globales para SweetAlert2
const style = document.createElement('style');
style.textContent = `
  .swal2-container {
    z-index: 99999 !important;
  }
  .swal2-popup {
    z-index: 99999 !important;
  }
`;
document.head.appendChild(style);

export default Roles;