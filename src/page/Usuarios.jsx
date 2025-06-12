import { useEffect, useState, useCallback } from 'react';
import {
  Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert, IconButton, Stack, Pagination, Switch, Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, TextField, Snackbar, MenuItem
} from '@mui/material';
import { getUsuarios, getUsuarioById, updateUsuario, getRoles, updateEstadoUsuario, deleteUsuario } from '../api';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useSearchParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

import Buscador from '../components/Buscador';
import VerDetalle from '../components/VerDetalle';
import Editar from '../components/Editar';
import CambiarEstado from '../components/CambiarEstado';
import Eliminar from '../components/Eliminar';
import Crear from '../components/Crear';

const USUARIOS_POR_PAGINA = 5;
const CAMPOS_EDITABLES = [
  { name: 'tipodocumento', label: 'Tipo de Documento', select: true, options: ['CC', 'CE', 'TI'], required: true, disabled: true },
  { name: 'documento', label: 'Documento', required: true, disabled: true },
  { name: 'nombre', label: 'Nombre', required: true },
  { name: 'apellido', label: 'Apellido', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'municipio', label: 'Municipio', required: false },
  { name: 'barrio', label: 'Barrio', required: false },
  { name: 'dirrecion', label: 'Dirección', required: false },
  { name: 'complemento', label: 'Complemento', required: false },
  { name: 'rol_idrol', label: 'Rol', select: true, options: [], required: true },
];

const CAMPOS_CREAR_ORIGINAL = [
  { name: 'tipodocumento', label: 'Tipo de Documento', select: true, options: ['CC', 'CE', 'TI',], required: true },
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
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(''); 
  const [roles, setRoles] = useState([]);
  const [camposCrear, setCamposCrear] = useState(CAMPOS_CREAR_ORIGINAL);
  const [rolSelectOptions, setRolSelectOptions] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [errorCargandoRoles, setErrorCargandoRoles] = useState(''); 

  const [searchParams, setSearchParams] = useSearchParams();
  
  const [pagina, setPagina] = useState(parseInt(searchParams.get('page')) || 1);
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
  
  // Nuevo estado unificado para el Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const [eliminarOpen, setEliminarOpen] = useState(false);
  const [usuarioEliminar, setUsuarioEliminar] = useState(null);
  
  const [crearOpen, setCrearOpen] = useState(false);
  const [crearErrorInterno, setCrearErrorInterno] = useState(''); // Para Alert dentro del diálogo Crear


  // Función helper para mostrar el Snackbar
  const openSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchUsuariosCallback = useCallback(async (currentPage, currentSearchTermFromUrl) => {
    setLoading(true);
    setError('');
    try {
      const result = await getUsuarios(currentPage, USUARIOS_POR_PAGINA, currentSearchTermFromUrl);
      if (result.error) {
        setError(result.detalles || 'Error al cargar usuarios.');
        setUsuarios([]);
        setTotalPaginasAPI(1);
      } else if (result.success && result.data) {
        setUsuarios(result.data.usuarios || []);
        setTotalPaginasAPI(result.data.paginacion?.totalPaginas || 1);
        if (currentPage > (result.data.paginacion?.totalPaginas || 1) && (result.data.paginacion?.totalPaginas || 1) > 0) {
            const newPage = result.data.paginacion.totalPaginas;
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.set('page', newPage.toString());
            setSearchParams(newSearchParams, { replace: true });
        }
      } else {
         setError('No se recibieron datos de usuarios o el formato es incorrecto.');
         setUsuarios([]);
         setTotalPaginasAPI(1);
      }
    } catch (err) {
      setError('Error inesperado al cargar usuarios: ' + (err.message || ''));
      setUsuarios([]);
      setTotalPaginasAPI(1);
    } finally {
      setLoading(false);
    }
  }, [searchParams, setSearchParams]); 

  useEffect(() => {
    const cargarRoles = async () => {
      setLoadingRoles(true);
      setErrorCargandoRoles('');
      try {
        const result = await getRoles(null, null, '', true); 
        if (result.success && result.data) {
            let rolesArray = [];
            if (Array.isArray(result.data)) {
                rolesArray = result.data;
            } else if (result.data.roles && Array.isArray(result.data.roles)) {
                rolesArray = result.data.roles;
            } else {
                console.error('Formato de roles inesperado:', result.data);
                setErrorCargandoRoles('Error al procesar lista de roles.');
            }
            setRoles(rolesArray);
            const options = rolesArray.map(rol => ({ value: rol.idrol, label: rol.nombre }));
            setRolSelectOptions(options); 
        } else if (result.error) {
          setErrorCargandoRoles(result.detalles || 'No se pudo obtener la lista de roles.');
        }
      } catch (err) {
        setErrorCargandoRoles('Error al cargar los roles: ' + (err.message || ''));
      } finally {
        setLoadingRoles(false);
      }
    };
    cargarRoles();
  }, []); 

  useEffect(() => {
    const currentPageFromUrl = parseInt(searchParams.get('page')) || 1;
    const currentSearchFromUrl = searchParams.get('search') || '';
    
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
  
  const usuariosFiltrados = usuarios.filter(usuario => {
    if (!busqueda) { 
      return true;
    }
    const terminoBusquedaLower = busqueda.toLowerCase().trim();
    if (terminoBusquedaLower === "activo") {
      return usuario.estado === true || usuario.estado === 'true' || usuario.estado === 1 || usuario.estado === '1';
    }
    if (terminoBusquedaLower === "inactivo") {
      return !(usuario.estado === true || usuario.estado === 'true' || usuario.estado === 1 || usuario.estado === '1');
    }
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
    const usuarioId = parseInt(id, 10);
    if (isNaN(usuarioId)) {
        setDetalleError("ID de usuario inválido.");
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'ID de usuario inválido para ver detalle',
          confirmButtonColor: '#2E8B57',
          background: '#fff',
          customClass: {
            popup: 'animated fadeInDown'
          },
          zIndex: 9999,
          didOpen: (popup) => {
            popup.style.zIndex = 9999;
          }
        });
        return;
    }
    setDetalleOpen(true);
    setUsuarioDetalle(null);
    setDetalleLoading(true);
    setDetalleError('');
    try {
      const data = await getUsuarioById(usuarioId);
      setUsuarioDetalle(data);
    } catch (err) {
      const errorMsg = err.message || 'Error al cargar detalle del usuario.';
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
        zIndex: 9999,
        didOpen: (popup) => {
          popup.style.zIndex = 9999;
        }
      });
    } finally {
      setDetalleLoading(false);
    }
  };

  const handleCerrarDetalle = () => {
    setDetalleOpen(false);
    setUsuarioDetalle(null);
    setDetalleError('');
  };

  const handleEditarUsuario = async (usuario) => {
    setEditOpen(true);
    setEditUsuario(usuario);
    setEditLoading(true);
    setEditError('');
    setEditValidationErrors({});
    try {
      const data = await getUsuarioById(usuario.idusuario);
      const initialForm = {};
      CAMPOS_EDITABLES.forEach(campo => {
        initialForm[campo.name] = data[campo.name] || '';
      });

      // Reutilizar las opciones de roles ya cargadas al montar el componente
      // en lugar de cargar roles de nuevo aquí.
      // Esto también resuelve el error del linter por redeclaración de rolesResult.
      
      // Ya no necesitamos cargar roles aquí porque ya se cargaron en el useEffect inicial
      // const rolesResult = await getRoles(); // <<-- Eliminar esta línea
      // if (rolesResult.success && rolesResult.data) { // <<-- Eliminar esta línea
      //   const rolesOptions = rolesResult.data.map(rol => ({ // <<-- Eliminar esta línea
      //     value: rol.idrol,
      //     label: rol.nombre
      //   }));
      //   setRolSelectOptions(rolesOptions); // <<-- Esto se actualiza al montar, no aquí
      // } // <<-- Eliminar esta línea

      // Las opciones de rolSelectOptions ya están disponibles en el scope del componente
      // y se pasan al componente Editar.

      setEditForm(initialForm);
    } catch (err) {
      const errorMsg = err.message || 'Error al cargar datos del usuario para editar.';
      setEditError(errorMsg); 
      openSnackbar(errorMsg, 'error');
    } finally {
      setEditLoading(false);
    }
  };

  // VALIDACIONES ROBUSTAS PARA EDITAR USUARIO
  const validateEditEmail = (email) => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = 'El email es requerido';
    } else {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email)) {
        newErrors.email = 'El formato del email no es válido';
      } else if (email.length > 100) {
        newErrors.email = 'El email excede la longitud máxima permitida';
      } else if (/[<>()[\]\\,;:\s"]+/.test(email)) {
        newErrors.email = 'El email contiene caracteres no permitidos';
      }
    }
    return newErrors;
  };
  const validateEditDocumento = (documento) => {
    const newErrors = {};
    if (!documento.trim()) {
      newErrors.documento = 'El documento es requerido';
    } else if (!/^\d{10}$/.test(documento)) {
      newErrors.documento = 'El documento debe tener exactamente 10 dígitos numéricos';
    }
    return newErrors;
  };
  const validateEditNombre = (nombre) => {
    const newErrors = {};
    if (!nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{3,10}$/.test(nombre)) {
      newErrors.nombre = 'El nombre debe tener entre 3 y 10 letras';
    }
    return newErrors;
  };
  const validateEditApellido = (apellido) => {
    const newErrors = {};
    if (!apellido.trim()) {
      newErrors.apellido = 'El apellido es requerido';
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{3,10}$/.test(apellido)) {
      newErrors.apellido = 'El apellido debe tener entre 3 y 10 letras';
    }
    return newErrors;
  };
  const validateEditUbicacion = (valor, campo) => {
    const newErrors = {};
    if (["municipio", "barrio", "dirrecion"].includes(campo)) {
      if (!valor || !valor.trim()) {
        newErrors[campo] = `El campo es obligatorio`;
        return newErrors;
      }
    }
    if (valor && valor.trim()) {
      if (valor.length < 3 || valor.length > 50) {
        newErrors[campo] = `El campo debe tener entre 3 y 50 caracteres`;
      } else if (!/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]+$/.test(valor)) {
        newErrors[campo] = `Solo se permiten letras, números y espacios`;
      } else if (campo === 'dirrecion' && (valor.match(/\d/g) || []).length < 2) {
        newErrors[campo] = `La dirección debe contener al menos 2 números`;
      }
    }
    return newErrors;
  };
  const validateEditRol = (rol) => {
    const newErrors = {};
    if (!rol) {
      newErrors.rol_idrol = 'El rol es requerido';
    }
    return newErrors;
  };
  const validateEditTipoDocumento = (tipoDocumento) => {
    const newErrors = {};
    if (!tipoDocumento) {
      newErrors.tipodocumento = 'El tipo de documento es requerido';
    }
    return newErrors;
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
    let fieldSpecificError = ''; 

    if (name === 'email') {
      fieldSpecificError = validateEditEmail(value).email;
    } else if (name === 'documento') {
      fieldSpecificError = validateEditDocumento(value).documento;
    } else if (name === 'nombre') {
      fieldSpecificError = validateEditNombre(value).nombre;
    } else if (name === 'apellido') {
      fieldSpecificError = validateEditApellido(value).apellido;
    } else if (["municipio","barrio","dirrecion","complemento"].includes(name)) {
      fieldSpecificError = validateEditUbicacion(value, name)[name];
    } else if (name === 'rol_idrol') {
      fieldSpecificError = validateEditRol(value).rol_idrol;
    } else if (name === 'tipodocumento') {
      fieldSpecificError = validateEditTipoDocumento(value).tipodocumento;
    }

    setEditValidationErrors(prev => ({
      ...prev,
      [name]: fieldSpecificError || '' 
    }));
  };

  const validateEditForm = (formData) => {
    const newErrors = {};
    Object.assign(newErrors,
      validateEditEmail(formData.email),
      validateEditDocumento(formData.documento),
      validateEditNombre(formData.nombre),
      validateEditApellido(formData.apellido),
      validateEditUbicacion(formData.municipio, 'municipio'),
      validateEditUbicacion(formData.barrio, 'barrio'),
      validateEditUbicacion(formData.dirrecion, 'dirrecion'),
      validateEditUbicacion(formData.complemento, 'complemento'),
      validateEditRol(formData.rol_idrol),
      validateEditTipoDocumento(formData.tipodocumento)
    );
    if (!formData.complemento || !formData.complemento.trim()) {
      delete newErrors.complemento;
    }
    setEditValidationErrors(newErrors); // Asegura que los errores se actualicen para todos los campos
    return Object.keys(newErrors).length === 0;
  };

  const handleGuardarEdicion = async () => {
    if (!editUsuario) return;
    setEditError('');
    // Llama a validateEditForm para actualizar los errores de validación antes de la comprobación
    if (!validateEditForm(editForm)) {
        return; // Si hay errores de validación, detén la ejecución
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
      Swal.fire({
        icon: 'info',
        title: 'Sin Cambios',
        text: 'No hay cambios para guardar',
        confirmButtonColor: '#2E8B57',
        background: '#fff',
        customClass: {
          popup: 'animated fadeInDown'
        },
        zIndex: 9999,
        didOpen: (popup) => {
          popup.style.zIndex = 9999;
        }
      });
      return;
    }
    setEditLoading(true);
    try {
      const usuarioId = parseInt(editUsuario.idusuario, 10);
      if (isNaN(usuarioId)) throw new Error("ID de usuario inválido para actualizar.");
      await updateUsuario(usuarioId, dataToSend);
      Swal.fire({
        icon: 'success',
        title: '¡Usuario Actualizado!',
        text: 'Los cambios han sido guardados correctamente',
        timer: 2000,
        showConfirmButton: false,
        position: 'center',
        background: '#fff',
        customClass: {
          popup: 'animated fadeInDown'
        },
        zIndex: 9999,
        didOpen: (popup) => {
          popup.style.zIndex = 9999;
        }
      });
      const currentPageFromUrl = parseInt(searchParams.get('page')) || 1;
      const currentSearchFromUrl = searchParams.get('search') || '';
      fetchUsuariosCallback(currentPageFromUrl, currentSearchFromUrl); 
      setEditOpen(false);
    } catch (err) {
      const errorMsg = err.message || 'Ocurrió un error al actualizar el usuario.';
      setEditError(errorMsg);
      Swal.fire({
        icon: 'error',
        title: 'Error al Actualizar',
        text: errorMsg,
        confirmButtonColor: '#2E8B57',
        background: '#fff',
        customClass: {
          popup: 'animated fadeInDown'
        },
        zIndex: 9999,
        didOpen: (popup) => {
          popup.style.zIndex = 9999;
        }
      });
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
    Swal.fire({
      icon: 'success',
      title: '¡Usuario Creado!',
      text: 'El usuario ha sido registrado correctamente',
      timer: 2000,
      showConfirmButton: false,
      position: 'center',
      background: '#fff',
      customClass: {
        popup: 'animated fadeInDown'
      },
      zIndex: 9999,
      didOpen: (popup) => {
        popup.style.zIndex = 9999;
      }
    });
    const newSearchParams = new URLSearchParams(searchParams); 
    newSearchParams.set('page', '1');
    setSearchParams(newSearchParams); 
  };
  
  const handleCrearError = (errorMessage) => {
    setCrearErrorInterno(errorMessage);
    Swal.fire({
      icon: 'error',
      title: 'Error al Crear Usuario',
      text: errorMessage,
      confirmButtonColor: '#2E8B57',
      background: '#fff',
      customClass: {
        popup: 'animated fadeInDown'
      },
      zIndex: 9999,
      didOpen: (popup) => {
        popup.style.zIndex = 9999;
      }
    });
  };

  const handleUsuarioEliminado = async (idUsuarioEliminado) => {
    setEliminarOpen(false);
    Swal.fire({
      icon: 'success',
      title: '¡Usuario Eliminado!',
      text: 'El usuario ha sido eliminado correctamente',
      timer: 2000,
      showConfirmButton: false,
      position: 'center',
      background: '#fff',
      customClass: {
        popup: 'animated fadeInDown'
      },
      zIndex: 9999,
      didOpen: (popup) => {
        popup.style.zIndex = 9999;
      }
    });
    
    // No modificamos el estado local 'usuarios' directamente para paginación
    // setUsuarios(prevUsuarios => prevUsuarios.filter(u => u.idusuario !== idUsuarioEliminado));

    // Re-obtener la lista y verificar la paginación
    const currentSearchFromUrl = searchParams.get('search') || '';
    let currentPageFromUrl = parseInt(searchParams.get('page')) || 1;

    // Refetch la página actual. fetchUsuariosCallback ya maneja el caso de página inválida.
    fetchUsuariosCallback(currentPageFromUrl, currentSearchFromUrl);

  };

  const camposCrearConRoles = CAMPOS_CREAR_ORIGINAL.map(campo => {
    if (campo.name === 'rol_idrol') {
      return { ...campo, options: rolSelectOptions }; 
    }
    return campo;
  });

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ open: false, message: '', severity: 'info' });
  };

  return (
    <Box p={3} sx={{ position: 'relative' }}>
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
          onClick={() => {
            setCrearErrorInterno(''); 
            setCrearOpen(true);
          }}
          sx={{ minWidth: 140, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0, width: {xs: '100%', sm: 'auto'} }}
          startIcon={<AddIcon />}
        >
          Registrar
        </Button>
      </Box>
      
      {errorCargandoRoles && !loadingRoles && (
        <Box mb={2}>
          <Alert severity="warning">{errorCargandoRoles}</Alert>
        </Box>
      )}
      
      <Box mb={2} height={40} display="flex" alignItems="center" justifyContent="center">
        {loading && <CircularProgress size={28} />}
        {error && !loading && <Alert severity="error" sx={{width: '100%'}}>{error}</Alert>}
      </Box>
      <TableContainer 
        component={Paper} 
        sx={{ 
          margin: '0 auto', 
          boxShadow: 2, 
          overflowX: 'auto',
          position: 'relative',
          zIndex: 1
        }}
      >
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
            {usuariosFiltrados.map((usuario, idx) => {
              const usuarioActivo = usuario.estado === true || usuario.estado === 'true' || usuario.estado === 1 || usuario.estado === '1';
              return (
              <TableRow key={usuario.idusuario || idx} hover>
                <TableCell>{(pagina - 1) * USUARIOS_POR_PAGINA + idx + 1}</TableCell>
                <TableCell>{usuario.nombre} {usuario.apellido}</TableCell>
                <TableCell>{usuario.email}</TableCell>
                <TableCell align="center">
                  <CambiarEstado
                    id={usuario.idusuario} 
                      estadoActual={usuarioActivo}
                    onEstadoCambiado={(idUsuario, nuevoEstado, errorMsg) => { 
                      if (errorMsg) {
                        openSnackbar(`Error al cambiar estado: ${errorMsg}`, 'error');
                      } else {
                        setUsuarios((prevUsuarios) => 
                          prevUsuarios.map(u => 
                            u.idusuario === idUsuario ? { ...u, estado: nuevoEstado } : u
                          )
                        );
                        openSnackbar(`Estado del usuario ${usuario.nombre} cambiado.`, 'success');
                      }
                    }}
                    updateEstadoApi={updateEstadoUsuario} 
                  />
                </TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={0.5} justifyContent="center">
                    <IconButton color="info" size="small" onClick={() => handleVerDetalle(usuario.idusuario)} title="Ver Detalle"><VisibilityIcon fontSize="small"/></IconButton>
                      {usuarioActivo && (
                        <>
                    <IconButton color="warning" size="small" onClick={() => handleEditarUsuario(usuario)} title="Editar"><EditIcon fontSize="small"/></IconButton>
                    {usuario.rol_idrol !== 1 && (
                      <IconButton color="error" size="small" onClick={() => { setUsuarioEliminar(usuario); setEliminarOpen(true); }} title="Eliminar"><DeleteIcon fontSize="small"/></IconButton>
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
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPaginasAPI}
            page={pagina} 
            onChange={handleChangePagina}
            color="primary"
            showFirstButton showLastButton
          />
        </Box>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.severity === 'success' ? 3000 : 6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity} 
            sx={{ width: '100%' }}
        >
            {snackbar.message}
        </Alert>
      </Snackbar>

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
        onSave={handleGuardarEdicion}
        usuario={editUsuario}
        form={editForm}
        onFormChange={handleEditFormChange}
        loading={editLoading}
        error={editError}
        validationErrors={editValidationErrors}
        camposEditables={CAMPOS_EDITABLES.map(campo => {
          if (campo.name === 'rol_idrol') {
            return { ...campo, options: rolSelectOptions };
          }
          return campo;
        })
        .filter(campo => !(campo.name === 'rol_idrol' && editUsuario?.idusuario === 34))}
      />

      <Eliminar
        id={usuarioEliminar?.idusuario}
        open={eliminarOpen}
        onClose={() => setEliminarOpen(false)}
        onEliminado={handleUsuarioEliminado}
        onError={(errorMessage) => openSnackbar(errorMessage, 'error')}
        nombre={usuarioEliminar ? `${usuarioEliminar.nombre} ${usuarioEliminar.apellido}` : ''}
        tipoEntidad="usuario"
        deleteApi={deleteUsuario}
      />

      <Crear
        open={crearOpen}
        onClose={() => setCrearOpen(false)}
        onCreado={handleUsuarioCreadoExitosamente}
        campos={camposCrearConRoles}
        titulo="Registrar Usuario"
        onError={(errorMessage) => openSnackbar(errorMessage, 'error')}
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

export default Usuarios;