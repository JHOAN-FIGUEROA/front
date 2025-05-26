import { useEffect, useState, useCallback } from 'react';
import {
  Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert, IconButton, Stack, Pagination, Switch, Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, TextField, Snackbar, MenuItem
} from '@mui/material';
import { getUsuarios, getUsuarioById, updateUsuario, getRoles } from '../api';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useSearchParams, useNavigate } from 'react-router-dom';

import Buscador from '../components/Buscador';
import VerDetalle from '../components/VerDetalle';
import Editar from '../components/Editar';
import CambiarEstado from '../components/CambiarEstado';
import Eliminar from '../components/Eliminar';
import Crear from '../components/Crear';

const USUARIOS_POR_PAGINA = 5;
const CAMPOS_EDITABLES = [
  { name: 'tipodocumento', label: 'Tipo de Documento', select: true, options: ['CC', 'CE', 'TI', 'NIT'], required: true },
  { name: 'documento', label: 'Documento', required: true },
  { name: 'nombre', label: 'Nombre', required: true },
  { name: 'apellido', label: 'Apellido', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'municipio', label: 'Municipio', required: false },
  { name: 'barrio', label: 'Barrio', required: false },
  { name: 'dirrecion', label: 'Dirección', required: false },
  { name: 'complemento', label: 'Complemento', required: false },
];

const CAMPOS_CREAR_ORIGINAL = [
  { name: 'tipodocumento', label: 'Tipo de Documento', select: true, options: ['CC', 'CE', 'TI', 'NIT'], required: true },
  { name: 'documento', label: 'Documento', required: true },
  { name: 'nombre', label: 'Nombre', required: true },
  { name: 'apellido', label: 'Apellido', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'password', label: 'Contraseña', type: 'password', required: true },
  { name: 'municipio', label: 'Municipio', required: false },
  { name: 'complemento', label: 'Complemento', required: false },
  { name: 'barrio', label: 'Barrio', required: false },
  { name: 'dirrecion', label: 'Dirección', required: false },
  { name: 'rol_idrol', label: 'Rol', select: true, options: [], required: true },
];

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]); // Usuarios de la página actual, tal como vienen del backend
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [roles, setRoles] = useState([]);
  const [camposCrear, setCamposCrear] = useState(CAMPOS_CREAR_ORIGINAL);
  const [rolSelectOptions, setRolSelectOptions] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [errorCargandoRoles, setErrorCargandoRoles] = useState('');

  const [searchParams, setSearchParams] = useSearchParams();
  
  const [pagina, setPagina] = useState(parseInt(searchParams.get('page')) || 1);
  // 'busqueda' es el término actual en el input, usado para filtrar en el frontend
  const [busqueda, setBusqueda] = useState(searchParams.get('search') || '');

  const [totalPaginasAPI, setTotalPaginasAPI] = useState(1);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [usuarioDetalle, setUsuarioDetalle] = useState(null);
  const [detalleLoading, setDetalleLoading] = useState(false);
  const [detalleError, setDetalleError] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editUsuario, setEditUsuario] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editValidationErrors, setEditValidationErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');
  const [eliminarOpen, setEliminarOpen] = useState(false);
  const [usuarioEliminar, setUsuarioEliminar] = useState(null);
  const [crearOpen, setCrearOpen] = useState(false);
  const [crearSuccess, setCrearSuccess] = useState(false);


  const fetchUsuariosCallback = useCallback(async (currentPage, currentSearchTermFromUrl) => {
    // console.log(`DEBUG: Fetching usuarios - Página: ${currentPage}, Término de búsqueda URL: '${currentSearchTermFromUrl}'`);
    setLoading(true);
    setError('');
    try {
      const result = await getUsuarios(currentPage, USUARIOS_POR_PAGINA, currentSearchTermFromUrl);

      if (result.error) {
        let errorMessage = result.detalles || 'Error al cargar usuarios.';
        setError(errorMessage);
        setUsuarios([]);
        setTotalPaginasAPI(1);
      } else if (result.success && result.data) {
        setUsuarios(result.data.usuarios || []); // Almacena los usuarios de la página actual
        setTotalPaginasAPI(result.data.paginacion?.totalPaginas || 1);
        if (currentPage > (result.data.paginacion?.totalPaginas || 1) && (result.data.paginacion?.totalPaginas || 1) > 0) {
            const newPage = result.data.paginacion.totalPaginas;
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.set('page', newPage.toString());
            setSearchParams(newSearchParams, { replace: true });
        }
      } else {
         setUsuarios([]);
         setTotalPaginasAPI(1);
      }
    } catch (err) {
      setError('Error inesperado al cargar usuarios.' + (err.message || ''));
      setUsuarios([]);
      setTotalPaginasAPI(1);
    } finally {
      setLoading(false);
    }
  }, [searchParams, setSearchParams]); // searchParams aquí para que el callback se actualice si cambia

  useEffect(() => {
    const cargarRoles = async () => {
      setLoadingRoles(true);
      setErrorCargandoRoles('');
      try {
        const result = await getRoles(1, 100); 
        if (result.success && result.data) {
            let rolesArray = [];
            if (result.data.roles && Array.isArray(result.data.roles)) {
                rolesArray = result.data.roles;
            } else if (Array.isArray(result.data)) {
                rolesArray = result.data;
            } else {
                console.error('Formato de roles inesperado:', result.data);
                setErrorCargandoRoles('Error al procesar roles.');
            }
            setRoles(rolesArray);
            const options = rolesArray.map(rol => ({ value: rol.idrol, label: rol.nombre }));
            setRolSelectOptions(options); 
        } else {
          setErrorCargandoRoles(result.detalles || 'Error al obtener la lista de roles.');
        }
      } catch (err) {
        setErrorCargandoRoles('Error al cargar los roles: ' + err.message);
      } finally {
        setLoadingRoles(false);
      }
    };
    cargarRoles();
  }, []); 

  useEffect(() => {
    const currentPageFromUrl = parseInt(searchParams.get('page')) || 1;
    const currentSearchFromUrl = searchParams.get('search') || '';
    
    // console.log(`DEBUG: useEffect[searchParams] - URL Page: ${currentPageFromUrl}, URL Search: '${currentSearchFromUrl}'`);
    // Sincronizar estados locales 'pagina' y 'busqueda' con la URL
    if (currentPageFromUrl !== pagina) {
      setPagina(currentPageFromUrl);
    }
    if (currentSearchFromUrl !== busqueda) {
      setBusqueda(currentSearchFromUrl);
    }

    fetchUsuariosCallback(currentPageFromUrl, currentSearchFromUrl);
  }, [searchParams, fetchUsuariosCallback]);


  const handleChangePagina = (event, value) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('page', value.toString());
    setSearchParams(newSearchParams);
  };

  const handleSearchChange = (e) => {
    const newSearchTerm = e.target.value;
    setBusqueda(newSearchTerm); // Actualiza el estado local para el filtrado inmediato

    // Actualiza la URL. Esto disparará el useEffect de arriba, que llamará a fetchUsuariosCallback
    // con el nuevo término de búsqueda para el backend.
    const newSearchParams = new URLSearchParams(searchParams);
    if (newSearchTerm) {
      newSearchParams.set('search', newSearchTerm);
    } else {
      newSearchParams.delete('search');
    }
    newSearchParams.set('page', '1'); 
    setSearchParams(newSearchParams);
  };
  
  // Lógica de filtrado en el frontend
  const usuariosFiltrados = usuarios.filter(usuario => {
    if (!busqueda) { // Si no hay término en el input 'busqueda', no filtrar adicionalmente en frontend
      return true;
    }

    const terminoBusquedaLower = busqueda.toLowerCase().trim();

    if (terminoBusquedaLower === "activo") {
      return usuario.estado === true || usuario.estado === 'true' || usuario.estado === 1 || usuario.estado === '1';
    }
    if (terminoBusquedaLower === "inactivo") {
      // Asegurarse que la negación cubra todos los casos de "no activo"
      return !(usuario.estado === true || usuario.estado === 'true' || usuario.estado === 1 || usuario.estado === '1');
    }

    // Búsqueda por campos de texto
    return (
      usuario.nombre?.toLowerCase().includes(terminoBusquedaLower) ||
      usuario.apellido?.toLowerCase().includes(terminoBusquedaLower) ||
      usuario.email?.toLowerCase().includes(terminoBusquedaLower) ||
      usuario.documento?.toLowerCase().includes(terminoBusquedaLower) ||
      usuario.municipio?.toLowerCase().includes(terminoBusquedaLower) ||
      usuario.barrio?.toLowerCase().includes(terminoBusquedaLower) ||
      usuario.dirrecion?.toLowerCase().includes(terminoBusquedaLower)
    );
  });


  const handleVerDetalle = async (id) => {
    setDetalleOpen(true);
    setUsuarioDetalle(null);
    setDetalleLoading(true);
    setDetalleError('');
    try {
      const data = await getUsuarioById(id);
      setUsuarioDetalle(data);
    } catch (err) {
      setDetalleError(err.response?.data?.message || err.message || 'Error al cargar detalle');
    } finally {
      setDetalleLoading(false);
    }
  };

  const handleCerrarDetalle = () => {
    setDetalleOpen(false);
    setUsuarioDetalle(null);
    setDetalleError('');
  };

  const handleEditarUsuario = async (id) => {
    setEditOpen(true);
    setEditUsuario(null);
    setEditForm({});
    setEditLoading(true);
    setEditError('');
    setEditValidationErrors({});
    try {
      const data = await getUsuarioById(id);
      setEditUsuario(data);
      const initialForm = {};
      CAMPOS_EDITABLES.forEach(campo => {
          initialForm[campo.name] = data[campo.name] !== null && data[campo.name] !== undefined ? data[campo.name] : '';
      });
      setEditForm(initialForm);
    } catch (err) {
      setEditError(err.response?.data?.message || err.message || 'Error al cargar datos para editar');
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
    if (editValidationErrors[name]) {
      setEditValidationErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateEditForm = (formData) => {
    const newErrors = {};
    let isValid = true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    CAMPOS_EDITABLES.forEach(campo => {
        const value = formData[campo.name];
        const trimmedValue = typeof value === 'string' ? value.trim() : value;

        if (campo.required) {
            if (typeof trimmedValue === 'string' && !trimmedValue) {
                newErrors[campo.name] = `${campo.label} es requerido`;
                isValid = false;
            } else if (trimmedValue === null || trimmedValue === undefined || (typeof trimmedValue !== 'string' && !trimmedValue && trimmedValue !== 0) ) {
                 if (!(typeof trimmedValue === 'number' && trimmedValue === 0)) {
                    newErrors[campo.name] = `${campo.label} es requerido`;
                    isValid = false;
                }
            }
        }
        if (campo.name === 'email' && trimmedValue && !emailRegex.test(trimmedValue)) {
            newErrors[campo.name] = 'Formato de email inválido';
            isValid = false;
        }
    });
    setEditValidationErrors(newErrors);
    return isValid;
  };


  const handleGuardarEdicion = async () => {
    if (!editUsuario) return;
    setEditError('');
    setEditValidationErrors({});

    if (!validateEditForm(editForm)) {
        return;
    }

    const dataToSend = {};
    let hasChanges = false;
    CAMPOS_EDITABLES.forEach(({ name }) => {
      if (editForm[name] !== editUsuario[name]) {
        if (editForm[name] !== undefined) { 
            dataToSend[name] = editForm[name];
            hasChanges = true;
        }
      }
    });
    
    if (!hasChanges) {
      setEditError('No hay cambios para guardar.');
      return;
    }
    
    setEditLoading(true);
    try {
      await updateUsuario(editUsuario.idusuario, dataToSend);
      setSuccessMsg('Usuario actualizado correctamente');
      // Usar los parámetros actuales de la URL para la recarga
      const currentPageFromUrl = parseInt(searchParams.get('page')) || 1;
      const currentSearchFromUrl = searchParams.get('search') || '';
      fetchUsuariosCallback(currentPageFromUrl, currentSearchFromUrl); 
      setEditOpen(false);
    } catch (err) {
      setEditError(err.response?.data?.error || err.response?.data?.detalles || err.message || 'Ocurrió un error al actualizar');
    } finally {
      setEditLoading(false);
    }
  };

  const handleCerrarEdicion = () => {
    setEditOpen(false);
    setEditUsuario(null);
    setEditForm({});
    setEditError('');
    setEditValidationErrors({});
  };

  const handleUsuarioCreadoExitosamente = (nuevoUsuario) => {
    setCrearOpen(false);
    setCrearSuccess(true); 
    const newSearchParams = new URLSearchParams(searchParams); 
    newSearchParams.set('page', '1');
    // Opcional: limpiar búsqueda tras crear un usuario
    // newSearchParams.delete('search'); 
    // if (busqueda) setBusqueda(''); // Limpiar estado local también
    setSearchParams(newSearchParams); 
  };
  
  const handleEliminadoExitoso = () => {
    setEliminarOpen(false);
    const fetchCurrentPageOrPrevious = async () => {
        setLoading(true);
        const currentSearchFromUrl = searchParams.get('search') || '';
        let currentPageFromUrl = parseInt(searchParams.get('page')) || 1;

        const result = await getUsuarios(currentPageFromUrl, USUARIOS_POR_PAGINA, currentSearchFromUrl);
        if (result.success && result.data && result.data.usuarios.length === 0 && currentPageFromUrl > 1) {
            const newPage = currentPageFromUrl - 1;
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.set('page', newPage.toString());
            setSearchParams(newSearchParams); 
        } else {
            fetchUsuariosCallback(currentPageFromUrl, currentSearchFromUrl); 
        }
        setLoading(false);
    };
    fetchCurrentPageOrPrevious();
    setSuccessMsg('Usuario eliminado correctamente');
  };


  const camposCrearConRoles = CAMPOS_CREAR_ORIGINAL.map(campo => {
    if (campo.name === 'rol_idrol') {
      return { ...campo, options: rolSelectOptions }; 
    }
    return campo;
  });

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>Usuarios Registrados</Typography>
      <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" mb={2} gap={2}>
        <Box sx={{ flexGrow: 1, width: {xs: '100%', sm: 350} }}> 
          <Buscador
            value={busqueda} 
            onChange={handleSearchChange} 
            placeholder="Buscar (Nombre, Email, Activo...)"
          />
        </Box>
        <Button
          variant="contained"
          color="success"
          onClick={() => setCrearOpen(true)}
          sx={{ minWidth: 140, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0, width: {xs: '100%', sm: 'auto'} }}
          startIcon={<AddIcon />}
        >
          Registrar
        </Button>
      </Box>
      
      {errorCargandoRoles && (
        <Box mb={2}>
          <Alert severity="warning">{errorCargandoRoles}</Alert>
        </Box>
      )}
      
      <Box mb={2} height={40} display="flex" alignItems="center" justifyContent="center">
        {loading && <CircularProgress size={28} />}
        {error && !loading && <Alert severity="error" sx={{width: '100%'}}>{error}</Alert>}
      </Box>
      <TableContainer component={Paper} sx={{ margin: '0 auto', boxShadow: 2, overflowX: 'auto' }}>
        <Table sx={{ minWidth: 650 }} aria-label="tabla de usuarios">
          <TableHead>
            <TableRow>
              <TableCell><b>#</b></TableCell>
              <TableCell><b>Nombre</b></TableCell>
              <TableCell><b>Email</b></TableCell>
              <TableCell align="center"><b>Estado</b></TableCell>
              <TableCell align="center"><b>Acciones</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            { !loading && usuariosFiltrados.length === 0 && !error && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  {busqueda ? 'No se encontraron usuarios que coincidan con la búsqueda.' : 'No se encontraron usuarios.'}
                </TableCell>
              </TableRow>
            )}
            {/* Mapear sobre usuariosFiltrados en lugar de usuarios */}
            {usuariosFiltrados.map((usuario, idx) => (
              <TableRow key={usuario.idusuario || idx} hover>
                <TableCell>{(pagina - 1) * USUARIOS_POR_PAGINA + idx + 1}</TableCell>
                <TableCell>{usuario.nombre} {usuario.apellido}</TableCell>
                <TableCell>{usuario.email}</TableCell>
                <TableCell align="center">
                  <CambiarEstado
                    id={usuario.idusuario}
                    estadoActual={usuario.estado === true || usuario.estado === 'true' || usuario.estado === 1 || usuario.estado === '1'}
                    onEstadoCambiado={(idUsuario, nuevoEstado) => {
                      // Actualizar el estado en la lista original 'usuarios' también, 
                      // para que si se quita el filtro, el estado refleje el cambio.
                      setUsuarios((prev) => prev.map(u => u.idusuario === idUsuario ? { ...u, estado: nuevoEstado } : u));
                      setSuccessMsg(`Estado del usuario ${usuario.nombre} cambiado.`);
                    }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={0.5} justifyContent="center">
                    <IconButton color="info" size="small" onClick={() => handleVerDetalle(usuario.idusuario)} title="Ver Detalle"><VisibilityIcon fontSize="small"/></IconButton>
                    <IconButton color="warning" size="small" onClick={() => handleEditarUsuario(usuario.idusuario)} title="Editar"><EditIcon fontSize="small"/></IconButton>
                    <IconButton color="error" size="small" onClick={() => { setUsuarioEliminar(usuario); setEliminarOpen(true); }} title="Eliminar"><DeleteIcon fontSize="small"/></IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* La paginación debe basarse en totalPaginasAPI ya que los datos vienen paginados del backend */}
      {/* Si el filtrado frontend redujera el número de páginas visibles, la paginación se volvería inconsistente */}
      {/* con el conjunto de datos completo del backend. */}
      {!loading && totalPaginasAPI > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPaginasAPI} // Sigue usando totalPaginasAPI del backend
            page={pagina} 
            onChange={handleChangePagina}
            color="primary"
            showFirstButton showLastButton
          />
        </Box>
      )}

      <VerDetalle
        open={detalleOpen}
        onClose={handleCerrarDetalle}
        usuarioDetalle={usuarioDetalle}
        loading={detalleLoading}
        error={detalleError}
        roles={roles} 
      />

      <Editar
        open={editOpen}
        onClose={handleCerrarEdicion}
        usuario={editUsuario}
        form={editForm}
        onFormChange={handleEditFormChange}
        onSave={handleGuardarEdicion}
        loading={editLoading}
        validationErrors={editValidationErrors} 
        camposEditables={CAMPOS_EDITABLES}
        titulo="Editar Usuario"
        apiError={editError} 
      />

      <Snackbar
        open={!!successMsg || crearSuccess}
        autoHideDuration={3000}
        onClose={() => { setSuccessMsg(''); setCrearSuccess(false);}}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
            severity="success" 
            onClose={() => { setSuccessMsg(''); setCrearSuccess(false);}} 
            sx={{ width: '100%' }}
        >
            {crearSuccess ? "Usuario creado correctamente" : successMsg}
        </Alert>
      </Snackbar>


      <Eliminar
        id={usuarioEliminar?.idusuario}
        open={eliminarOpen}
        onClose={() => setEliminarOpen(false)}
        onEliminado={handleEliminadoExitoso}
        nombre={usuarioEliminar ? `${usuarioEliminar.nombre} ${usuarioEliminar.apellido}` : ''}
        tipoEntidad="usuario"
      />

      <Crear
        open={crearOpen}
        onClose={() => setCrearOpen(false)}
        onCreado={handleUsuarioCreadoExitosamente}
        campos={camposCrearConRoles} 
        titulo="Registrar Usuario"
      />
    </Box>
  );
};

export default Usuarios;
