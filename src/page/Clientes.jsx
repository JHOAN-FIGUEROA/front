import { useEffect, useState, useCallback } from 'react';
import {
  Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert, Button, Snackbar, Pagination, IconButton, Stack, Dialog, DialogTitle, DialogContent, DialogActions, Grid, TextField, MenuItem
} from '@mui/material';
import { getClientes, updateEstadoCliente, createCliente } from '../api';
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
      } else if (result.success && result.data && result.data.data) {
        // Estructura correcta: result.data.data.clientes
        setClientes(result.data.data.clientes || []);
        const totalPaginas = result.data.data.paginacion?.totalPaginas || 1;
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

  const clientesFiltrados = clientes.filter(cliente => {
    if (!busqueda) return true;
    const terminoBusquedaLower = busqueda.toLowerCase().trim();

    if (terminoBusquedaLower === 'activo') {
      return cliente.estado === true || cliente.estado === 1 || cliente.estado === 'true';
    }
    if (terminoBusquedaLower === 'inactivo') {
      return !(cliente.estado === true || cliente.estado === 1 || cliente.estado === 'true');
    }

    // Buscar en nombre completo (nombre + apellido)
    const nombreCompleto = `${cliente.nombre || ''} ${cliente.apellido || ''}`.toLowerCase();
    
    return (nombreCompleto.includes(terminoBusquedaLower) ||
            cliente.email?.toLowerCase().includes(terminoBusquedaLower) ||
            cliente.telefono?.toLowerCase().includes(terminoBusquedaLower));
  });

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
    if (!documento?.trim()) {
      return 'El documento es requerido';
    }
    if (!/^\d{10}$/.test(documento)) {
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

  // Funciones placeholder para las acciones (se implementarán después)
  const handleVerDetalleCliente = (id) => {
    openSnackbar('Función de ver detalle en desarrollo', 'info');
  };

  const handleEditarCliente = (cliente) => {
    openSnackbar('Función de editar en desarrollo', 'info');
  };

  const handleEliminarCliente = (cliente) => {
    openSnackbar('Función de eliminar en desarrollo', 'info');
  };

  const handleCrearCliente = () => {
    setCrearOpen(true);
    setCrearError('');
    setCrearValidation({});
  };

  const handleCrearChange = (e) => {
    const { name, value } = e.target;
    setCrearForm(prev => ({ ...prev, [name]: value }));

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
      case 'password':
        errorMessage = validatePassword(value);
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

  const handleCrearClienteSubmit = async (e) => {
    e.preventDefault();
    setCrearError('');
    if (!validateCrear()) return;
    setCrearLoading(true);
    try {
      const datosEnviar = {
        ...crearForm,
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
      let msg = err?.message;
      if (typeof msg === 'object') {
        msg = msg?.message || msg?.mensaje || msg?.detalles || JSON.stringify(msg);
      }
      if (!msg || typeof msg !== 'string') msg = 'Error al crear cliente';
      setCrearError(msg);
    } finally {
      setCrearLoading(false);
    }
  };

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
                      <TextField
                        label="Municipio"
                        name="municipio"
                        value={crearForm.municipio}
                        onChange={handleCrearChange}
                        fullWidth
                        margin="normal"
                        required
                        error={!!crearValidation.municipio}
                        helperText={crearValidation.municipio}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Barrio"
                        name="barrio"
                        value={crearForm.barrio}
                        onChange={handleCrearChange}
                        fullWidth
                        margin="normal"
                        required
                        error={!!crearValidation.barrio}
                        helperText={crearValidation.barrio}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Dirección"
                        name="direccion"
                        value={crearForm.direccion}
                        onChange={handleCrearChange}
                        fullWidth
                        margin="normal"
                        required
                        error={!!crearValidation.direccion}
                        helperText={crearValidation.direccion}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Complemento"
                        name="complemento"
                        value={crearForm.complemento}
                        onChange={handleCrearChange}
                        fullWidth
                        margin="normal"
                        error={!!crearValidation.complemento}
                        helperText={crearValidation.complemento}
                      />
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
    </Box>
  );
};

export default Clientes; 