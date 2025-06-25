import { useEffect, useState, useCallback } from 'react';
import {
  Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert, Button, Snackbar, Pagination, TextField, IconButton, Stack, Dialog, DialogTitle, DialogContent, DialogActions, Grid, MenuItem, Chip
} from '@mui/material';
import { getProveedores, createProveedor, deleteProveedor, updateEstadoProveedor, getProveedorByNit, updateProveedor } from '../api';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import Buscador from '../components/Buscador';
import CambiarEstado from '../components/CambiarEstado';
import PersonAddIcon from '@mui/icons-material/Add';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BadgeIcon from '@mui/icons-material/Badge';
import PhoneIcon from '@mui/icons-material/Phone';
import Eliminar from '../components/Eliminar';  
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { useSearchParams } from 'react-router-dom';

const PROVEEDORES_POR_PAGINA = 5;

const CAMPOS_CREAR = [
  { name: 'tipodocumento', label: 'Tipo de Documento', required: true, default: 'NIT', options: ['NIT', 'CC', 'CE'] },
  { name: 'documento', label: 'Documento', required: true },
  { name: 'nombre', label: 'Nombre', required: true },
  { name: 'contacto', label: 'Contacto', required: true },
  { name: 'email', label: 'Email', required: true, type: 'email' },
  { name: 'municipio', label: 'Municipio', required: true },
  { name: 'complemento', label: 'Complemento', required: false },
  { name: 'direccion', label: 'Dirección', required: true },
  { name: 'telefono', label: 'Teléfono', required: true },
  { name: 'barrio', label: 'Barrio', required: true },
];

const Proveedores = () => {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const [pagina, setPagina] = useState(Number.parseInt(searchParams.get('page')) || 1);
  const [totalPaginasAPI, setTotalPaginasAPI] = useState(1);
  const [successMsg, setSuccessMsg] = useState('');
  const [busqueda, setBusqueda] = useState(searchParams.get('search') || '');
  const [crearOpen, setCrearOpen] = useState(false);
  const [crearLoading, setCrearLoading] = useState(false);
  const [crearError, setCrearError] = useState('');
  const [crearForm, setCrearForm] = useState(() => Object.fromEntries(CAMPOS_CREAR.map(c => [c.name, c.default || ''])));
  const [crearValidation, setCrearValidation] = useState({});
  const [eliminarOpen, setEliminarOpen] = useState(false);
  const [proveedorEliminar, setProveedorEliminar] = useState(null);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [proveedorDetalle, setProveedorDetalle] = useState(null);
  const [detalleLoading, setDetalleLoading] = useState(false);
  const [detalleError, setDetalleError] = useState('');

  // Estados para edición
  const [editOpen, setEditOpen] = useState(false);
  const [proveedorAEditar, setProveedorAEditar] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editValidation, setEditValidation] = useState({});
  const [originalEditData, setOriginalEditData] = useState(null);

  // Nuevo estado unificado para el Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Función helper para mostrar el Snackbar
  const openSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchProveedores = useCallback(async (currentPage, currentSearch) => {
    setLoading(true);
    setError('');
    try {
      const result = await getProveedores(currentPage, PROVEEDORES_POR_PAGINA, currentSearch);
      if (result.error) {
        setError(result.detalles || 'Error al cargar proveedores.');
        setProveedores([]);
        setTotalPaginasAPI(1);
        if (currentPage > 1) {
          const newSearchParams = new URLSearchParams(searchParams);
          newSearchParams.set('page', '1');
          setSearchParams(newSearchParams, { replace: true });
        }
      } else if (result.success && result.data) {
        setProveedores(result.data.proveedores || []);
        const totalPaginas = result.data.totalPaginas || 1;
        setTotalPaginasAPI(totalPaginas);

        if (currentPage > totalPaginas && totalPaginas > 0) {
          const newSearchParams = new URLSearchParams(searchParams);
          newSearchParams.set('page', totalPaginas.toString());
          setSearchParams(newSearchParams, { replace: true });
        } else if (currentPage !== (Number.parseInt(searchParams.get('page')) || 1)) {
          const newSearchParams = new URLSearchParams(searchParams);
          newSearchParams.set('page', currentPage.toString());
          setSearchParams(newSearchParams, { replace: true });
        }
      } else {
        setProveedores([]);
        setTotalPaginasAPI(1);
      }
    } catch (err) {
      setError('Error inesperado al cargar proveedores: ' + (err.message || ''));
      setProveedores([]);
      setTotalPaginasAPI(1);
    }
    finally {
      setLoading(false);
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const pageFromUrl = Number.parseInt(searchParams.get('page')) || 1;
    const searchFromUrl = searchParams.get('search') || '';

    if (pageFromUrl !== pagina) {
      setPagina(pageFromUrl);
    }
    if (searchFromUrl !== busqueda) {
      setBusqueda(searchFromUrl);
    }

    fetchProveedores(pageFromUrl, searchFromUrl);
  }, [searchParams, fetchProveedores]);

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

  const proveedoresFiltrados = proveedores.filter(proveedor => {
    if (!busqueda) return true;
    const terminoBusquedaLower = busqueda.toLowerCase().trim();

    if (terminoBusquedaLower === 'activo') {
      return proveedor.estado === true || proveedor.estado === 1 || proveedor.estado === 'true';
    }
    if (terminoBusquedaLower === 'inactivo') {
      return !(proveedor.estado === true || proveedor.estado === 1 || proveedor.estado === 'true');
    }

    return (proveedor.nombre?.toLowerCase().includes(terminoBusquedaLower) ||
            proveedor.email?.toLowerCase().includes(terminoBusquedaLower) ||
            proveedor.telefono?.toLowerCase().includes(terminoBusquedaLower));
  });

  // Funciones de validación individuales
  const validateTipoDocumento = (tipoDocumento) => {
    if (!tipoDocumento) {
      return 'El tipo de documento es requerido';
    }
    return '';
  };

  const validateDocumento = (documento, tipoDocumento) => {
    if (!documento?.trim()) {
      return 'El documento es requerido';
    }
    // Validar según el tipo de documento
    if (tipoDocumento === 'NIT' || tipoDocumento === 'CC' || tipoDocumento === 'CE') {
      if (!/^\d{7,10}$/.test(documento)) {
        return 'El documento debe tener entre 7 y 10 dígitos numéricos';
      }
    }
    return '';
  };

  const validateNombreContacto = (valor, campo) => {
    if (!valor?.trim()) {
      return `El ${campo} es requerido`;
    }
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{3,10}$/.test(valor)) {
      return `El ${campo} debe tener entre 3 y 10 letras`;
    }
    return '';
  };

  const validateEmail = (email) => {
    if (!email?.trim()) {
      return 'El email es requerido';
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return 'El formato del email no es válido';
    }
    if (email.length > 100) {
      return 'El email excede la longitud máxima permitida';
    }
    if (/[<>()[\]\\,;:\s"]+/.test(email)) {
      return 'El email contiene caracteres no permitidos';
    }
    return '';
  };

  const validateTelefono = (telefono) => {
    if (!telefono?.trim()) {
      return 'El teléfono es requerido';
    }
    if (!/^\d{10}$/.test(telefono)) {
      return 'El teléfono debe tener exactamente 10 dígitos numéricos';
    }
    return '';
  };

  const validateUbicacion = (valor, campo) => {
    if (!valor?.trim()) {
      return `El ${campo} es requerido`;
    }
    if (valor.length < 3 || valor.length > 50) {
      return `El ${campo} debe tener entre 3 y 50 caracteres`;
    }
    if (!/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]+$/.test(valor)) {
      return `Solo se permiten letras, números y espacios`;
    }
    if (campo === 'direccion' && (valor.match(/\d/g) || []).length < 2) {
      return `La dirección debe contener al menos 2 números`;
    }
    return '';
  };

  const validateComplemento = (complemento) => {
    if (!complemento?.trim()) {
      return ''; // Complemento es opcional si está vacío
    }
    if (complemento.length < 3 || complemento.length > 50) {
      return 'El complemento debe tener entre 3 y 50 caracteres';
    }
    if (!/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]+$/.test(complemento)) {
      return 'Solo se permiten letras, números y espacios';
    }
    return '';
  };

  const handleCrearChange = (e) => {
    const { name, value } = e.target;
    setCrearForm(prev => ({ ...prev, [name]: value }));

    let errorMessage = '';
    switch (name) {
      case 'tipodocumento':
        errorMessage = validateTipoDocumento(value);
        // Validar documento cuando cambia el tipo de documento
        if (crearForm.documento) {
          const docError = validateDocumento(crearForm.documento, value);
          setCrearValidation(prev => ({ ...prev, documento: docError }));
        }
        break;
      case 'documento':
        errorMessage = validateDocumento(value, crearForm.tipodocumento);
        break;
      case 'nombre':
      case 'contacto':
        errorMessage = validateNombreContacto(value, name);
        break;
      case 'email':
        errorMessage = validateEmail(value);
        break;
      case 'telefono':
        errorMessage = validateTelefono(value);
        break;
      case 'municipio':
      case 'barrio':
      case 'direccion':
        errorMessage = validateUbicacion(value, name);
        break;
      case 'complemento':
        errorMessage = validateComplemento(value);
        break;
      default:
        break;
    }
    setCrearValidation(prev => ({ ...prev, [name]: errorMessage }));
  };

  const validateCrear = () => {
    const newErrors = {};
    let isValid = true;

    // Validar todos los campos
    const tipoDocumentoError = validateTipoDocumento(crearForm.tipodocumento);
    if (tipoDocumentoError) { newErrors.tipodocumento = tipoDocumentoError; isValid = false; }

    const documentoError = validateDocumento(crearForm.documento, crearForm.tipodocumento);
    if (documentoError) { newErrors.documento = documentoError; isValid = false; }

    const nombreError = validateNombreContacto(crearForm.nombre, 'nombre');
    if (nombreError) { newErrors.nombre = nombreError; isValid = false; }

    const contactoError = validateNombreContacto(crearForm.contacto, 'contacto');
    if (contactoError) { newErrors.contacto = contactoError; isValid = false; }

    const emailError = validateEmail(crearForm.email);
    if (emailError) { newErrors.email = emailError; isValid = false; }

    const telefonoError = validateTelefono(crearForm.telefono);
    if (telefonoError) { newErrors.telefono = telefonoError; isValid = false; }

    const municipioError = validateUbicacion(crearForm.municipio, 'municipio');
    if (municipioError) { newErrors.municipio = municipioError; isValid = false; }

    const barrioError = validateUbicacion(crearForm.barrio, 'barrio');
    if (barrioError) { newErrors.barrio = barrioError; isValid = false; }

    const direccionError = validateUbicacion(crearForm.direccion, 'direccion');
    if (direccionError) { newErrors.direccion = direccionError; isValid = false; }

    const complementoError = validateComplemento(crearForm.complemento);
    if (complementoError) { newErrors.complemento = complementoError; isValid = false; }

    setCrearValidation(newErrors);
    return isValid;
  };

  const handleCrearProveedor = async (e) => {
    e.preventDefault();
    setCrearError('');
    if (!validateCrear()) return;
    setCrearLoading(true);
    try {
      await createProveedor({ ...crearForm, nitproveedor: crearForm.documento });
      setCrearOpen(false);
      setCrearForm(Object.fromEntries(CAMPOS_CREAR.map(c => [c.name, c.default || ''])));
      Swal.fire({
        icon: 'success',
        title: '¡Proveedor Creado!',
        text: 'El proveedor ha sido registrado correctamente',
        timer: 2000,
        showConfirmButton: false,
        position: 'center',
        background: '#fff',
        customClass: {
          popup: 'animated fadeInDown'
        },
        didOpen: (popup) => {
          popup.style.zIndex = 9999;
        }
      });
      fetchProveedores(pagina, busqueda);
    } catch (err) {
      setCrearError(err.message || 'Error al crear proveedor');
    } finally {
      setCrearLoading(false);
    }
  };

  const handleProveedorEliminadoExitosamente = async () => {
    setEliminarOpen(false);
    setProveedorEliminar(null);
    Swal.fire({
      icon: 'success',
      title: '¡Proveedor Eliminado!',
      text: 'El proveedor ha sido eliminado correctamente',
      timer: 2000,
      showConfirmButton: false,
      position: 'center',
      background: '#fff',
      customClass: {
        popup: 'animated fadeInDown'
      },
      didOpen: (popup) => {
        popup.style.zIndex = 9999;
      }
    });
    fetchProveedores(pagina, busqueda); // Recargar la lista de proveedores
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ open: false, message: '', severity: 'info' });
  };

  const handleEstadoCambiado = (nitproveedor, nuevoEstado, errorMsg) => {
    if (errorMsg) {
      openSnackbar(`Error al cambiar estado: ${errorMsg}`, 'error');
    } else {
      setProveedores((prev) => prev.map((p) => 
        p.nitproveedor === nitproveedor ? { ...p, estado: nuevoEstado } : p
      ));
      const proveedor = proveedores.find(p => p.nitproveedor === nitproveedor);
      openSnackbar(`Estado del proveedor ${proveedor?.nombre || 'Proveedor'} cambiado.`, 'success');
    }
  };

  const handleVerDetalleProveedor = async (nitproveedor) => {
    setDetalleLoading(true);
    setDetalleError('');
    try {
      const response = await getProveedorByNit(nitproveedor);
      if (response && response.data) {
        setProveedorDetalle(response.data);
      } else {
        throw new Error('Formato de respuesta de API inesperado');
      }
      setDetalleOpen(true);
    } catch (error) {
      setDetalleError(error.message || 'Error al cargar los detalles del proveedor');
      openSnackbar(error.message || 'Error al cargar los detalles del proveedor', 'error');
    } finally {
      setDetalleLoading(false);
    }
  };

  const handleEditarProveedor = async (proveedor) => {
    setProveedorAEditar(proveedor);
    setEditOpen(true);
    setEditLoading(true);
    setEditError('');
    setEditValidation({});
    try {
      const response = await getProveedorByNit(proveedor.nitproveedor);
      const fetchedData = {
        tipodocumento: response.data.tipodocumento || '',
        documento: response.data.nitproveedor || '',
        nombre: response.data.nombre || '',
        contacto: response.data.contacto || '',
        email: response.data.email || '',
        municipio: response.data.municipio || '',
        complemento: response.data.complemento || '',
        direccion: response.data.direccion || '',
        telefono: response.data.telefono || '',
        barrio: response.data.barrio || '',
      };
      setEditForm(fetchedData);
      setOriginalEditData(fetchedData);
    } catch (err) {
      const errorMsg = 'Error al cargar los datos del proveedor para editar: ' + (err.message || '');
      setEditError(errorMsg);
      Swal.fire({
        icon: 'error',
        title: 'Error al Cargar Datos',
        text: errorMsg,
        confirmButtonColor: '#2E8B57',
        background: '#fff',
        customClass: {
          popup: 'animated fadeInDown'
        },
        didOpen: (popup) => {
          popup.style.zIndex = 9999;
        }
      });
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));

    let errorMessage = '';
    switch (name) {
      case 'tipodocumento':
      case 'documento':
        // Estos campos no se pueden editar, no procesar cambios
        return;
      case 'nombre':
      case 'contacto':
        errorMessage = validateNombreContacto(value, name);
        break;
      case 'email':
        errorMessage = validateEmail(value);
        break;
      case 'telefono':
        errorMessage = validateTelefono(value);
        break;
      case 'municipio':
      case 'barrio':
      case 'direccion':
        errorMessage = validateUbicacion(value, name);
        break;
      case 'complemento':
        errorMessage = validateComplemento(value);
        break;
      default:
        break;
    }
    setEditValidation(prev => ({ ...prev, [name]: errorMessage }));
  };

  const validateEdit = () => {
    const newErrors = {};
    let isValid = true;

    // No validar tipodocumento y documento ya que no se pueden editar
    // const tipoDocumentoError = validateTipoDocumento(editForm.tipodocumento);
    // if (tipoDocumentoError) { newErrors.tipodocumento = tipoDocumentoError; isValid = false; }

    // const documentoError = validateDocumento(editForm.documento, editForm.tipodocumento);
    // if (documentoError) { newErrors.documento = documentoError; isValid = false; }

    const nombreError = validateNombreContacto(editForm.nombre, 'nombre');
    if (nombreError) { newErrors.nombre = nombreError; isValid = false; }

    const contactoError = validateNombreContacto(editForm.contacto, 'contacto');
    if (contactoError) { newErrors.contacto = contactoError; isValid = false; }

    const emailError = validateEmail(editForm.email);
    if (emailError) { newErrors.email = emailError; isValid = false; }

    const telefonoError = validateTelefono(editForm.telefono);
    if (telefonoError) { newErrors.telefono = telefonoError; isValid = false; }

    const municipioError = validateUbicacion(editForm.municipio, 'municipio');
    if (municipioError) { newErrors.municipio = municipioError; isValid = false; }

    const barrioError = validateUbicacion(editForm.barrio, 'barrio');
    if (barrioError) { newErrors.barrio = barrioError; isValid = false; }

    const direccionError = validateUbicacion(editForm.direccion, 'direccion');
    if (direccionError) { newErrors.direccion = direccionError; isValid = false; }

    const complementoError = validateComplemento(editForm.complemento);
    if (complementoError) { newErrors.complemento = complementoError; isValid = false; }

    setEditValidation(newErrors);
    return isValid;
  };

  const hasEditChanges = () => {
    if (!originalEditData) return false;
    
    // Campos que no se pueden editar (no considerar en la detección de cambios)
    const camposNoEditables = ['tipodocumento', 'documento'];
    
    return Object.keys(editForm).some(key => {
      // Saltar campos no editables
      if (camposNoEditables.includes(key)) return false;
      
      const originalValue = originalEditData[key] || '';
      const currentValue = editForm[key] || '';
      return originalValue !== currentValue;
    });
  };

  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    if (!proveedorAEditar || !originalEditData) return;

    setEditError('');
    if (!validateEdit()) {
      setEditLoading(false);
      return;
    }

    const datosParaEnviar = {};

    // Solo enviar campos que han cambiado (excluyendo campos no editables)
    const camposNoEditables = ['tipodocumento', 'documento'];
    
    Object.keys(editForm).forEach(key => {
      // Saltar campos no editables
      if (camposNoEditables.includes(key)) return;
      
      const originalValue = originalEditData[key] || '';
      const currentValue = editForm[key] || '';
      if (originalValue !== currentValue) {
        datosParaEnviar[key] = currentValue;
      }
    });

    if (!hasEditChanges()) {
      Swal.fire({
        icon: 'info',
        title: 'Sin Cambios',
        text: 'No hay cambios para guardar',
        confirmButtonColor: '#2E8B57',
        background: '#fff',
        customClass: {
          popup: 'animated fadeInDown'
        },
        didOpen: (popup) => {
          popup.style.zIndex = 9999;
        }
      });
      setEditLoading(false);
      return;
    }

    setEditLoading(true);
    try {
      await updateProveedor(proveedorAEditar.nitproveedor, datosParaEnviar);
      Swal.fire({
        icon: 'success',
        title: '¡Proveedor Actualizado!',
        text: 'Los cambios han sido guardados correctamente',
        timer: 2000,
        showConfirmButton: false,
        position: 'center',
        background: '#fff',
        customClass: {
          popup: 'animated fadeInDown'
        },
        didOpen: (popup) => {
          popup.style.zIndex = 9999;
        }
      });
      setEditOpen(false);
      setProveedorAEditar(null);
      fetchProveedores(pagina, busqueda);
    } catch (err) {
      const errorMsg = err.message || 'Error al guardar el proveedor.';
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
    setProveedorAEditar(null);
    setEditForm({});
    setOriginalEditData(null);
    setEditError('');
    setEditValidation({});
  };

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>Proveedores Registrados</Typography>
      <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" mb={2} gap={2}>
        <Box sx={{ flexGrow: 1, width: { xs: '100%', sm: 350 } }}>
          <Buscador
            value={busqueda}
            onChange={handleSearchChange}
            placeholder="Buscar Proveedor"
          />
        </Box>
        <Button
          variant="contained"
          color="success"
          onClick={() => { setCrearOpen(true); setCrearError(''); setCrearValidation({}); }}
          sx={{ minWidth: 140, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}
          startIcon={<AddIcon />}
        >
          Registrar Proveedor
        </Button>
      </Box>
      <Box mb={2} height={40} display="flex" alignItems="center" justifyContent="center">
        {loading && <CircularProgress size={28} />}
        {error && !loading && <Alert severity="error" sx={{ width: '100%' }}>{error}</Alert>}
      </Box>
      <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><b>#</b></TableCell>
              <TableCell><b>Nombre</b></TableCell>
              <TableCell><b>Email</b></TableCell>
              <TableCell><b>Teléfono</b></TableCell>
              <TableCell align="center"><b>Estado</b></TableCell>
              <TableCell align="center"><b>Acciones</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading && proveedoresFiltrados.length === 0 && !error && (
              <TableRow>
                <TableCell colSpan={6} align="center">No hay proveedores registrados.</TableCell>
              </TableRow>
            )}
            {proveedoresFiltrados.map((proveedor, idx) => {
              const proveedorActivo = proveedor.estado === true || proveedor.estado === 1 || proveedor.estado === "true";
              return (
                <TableRow key={idx}>
                  <TableCell>{(pagina - 1) * PROVEEDORES_POR_PAGINA + idx + 1}</TableCell>
                  <TableCell>{proveedor.nombre}</TableCell>
                  <TableCell>{proveedor.email}</TableCell>
                  <TableCell>{proveedor.telefono}</TableCell>
                  <TableCell align="center">
                    <CambiarEstado
                      id={proveedor.nitproveedor}
                      estadoActual={proveedorActivo}
                      onEstadoCambiado={handleEstadoCambiado}
                      updateEstadoApi={updateEstadoProveedor}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      <IconButton 
                        color="info" 
                        size="small" 
                        title="Ver Detalle"
                        onClick={() => handleVerDetalleProveedor(proveedor.nitproveedor)}
                        disabled={detalleLoading}
                      >
                        {detalleLoading && proveedorDetalle?.nitproveedor === proveedor.nitproveedor ? (
                          <CircularProgress size={20} />
                        ) : (
                          <VisibilityIcon fontSize="small" />
                        )}
                      </IconButton>
                      {proveedorActivo && (
                        <>
                          <IconButton color="warning" size="small" onClick={() => { handleEditarProveedor(proveedor); }} title="Editar">
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton color="error" size="small" onClick={() => { setProveedorEliminar(proveedor); setEliminarOpen(true); }} title="Eliminar">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
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
        <Pagination
          count={totalPaginasAPI}
          page={pagina}
          onChange={handleChangePagina}
          color="primary"
          showFirstButton 
          showLastButton
        />
      )}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={handleCloseSnackbar} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      {/* Modal Crear Proveedor */}
      <Dialog open={crearOpen} onClose={() => setCrearOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0', py: 2.5 }}>
          <AddIcon color="primary" sx={{ fontSize: 28 }} />
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>Registrar Proveedor</Typography>
        </DialogTitle>
        <form onSubmit={handleCrearProveedor} autoComplete="off">
          <DialogContent dividers sx={{ p: 0, backgroundColor: '#f8f9fa' }}>
            <Paper elevation={4} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 4, backgroundColor: '#fff', m: { xs: 1, sm: 3 }, boxShadow: '0 8px 32px rgba(0,0,0,0.10)' }}>
              <Typography variant="h5" sx={{ fontWeight: 900, mb: 3, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonAddIcon color="primary" sx={{ fontSize: 32 }} />
                Información del Proveedor
              </Typography>
              <Grid container spacing={3}>
                {/* Tipo de documento y documento */}
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <BadgeIcon color="primary" sx={{ fontSize: 24 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, fontSize: 18 }}>Identificación</Typography>
                  </Box>
                  <Box display="flex" gap={1} mb={2}>
                    {['NIT', 'CC', 'CE'].map(opt => (
                      <Button
                        key={opt}
                        variant={crearForm.tipodocumento === opt ? 'contained' : 'outlined'}
                        color={crearForm.tipodocumento === opt ? 'primary' : 'inherit'}
                        size="small"
                        sx={{ minWidth: 48, fontWeight: 700, borderRadius: 2, px: 2, py: 1, boxShadow: 'none' }}
                        onClick={() => setCrearForm(prev => ({ ...prev, tipodocumento: opt }))}
                      >
                        {opt}
                      </Button>
                    ))}
                  </Box>
                  <TextField
                    label="Documento"
                    name="documento"
                    value={crearForm.documento}
                    onChange={handleCrearChange}
                    fullWidth
                    required
                    error={!!crearValidation.documento}
                    helperText={crearValidation.documento}
                  />
                </Grid>
                {/* Información personal */}
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <PersonIcon color="primary" sx={{ fontSize: 24 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, fontSize: 18 }}>Información Personal</Typography>
                  </Box>
                  <TextField
                    label="Nombre"
                    name="nombre"
                    value={crearForm.nombre}
                    onChange={handleCrearChange}
                    fullWidth
                    required
                    error={!!crearValidation.nombre}
                    helperText={crearValidation.nombre}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    label="Contacto"
                    name="contacto"
                    value={crearForm.contacto}
                    onChange={handleCrearChange}
                    fullWidth
                    required
                    error={!!crearValidation.contacto}
                    helperText={crearValidation.contacto}
                  />
                </Grid>
                {/* Contacto */}
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <EmailIcon color="primary" sx={{ fontSize: 24 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, fontSize: 18 }}>Contacto</Typography>
                  </Box>
                  <TextField
                    label="Email"
                    name="email"
                    value={crearForm.email}
                    onChange={handleCrearChange}
                    fullWidth
                    required
                    error={!!crearValidation.email}
                    helperText={crearValidation.email}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    label="Teléfono"
                    name="telefono"
                    value={crearForm.telefono}
                    onChange={handleCrearChange}
                    fullWidth
                    required
                    error={!!crearValidation.telefono}
                    helperText={crearValidation.telefono}
                  />
                </Grid>
                {/* Ubicación */}
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <LocationOnIcon color="primary" sx={{ fontSize: 24 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, fontSize: 18 }}>Ubicación</Typography>
                  </Box>
                  <TextField
                    label="Municipio"
                    name="municipio"
                    value={crearForm.municipio}
                    onChange={handleCrearChange}
                    fullWidth
                    required
                    error={!!crearValidation.municipio}
                    helperText={crearValidation.municipio}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    label="Barrio"
                    name="barrio"
                    value={crearForm.barrio}
                    onChange={handleCrearChange}
                    fullWidth
                    required
                    error={!!crearValidation.barrio}
                    helperText={crearValidation.barrio}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    label="Dirección"
                    name="direccion"
                    value={crearForm.direccion}
                    onChange={handleCrearChange}
                    fullWidth
                    required
                    error={!!crearValidation.direccion}
                    helperText={crearValidation.direccion}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    label="Complemento"
                    name="complemento"
                    value={crearForm.complemento}
                    onChange={handleCrearChange}
                    fullWidth
                    error={!!crearValidation.complemento}
                    helperText={crearValidation.complemento}
                  />
                </Grid>
              </Grid>
              {crearError && <Alert severity="error" sx={{ mt: 3 }}>{crearError}</Alert>}
            </Paper>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, backgroundColor: '#f8f9fa', borderTop: '1px solid #e0e0e0' }}>
            <Button onClick={() => setCrearOpen(false)} color="secondary" variant="outlined">Cancelar</Button>
            <Button type="submit" color="primary" variant="contained" disabled={crearLoading || Object.values(crearValidation).some(v => v)}>
              {crearLoading ? <CircularProgress size={24} /> : 'Registrar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Eliminar
        id={proveedorEliminar?.documento || proveedorEliminar?.nitproveedor}
        open={eliminarOpen}
        onClose={() => setEliminarOpen(false)}
        onEliminado={handleProveedorEliminadoExitosamente}
        onError={(errorMessage) => openSnackbar(errorMessage, 'error')}
        nombre={proveedorEliminar ? proveedorEliminar.nombre : ''}
        tipoEntidad="proveedor"
        deleteApi={deleteProveedor}
      />

      {/* Modal de Detalle */}
      <Dialog open={detalleOpen} onClose={() => setDetalleOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0', py: 2.5 }}>
          <VisibilityIcon color="primary" sx={{ fontSize: 28 }} />
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>Detalles del Proveedor</Typography>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3, backgroundColor: '#fff' }}>
          {detalleLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress size={40} />
            </Box>
          ) : detalleError ? (
            <Alert severity="error" sx={{ mb: 2 }}>{detalleError}</Alert>
          ) : proveedorDetalle ? (
            <>
              <Grid container spacing={3}>
                {/* Identificación */}
                <Grid item xs={12} sm={6}>
                  <Paper elevation={0} sx={{ p: 3, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <BadgeIcon color="primary" sx={{ fontSize: 24 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>Identificación</Typography>
                    </Box>
                    <Typography variant="subtitle1" color="text.secondary">Tipo de Documento</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>{proveedorDetalle.tipodocumento}</Typography>
                    <Typography variant="subtitle1" color="text.secondary">Documento</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>{proveedorDetalle.nitproveedor || proveedorDetalle.documento}</Typography>
                  </Paper>
                </Grid>
                {/* Información personal */}
                <Grid item xs={12} sm={6}>
                  <Paper elevation={0} sx={{ p: 3, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <PersonIcon color="primary" sx={{ fontSize: 24 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>Información Personal</Typography>
                    </Box>
                    <Typography variant="subtitle1" color="text.secondary">Nombre</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>{proveedorDetalle.nombre}</Typography>
                    <Typography variant="subtitle1" color="text.secondary">Contacto</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>{proveedorDetalle.contacto}</Typography>
                  </Paper>
                </Grid>
                {/* Contacto */}
                <Grid item xs={12} sm={6}>
                  <Paper elevation={0} sx={{ p: 3, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <EmailIcon color="primary" sx={{ fontSize: 24 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>Contacto</Typography>
                    </Box>
                    <Typography variant="subtitle1" color="text.secondary">Email</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>{proveedorDetalle.email}</Typography>
                    <Typography variant="subtitle1" color="text.secondary">Teléfono</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>{proveedorDetalle.telefono}</Typography>
                  </Paper>
                </Grid>
                {/* Ubicación */}
                <Grid item xs={12} sm={6}>
                  <Paper elevation={0} sx={{ p: 3, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <LocationOnIcon color="primary" sx={{ fontSize: 24 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>Ubicación</Typography>
                    </Box>
                    <Typography variant="subtitle1" color="text.secondary">Municipio</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>{proveedorDetalle.municipio}</Typography>
                    <Typography variant="subtitle1" color="text.secondary">Barrio</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>{proveedorDetalle.barrio}</Typography>
                    <Typography variant="subtitle1" color="text.secondary">Dirección</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>{proveedorDetalle.direccion}</Typography>
                    {proveedorDetalle.complemento && (
                      <>
                        <Typography variant="subtitle1" color="text.secondary">Complemento</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>{proveedorDetalle.complemento}</Typography>
                      </>
                    )}
                  </Paper>
                </Grid>
                {/* Estado */}
                <Grid item xs={12} sm={6}>
                  <Paper elevation={0} sx={{ p: 3, backgroundColor: '#f8f9fa', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CheckCircleIcon color={proveedorDetalle.estado ? "success" : "error"} sx={{ fontSize: 24 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Estado</Typography>
                    <Chip 
                      label={proveedorDetalle.estado ? "Activo" : "Inactivo"} 
                      color={proveedorDetalle.estado ? "success" : "error"}
                      icon={proveedorDetalle.estado ? <CheckCircleIcon /> : <CancelIcon />}
                      sx={{ fontWeight: 600, ml: 2 }}
                    />
                  </Paper>
                </Grid>
              </Grid>
            </>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, backgroundColor: '#f8f9fa', borderTop: '1px solid #e0e0e0' }}>
          <Button onClick={() => setDetalleOpen(false)} variant="contained" color="primary">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Edición */}
      <Dialog open={editOpen} onClose={handleCerrarEdicion} maxWidth="md" fullWidth>
        <form onSubmit={handleGuardarEdicion} autoComplete="off">
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0', py: 2.5 }}>
            <EditIcon color="primary" sx={{ fontSize: 28 }} />
            <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>Editar Proveedor</Typography>
          </DialogTitle>
          <DialogContent dividers sx={{ p: 3, backgroundColor: '#fff', maxHeight: '70vh', overflowY: 'auto' }}>
            {editLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress size={40} />
              </Box>
            ) : (
              <Grid container spacing={3}>
                {/* Identificación */}
                <Grid item xs={12} sm={6}>
                  <Paper elevation={0} sx={{ p: 3, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <BadgeIcon color="primary" sx={{ fontSize: 24 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>Identificación</Typography>
                    </Box>
                    <Box display="flex" gap={1} mb={2}>
                      {['NIT', 'CC', 'CE'].map(opt => (
                        <Button
                          key={opt}
                          variant={editForm.tipodocumento === opt ? 'contained' : 'outlined'}
                          color={editForm.tipodocumento === opt ? 'primary' : 'inherit'}
                          size="small"
                          sx={{ minWidth: 48, fontWeight: 700, borderRadius: 2, px: 2, py: 1, boxShadow: 'none' }}
                          onClick={() => setEditForm(prev => ({ ...prev, tipodocumento: opt }))}
                        >
                          {opt}
                        </Button>
                      ))}
                    </Box>
                    <TextField
                      label="Documento"
                      name="documento"
                      value={editForm.documento}
                      onChange={handleEditChange}
                      fullWidth
                      required
                    />
                  </Paper>
                </Grid>
                {/* Información personal */}
                <Grid item xs={12} sm={6}>
                  <Paper elevation={0} sx={{ p: 3, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <PersonIcon color="primary" sx={{ fontSize: 24 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>Información Personal</Typography>
                    </Box>
                    <TextField
                      label="Nombre"
                      name="nombre"
                      value={editForm.nombre}
                      onChange={handleEditChange}
                      fullWidth
                      required
                      error={!!editValidation.nombre}
                      helperText={editValidation.nombre}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      label="Contacto"
                      name="contacto"
                      value={editForm.contacto}
                      onChange={handleEditChange}
                      fullWidth
                      required
                      error={!!editValidation.contacto}
                      helperText={editValidation.contacto}
                    />
                  </Paper>
                </Grid>
                {/* Contacto */}
                <Grid item xs={12} sm={6}>
                  <Paper elevation={0} sx={{ p: 3, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <EmailIcon color="primary" sx={{ fontSize: 24 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>Contacto</Typography>
                    </Box>
                    <TextField
                      label="Email"
                      name="email"
                      value={editForm.email}
                      onChange={handleEditChange}
                      fullWidth
                      required
                      error={!!editValidation.email}
                      helperText={editValidation.email}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      label="Teléfono"
                      name="telefono"
                      value={editForm.telefono}
                      onChange={handleEditChange}
                      fullWidth
                      required
                      error={!!editValidation.telefono}
                      helperText={editValidation.telefono}
                    />
                  </Paper>
                </Grid>
                {/* Ubicación */}
                <Grid item xs={12} sm={6}>
                  <Paper elevation={0} sx={{ p: 3, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <LocationOnIcon color="primary" sx={{ fontSize: 24 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>Ubicación</Typography>
                    </Box>
                    <TextField
                      label="Municipio"
                      name="municipio"
                      value={editForm.municipio}
                      onChange={handleEditChange}
                      fullWidth
                      required
                      error={!!editValidation.municipio}
                      helperText={editValidation.municipio}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      label="Barrio"
                      name="barrio"
                      value={editForm.barrio}
                      onChange={handleEditChange}
                      fullWidth
                      required
                      error={!!editValidation.barrio}
                      helperText={editValidation.barrio}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      label="Dirección"
                      name="direccion"
                      value={editForm.direccion}
                      onChange={handleEditChange}
                      fullWidth
                      required
                      error={!!editValidation.direccion}
                      helperText={editValidation.direccion}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      label="Complemento"
                      name="complemento"
                      value={editForm.complemento}
                      onChange={handleEditChange}
                      fullWidth
                      error={!!editValidation.complemento}
                      helperText={editValidation.complemento}
                    />
                  </Paper>
                </Grid>
              </Grid>
            )}
            {editError && <Alert severity="error" sx={{ mt: 3 }}>{editError}</Alert>}
          </DialogContent>
          <DialogActions sx={{ p: 2.5, backgroundColor: '#f8f9fa', borderTop: '1px solid #e0e0e0' }}>
            <Button onClick={handleCerrarEdicion} color="secondary" variant="outlined">Cancelar</Button>
            <Button type="submit" color="primary" variant="contained" disabled={editLoading || Object.values(editValidation).some(v => v)}>
              {editLoading ? <CircularProgress size={24} /> : 'Guardar Cambios'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Proveedores;
