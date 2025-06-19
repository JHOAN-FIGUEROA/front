import { useEffect, useState, useCallback } from 'react';
import {
  Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert, Button, Snackbar, Pagination, IconButton, Stack
} from '@mui/material';
import { getUnidades, getProductos, createUnidad, deleteUnidad, updateUnidad } from '../api';
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
  const [crearForm, setCrearForm] = useState({ producto_idproducto: '', nombre: '', factor_conversion: '' });
  const [crearValidation, setCrearValidation] = useState({});
  const [productos, setProductos] = useState([]);
  const [eliminarOpen, setEliminarOpen] = useState(false);
  const [unidadEliminar, setUnidadEliminar] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [unidadAEditar, setUnidadAEditar] = useState(null);
  const [editForm, setEditForm] = useState({ producto_idproducto: '', nombre: '', factor_conversion: '' });
  const [editValidation, setEditValidation] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [originalEditData, setOriginalEditData] = useState(null);

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
    setCrearValidation(errors);
    return valid;
  };

  const handleCrearUnidad = async (e) => {
    e.preventDefault();
    setCrearError('');
    if (!validateCrear()) return;
    setCrearLoading(true);
    try {
      await createUnidad({
        producto_idproducto: crearForm.producto_idproducto,
        nombre: crearForm.nombre.trim(),
        factor_conversion: crearForm.factor_conversion
      });
      setCrearOpen(false);
      setCrearForm({ producto_idproducto: '', nombre: '', factor_conversion: '' });
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
      factor_conversion: unidad.factor_conversion
    });
    setOriginalEditData({
      producto_idproducto: unidad.producto_idproducto,
      nombre: unidad.nombre,
      factor_conversion: unidad.factor_conversion
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
      editForm.factor_conversion !== originalEditData.factor_conversion
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
    setEditForm({ producto_idproducto: '', nombre: '', factor_conversion: '' });
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
      <Dialog open={crearOpen} onClose={() => setCrearOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.10)', background: '#f8f9fa' } }}
      >
        <form onSubmit={handleCrearUnidad} autoComplete="off">
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0', py: 2.5 }}>
            <ShieldIcon color="primary" sx={{ fontSize: 28 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Registrar Unidad</Typography>
          </DialogTitle>
          <DialogContent dividers sx={{ p: 3, backgroundColor: '#fff', borderRadius: 2 }}>
            {/* Selector de productos tipo chips */}
            <Box mb={2}>
              <Typography variant="subtitle1" fontWeight={600} mb={1}>Producto</Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {productos.map(prod => (
                  <Paper
                    key={prod.idproducto}
                    elevation={crearForm.producto_idproducto === prod.idproducto ? 3 : 0}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      border: crearForm.producto_idproducto === prod.idproducto ? '2px solid #1976d2' : '1px solid #e0e0e0',
                      backgroundColor: crearForm.producto_idproducto === prod.idproducto ? '#e3f2fd' : '#fff',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: 16,
                      minWidth: 120,
                      textAlign: 'center',
                      transition: 'all 0.2s',
                      boxShadow: crearForm.producto_idproducto === prod.idproducto ? '0 2px 8px rgba(25, 118, 210, 0.12)' : 'none',
                      color: '#222',
                      '&:hover': {
                        boxShadow: '0 2px 8px rgba(25, 118, 210, 0.12)',
                        borderColor: '#1976d2',
                        backgroundColor: '#f3f6f9',
                      },
                    }}
                    onClick={() => handleSelectProducto(prod.idproducto)}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: 16 }}>
                      {prod.nombre} (ID: {prod.idproducto})
                    </Typography>
                  </Paper>
                ))}
              </Box>
              {crearValidation.producto_idproducto && (
                <Alert severity="error" sx={{ mt: 1 }}>{crearValidation.producto_idproducto}</Alert>
              )}
            </Box>
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
              sx={{ background: '#f8f9fa', borderRadius: 2 }}
            />
            <TextField
              label="Factor de Conversión"
              name="factor_conversion"
              value={crearForm.factor_conversion}
              onChange={handleCrearChange}
              fullWidth
              margin="normal"
              required
              error={!!crearValidation.factor_conversion}
              helperText={crearValidation.factor_conversion}
              inputProps={{ inputMode: 'decimal', pattern: '^\\d+(\\.\\d{1,4})?$', min: 0.0001 }}
              sx={{ background: '#f8f9fa', borderRadius: 2 }}
            />
            {crearError && <Alert severity="error" sx={{ mt: 2 }}>{crearError}</Alert>}
          </DialogContent>
          <DialogActions sx={{ p: 2.5, backgroundColor: '#f8f9fa', borderTop: '1px solid #e0e0e0' }}>
            <Button onClick={() => setCrearOpen(false)} color="secondary" disabled={crearLoading} sx={{ borderRadius: 2, textTransform: 'none', px: 3, py: 1, fontWeight: 600, boxShadow: 'none', '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' } }}>Cancelar</Button>
            <Button type="submit" color="primary" disabled={crearLoading} sx={{ borderRadius: 2, textTransform: 'none', px: 3, py: 1, fontWeight: 600, boxShadow: 'none', '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' } }}>{crearLoading ? <CircularProgress size={18} /> : 'Registrar'}</Button>
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
      <Dialog open={editOpen} onClose={handleCerrarEdicion} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.10)', background: '#f8f9fa' } }}
      >
        <form onSubmit={handleGuardarEdicion} autoComplete="off">
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0', py: 2.5 }}>
            <ShieldIcon color="primary" sx={{ fontSize: 28 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Editar Unidad</Typography>
          </DialogTitle>
          <DialogContent dividers sx={{ p: 3, backgroundColor: '#fff', borderRadius: 2 }}>
            <Box mb={2}>
              <Typography variant="subtitle1" fontWeight={600} mb={1}>Producto</Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {productos.map(prod => (
                  <Paper
                    key={prod.idproducto}
                    elevation={editForm.producto_idproducto === prod.idproducto ? 3 : 0}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      border: editForm.producto_idproducto === prod.idproducto ? '2px solid #1976d2' : '1px solid #e0e0e0',
                      backgroundColor: editForm.producto_idproducto === prod.idproducto ? '#e3f2fd' : '#fff',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: 16,
                      minWidth: 120,
                      textAlign: 'center',
                      transition: 'all 0.2s',
                      boxShadow: editForm.producto_idproducto === prod.idproducto ? '0 2px 8px rgba(25, 118, 210, 0.12)' : 'none',
                      color: '#222',
                      '&:hover': {
                        boxShadow: '0 2px 8px rgba(25, 118, 210, 0.12)',
                        borderColor: '#1976d2',
                        backgroundColor: '#f3f6f9',
                      },
                    }}
                    onClick={() => handleEditSelectProducto(prod.idproducto)}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: 16 }}>
                      {prod.nombre} (ID: {prod.idproducto})
                    </Typography>
                  </Paper>
                ))}
              </Box>
              {editValidation.producto_idproducto && (
                <Alert severity="error" sx={{ mt: 1 }}>{editValidation.producto_idproducto}</Alert>
              )}
            </Box>
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
              sx={{ background: '#f8f9fa', borderRadius: 2 }}
            />
            <TextField
              label="Factor de Conversión"
              name="factor_conversion"
              value={editForm.factor_conversion}
              onChange={handleEditChange}
              fullWidth
              margin="normal"
              required
              error={!!editValidation.factor_conversion}
              helperText={editValidation.factor_conversion}
              inputProps={{ inputMode: 'decimal', pattern: '^\\d+(\\.\\d{1,4})?$', min: 0.0001 }}
              sx={{ background: '#f8f9fa', borderRadius: 2 }}
            />
            {editError && <Alert severity="error" sx={{ mt: 2 }}>{editError}</Alert>}
          </DialogContent>
          <DialogActions sx={{ p: 2.5, backgroundColor: '#f8f9fa', borderTop: '1px solid #e0e0e0' }}>
            <Button onClick={handleCerrarEdicion} color="secondary" disabled={editLoading} sx={{ borderRadius: 2, textTransform: 'none', px: 3, py: 1, fontWeight: 600, boxShadow: 'none', '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' } }}>Cancelar</Button>
            <Button type="submit" color="primary" disabled={editLoading || !hasEditChanges()} sx={{ borderRadius: 2, textTransform: 'none', px: 3, py: 1, fontWeight: 600, boxShadow: 'none', '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' } }}>{editLoading ? <CircularProgress size={18} /> : 'Guardar Cambios'}</Button>
          </DialogActions>
        </form>
      </Dialog>
  </Box>
);
};

export default Unidades;