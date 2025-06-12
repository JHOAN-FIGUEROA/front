import { useEffect, useState, useCallback } from 'react';
import {
  Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert, Button, Snackbar, Pagination, TextField, IconButton, Stack, Dialog, DialogTitle, DialogContent, DialogActions, Grid, MenuItem
} from '@mui/material';
import { getProveedores, createProveedor, deleteProveedor } from '../api';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Buscador from '../components/Buscador';
import VerDetalle from '../components/VerDetalle';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BadgeIcon from '@mui/icons-material/Badge';
import PhoneIcon from '@mui/icons-material/Phone';
import Eliminar from '../components/Eliminar';

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
  const [pagina, setPagina] = useState(1);
  const [totalPaginasAPI, setTotalPaginasAPI] = useState(1);
  const [successMsg, setSuccessMsg] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [nitproveedorSeleccionado, setNitproveedorSeleccionado] = useState(null);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [proveedorDetalle, setProveedorDetalle] = useState(null);
  const [crearOpen, setCrearOpen] = useState(false);
  const [crearLoading, setCrearLoading] = useState(false);
  const [crearError, setCrearError] = useState('');
  const [crearForm, setCrearForm] = useState(() => Object.fromEntries(CAMPOS_CREAR.map(c => [c.name, c.default || ''])));
  const [crearValidation, setCrearValidation] = useState({});
  const [eliminarOpen, setEliminarOpen] = useState(false);
  const [proveedorEliminar, setProveedorEliminar] = useState(null);

  const fetchProveedores = useCallback(async (currentPage) => {
    setLoading(true);
    setError('');
    try {
      const result = await getProveedores(currentPage, PROVEEDORES_POR_PAGINA);
      if (result.error) {
        setError(result.detalles || 'Error al cargar proveedores.');
        setProveedores([]);
        setTotalPaginasAPI(1);
      } else if (result.success && result.data) {
        setProveedores(result.data.proveedores || []);
        setTotalPaginasAPI(result.data.totalPaginas || 1);
      } else {
        setProveedores([]);
        setTotalPaginasAPI(1);
      }
    } catch (err) {
      setError('Error inesperado al cargar proveedores: ' + (err.message || ''));
      setProveedores([]);
      setTotalPaginasAPI(1);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProveedores(pagina);
  }, [pagina, fetchProveedores]);

  const handleChangePagina = (event, value) => {
    setPagina(value);
  };

  const handleSearchChange = (e) => {
    const newSearchTerm = e.target.value;
    setBusqueda(newSearchTerm);
  };

  // Funciones de validación individuales
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
        break;
      case 'documento':
        errorMessage = validateDocumento(value);
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

    const documentoError = validateDocumento(crearForm.documento);
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
      setSuccessMsg('Proveedor creado correctamente');
      fetchProveedores(pagina);
    } catch (err) {
      setCrearError(err.message || 'Error al crear proveedor');
    } finally {
      setCrearLoading(false);
    }
  };

  const handleEliminarProveedor = async (nitproveedor) => {
    try {
      await deleteProveedor(nitproveedor);
      setEliminarOpen(false);
      setProveedorEliminar(null);
      setSuccessMsg('Proveedor eliminado correctamente');
      fetchProveedores(pagina);
    } catch (err) {
      setSuccessMsg('Error al eliminar proveedor: ' + (err.message || ''));
    }
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
              <TableCell><b>Teléfono</b></TableCell>
              <TableCell align="center"><b>Acciones</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading && proveedores.length === 0 && !error && (
              <TableRow>
                <TableCell colSpan={4} align="center">No hay proveedores registrados.</TableCell>
              </TableRow>
            )}
            {proveedores.map((proveedor, idx) => (
              <TableRow key={idx}>
                <TableCell>{(pagina - 1) * PROVEEDORES_POR_PAGINA + idx + 1}</TableCell>
                <TableCell>{proveedor.nombre}</TableCell>
                <TableCell>{proveedor.telefono}</TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={0.5} justifyContent="center">
                    <IconButton color="info" size="small" onClick={() => {
                      setNitproveedorSeleccionado(proveedor.nitproveedor);
                      setDetalleOpen(true);
                    }} title="Ver Detalle">
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                    <IconButton color="warning" size="small" onClick={() => { /* Lógica para editar */ }} title="Editar">
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton color="error" size="small" onClick={() => { setProveedorEliminar(proveedor); setEliminarOpen(true); }} title="Eliminar">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
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
        open={!!successMsg}
        autoHideDuration={3000}
        onClose={() => setSuccessMsg('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccessMsg('')} sx={{ width: '100%' }}>
          {successMsg}
        </Alert>
      </Snackbar>
      <VerDetalle
        open={detalleOpen}
        onClose={() => setDetalleOpen(false)}
        nitproveedor={nitproveedorSeleccionado}
        loading={loading}
        error={error}
        setProveedorDetalle={setProveedorDetalle}
      />
      {/* Modal Crear Proveedor */}
      <Dialog open={crearOpen} onClose={() => setCrearOpen(false)} maxWidth="md" fullWidth scroll="paper"
        PaperProps={{ sx: { borderRadius: 2, boxShadow: '0 8px 32px rgba(0,0,0,0.1)', overflow: 'hidden' } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0', py: 2.5 }}>
          <PersonAddIcon color="primary" sx={{ fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Registrar Proveedor</Typography>
        </DialogTitle>
        <form onSubmit={handleCrearProveedor} autoComplete="off">
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
                    <Grid item xs={12} sm={4} md={4}>
                      <Grid container spacing={1}>
                        {['NIT', 'CC', 'CE'].map(opt => (
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
                    <Grid item xs={12} sm={8} md={8}>
                      <TextField
                        label="Documento"
                        name="documento"
                        value={crearForm.documento}
                        onChange={handleCrearChange}
                        fullWidth
                        margin="normal"
                        required
                        error={!!crearValidation.documento}
                        helperText={crearValidation.documento}
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
                        label="Contacto"
                        name="contacto"
                        value={crearForm.contacto}
                        onChange={handleCrearChange}
                        fullWidth
                        margin="normal"
                        required
                        error={!!crearValidation.contacto}
                        helperText={crearValidation.contacto}
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
      <Eliminar
        id={proveedorEliminar?.documento || proveedorEliminar?.nitproveedor}
        open={eliminarOpen}
        onClose={() => setEliminarOpen(false)}
        onEliminado={() => handleEliminarProveedor(proveedorEliminar?.documento || proveedorEliminar?.nitproveedor)}
        onError={(errorMessage) => setSuccessMsg(errorMessage)}
        nombre={proveedorEliminar ? proveedorEliminar.nombre : ''}
        tipoEntidad="proveedor"
        deleteApi={deleteProveedor}
      />
    </Box>
  );
};

export default Proveedores;
