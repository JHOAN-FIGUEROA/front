import { useEffect, useState, useCallback } from 'react';
import {
  Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert, Button, Snackbar, Pagination, IconButton, Stack, Dialog, DialogTitle, DialogContent, DialogActions, Grid, TextField, MenuItem, Chip
} from '@mui/material';
import { getClientes, updateEstadoCliente, createCliente, getClienteById, updateCliente, deleteCliente } from '../api';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import Buscador from '../components/Buscador';
import CambiarEstado from '../components/CambiarEstado';
import { useSearchParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import BadgeIcon from '@mui/icons-material/Badge';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LockIcon from '@mui/icons-material/Lock';
import Editar from '../components/Editar';
import Eliminar from '../components/Eliminar';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

const CLIENTES_POR_PAGINA = 5;

const CAMPOS_CREAR = [
  { name: 'tipodocumento', label: 'Tipo de Documento', required: true, default: 'CC', options: ['TI', 'CC', 'CE'] },
  { name: 'documentocliente', label: 'Documento', required: true },
  { name: 'nombre', label: 'Nombre', required: true },
  { name: 'apellido', label: 'Apellido', required: true },
  { name: 'email', label: 'Email', required: true, type: 'email' },
  { name: 'telefono', label: 'Teléfono', required: true },
  { name: 'municipio', label: 'Municipio', required: true },
  { name: 'complemento', label: 'Complemento', required: false },
  { name: 'direccion', label: 'Dirección', required: true },
  { name: 'barrio', label: 'Barrio', required: true },
  { name: 'password', label: 'Contraseña', required: true, type: 'password' },
];

const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const [pagina, setPagina] = useState(Number.parseInt(searchParams.get('page')) || 1);
  const [totalPaginasAPI, setTotalPaginasAPI] = useState(1);
  const [busqueda, setBusqueda] = useState(searchParams.get('search') || '');

  // Estado unificado para el Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Estados para crear cliente
  const [crearOpen, setCrearOpen] = useState(false);
  const [crearLoading, setCrearLoading] = useState(false);
  const [crearError, setCrearError] = useState('');
  const [crearForm, setCrearForm] = useState(() => Object.fromEntries(CAMPOS_CREAR.map(c => [c.name, c.default || ''])));
  const [crearValidation, setCrearValidation] = useState({});

  // Estados para ver detalle de cliente
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [clienteDetalle, setClienteDetalle] = useState(null);
  const [detalleLoading, setDetalleLoading] = useState(false);
  const [detalleError, setDetalleError] = useState('');

  // Estados para editar cliente
  const [editOpen, setEditOpen] = useState(false);
  const [clienteAEditar, setClienteAEditar] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editValidation, setEditValidation] = useState({});
  const [originalEditData, setOriginalEditData] = useState(null);

  const [eliminarOpen, setEliminarOpen] = useState(false);
  const [clienteEliminar, setClienteEliminar] = useState(null);

  // Función helper para mostrar el Snackbar
  const openSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchClientes = useCallback(async (currentPage, currentSearch) => {
    setLoading(true);
    setError('');
    try {
      const result = await getClientes(currentPage, CLIENTES_POR_PAGINA, currentSearch);
      if (result.error) {
        setError(result.detalles || 'Error al cargar clientes.');
        setClientes([]);
        setTotalPaginasAPI(1);
        if (currentPage > 1) {
          const newSearchParams = new URLSearchParams(searchParams);
          newSearchParams.set('page', '1');
          setSearchParams(newSearchParams, { replace: true });
        }
      } else if (result.success && result.data && result.data.data && result.data.data.clientes) {
        setClientes(result.data.data.clientes || []);
        const totalPaginas = result.data.data.totalPaginas || 1;
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
        setClientes([]);
        setTotalPaginasAPI(1);
      }
    } catch (err) {
      setError('Error inesperado al cargar clientes: ' + (err.message || ''));
      setClientes([]);
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

    fetchClientes(pageFromUrl, searchFromUrl);
  }, [searchParams, fetchClientes]);

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

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ open: false, message: '', severity: 'info' });
  };

  const handleEstadoCambiado = (id, nuevoEstado, errorMsg) => {
    if (errorMsg) {
      openSnackbar(`Error al cambiar estado: ${errorMsg}`, 'error');
    } else {
      setClientes((prev) => prev.map((c) => 
        c.id === id ? { ...c, estado: nuevoEstado } : c
      ));
      const cliente = clientes.find(c => c.id === id);
      openSnackbar(`Estado del cliente ${cliente?.nombre || 'Cliente'} cambiado.`, 'success');
    }
  };

  // Funciones de validación para crear cliente
  const validateTipoDocumento = (tipoDocumento) => {
    if (!tipoDocumento) {
      return 'El tipo de documento es requerido';
    }
    return '';
  };

  const validateDocumento = (documento) => {
    if (!String(documento).trim()) {
      return 'El documento es requerido';
    }
    if (!/^\d{10}$/.test(String(documento))) {
      return 'El documento debe tener exactamente 10 dígitos numéricos';
    }
    return '';
  };

  const validateNombreApellido = (valor, campo) => {
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
    if (campo === 'direccion') {
      if ((valor.match(/\d/g) || []).length < 2) {
        return `La dirección debe contener al menos 2 números`;
      }
      // Permitir todos los caracteres en dirección
      return '';
    }
    // Para los demás campos, solo letras, números y espacios
    if (!/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]+$/.test(valor)) {
      return `Solo se permiten letras, números y espacios`;
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

  const validatePassword = (password) => {
    if (!password?.trim()) {
      return 'La contraseña es requerida';
    }
    if (password.length < 8) {
      return 'La contraseña debe tener al menos 8 caracteres';
    }
    if (!/\d/.test(password)) {
      return 'La contraseña debe contener al menos un número';
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return 'La contraseña debe contener al menos un carácter especial';
    }
    if (!/[A-Z]/.test(password)) {
      return 'La contraseña debe contener al menos una mayúscula';
    }
    return '';
  };

  // Ver Detalle
  const handleVerDetalleCliente = async (id) => {
    setDetalleLoading(true);
    setDetalleError('');
    setClienteDetalle(null);
    setDetalleOpen(true);
    try {
      const response = await getClienteById(id);
      if (response && response.data && response.data.cliente) {
        setClienteDetalle(response.data.cliente);
      } else {
        throw new Error('No se encontraron datos del cliente');
      }
    } catch (error) {
      setDetalleError(error.message || 'Error al cargar los detalles del cliente');
    } finally {
      setDetalleLoading(false);
    }
  };

  // Editar Cliente
  const handleEditarCliente = async (cliente) => {
    setClienteAEditar(cliente);
    setEditOpen(true);
    setEditLoading(true);
    setEditError('');
    setEditValidation({});
    try {
      const response = await getClienteById(cliente.id);
      const data = response.data?.cliente || response.data;
      const fetchedData = {
        tipodocumento: data.tipodocumento || '',
        documentocliente: data.id || data.documentocliente || '',
        nombre: data.nombre || '',
        apellido: data.apellido || '',
        email: data.email || '',
        municipio: data.direccion?.municipio || '',
        complemento: data.direccion?.complemento || '',
        direccion: data.direccion?.direccion || '',
        telefono: data.telefono || '',
        barrio: data.direccion?.barrio || '',
        // No se edita password aquí
      };
      setEditForm(fetchedData);
      setOriginalEditData(fetchedData);
    } catch (err) {
      setEditError('Error al cargar los datos del cliente para editar: ' + (err.message || ''));
      Swal.fire({
        icon: 'error',
        title: 'Error al Cargar Datos',
        text: err.message || 'Error al cargar los datos del cliente para editar',
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
      setEditLoading(false);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));

    let errorMessage = '';
    switch (name) {
      case 'tipodocumento':
        errorMessage = validateTipoDocumento(value);
        break;
      case 'documentocliente':
        errorMessage = validateDocumento(value);
        break;
      case 'nombre':
      case 'apellido':
        errorMessage = validateNombreApellido(value, name);
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

  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    if (!clienteAEditar || !originalEditData) return;
    setEditError('');
    if (!validateEdit()) {
      setEditLoading(false);
      return;
    }
    const datosParaEnviar = {};
    let huboCambio = false;
    Object.keys(editForm).forEach(key => {
      const originalValue = originalEditData[key] || '';
      const currentValue = editForm[key] || '';
      if (originalValue !== currentValue) {
        huboCambio = true;
        datosParaEnviar[key] = currentValue;
      }
    });
    if (!huboCambio || Object.keys(datosParaEnviar).length === 0) {
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
      setEditLoading(false);
      return;
    }
    // Log temporal para depuración
    console.log('Payload enviado a la API:', datosParaEnviar);
    setEditLoading(true);
    try {
      await updateCliente(clienteAEditar.id, datosParaEnviar);
      Swal.fire({
        icon: 'success',
        title: '¡Cliente Actualizado!',
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
      setEditOpen(false);
      setClienteAEditar(null);
      fetchClientes(pagina, busqueda);
    } catch (err) {
      const errorMsg = err.message || 'Error al guardar el cliente.';
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
        zIndex: 99999,
        didOpen: (popup) => {
          popup.style.zIndex = 99999;
        }
      });
    } finally {
      setEditLoading(false);
    }
  };

  const handleCerrarEdicion = () => {
    setEditOpen(false);
    setClienteAEditar(null);
    setEditForm({});
    setOriginalEditData(null);
    setEditError('');
    setEditValidation({});
  };

  // Eliminar Cliente
  const handleEliminarCliente = (cliente) => {
    setClienteEliminar(cliente);
    setEliminarOpen(true);
  };

  const handleClienteEliminadoExitosamente = async () => {
    setEliminarOpen(false);
    setClienteEliminar(null);
    fetchClientes(pagina, busqueda);
    openSnackbar('Cliente eliminado correctamente', 'success');
  };

  const handleCrearCliente = () => {
    setCrearOpen(true);
    setCrearError('');
    setCrearValidation({});
  };

  const handleCrearChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    if (name === 'documentocliente') {
      newValue = value.replace(/[^0-9]/g, '');
    }
    setCrearForm(prev => ({ ...prev, [name]: newValue }));

    let errorMessage = '';
    switch (name) {
      case 'tipodocumento':
        errorMessage = validateTipoDocumento(newValue);
        break;
      case 'documentocliente':
        errorMessage = validateDocumento(newValue);
        break;
      case 'nombre':
      case 'apellido':
        errorMessage = validateNombreApellido(newValue, name);
        break;
      case 'email':
        errorMessage = validateEmail(newValue);
        break;
      case 'telefono':
        errorMessage = validateTelefono(newValue);
        break;
      case 'municipio':
      case 'barrio':
      case 'direccion':
        errorMessage = validateUbicacion(newValue, name);
        break;
      case 'complemento':
        errorMessage = validateComplemento(newValue);
        break;
      case 'password':
        errorMessage = validatePassword(newValue);
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

    const documentoError = validateDocumento(crearForm.documentocliente);
    if (documentoError) { newErrors.documentocliente = documentoError; isValid = false; }

    const nombreError = validateNombreApellido(crearForm.nombre, 'nombre');
    if (nombreError) { newErrors.nombre = nombreError; isValid = false; }

    const apellidoError = validateNombreApellido(crearForm.apellido, 'apellido');
    if (apellidoError) { newErrors.apellido = apellidoError; isValid = false; }

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

    const passwordError = validatePassword(crearForm.password);
    if (passwordError) { newErrors.password = passwordError; isValid = false; }

    setCrearValidation(newErrors);
    return isValid;
  };

  const extractErrorMessage = (err) => {
    if (!err) return 'Error al crear cliente';
    if (typeof err === 'string') return err;
    if (typeof err === 'object') {
      return (
        err.message ||
        err.mensaje ||
        err.detalles ||
        err.error ||
        (err.response && (err.response.data?.message || err.response.data?.mensaje || err.response.data?.detalles || err.response.data?.error)) ||
        JSON.stringify(err)
      );
    }
    return 'Error al crear cliente';
  };

  const handleCrearClienteSubmit = async (e) => {
    e.preventDefault();
    setCrearError('');
    if (!validateCrear()) return;
    setCrearLoading(true);
    try {
      const datosEnviar = {
        ...crearForm,
        documentocliente: Number(crearForm.documentocliente),
        telefono: String(crearForm.telefono),
      };
      await createCliente(datosEnviar);
      setCrearOpen(false);
      setCrearForm(Object.fromEntries(CAMPOS_CREAR.map(c => [c.name, c.default || ''])));
      Swal.fire({
        icon: 'success',
        title: '¡Cliente Creado!',
        text: 'El cliente ha sido registrado correctamente',
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
      fetchClientes(pagina, busqueda);
    } catch (err) {
      const msg = extractErrorMessage(err);
      setCrearError(msg);
    } finally {
      setCrearLoading(false);
    }
  };

  const validateEdit = () => {
    const newErrors = {};
    let isValid = true;

    // Validar todos los campos (excepto password)
    const tipoDocumentoError = validateTipoDocumento(editForm.tipodocumento);
    if (tipoDocumentoError) { newErrors.tipodocumento = tipoDocumentoError; isValid = false; }

    const documentoError = validateDocumento(editForm.documentocliente);
    if (documentoError) { newErrors.documentocliente = documentoError; isValid = false; }

    const nombreError = validateNombreApellido(editForm.nombre, 'nombre');
    if (nombreError) { newErrors.nombre = nombreError; isValid = false; }

    const apellidoError = validateNombreApellido(editForm.apellido, 'apellido');
    if (apellidoError) { newErrors.apellido = apellidoError; isValid = false; }

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
    return Object.keys(editForm).some(key => {
      const originalValue = originalEditData[key] || '';
      const currentValue = editForm[key] || '';
      return originalValue !== currentValue;
    });
  };

  // Filtrado local EXACTAMENTE igual que en proveedores
  const clientesFiltrados = clientes.filter(cliente => {
    if (!busqueda) return true;
    const terminoBusquedaLower = busqueda.toLowerCase().trim();

    if (terminoBusquedaLower === 'activo') {
      return cliente.estado === true || cliente.estado === 1 || cliente.estado === 'true';
    }
    if (terminoBusquedaLower === 'inactivo') {
      return !(cliente.estado === true || cliente.estado === 1 || cliente.estado === 'true');
    }

    const nombreCompleto = `${cliente.nombre || ''} ${cliente.apellido || ''}`.toLowerCase();
    return (
      nombreCompleto.includes(terminoBusquedaLower) ||
      (cliente.email || '').toLowerCase().includes(terminoBusquedaLower) ||
      (cliente.telefono || '').toLowerCase().includes(terminoBusquedaLower)
    );
  });

  return (
  <Box p={3}>
      <Typography variant="h5" gutterBottom>Clientes Registrados</Typography>
      <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" mb={2} gap={2}>
        <Box sx={{ flexGrow: 1, width: { xs: '100%', sm: 350 } }}>
          <Buscador
            value={busqueda}
            onChange={handleSearchChange}
            placeholder="Buscar Cliente"
          />
        </Box>
        <Button
          variant="contained"
          color="success"
          onClick={handleCrearCliente}
          sx={{ minWidth: 140, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}
          startIcon={<AddIcon />}
        >
          Registrar Cliente
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
              <TableCell><b>Nombre Completo</b></TableCell>
              <TableCell><b>Teléfono</b></TableCell>
              <TableCell align="center"><b>Estado</b></TableCell>
              <TableCell align="center"><b>Acciones</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading && clientesFiltrados.length === 0 && !error && (
              <TableRow>
                <TableCell colSpan={5} align="center">No hay clientes registrados.</TableCell>
              </TableRow>
            )}
            {clientesFiltrados.map((cliente, idx) => {
              const clienteActivo = cliente.estado === true || cliente.estado === 1 || cliente.estado === "true";
              const nombreCompleto = `${cliente.nombre || ''} ${cliente.apellido || ''}`.trim();
              
              return (
                <TableRow key={cliente.id || idx}>
                  <TableCell>{(pagina - 1) * CLIENTES_POR_PAGINA + idx + 1}</TableCell>
                  <TableCell>{nombreCompleto}</TableCell>
                  <TableCell>{cliente.telefono}</TableCell>
                  <TableCell align="center">
                    <CambiarEstado
                      id={cliente.id}
                      estadoActual={clienteActivo}
                      onEstadoCambiado={handleEstadoCambiado}
                      updateEstadoApi={updateEstadoCliente}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      <IconButton 
                        color="info" 
                        size="small" 
                        title="Ver Detalle"
                        onClick={() => handleVerDetalleCliente(cliente.id)}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      {clienteActivo && (
                        <>
                          <IconButton 
                            color="warning" 
                            size="small" 
                            onClick={() => handleEditarCliente(cliente)} 
                            title="Editar"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            color="error" 
                            size="small" 
                            onClick={() => handleEliminarCliente(cliente)} 
                            title="Eliminar"
                          >
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
        <Box display="flex" justifyContent="center" mt={2}>
          <Pagination
            count={totalPaginasAPI}
            page={pagina}
            onChange={handleChangePagina}
            color="primary"
            showFirstButton 
            showLastButton
          />
        </Box>
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

      {/* Modal Crear Cliente */}
      <Dialog open={crearOpen} onClose={() => setCrearOpen(false)} maxWidth="md" fullWidth scroll="paper"
        PaperProps={{ sx: { borderRadius: 2, boxShadow: '0 8px 32px rgba(0,0,0,0.1)', overflow: 'hidden' } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0', py: 2.5 }}>
          <AddIcon color="primary" sx={{ fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Registrar Cliente</Typography>
        </DialogTitle>
        <form onSubmit={handleCrearClienteSubmit} autoComplete="off">
          <DialogContent dividers sx={{ p: 3, backgroundColor: '#fff', maxHeight: '70vh', overflowY: 'auto' }}>
            <Grid container spacing={3}>
              {/* Identificación */}
              <Grid item xs={12} md={6}>
                <Paper elevation={0} sx={{ p: 3, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <BadgeIcon color="primary" sx={{ fontSize: 24 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Identificación</Typography>
                  </Box>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12}>
                      <Grid container spacing={1}>
                        {['CC', 'CE', 'TI'].map(opt => (
                          <Grid item xs={4} key={opt}>
                            <Paper
                              elevation={crearForm.tipodocumento === opt ? 3 : 0}
                              sx={{
                                p: 1.5,
                                borderRadius: 2,
                                border: crearForm.tipodocumento === opt ? '2px solid #1976d2' : '1px solid #e0e0e0',
                                backgroundColor: crearForm.tipodocumento === opt ? '#e3f2fd' : '#fff',
                                cursor: 'pointer',
                                textAlign: 'center',
                                fontWeight: 600,
                                transition: 'all 0.2s',
                                '&:hover': {
                                  boxShadow: '0 2px 8px rgba(25, 118, 210, 0.12)',
                                  borderColor: '#1976d2',
                                },
                              }}
                              onClick={() => setCrearForm(prev => ({ ...prev, tipodocumento: opt }))}
                            >
                              <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: 16 }}>
                                {opt}
                              </Typography>
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                      {crearValidation.tipodocumento && (
                        <Alert severity="error" sx={{ mt: 2 }}>{crearValidation.tipodocumento}</Alert>
                      )}
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Documento"
                        name="documentocliente"
                        value={crearForm.documentocliente}
                        onChange={handleCrearChange}
                        fullWidth
                        margin="normal"
                        required
                        error={!!crearValidation.documentocliente}
                        helperText={crearValidation.documentocliente}
                        type="number"
                        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', min: 0 }}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
              {/* Información Personal */}
              <Grid item xs={12} md={6}>
                <Paper elevation={0} sx={{ p: 3, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <PersonIcon color="primary" sx={{ fontSize: 24 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Información Personal</Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Nombre"
                        name="nombre"
                        value={crearForm.nombre}
                        onChange={handleCrearChange}
                        fullWidth
                        margin="normal"
                        required
                        error={!!crearValidation.nombre}
                        helperText={crearValidation.nombre}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Apellido"
                        name="apellido"
                        value={crearForm.apellido}
                        onChange={handleCrearChange}
                        fullWidth
                        margin="normal"
                        required
                        error={!!crearValidation.apellido}
                        helperText={crearValidation.apellido}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Contraseña"
                        name="password"
                        type="password"
                        value={crearForm.password}
                        onChange={handleCrearChange}
                        fullWidth
                        margin="normal"
                        required
                        error={!!crearValidation.password}
                        helperText={crearValidation.password}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
              {/* Contacto */}
              <Grid item xs={12} md={6}>
                <Paper elevation={0} sx={{ p: 3, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <EmailIcon color="primary" sx={{ fontSize: 24 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Contacto</Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Email"
                        name="email"
                        type="email"
                        value={crearForm.email}
                        onChange={handleCrearChange}
                        fullWidth
                        margin="normal"
                        required
                        error={!!crearValidation.email}
                        helperText={crearValidation.email}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Teléfono"
                        name="telefono"
                        value={crearForm.telefono}
                        onChange={handleCrearChange}
                        fullWidth
                        margin="normal"
                        required
                        error={!!crearValidation.telefono}
                        helperText={crearValidation.telefono}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
              {/* Ubicación */}
              <Grid item xs={12} md={6}>
                <Paper elevation={0} sx={{ p: 3, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <LocationOnIcon color="primary" sx={{ fontSize: 24 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Ubicación</Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1" color="text.secondary">Municipio</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>{crearForm.municipio}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1" color="text.secondary">Barrio</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>{crearForm.barrio}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" color="text.secondary">Dirección</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>{crearForm.direccion}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" color="text.secondary">Complemento</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>{crearForm.complemento}</Typography>
                    </Grid>
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
              {crearLoading ? <CircularProgress size={18} /> : 'Registrar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Modal de Detalle de Cliente */}
      <Dialog 
        open={detalleOpen} 
        onClose={() => setDetalleOpen(false)} 
        maxWidth="md" 
        fullWidth
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
          <PersonIcon color="primary" sx={{ fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Detalles del Cliente
          </Typography>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3, backgroundColor: '#fff' }}>
          {detalleError ? (
            <Alert severity="error" sx={{ mt: 2 }}>{detalleError}</Alert>
          ) : detalleLoading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : clienteDetalle ? (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper elevation={0} sx={{ p: 3, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <BadgeIcon color="primary" sx={{ fontSize: 24 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Identificación</Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" color="text.secondary">Tipo de Documento</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>{clienteDetalle.tipodocumento}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" color="text.secondary">Documento</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>{clienteDetalle.id || clienteDetalle.documentocliente}</Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper elevation={0} sx={{ p: 3, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <PersonIcon color="primary" sx={{ fontSize: 24 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Información Personal</Typography>
                  </Box>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={8}>
                      <Typography variant="subtitle1" color="text.secondary">Nombre Completo</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>{clienteDetalle.nombre} {clienteDetalle.apellido}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="subtitle1" color="text.secondary">Estado</Typography>
                      <Chip
                        label={clienteDetalle.estado ? 'Activo' : 'Inactivo'}
                        color={clienteDetalle.estado ? 'success' : 'error'}
                        icon={clienteDetalle.estado ? <CheckCircleIcon /> : <CancelIcon />}
                        sx={{ fontWeight: 600 }}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper elevation={0} sx={{ p: 3, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <EmailIcon color="primary" sx={{ fontSize: 24 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Contacto</Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" color="text.secondary">Email</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>{clienteDetalle.email}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" color="text.secondary">Teléfono</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>{clienteDetalle.telefono}</Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper elevation={0} sx={{ p: 3, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <LocationOnIcon color="primary" sx={{ fontSize: 24 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Ubicación</Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1" color="text.secondary">Municipio</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>{clienteDetalle.direccion?.municipio}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1" color="text.secondary">Barrio</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>{clienteDetalle.direccion?.barrio}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" color="text.secondary">Dirección</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>{clienteDetalle.direccion?.direccion}</Typography>
                    </Grid>
                    {clienteDetalle.direccion?.complemento && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle1" color="text.secondary">Complemento</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>{clienteDetalle.direccion?.complemento}</Typography>
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              </Grid>
              {clienteDetalle.usuario && (
                <Grid item xs={12}>
                  <Box display="flex" justifyContent="flex-end">
                    <Paper elevation={0} sx={{ p: 3, backgroundColor: '#f8f9fa', borderRadius: 2, minWidth: 320, maxWidth: 400 }}>
                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>Usuario Asociado</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">Email: <b>{clienteDetalle.usuario.email}</b></Typography>
                      <Typography variant="body2" color="text.secondary">Rol: <b>{clienteDetalle.usuario.rol}</b></Typography>
                      <Box display="flex" alignItems="center" gap={1} mt={1}>
                        <Typography variant="body2" color="text.secondary">Estado:</Typography>
                        <Chip
                          label={clienteDetalle.usuario.estado ? 'Activo' : 'Inactivo'}
                          color={clienteDetalle.usuario.estado ? 'success' : 'error'}
                          icon={clienteDetalle.usuario.estado ? <CheckCircleIcon /> : <CancelIcon />}
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>
                    </Paper>
                  </Box>
                </Grid>
              )}
            </Grid>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, backgroundColor: '#f8f9fa', borderTop: '1px solid #e0e0e0' }}>
          <Button 
            onClick={() => setDetalleOpen(false)} 
            color="primary" 
            sx={{ 
              borderRadius: 2, 
              textTransform: 'none', 
              px: 3, 
              py: 1, 
              fontWeight: 600, 
              boxShadow: 'none', 
              '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' } 
            }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Edición de Cliente */}
      <Dialog 
        open={editOpen} 
        onClose={handleCerrarEdicion} 
        maxWidth="md" 
        fullWidth 
        scroll="paper"
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }
        }}
      >
        <form onSubmit={handleGuardarEdicion} autoComplete="off">
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0', py: 2.5 }}>
            <EditIcon color="primary" sx={{ fontSize: 28 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Editar Cliente</Typography>
          </DialogTitle>
          <DialogContent dividers sx={{ p: 3, backgroundColor: '#fff', maxHeight: '70vh', overflowY: 'auto' }}>
            {editLoading && (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress size={40} />
              </Box>
            )}
            {editError && (
              <Alert severity="error" sx={{ mb: 2 }}>{editError}</Alert>
            )}
            {!editLoading && !editError && clienteAEditar && originalEditData && (
              <Grid container spacing={3}>
                {/* Identificación */}
                <Grid item xs={12} md={6}>
                  <Paper elevation={0} sx={{ p: 3, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <BadgeIcon color="primary" sx={{ fontSize: 24 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>Identificación</Typography>
                    </Box>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={4} md={4}>
                        <TextField
                          label="Tipo de Documento"
                          name="tipodocumento"
                          value={editForm.tipodocumento}
                          fullWidth
                          margin="normal"
                          select
                          disabled
                          sx={{
                            '& .MuiInputBase-input.Mui-disabled': {
                              backgroundColor: '#f5f5f5',
                              color: 'rgba(0, 0, 0, 0.87)',
                              WebkitTextFillColor: 'rgba(0, 0, 0, 0.87)',
                            },
                            '& .MuiInputLabel-root.Mui-disabled': {
                              color: 'rgba(0, 0, 0, 0.6)',
                            },
                            '& .MuiSelect-icon.Mui-disabled': {
                              opacity: 0.5,
                            }
                          }}
                        >
                          {['CC', 'CE', 'TI'].map(option => (
                            <MenuItem key={option} value={option}>
                              {option}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={8} md={8}>
                        <TextField
                          label="Documento"
                          name="documentocliente"
                          value={editForm.documentocliente}
                          fullWidth
                          margin="normal"
                          required
                          disabled
                          sx={{
                            '& .MuiInputBase-input.Mui-disabled': {
                              backgroundColor: '#f5f5f5',
                              color: 'rgba(0, 0, 0, 0.87)',
                              WebkitTextFillColor: 'rgba(0, 0, 0, 0.87)',
                            },
                            '& .MuiInputLabel-root.Mui-disabled': {
                              color: 'rgba(0, 0, 0, 0.6)',
                            }
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
                {/* Información Personal */}
                <Grid item xs={12} md={6}>
                  <Paper elevation={0} sx={{ p: 3, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <PersonIcon color="primary" sx={{ fontSize: 24 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>Información Personal</Typography>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Nombre"
                          name="nombre"
                          value={editForm.nombre}
                          onChange={handleEditChange}
                          fullWidth
                          margin="normal"
                          required
                          error={!!editValidation.nombre}
                          helperText={editValidation.nombre}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Apellido"
                          name="apellido"
                          value={editForm.apellido}
                          onChange={handleEditChange}
                          fullWidth
                          margin="normal"
                          required
                          error={!!editValidation.apellido}
                          helperText={editValidation.apellido}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
                {/* Contacto */}
                <Grid item xs={12} md={6}>
                  <Paper elevation={0} sx={{ p: 3, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <EmailIcon color="primary" sx={{ fontSize: 24 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>Contacto</Typography>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Email"
                          name="email"
                          value={editForm.email}
                          onChange={handleEditChange}
                          fullWidth
                          margin="normal"
                          required
                          error={!!editValidation.email}
                          helperText={editValidation.email}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Teléfono"
                          name="telefono"
                          value={editForm.telefono}
                          onChange={handleEditChange}
                          fullWidth
                          margin="normal"
                          required
                          error={!!editValidation.telefono}
                          helperText={editValidation.telefono}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
                {/* Ubicación */}
                <Grid item xs={12} md={6}>
                  <Paper elevation={0} sx={{ p: 3, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <LocationOnIcon color="primary" sx={{ fontSize: 24 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>Ubicación</Typography>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Municipio"
                          name="municipio"
                          value={editForm.municipio}
                          onChange={handleEditChange}
                          fullWidth
                          margin="normal"
                          required
                          error={!!editValidation.municipio}
                          helperText={editValidation.municipio}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Barrio"
                          name="barrio"
                          value={editForm.barrio}
                          onChange={handleEditChange}
                          fullWidth
                          margin="normal"
                          required
                          error={!!editValidation.barrio}
                          helperText={editValidation.barrio}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          label="Dirección"
                          name="direccion"
                          value={editForm.direccion}
                          onChange={handleEditChange}
                          fullWidth
                          margin="normal"
                          required
                          error={!!editValidation.direccion}
                          helperText={editValidation.direccion}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          label="Complemento"
                          name="complemento"
                          value={editForm.complemento}
                          onChange={handleEditChange}
                          fullWidth
                          margin="normal"
                          error={!!editValidation.complemento}
                          helperText={editValidation.complemento}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2.5, backgroundColor: '#f8f9fa', borderTop: '1px solid #e0e0e0' }}>
            <Button 
              onClick={handleCerrarEdicion} 
              color="secondary" 
              disabled={editLoading}
              sx={{ 
                borderRadius: 2, 
                textTransform: 'none', 
                px: 3, 
                py: 1, 
                fontWeight: 600, 
                boxShadow: 'none', 
                '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' } 
              }}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              color="primary" 
              disabled={editLoading || !hasEditChanges()}
              sx={{ 
                borderRadius: 2, 
                textTransform: 'none', 
                px: 3, 
                py: 1, 
                fontWeight: 600, 
                boxShadow: 'none', 
                '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' } 
              }}
            >
              {editLoading ? <CircularProgress size={18} /> : 'Guardar Cambios'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Modales de Detalle, Edición y Eliminación */}
      <Eliminar
        id={clienteEliminar?.id}
        open={eliminarOpen}
        onClose={() => setEliminarOpen(false)}
        onEliminado={handleClienteEliminadoExitosamente}
        nombre={clienteEliminar ? clienteEliminar.nombre : ''}
        tipoEntidad="cliente"
        deleteApi={deleteCliente}
      />
    </Box>
  );
};

export default Clientes; 