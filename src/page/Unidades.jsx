import { useEffect, useState, useCallback } from 'react';
import {
  Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert, Button, Snackbar, Pagination, IconButton, Stack, Grid
} from '@mui/material';
import { getUnidades, getProductos, createUnidad, deleteUnidad, updateUnidad, getProductoByCodigo } from '../api';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Buscador from '../components/Buscador';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import ShieldIcon from '@mui/icons-material/Security';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import Eliminar from '../components/Eliminar';

const UNIDADES_POR_PAGINA = 5;
const BACKEND_URL = 'https://backend-wi7t.onrender.com';

const Unidades = () => {
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagina, setPagina] = useState(1);
  const [totalPaginasAPI, setTotalPaginasAPI] = useState(1);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [busqueda, setBusqueda] = useState('');
  const [crearOpen, setCrearOpen] = useState(false);
  const [crearLoading, setCrearLoading] = useState(false);
  const [crearError, setCrearError] = useState('');
  const [crearForm, setCrearForm] = useState({ producto_idproducto: '', nombre: '', factor_conversion: '', codigoproducto: '', codigobarras: '' });
  const [crearValidation, setCrearValidation] = useState({});
  const [productos, setProductos] = useState([]);
  const [eliminarOpen, setEliminarOpen] = useState(false);
  const [unidadEliminar, setUnidadEliminar] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [unidadAEditar, setUnidadAEditar] = useState(null);
  const [editForm, setEditForm] = useState({ producto_idproducto: '', nombre: '', factor_conversion: '', codigoproducto: '', codigobarras: '' });
  const [editValidation, setEditValidation] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [originalEditData, setOriginalEditData] = useState(null);
  const [crearProductoNombre, setCrearProductoNombre] = useState('');
  const [editProductoNombre, setEditProductoNombre] = useState('');

  const fetchUnidades = useCallback(async (currentPage) => {
    setLoading(true);
    setError('');
    try {
      const result = await getUnidades(currentPage, UNIDADES_POR_PAGINA);
      if (result.error) {
        setError(result.detalles || 'Error al cargar unidades.');
        setUnidades([]);
        setTotalPaginasAPI(1);
      } else if (result.success && result.data && result.data.unidades) {
        setUnidades(result.data.unidades || []);
        setTotalPaginasAPI(result.data.totalPaginas || 1);
      } else {
        setUnidades([]);
        setTotalPaginasAPI(1);
      }
    } catch (err) {
      setError('Error inesperado al cargar unidades: ' + (err.message || ''));
      setUnidades([]);
      setTotalPaginasAPI(1);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnidades(pagina);
  }, [pagina, fetchUnidades]);

  useEffect(() => {
    if (crearOpen) {
      getProductos(1, 100).then(res => {
        if (res.success && res.data && res.data.data && res.data.data.productos) {
          setProductos(res.data.data.productos);
        } else {
          setProductos([]);
        }
      });
    }
  }, [crearOpen]);

  const handleChangePagina = (event, value) => {
    setPagina(value);
  };

  const handleSearchChange = (e) => {
    setBusqueda(e.target.value);
    setPagina(1);
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ open: false, message: '', severity: 'info' });
  };

  // Filtrado local igual que proveedores
  const unidadesFiltradas = unidades.filter(unidad => {
    if (!busqueda) return true;
    const terminoBusquedaLower = busqueda.toLowerCase().trim();

    // Buscar por estado
    if (terminoBusquedaLower === 'activo') {
      return unidad.estado === true || unidad.estado === 1 || unidad.estado === 'true';
    }
    if (terminoBusquedaLower === 'inactivo') {
      return !(unidad.estado === true || unidad.estado === 1 || unidad.estado === 'true');
    }

    // Buscar por nombre de unidad o nombre de producto
    const nombreUnidad = (unidad.nombre || '').toLowerCase();
    const nombreProducto = (unidad.producto_nombre || unidad.producto?.nombre || '').toLowerCase();
    return nombreUnidad.includes(terminoBusquedaLower) || nombreProducto.includes(terminoBusquedaLower);
  });

  // Validaciones
  const validateNombre = (nombre) => {
    if (!nombre.trim()) return 'El nombre es obligatorio';
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{3,15}$/.test(nombre)) return 'Solo letras, 3-15 caracteres';
    return '';
  };
  const validateProducto = (id) => {
    if (!id) return 'Debe seleccionar un producto';
    return '';
  };
  const validateFactor = (valor) => {
    if (!valor) return 'El factor de conversión es obligatorio';
    if (!/^(\d+)(\.\d{1,4})?$/.test(valor)) return 'Solo números, hasta 4 decimales';
    if (parseFloat(valor) <= 0) return 'Debe ser mayor a 0';
    return '';
  };
  const validateCodigobarras = (valor) => {
    if (!valor || !valor.trim()) return 'El código de barras de la unidad es obligatorio';
    // Puedes agregar más validaciones aquí (ej: solo números, longitud, etc.)
    return '';
  };

  const handleCrearChange = (e) => {
    const { name, value } = e.target;
    setCrearForm(prev => ({ ...prev, [name]: value }));
    let error = '';
    if (name === 'nombre') error = validateNombre(value);
    if (name === 'factor_conversion') error = validateFactor(value);
    setCrearValidation(prev => ({ ...prev, [name]: error }));
  };

  const handleSelectProducto = (id) => {
    setCrearForm(prev => ({ ...prev, producto_idproducto: id }));
    setCrearValidation(prev => ({ ...prev, producto_idproducto: '' }));
  };

  const validateCrear = () => {
    const errors = {};
    let valid = true;
    errors.producto_idproducto = validateProducto(crearForm.producto_idproducto);
    if (errors.producto_idproducto) valid = false;
    errors.nombre = validateNombre(crearForm.nombre);
    if (errors.nombre) valid = false;
    errors.factor_conversion = validateFactor(crearForm.factor_conversion);
    if (errors.factor_conversion) valid = false;
    errors.codigobarras = validateCodigobarras(crearForm.codigobarras);
    if (errors.codigobarras) valid = false;
    setCrearValidation(errors);
    return valid;
  };

  const handleCrearUnidad = async (e) => {
    e.preventDefault();
    setCrearError('');
    if (!validateCrear()) return;
    setCrearLoading(true);
    try {
      const payload = {
        producto_idproducto: crearForm.producto_idproducto,
        nombre: crearForm.nombre.trim(),
        factor_conversion: crearForm.factor_conversion,
        codigobarras: crearForm.codigobarras
      };
      console.log('Payload enviado:', payload);
      await createUnidad(payload);
      setCrearOpen(false);
      setCrearForm({ producto_idproducto: '', nombre: '', factor_conversion: '', codigoproducto: '', codigobarras: '' });
      setCrearValidation({});
      Swal.fire({
        icon: 'success',
        title: '¡Unidad Creada!',
        text: 'La unidad ha sido registrada correctamente',
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
      fetchUnidades(pagina);
    } catch (err) {
      setCrearError(err.message || 'Error al crear la unidad');
    } finally {
      setCrearLoading(false);
    }
  };

  const handleUnidadEliminadaExitosamente = async () => {
    setEliminarOpen(false);
    setUnidadEliminar(null);
    Swal.fire({
      icon: 'success',
      title: '¡Unidad Eliminada!',
      text: 'La unidad ha sido eliminada correctamente',
      timer: 2000,
      showConfirmButton: false,
      position: 'center',
      background: '#fff',
      customClass: { popup: 'animated fadeInDown' },
      zIndex: 9999,
      didOpen: (popup) => { popup.style.zIndex = 9999; }
    });
    fetchUnidades(pagina);
  };

  const handleEditarUnidad = (unidad) => {
    setUnidadAEditar(unidad);
    setEditForm({
      producto_idproducto: unidad.producto_idproducto,
      nombre: unidad.nombre,
      factor_conversion: unidad.factor_conversion,
      codigoproducto: unidad.codigoproducto,
      codigobarras: String(unidad.codigobarras ?? '')
    });
    setOriginalEditData({
      producto_idproducto: unidad.producto_idproducto,
      nombre: unidad.nombre,
      factor_conversion: unidad.factor_conversion,
      codigoproducto: unidad.codigoproducto,
      codigobarras: String(unidad.codigobarras ?? '')
    });
    setEditValidation({});
    setEditError('');
    setEditOpen(true);
    // Cargar productos si no están cargados
    if (productos.length === 0) {
      getProductos(1, 100).then(res => {
        if (res.success && res.data && res.data.data && res.data.data.productos) {
          setProductos(res.data.data.productos);
        }
      });
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
    let error = '';
    if (name === 'nombre') error = validateNombre(value);
    if (name === 'factor_conversion') error = validateFactor(value);
    setEditValidation(prev => ({ ...prev, [name]: error }));
  };

  const handleEditSelectProducto = (id) => {
    setEditForm(prev => ({ ...prev, producto_idproducto: id }));
    setEditValidation(prev => ({ ...prev, producto_idproducto: '' }));
  };

  const validateEdit = () => {
    const errors = {};
    let valid = true;
    errors.producto_idproducto = validateProducto(editForm.producto_idproducto);
    if (errors.producto_idproducto) valid = false;
    errors.nombre = validateNombre(editForm.nombre);
    if (errors.nombre) valid = false;
    errors.factor_conversion = validateFactor(editForm.factor_conversion);
    if (errors.factor_conversion) valid = false;
    setEditValidation(errors);
    return valid;
  };

  const hasEditChanges = () => {
    if (!originalEditData) return false;
    return (
      editForm.producto_idproducto !== originalEditData.producto_idproducto ||
      editForm.nombre !== originalEditData.nombre ||
      editForm.factor_conversion !== originalEditData.factor_conversion ||
      editForm.codigoproducto !== originalEditData.codigoproducto ||
      editForm.codigobarras !== originalEditData.codigobarras
    );
  };

  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    setEditError('');
    if (!validateEdit()) return;
    if (!unidadAEditar) return;
    if (!hasEditChanges()) {
      Swal.fire({
        icon: 'info',
        title: 'Sin Cambios',
        text: 'No hay cambios para guardar',
        confirmButtonColor: '#2E8B57',
        background: '#fff',
        customClass: { popup: 'animated fadeInDown' },
        zIndex: 99999,
        didOpen: (popup) => { popup.style.zIndex = 99999; }
      });
      return;
    }
    setEditLoading(true);
    const datosParaEnviar = {};
    if (editForm.producto_idproducto !== originalEditData.producto_idproducto) datosParaEnviar.producto_idproducto = editForm.producto_idproducto;
    if (editForm.nombre !== originalEditData.nombre) datosParaEnviar.nombre = editForm.nombre;
    if (editForm.factor_conversion !== originalEditData.factor_conversion) datosParaEnviar.factor_conversion = editForm.factor_conversion;
    if (editForm.codigoproducto !== originalEditData.codigoproducto) datosParaEnviar.codigoproducto = editForm.codigoproducto;
    if (editForm.codigobarras !== originalEditData.codigobarras) datosParaEnviar.codigobarras = editForm.codigobarras;
    try {
      await updateUnidad(unidadAEditar.idpresentacion, datosParaEnviar);
      Swal.fire({
        icon: 'success',
        title: '¡Unidad Actualizada!',
        text: 'Los cambios han sido guardados correctamente',
        timer: 2000,
        showConfirmButton: false,
        position: 'center',
        background: '#fff',
        customClass: { popup: 'animated fadeInDown' },
        zIndex: 99999,
        didOpen: (popup) => { popup.style.zIndex = 99999; }
      });
      setEditOpen(false);
      setUnidadAEditar(null);
      setOriginalEditData(null);
      fetchUnidades(pagina);
    } catch (err) {
      setEditError(err.message || 'Error al actualizar la unidad');
      Swal.fire({
        icon: 'error',
        title: 'Error al Actualizar',
        text: err.message || 'Error al actualizar la unidad',
        confirmButtonColor: '#2E8B57',
        background: '#fff',
        customClass: { popup: 'animated fadeInDown' },
        zIndex: 99999,
        didOpen: (popup) => { popup.style.zIndex = 99999; }
      });
    } finally {
      setEditLoading(false);
    }
  };

  const handleCerrarEdicion = () => {
    setEditOpen(false);
    setUnidadAEditar(null);
    setEditForm({ producto_idproducto: '', nombre: '', factor_conversion: '', codigoproducto: '', codigobarras: '' });
    setOriginalEditData(null);
    setEditValidation({});
    setEditError('');
  };

  return (
  <Box p={3}>
      <Typography variant="h5" gutterBottom>Unidades Registradas</Typography>
      <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" mb={2} gap={2}>
        <Box sx={{ flexGrow: 1, width: { xs: '100%', sm: 350 } }}>
          <Buscador
            value={busqueda}
            onChange={handleSearchChange}
            placeholder="Buscar Unidad"
          />
        </Box>
        <Button
          variant="contained"
          color="success"
          sx={{
            minWidth: 140,
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexShrink: 0
          }}
          startIcon={<AddIcon />}
          onClick={() => setCrearOpen(true)}
        >
          Registrar Unidad
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
              <TableCell><b>Producto</b></TableCell>
              <TableCell align="center"><b>Factor de Conversión</b></TableCell>
              <TableCell align="center"><b>Acciones</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading && unidadesFiltradas.length === 0 && !error && (
              <TableRow>
                <TableCell colSpan={5} align="center">No hay unidades registradas.</TableCell>
              </TableRow>
            )}
            {unidadesFiltradas.map((unidad, idx) => (
              <TableRow key={unidad.id || idx}>
                <TableCell>{(pagina - 1) * UNIDADES_POR_PAGINA + idx + 1}</TableCell>
                <TableCell>{unidad.nombre}</TableCell>
                <TableCell>{unidad.producto_nombre || unidad.producto?.nombre || '-'}</TableCell>
                <TableCell align="center">{unidad.factor_conversion}</TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={0.5} justifyContent="center">
                    <IconButton color="warning" size="small" title="Editar" onClick={() => handleEditarUnidad(unidad)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton color="error" size="small" title="Eliminar" onClick={() => { setUnidadEliminar(unidad); setEliminarOpen(true); }}>
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
      {/* Modal Crear Unidad */}
      <Dialog open={crearOpen} onClose={() => setCrearOpen(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleCrearUnidad} autoComplete="off">
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0', py: 2.5 }}>
            <AddIcon color="primary" sx={{ fontSize: 28 }} />
            <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>Registrar Unidad</Typography>
          </DialogTitle>
          <DialogContent dividers sx={{ p: 0, backgroundColor: '#f8f9fa' }}>
            <Paper elevation={4} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 4, backgroundColor: '#fff', m: { xs: 1, sm: 3 }, boxShadow: '0 8px 32px rgba(0,0,0,0.10)' }}>
              <Grid container spacing={3}>
                {/* Producto asociado */}
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <ShieldIcon color="primary" sx={{ fontSize: 24 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Producto Asociado</Typography>
                  </Box>
                  <TextField
                    label="Código de Barras del Producto"
                    name="codigoproducto"
                    value={crearForm.codigoproducto || ''}
                    onChange={async (e) => {
                      const value = e.target.value;
                      setCrearForm(prev => ({ ...prev, codigoproducto: value, producto_idproducto: '' }));
                      if (value.length > 0) {
                        try {
                          const data = await getProductoByCodigo(value);
                          if (data && data.success && data.data && data.data.idproducto) {
                            setCrearForm(prev => ({ ...prev, producto_idproducto: data.data.idproducto }));
                            setCrearProductoNombre(data.data.nombre || '');
                            setCrearValidation(prev => ({ ...prev, producto_idproducto: '' }));
                          } else {
                            setCrearValidation(prev => ({ ...prev, producto_idproducto: 'Producto no encontrado' }));
                            setCrearForm(prev => ({ ...prev, producto_idproducto: '' }));
                            setCrearProductoNombre('');
                          }
                        } catch (err) {
                          setCrearValidation(prev => ({ ...prev, producto_idproducto: 'Error al buscar producto' }));
                          setCrearForm(prev => ({ ...prev, producto_idproducto: '' }));
                          setCrearProductoNombre('');
                        }
                      } else {
                        setCrearValidation(prev => ({ ...prev, producto_idproducto: 'Debe ingresar un código' }));
                        setCrearForm(prev => ({ ...prev, producto_idproducto: '' }));
                        setCrearProductoNombre('');
                      }
                    }}
                    fullWidth
                    required
                    error={!!crearValidation.producto_idproducto}
                    helperText={crearValidation.producto_idproducto}
                    sx={{ mb: 2 }}
                  />
                  {crearForm.producto_idproducto && (
                    <Alert severity="success" sx={{ mt: 1 }}>
                      Producto seleccionado correctamente (ID: {crearForm.producto_idproducto})<br />
                      <b>{crearProductoNombre}</b>
                    </Alert>
                  )}
                </Grid>
                {/* Datos de la unidad */}
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <AddIcon color="primary" sx={{ fontSize: 24 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Datos de la Unidad</Typography>
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
                    label="Factor de Conversión"
                    name="factor_conversion"
                    value={crearForm.factor_conversion}
                    onChange={handleCrearChange}
                    fullWidth
                    required
                    error={!!crearValidation.factor_conversion}
                    helperText={crearValidation.factor_conversion}
                    inputProps={{ inputMode: 'decimal', pattern: '^\\d+(\\.\\d{1,4})?$', min: 0.0001 }}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    label="Código de Barras de la Unidad"
                    name="codigobarras"
                    value={crearForm.codigobarras}
                    onChange={e => setCrearForm(prev => ({ ...prev, codigobarras: e.target.value }))}
                    fullWidth
                    required
                    error={!!crearValidation.codigobarras}
                    helperText={crearValidation.codigobarras}
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
        id={unidadEliminar?.idpresentacion}
        open={eliminarOpen}
        onClose={() => setEliminarOpen(false)}
        onEliminado={handleUnidadEliminadaExitosamente}
        onError={(errorMessage) => setSnackbar({ open: true, message: errorMessage, severity: 'error' })}
        nombre={unidadEliminar ? unidadEliminar.nombre : ''}
        tipoEntidad="unidad"
        deleteApi={deleteUnidad}
      />
      <Dialog open={editOpen} onClose={handleCerrarEdicion} maxWidth="md" fullWidth>
        <form onSubmit={handleGuardarEdicion} autoComplete="off">
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0', py: 2.5 }}>
            <EditIcon color="primary" sx={{ fontSize: 28 }} />
            <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>Editar Unidad</Typography>
          </DialogTitle>
          <DialogContent dividers sx={{ p: 0, backgroundColor: '#f8f9fa' }}>
            <Paper elevation={4} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 4, backgroundColor: '#fff', m: { xs: 1, sm: 3 }, boxShadow: '0 8px 32px rgba(0,0,0,0.10)' }}>
              <Grid container spacing={3}>
                {/* Producto asociado */}
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <ShieldIcon color="primary" sx={{ fontSize: 24 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Producto Asociado</Typography>
                  </Box>
                  <TextField
                    label="Código de Barras del Producto"
                    name="codigoproducto"
                    value={editForm.codigoproducto || ''}
                    onChange={async (e) => {
                      const value = e.target.value;
                      setEditForm(prev => ({ ...prev, codigoproducto: value, producto_idproducto: '' }));
                      if (value.length > 0) {
                        try {
                          const data = await getProductoByCodigo(value);
                          if (data && data.success && data.data && data.data.idproducto) {
                            setEditForm(prev => ({ ...prev, producto_idproducto: data.data.idproducto }));
                            setEditProductoNombre(data.data.nombre || '');
                            setEditValidation(prev => ({ ...prev, producto_idproducto: '' }));
                          } else {
                            setEditValidation(prev => ({ ...prev, producto_idproducto: 'Producto no encontrado' }));
                            setEditForm(prev => ({ ...prev, producto_idproducto: '' }));
                            setEditProductoNombre('');
                          }
                        } catch (err) {
                          setEditValidation(prev => ({ ...prev, producto_idproducto: 'Error al buscar producto' }));
                          setEditForm(prev => ({ ...prev, producto_idproducto: '' }));
                          setEditProductoNombre('');
                        }
                      } else {
                        setEditValidation(prev => ({ ...prev, producto_idproducto: 'Debe ingresar un código' }));
                        setEditForm(prev => ({ ...prev, producto_idproducto: '' }));
                        setEditProductoNombre('');
                      }
                    }}
                    fullWidth
                    required
                    error={!!editValidation.producto_idproducto}
                    helperText={editValidation.producto_idproducto}
                    sx={{ mb: 2 }}
                  />
                  {editForm.producto_idproducto && (
                    <Alert severity="success" sx={{ mt: 1 }}>
                      Producto seleccionado correctamente (ID: {editForm.producto_idproducto})<br />
                      <b>{editProductoNombre}</b>
                    </Alert>
                  )}
                </Grid>
                {/* Datos de la unidad */}
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <EditIcon color="primary" sx={{ fontSize: 24 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Datos de la Unidad</Typography>
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
                    label="Factor de Conversión"
                    name="factor_conversion"
                    value={editForm.factor_conversion}
                    onChange={handleEditChange}
                    fullWidth
                    required
                    error={!!editValidation.factor_conversion}
                    helperText={editValidation.factor_conversion}
                    inputProps={{ inputMode: 'decimal', pattern: '^\\d+(\\.\\d{1,4})?$', min: 0.0001 }}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    label="Código de Barras de la Unidad"
                    name="codigobarras"
                    value={editForm.codigobarras}
                    onChange={e => setEditForm(prev => ({ ...prev, codigobarras: e.target.value }))}
                    fullWidth
                    required
                    error={!!editValidation.codigobarras}
                    helperText={editValidation.codigobarras}
                  />
                </Grid>
              </Grid>
              {editError && <Alert severity="error" sx={{ mt: 3 }}>{editError}</Alert>}
            </Paper>
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

export default Unidades;