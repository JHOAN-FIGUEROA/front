import { useEffect, useState } from 'react';
import {
  Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert, IconButton, Stack, Pagination, Button, Snackbar, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Grid, TextField, Checkbox
} from '@mui/material';
import { getRoles, createRol, updateRol, deleteRol, updateEstadoRol, getRolById } from '../api';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import Buscador from '../components/Buscador';
import Editar from '../components/Editar';
import CambiarEstado from '../components/CambiarEstado';
import Eliminar from '../components/Eliminar';
import Crear from '../components/Crear';
import VerDetalle from '../components/VerDetalle';
import AddIcon from '@mui/icons-material/Add';
import { useSearchParams } from 'react-router-dom';

const ROLES_POR_PAGINA = 5;
const CAMPOS_EDITABLES = [
  { name: 'nombre', label: 'Nombre' },
  { name: 'permisos_ids', label: 'Permisos (IDs separados por coma)', type: 'text', required: false },
];
const CAMPOS_CREAR = [
  { name: 'nombre', label: 'Nombre' },
  { name: 'permisos_ids', label: 'Permisos (IDs separados por coma)', type: 'text', required: false },
];

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
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();

  const initialPage = parseInt(searchParams.get('page')) || 1;
  const [pagina, setPagina] = useState(initialPage);
  const [totalPaginasAPI, setTotalPaginasAPI] = useState(1);
  const [editOpen, setEditOpen] = useState(false);
  const [editRol, setEditRol] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [eliminarOpen, setEliminarOpen] = useState(false);
  const [rolEliminar, setRolEliminar] = useState(null);
  const [crearOpen, setCrearOpen] = useState(false);
  const [crearSuccess, setCrearSuccess] = useState(false);
  const [verDetalleOpen, setVerDetalleOpen] = useState(false);
  const [rolDetalle, setRolDetalle] = useState(null);
  const [detalleLoading, setDetalleLoading] = useState(false);
  const [detalleError, setDetalleError] = useState('');
  const [nuevoRol, setNuevoRol] = useState({ nombre: '', descripcion: '', permisos_ids: [] });
  const [crearLoading, setCrearLoading] = useState(false);
  const [crearError, setCrearError] = useState('');
  const [editRolOpen, setEditRolOpen] = useState(false);
  const [rolAEditar, setRolAEditar] = useState(null);
  const [editRolData, setEditRolData] = useState({ nombre: '', descripcion: '', permisos_ids: [] });
  const [editRolLoading, setEditRolLoading] = useState(false);
  const [editRolError, setEditRolError] = useState('');

  useEffect(() => {
    const fetchRoles = async () => {
      setLoading(true);
      setError('');
      setRoles([]);
      try {
        // Usar getRoles con paginación y búsqueda
        const result = await getRoles(pagina, ROLES_POR_PAGINA, busqueda);

        if (result.error) {
          let errorMessage = result.detalles || 'Error al cargar roles.';
          let errorTitle = 'Error de Carga';

          if (result.status) {
            switch (result.status) {
              case 404:
                errorMessage = 'No se encontraron roles.';
                errorTitle = 'No Encontrado';
                break;
              default:
                errorTitle = `Error ${result.status}`;
            }
          }
          setError(errorMessage);
          setTotalPaginasAPI(1);
        } else if (result.success && result.data) {
          setRoles(result.data.roles || []);
          setTotalPaginasAPI(result.data.totalPaginas || 1);
        }
      } catch (err) {
        setError('Error inesperado al cargar roles.' + err.message);
        setTotalPaginasAPI(1);
      } finally {
        setLoading(false);
      }
    };
    fetchRoles();
  }, [pagina, busqueda]); // Dependencias: pagina y busqueda

  useEffect(() => {
    const pageFromUrl = parseInt(searchParams.get('page')) || 1;
    if (pageFromUrl !== pagina) {
      setPagina(pageFromUrl);
    }
    const searchFromUrl = searchParams.get('search') || '';
    if (searchFromUrl !== busqueda) {
       setBusqueda(searchFromUrl);
    }
  }, [searchParams]);

  // Filtrado por búsqueda (Esta lógica ya no es necesaria aquí, la maneja la API)
  // const rolesFiltrados = roles.filter((rol) => { ... });

  // Paginación (Esta lógica ya no es necesaria aquí, la maneja la API)
  // const totalPaginas = Math.ceil(rolesFiltrados.length / ROLES_POR_PAGINA);
  const rolesPagina = roles; // roles ahora contiene los datos paginados de la API

  const handleChangePagina = (event, value) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('page', value.toString());
    setSearchParams(newSearchParams);
  };

  // Manejar cambio en el buscador (Actualiza URL y dispara useEffect)
  const handleSearchChange = (e) => {
    const newSearchTerm = e.target.value;
    // setBusqueda(newSearchTerm); // Ya no actualizamos el estado local directamente
    const newSearchParams = new URLSearchParams(searchParams);
    if (newSearchTerm) {
       newSearchParams.set('search', newSearchTerm);
    } else {
       newSearchParams.delete('search');
    }
    newSearchParams.set('page', '1'); // Reiniciar a la página 1 en nueva búsqueda
    setSearchParams(newSearchParams);
  };

  // Editar rol (ABRIR MODAL PERSONALIZADO)
  const handleEditarRol = async (rol) => {
    setRolAEditar(rol); // Guardamos el rol original para referencia
    setEditRolOpen(true);
    setEditRolLoading(true);
    setEditRolError('');
    try {
      const data = await getRolById(rol.idrol);
      // Asignar descripción si existe, o cadena vacía
      const descripcion = data.descripcion || '';
      // Mapear los permisos_asociados a un array de IDs
      const permisos_ids = data.permisos_asociados ? data.permisos_asociados.map(p => p.permisos_idpermisos) : [];
      setEditRolData({ nombre: data.nombre, descripcion: descripcion, permisos_ids: permisos_ids });
    } catch (err) {
      setEditRolError('Error al cargar los datos del rol para editar.');
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
    if (!rolAEditar) return;
    setEditRolLoading(true);
    setEditRolError('');
    try {
      // Validar campos - Solo nombre es obligatorio
       if (!editRolData.nombre || editRolData.permisos_ids.length === 0) {
        setEditRolError('El nombre y la selección de al menos un permiso son obligatorios.');
        setEditRolLoading(false);
        return;
      }

      // Preparar los datos en el formato que espera el backend
      const datosParaEnviar = {
        nombre: editRolData.nombre,
        permisos: editRolData.permisos_ids
      };

      // Solo agregar descripción si tiene valor
      if (editRolData.descripcion && editRolData.descripcion.trim() !== '') {
        datosParaEnviar.descripcion = editRolData.descripcion;
      }

      await updateRol(rolAEditar.idrol, datosParaEnviar); // Enviar datos en el formato correcto
      setSuccessMsg('Rol actualizado correctamente');
      
      // Cargar datos actualizados después de la edición
      const rolActualizado = await getRolById(rolAEditar.idrol);
      setRoles(prev => prev.map(r => r.idrol === rolAEditar.idrol ? rolActualizado : r));

      setEditRolOpen(false);
      setRolAEditar(null);
      setEditRolData({ nombre: '', descripcion: '', permisos_ids: [] }); // Resetear estado
    } catch (err) {
      setEditRolError(err.message);
    } finally {
      setEditRolLoading(false);
    }
  };

  const handleCerrarEdicionRol = () => {
    setEditRolOpen(false);
    setRolAEditar(null);
    setEditRolData({ nombre: '', descripcion: '', permisos_ids: [] }); // Resetear estado
    setEditRolError('');
  };

  const handleVerDetalle = async (rol) => {
    setVerDetalleOpen(true);
    setDetalleLoading(true);
    setDetalleError('');
    try {
      const data = await getRolById(rol.idrol);
      setRolDetalle(data);
    } catch (err) {
      setDetalleError(err.message);
    } finally {
      setDetalleLoading(false);
    }
  };

  // Lógica para crear rol
  const handleCrearRol = async (e) => {
    e.preventDefault();
    setCrearLoading(true);
    setCrearError('');
    try {
      // Validar campos - Solo nombre es obligatorio
      if (!nuevoRol.nombre || nuevoRol.permisos_ids.length === 0) {
        setCrearError('El nombre y la selección de al menos un permiso son obligatorios.');
        setCrearLoading(false);
        return;
      }
      await createRol(nuevoRol);
      setCrearOpen(false);
      setCrearSuccess(true);

      // Después de crear, recargar los datos de la primera página con la búsqueda actual
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('page', '1');
      // La búsqueda se mantiene si ya existía en la URL
      setSearchParams(newSearchParams);
      // El useEffect dependiente de searchParams (y por lo tanto de pagina y busqueda) se encargará de recargar los datos

      setNuevoRol({ nombre: '', descripcion: '', permisos_ids: [] });
    } catch (err) {
      setCrearError(err.message);
    } finally {
      setCrearLoading(false);
    }
  };

  // Lógica para seleccionar permisos (Modal CREAR)
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

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>Roles Registrados</Typography>
      <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" mb={2} gap={2}>
        <Box sx={{ flexGrow: 1 }}>
          <Buscador
            value={busqueda}
            onChange={handleSearchChange}
            placeholder="Buscar rol..."
          />
        </Box>
        
        <Button
          variant="contained"
          color="success"
          onClick={() => setCrearOpen(true)}
          sx={{ minWidth: 140, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}
          startIcon={<AddIcon />}
        >
          Registrar
        </Button>
      </Box>
      {/* Box para indicadores de carga y error, fuera del flex container principal */}
      <Box mb={2} height={4}>
         {loading && <CircularProgress size={28} />}
         {error && <Alert severity="error" sx={{ width: 'fit-content' }}>{error}</Alert>}
      </Box>
      <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><b>#</b></TableCell>
              <TableCell><b>Nombre</b></TableCell>
              <TableCell align="center"><b>Estado</b></TableCell>
              <TableCell align="center"><b>Acciones</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody key={pagina}>
            {loading ? (
               <TableRow><TableCell colSpan={4} align="center"><CircularProgress size={24} /></TableCell></TableRow>
            ) : rolesPagina.length > 0 ? (
              rolesPagina.map((rol, idx) => (
                <TableRow key={rol.idrol || idx}>
                  <TableCell>{(pagina - 1) * ROLES_POR_PAGINA + idx + 1}</TableCell>
                  <TableCell>{rol.nombre}</TableCell>
                  <TableCell align="center" sx={{ justifyContent: 'center' }}>
                    <CambiarEstado
                      id={rol.idrol}
                      estadoActual={rol.estado === true || rol.estado === 'true' || rol.estado === 1 || rol.estado === '1'}
                      onEstadoCambiado={(nuevoEstado) => {
                        setRoles((prev) => prev.map(r => r.idrol === rol.idrol ? { ...r, estado: nuevoEstado } : r));
                      }}
                      updateEstadoApi={updateEstadoRol}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton color="info" size="small" onClick={() => handleVerDetalle(rol)}><VisibilityIcon /></IconButton>
                    <IconButton color="warning" size="small" onClick={() => handleEditarRol(rol)}><EditIcon /></IconButton>
                    <IconButton color="error" size="small" onClick={() => { setRolEliminar(rol); setEliminarOpen(true); }}><DeleteIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (error ? null : (
              <TableRow>
                <TableCell colSpan={4} align="center">No hay roles registrados.</TableCell>
              </TableRow>
            ))}
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
          />
        </Stack>
      )}
      {/* Snackbar de éxito */}
      <Snackbar
        open={!!successMsg}
        autoHideDuration={3000}
        onClose={() => setSuccessMsg('')}
        message={successMsg}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      />
      {/* Diálogo de eliminar rol */}
      <Eliminar
        id={rolEliminar?.idrol}
        open={eliminarOpen}
        onClose={() => setEliminarOpen(false)}
        onEliminado={() => {
          setEliminarOpen(false);
          setRoles((prev) => prev.filter(r => r.idrol !== rolEliminar?.idrol));
        }}
        nombre={rolEliminar ? rolEliminar.nombre : ''}
        tipoEntidad="rol"
        deleteApi={deleteRol}
      />
      {/* Modal de crear rol personalizado */}
      <Dialog open={crearOpen} onClose={() => setCrearOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleCrearRol} autoComplete="off">
          <DialogTitle>Registrar Rol</DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Nombre"
                  name="nombre"
                  value={nuevoRol.nombre}
                  onChange={e => setNuevoRol(prev => ({ ...prev, nombre: e.target.value }))}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Descripción"
                  name="descripcion"
                  value={nuevoRol.descripcion}
                  onChange={e => setNuevoRol(prev => ({ ...prev, descripcion: e.target.value }))}
                  fullWidth
                  required={false}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Selecciona los permisos:</Typography>
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><b>ID</b></TableCell>
                        <TableCell><b>Nombre</b></TableCell>
                        <TableCell align="center"><b>Seleccionar</b></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {PERMISOS_DISPONIBLES.map(permiso => (
                        <TableRow key={permiso.id}>
                          <TableCell>{permiso.id}</TableCell>
                          <TableCell>{permiso.nombre}</TableCell>
                          <TableCell align="center">
                            <Checkbox
                              checked={nuevoRol.permisos_ids.includes(permiso.id)}
                              onChange={() => handlePermisoToggle(permiso.id)}
                              color="primary"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
            {crearError && <Alert severity="error" sx={{ mt: 2 }}>{crearError}</Alert>}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCrearOpen(false)} color="secondary" disabled={crearLoading}>Cancelar</Button>
            <Button type="submit" color="primary" disabled={crearLoading}>
              {crearLoading ? <CircularProgress size={18} /> : 'Registrar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      <Snackbar open={crearSuccess} autoHideDuration={2000} onClose={() => setCrearSuccess(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity="success" onClose={() => setCrearSuccess(false)}>
          Rol creado correctamente
        </Alert>
      </Snackbar>
      {/* Modal de ver detalle de rol */}
      <VerDetalle
        open={verDetalleOpen}
        onClose={() => {
          setVerDetalleOpen(false);
          setRolDetalle(null);
        }}
        usuarioDetalle={rolDetalle}
        loading={detalleLoading}
        error={detalleError}
      />
      {/* Modal de edición de rol personalizado */}
      <Dialog open={editRolOpen} onClose={handleCerrarEdicionRol} maxWidth="sm" fullWidth>
        <form onSubmit={handleGuardarEdicionRol} autoComplete="off">
          <DialogTitle>Editar Rol: {rolAEditar?.nombre}</DialogTitle>
          <DialogContent dividers>
             {editRolLoading && <CircularProgress />}
             {editRolError && <Alert severity="error">{editRolError}</Alert>}
             {!editRolLoading && !editRolError && rolAEditar && (
                <Grid container spacing={2}>
                   <Grid item xs={12} sm={6}>
                      <TextField
                         label="Nombre"
                         name="nombre"
                         value={editRolData.nombre}
                         onChange={handleEditRolFormChange}
                         fullWidth
                         required
                      />
                   </Grid>
                   <Grid item xs={12} sm={6}>
                      <TextField
                         label="Descripción"
                         name="descripcion"
                         value={editRolData.descripcion}
                         onChange={handleEditRolFormChange}
                         fullWidth
                         required={false}
                      />
                   </Grid>
                   <Grid item xs={12}>
                      <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Selecciona los permisos:</Typography>
                      <TableContainer component={Paper}>
                         <Table size="small">
                            <TableHead>
                               <TableRow>
                                  <TableCell><b>ID</b></TableCell>
                                  <TableCell><b>Nombre</b></TableCell>
                                  <TableCell align="center"><b>Seleccionar</b></TableCell>
                               </TableRow>
                            </TableHead>
                            <TableBody>
                               {PERMISOS_DISPONIBLES.map(permiso => (
                                  <TableRow key={permiso.id}>
                                     <TableCell>{permiso.id}</TableCell>
                                     <TableCell>{permiso.nombre}</TableCell>
                                     <TableCell align="center">
                                        <Checkbox
                                          checked={editRolData.permisos_ids.includes(permiso.id)}
                                          onChange={() => handleEditRolPermisoToggle(permiso.id)}
                                          color="primary"
                                        />
                                     </TableCell>
                                  </TableRow>
                               ))}
                            </TableBody>
                         </Table>
                      </TableContainer>
                   </Grid>
                </Grid>
             )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCerrarEdicionRol} color="secondary" disabled={editRolLoading}>Cancelar</Button>
            <Button type="submit" color="primary" disabled={editRolLoading}>
              {editRolLoading ? <CircularProgress size={18} /> : 'Guardar Cambios'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Roles;