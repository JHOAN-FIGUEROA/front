import { useEffect, useState, useCallback } from 'react';
import {
  Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, 
  CircularProgress, Alert, IconButton, Stack, Pagination, Button, Snackbar, Dialog, 
  DialogTitle, DialogContent, DialogActions, Grid, TextField, Chip, Divider
} from '@mui/material';
import { 
  getCategorias,
  createCategoria,
  updateCategoria,
  deleteCategoria,
  updateEstadoCategoria
} from '../api';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddIcon from '@mui/icons-material/Add';
import Buscador from '../components/Buscador';
import CambiarEstado from '../components/CambiarEstado';
import Eliminar from '../components/Eliminar';
import { useSearchParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import axios from 'axios';
import InfoIcon from '@mui/icons-material/Info';
import ImageIcon from '@mui/icons-material/Image';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import CategoryIcon from '@mui/icons-material/Category';


const CATEGORIAS_POR_PAGINA = 5;

const Categorias = () => {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [searchParams, setSearchParams] = useSearchParams();
  const [pagina, setPagina] = useState(parseInt(searchParams.get('page')) || 1);
  const [busqueda, setBusqueda] = useState(searchParams.get('search') || '');

  const [totalPaginasAPI, setTotalPaginasAPI] = useState(1);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const [eliminarOpen, setEliminarOpen] = useState(false);
  const [categoriaEliminar, setCategoriaEliminar] = useState(null);
  
  const [crearOpen, setCrearOpen] = useState(false);
  const [nuevaCategoria, setNuevaCategoria] = useState({ nombre: '', descripcion: '', imagen: null });
  const [previewImagen, setPreviewImagen] = useState(null);
  const [crearLoading, setCrearLoading] = useState(false);
  const [crearError, setCrearError] = useState('');

  const [editCategoriaOpen, setEditCategoriaOpen] = useState(false);
  const [categoriaAEditar, setCategoriaAEditar] = useState(null);
  const [editCategoriaData, setEditCategoriaData] = useState({ nombre: '', descripcion: '', imagen: null });
  const [editPreviewImagen, setEditPreviewImagen] = useState(null);
  const [editCategoriaLoading, setEditCategoriaLoading] = useState(false);
  const [editCategoriaError, setEditCategoriaError] = useState('');

  const [verDetalleOpen, setVerDetalleOpen] = useState(false);
  const [categoriaDetalle, setCategoriaDetalle] = useState(null);

  const [crearValidation, setCrearValidation] = useState({ nombre: '', descripcion: '' });
  const [editValidation, setEditValidation] = useState({ nombre: '', descripcion: '' });

  const showAlert = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ open: false, message: '', severity: 'info' });
  };

  const fetchCategoriasCallback = useCallback(async (currentPage, currentSearch) => {
    setLoading(true);
    setError('');
    try {
      const result = await getCategorias(currentPage, CATEGORIAS_POR_PAGINA, currentSearch);
      
      if (result.error) {
        setError(result.detalles || 'Error al cargar categorías.');
        setCategorias([]);
        setTotalPaginasAPI(1);
      } else if (result.success && result.data) {
        const categoriasData = result.data.data?.categorias || [];
        const paginacionData = result.data.data?.paginacion || {};
        
        setCategorias(categoriasData);
        setTotalPaginasAPI(paginacionData.totalPaginas || 1);
        
        // Ajustar página si es necesario
        if (currentPage > (paginacionData.totalPaginas || 1) && (paginacionData.totalPaginas || 1) > 0) {
          const newPage = paginacionData.totalPaginas;
          const newSearchParams = new URLSearchParams(searchParams);
          newSearchParams.set('page', newPage.toString());
          setSearchParams(newSearchParams, { replace: true });
        }
      } else {
        setError('No se recibieron datos de categorías');
        setCategorias([]);
        setTotalPaginasAPI(1);
      }
    } catch (err) {
      setError('Error inesperado: ' + (err.message || ''));
      setCategorias([]);
      setTotalPaginasAPI(1);
    } finally {
      setLoading(false);
    }
  }, [searchParams, setSearchParams]); 

  useEffect(() => {
    const pageFromUrl = parseInt(searchParams.get('page')) || 1;
    const searchFromUrl = searchParams.get('search') || '';

    if (pageFromUrl !== pagina) setPagina(pageFromUrl);
    if (searchFromUrl !== busqueda) setBusqueda(searchFromUrl);
    
    fetchCategoriasCallback(pageFromUrl, searchFromUrl);
  }, [searchParams, fetchCategoriasCallback]);

  const handleChangePagina = (event, value) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('page', value.toString());
    setSearchParams(newSearchParams);
  };

  const handleSearchChange = (e) => {
    const newSearchTerm = e.target.value;
    setBusqueda(newSearchTerm); 

    const newSearchParams = new URLSearchParams(searchParams);
    if (newSearchTerm) newSearchParams.set('search', newSearchTerm);
    else newSearchParams.delete('search');
    
    newSearchParams.set('page', '1');
    setSearchParams(newSearchParams);
  };

  const handleEditarCategoria = (categoria) => {
    setCategoriaAEditar(categoria);
    setEditCategoriaData({
      nombre: categoria.nombre,
      descripcion: categoria.descripcion || '',
      imagen: null
    });
    setEditPreviewImagen(categoria.imagen);
    setEditCategoriaOpen(true);
  };

  const handleEditCategoriaFormChange = (e) => {
    const { name, value } = e.target;
    setEditCategoriaData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditImagenChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        Swal.fire({
          icon: 'error',
          title: 'Archivo no válido',
          text: 'Por favor selecciona un archivo de imagen válido (jpg, png, gif, etc.)',
          confirmButtonColor: '#2E8B57',
          background: '#fff'
        });
        e.target.value = '';
        return;
      }
      if (file.size > 512000) { // 500 KB
        Swal.fire({
          icon: 'error',
          title: 'Imagen demasiado grande',
          text: 'La imagen debe pesar máximo 500 KB.',
          confirmButtonColor: '#2E8B57',
          background: '#fff'
        });
        e.target.value = '';
        return;
      }
      setEditCategoriaData(prev => ({ ...prev, imagen: file }));
      const reader = new FileReader();
      reader.onload = (event) => {
        setEditPreviewImagen(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const hasEditChangesCategoria = () => {
    if (!categoriaAEditar) return false;
    return (
      editCategoriaData.nombre !== categoriaAEditar.nombre ||
      editCategoriaData.descripcion !== (categoriaAEditar.descripcion || '') ||
      !!editCategoriaData.imagen // Si hay una nueva imagen
    );
  };

  const handleGuardarEdicionCategoria = async (e) => {
    e.preventDefault();
    if (!categoriaAEditar) return;

    if (!hasEditChangesCategoria()) {
      setEditCategoriaLoading(false);
      Swal.fire({
        icon: 'info',
        title: 'Sin Cambios',
        text: 'No hay cambios para guardar',
        confirmButtonColor: '#2E8B57',
        background: '#fff'
      });
      return;
    }

    setEditCategoriaLoading(true);
    setEditCategoriaError('');

    try {
      const formData = new FormData();
      formData.append('nombre', editCategoriaData.nombre);
      formData.append('descripcion', editCategoriaData.descripcion || '');
      
      if (editCategoriaData.imagen && editCategoriaData.imagen instanceof File) {
        formData.append('imagen', editCategoriaData.imagen, editCategoriaData.imagen.name);
      }
      
      console.log('editCategoriaData.imagen:', editCategoriaData.imagen);
      
      await updateCategoria(categoriaAEditar.id, formData);
      
      Swal.fire({
        icon: 'success',
        title: '¡Categoría Actualizada!',
        text: 'Los cambios han sido guardados',
        timer: 2000,
        showConfirmButton: false,
        background: '#fff'
      });
      
      setEditCategoriaOpen(false);
      const currentPage = parseInt(searchParams.get('page')) || 1;
      const currentSearch = searchParams.get('search') || '';
      fetchCategoriasCallback(currentPage, currentSearch);
    } catch (err) {
      const errorMsg = err.message || 'Error al guardar la categoría';
      setEditCategoriaError(errorMsg);
      Swal.fire({
        icon: 'error',
        title: 'Error al Actualizar',
        text: errorMsg,
        confirmButtonColor: '#2E8B57',
        background: '#fff'
      });
    } finally {
      setEditCategoriaLoading(false);
    }
  };

  const handleCerrarEdicionCategoria = () => {
    setEditCategoriaOpen(false);
    setCategoriaAEditar(null);
    setEditCategoriaData({ nombre: '', descripcion: '', imagen: null });
    setEditPreviewImagen(null);
  };

  const handleVerDetalle = (categoria) => {
    setCategoriaDetalle(categoria);
    setVerDetalleOpen(true);
  };

  const handleImagenChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        Swal.fire({
          icon: 'error',
          title: 'Archivo no válido',
          text: 'Por favor selecciona un archivo de imagen válido (jpg, png, gif, etc.)',
          confirmButtonColor: '#2E8B57',
          background: '#fff'
        });
        e.target.value = '';
        return;
      }
      if (file.size > 512000) { // 500 KB
        Swal.fire({
          icon: 'error',
          title: 'Imagen demasiado grande',
          text: 'La imagen debe pesar máximo 500 KB.',
          confirmButtonColor: '#2E8B57',
          background: '#fff'
        });
        e.target.value = '';
        return;
      }
      setNuevaCategoria(prev => ({ ...prev, imagen: file }));
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewImagen(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCrearCategoria = async (e) => {
    e.preventDefault();
    console.log('handleCrearCategoria ejecutado');
    setCrearLoading(true);
    setCrearError('');
    
    try {
      if (!nuevaCategoria.nombre) { 
        throw new Error('El nombre es obligatorio');
      }

      if (nuevaCategoria.nombre.length > 15) {
        throw new Error('El nombre debe tener máximo 15 caracteres');
      }

      if (nuevaCategoria.descripcion && nuevaCategoria.descripcion.length > 45) {
        throw new Error('La descripción debe tener máximo 45 caracteres');
      }
      
      const formData = new FormData();
      formData.append('nombre', nuevaCategoria.nombre);
      formData.append('descripcion', nuevaCategoria.descripcion || '');
      
      if (nuevaCategoria.imagen && nuevaCategoria.imagen instanceof File) {
        formData.append('imagen', nuevaCategoria.imagen, nuevaCategoria.imagen.name);
      }
      
      // Verificar el contenido del FormData
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]); // Para debugging
      }
      
      console.log('nuevaCategoria.imagen:', nuevaCategoria.imagen);
      
      const response = await createCategoria(formData);
      
      if (response.error) {
        throw new Error(response.detalles || 'Error al crear la categoría');
      }
      
      Swal.fire({
        icon: 'success',
        title: '¡Categoría Creada!',
        text: 'La categoría ha sido registrada',
        timer: 2000,
        showConfirmButton: false,
        background: '#fff'
      });
      
      setCrearOpen(false);
      setNuevaCategoria({ nombre: '', descripcion: '', imagen: null });
      setPreviewImagen(null);
      
      // Recargar la lista de categorías
      fetchCategoriasCallback(1, busqueda);
    } catch (err) {
      const errorMsg = err.message || 'Error al crear la categoría';
      setCrearError(errorMsg);
      Swal.fire({
        icon: 'error',
        title: 'Error al Crear',
        text: errorMsg,
        confirmButtonColor: '#2E8B57',
        background: '#fff'
      });
    } finally {
      setCrearLoading(false);
    }
  };

  const handleEliminadoExitoso = (mensaje) => {
    setEliminarOpen(false);
    Swal.fire({
      icon: "success",
      title: "¡Categoría Eliminada!",
      text: mensaje || "La categoría ha sido eliminada correctamente",
      timer: 2000,
      showConfirmButton: false,
      position: "center",
      background: "#fff",
      customClass: {
        popup: "animated fadeInDown",
      },
      zIndex: 99999,
      didOpen: (popup) => {
        popup.style.zIndex = 99999;
      },
    });

    const currentPage = parseInt(searchParams.get('page')) || 1;
    const currentSearch = searchParams.get('search') || '';
    fetchCategoriasCallback(currentPage, currentSearch);
  };

  const handleEliminarCategoria = async (id) => {
    try {
      const response = await deleteCategoria(id);
      // Accede al mensaje correctamente:
      const mensaje = response.data?.data?.mensaje || 'Categoría eliminada correctamente';
      showAlert(mensaje, 'success');
      // Aquí puedes refrescar la tabla o hacer otras acciones
    } catch (error) {
      showAlert(error.message || 'Error al eliminar la categoría', 'error');
    }
  };

  // VALIDACIONES EN TIEMPO REAL
  const validateNombreCategoria = (nombre) => {
    if (!nombre.trim()) return 'El nombre es obligatorio';
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{3,15}$/.test(nombre)) return 'El nombre debe tener entre 3 y 15 letras';
    return '';
  };
  const validateDescripcionCategoria = (descripcion) => {
    if (!descripcion) return '';
    if (descripcion.length > 45) return 'La descripción debe tener máximo 45 caracteres';
    return '';
  };

  useEffect(() => {
    setCrearValidation({
      nombre: validateNombreCategoria(nuevaCategoria.nombre),
      descripcion: validateDescripcionCategoria(nuevaCategoria.descripcion),
    });
  }, [nuevaCategoria]);

  useEffect(() => {
    setEditValidation({
      nombre: validateNombreCategoria(editCategoriaData.nombre),
      descripcion: validateDescripcionCategoria(editCategoriaData.descripcion),
    });
  }, [editCategoriaData]);

  return (
    <Box p={3} sx={{ position: 'relative' }}>
      <Typography variant="h5" gutterBottom>Categorías Registradas</Typography>
      
      <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} 
        alignItems="center" justifyContent="space-between" mb={2} gap={2}>
        
        <Box sx={{ flexGrow: 1, width: {xs: '100%', sm: 350} }}>
          <Buscador
            value={busqueda}
            onChange={handleSearchChange}
            placeholder="Buscar categoría (Nombre, Descripción, Estado...)"
          />
        </Box>
        
        <Button
          variant="contained"
          color="success"
          onClick={() => setCrearOpen(true)}
          sx={{ minWidth: 170, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}
          startIcon={<AddIcon />}
        >
          Nueva Categoría
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
              <TableCell><b>Descripción</b></TableCell>
              <TableCell align="center"><b>Estado</b></TableCell>
              <TableCell align="center"><b>Acciones</b></TableCell>
            </TableRow>
          </TableHead>
          
          <TableBody>
            {!loading && categorias.length === 0 && !error && (
              <TableRow>
                <TableCell colSpan={5} align="center"> 
                  {busqueda ? 'No se encontraron categorías' : 'No hay categorías registradas'}
                </TableCell>
              </TableRow>
            )}
            
            {categorias.map((categoria, idx) => (
              <TableRow key={categoria.id || idx}>
                <TableCell>{(pagina - 1) * CATEGORIAS_POR_PAGINA + idx + 1}</TableCell>
                <TableCell>{categoria.nombre}</TableCell>
                <TableCell sx={{ maxWidth: 200 }}>{categoria.descripcion || 'N/A'}</TableCell>
                
                <TableCell align="center">
                  <CambiarEstado
                    id={categoria.id}
                    estadoActual={categoria.estado}
                    onEstadoCambiado={(id, nuevoEstado, errorMsg) => {
                      if (errorMsg) {
                        showAlert(`Error: ${errorMsg}`, 'error');
                      } else {
                        setCategorias(prev => prev.map(c => 
                          c.id === id ? { ...c, estado: nuevoEstado } : c
                        ));
                        showAlert('Estado actualizado', 'success');
                      }
                    }}
                    updateEstadoApi={updateEstadoCategoria}
                  />
                </TableCell>
                
                <TableCell align="center">
                  <Stack direction="row" spacing={0.5} justifyContent="center">
                    <IconButton color="info" size="small" 
                      onClick={() => handleVerDetalle(categoria)}>
                      <VisibilityIcon />
                    </IconButton>
                    
                    {categoria.estado && (
                      <>
                        <IconButton color="warning" size="small" 
                          onClick={() => handleEditarCategoria(categoria)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton color="error" size="small" 
                          onClick={() => { 
                            setCategoriaEliminar(categoria); 
                            setEliminarOpen(true); 
                          }}>
                          <DeleteIcon />
                        </IconButton>
                      </>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      {!loading && totalPaginasAPI > 1 && (
        <Stack direction="row" justifyContent="center" mt={3}>
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
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Diálogo Crear */}
      <Dialog open={crearOpen} onClose={() => setCrearOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0', py: 2.5 }}>
          <AddIcon color="primary" sx={{ fontSize: 28 }} />
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>Registrar Nueva Categoría</Typography>
        </DialogTitle>
        <form onSubmit={handleCrearCategoria} autoComplete="off">
          <DialogContent dividers sx={{ p: 0, backgroundColor: '#f8f9fa' }}>
            <Paper elevation={4} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 4, backgroundColor: '#fff', m: { xs: 1, sm: 3 }, boxShadow: '0 8px 32px rgba(0,0,0,0.10)' }}>
              <Typography variant="h5" sx={{ fontWeight: 900, mb: 3, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                <CategoryIcon color="primary" sx={{ fontSize: 32 }} />
                Información de Categoría
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Nombre"
                    name="nombre"
                    value={nuevaCategoria.nombre}
                    onChange={e => setNuevaCategoria(prev => ({ ...prev, nombre: e.target.value }))}
                    fullWidth
                    required
                    error={!!crearValidation.nombre}
                    helperText={crearValidation.nombre}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Descripción"
                    name="descripcion"
                    value={nuevaCategoria.descripcion}
                    onChange={e => setNuevaCategoria(prev => ({ ...prev, descripcion: e.target.value }))}
                    fullWidth
                    multiline
                    rows={3}
                    error={!!crearValidation.descripcion}
                    helperText={crearValidation.descripcion}
                  />
                </Grid>
              </Grid>
              <Divider sx={{ my: 4 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                <ImageIcon color="primary" sx={{ fontSize: 22 }} />
                Imagen de la Categoría
              </Typography>
              <Grid container spacing={3} alignItems="center" justifyContent="center">
                <Grid item xs={12} sm={6}>
                  <Button variant="outlined" component="label" fullWidth sx={{ py: 2, fontWeight: 700, fontSize: 18, borderRadius: 3, border: '2px dashed #1976d2', color: 'primary.main', background: 'rgba(25, 118, 210, 0.04)', transition: 'all 0.2s', '&:hover': { background: 'rgba(25, 118, 210, 0.10)', borderColor: '#1565c0', color: '#1565c0', }, }}>
                    Subir Imagen
                    <input type="file" hidden accept="image/*" onChange={handleImagenChange} />
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  {previewImagen && (
                    <Box textAlign="center" sx={{ mt: { xs: 2, sm: 0 } }}>
                      <img src={previewImagen} alt="Preview" style={{ maxWidth: 200, maxHeight: 200, borderRadius: 16, border: '2px solid #e0e0e0', boxShadow: '0 4px 16px rgba(25,118,210,0.08)' }} />
                    </Box>
                  )}
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
      
      {/* Diálogo Editar */}
      <Dialog open={editCategoriaOpen} onClose={handleCerrarEdicionCategoria} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0', py: 2.5 }}>
          <EditIcon color="primary" sx={{ fontSize: 28 }} />
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>Editar Categoría</Typography>
        </DialogTitle>
        <form onSubmit={handleGuardarEdicionCategoria} autoComplete="off">
          <DialogContent dividers sx={{ p: 0, backgroundColor: '#f8f9fa' }}>
            <Paper elevation={4} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 4, backgroundColor: '#fff', m: { xs: 1, sm: 3 }, boxShadow: '0 8px 32px rgba(0,0,0,0.10)' }}>
              <Typography variant="h5" sx={{ fontWeight: 900, mb: 3, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                <CategoryIcon color="primary" sx={{ fontSize: 32 }} />
                Información de Categoría
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    label="Nombre"
                    name="nombre"
                    value={editCategoriaData.nombre}
                    onChange={handleEditCategoriaFormChange}
                    fullWidth
                    required
                    error={!!editValidation.nombre}
                    helperText={editValidation.nombre}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Descripción"
                    name="descripcion"
                    value={editCategoriaData.descripcion}
                    onChange={handleEditCategoriaFormChange}
                    fullWidth
                    multiline
                    rows={3}
                    error={!!editValidation.descripcion}
                    helperText={editValidation.descripcion}
                  />
                </Grid>
              </Grid>
              <Divider sx={{ my: 4 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                <ImageIcon color="primary" sx={{ fontSize: 22 }} />
                Imagen de la Categoría
              </Typography>
              <Grid container spacing={3} alignItems="center" justifyContent="center">
                <Grid item xs={12} sm={6}>
                  <Button variant="outlined" component="label" fullWidth sx={{ py: 2, fontWeight: 700, fontSize: 18, borderRadius: 3, border: '2px dashed #1976d2', color: 'primary.main', background: 'rgba(25, 118, 210, 0.04)', transition: 'all 0.2s', '&:hover': { background: 'rgba(25, 118, 210, 0.10)', borderColor: '#1565c0', color: '#1565c0', }, }}>
                    Cambiar Imagen
                    <input type="file" hidden accept="image/*" onChange={handleEditImagenChange} />
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  {editPreviewImagen && (
                    <Box textAlign="center" sx={{ mt: { xs: 2, sm: 0 } }}>
                      <img src={editPreviewImagen} alt="Preview" style={{ maxWidth: 200, maxHeight: 200, borderRadius: 16, border: '2px solid #e0e0e0', boxShadow: '0 4px 16px rgba(25,118,210,0.08)' }} />
                    </Box>
                  )}
                </Grid>
              </Grid>
            </Paper>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, backgroundColor: '#f8f9fa', borderTop: '1px solid #e0e0e0' }}>
            <Button onClick={handleCerrarEdicionCategoria} color="secondary" variant="outlined">Cancelar</Button>
            <Button type="submit" color="primary" variant="contained" disabled={editCategoriaLoading || !!editValidation.nombre || !!editValidation.descripcion}>
              {editCategoriaLoading ? <CircularProgress size={24} /> : 'Guardar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      
      {/* Diálogo Ver Detalle */}
      <Dialog open={verDetalleOpen} onClose={() => setVerDetalleOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0', py: 2.5 }}>
          <VisibilityIcon color="primary" sx={{ fontSize: 28 }} />
          <span style={{ fontWeight: 600 }}>
            Detalles de la Categoría
          </span>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, backgroundColor: '#f8f9fa' }}>
          <Paper elevation={4} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 4, backgroundColor: '#fff', m: { xs: 1, sm: 3 }, boxShadow: '0 8px 32px rgba(0,0,0,0.10)' }}>
            {categoriaDetalle ? (
              <>
                <Typography variant="h5" sx={{ fontWeight: 900, mb: 3, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CategoryIcon color="primary" sx={{ fontSize: 32 }} />
                  Información de Categoría
                </Typography>
                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={12} sm={4}>
                    <Typography color="text.secondary" fontWeight={600}>ID</Typography>
                    <Typography fontWeight={500}>{categoriaDetalle.id ?? categoriaDetalle.idcategoria}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={8}>
                    <Typography color="text.secondary" fontWeight={600}>Nombre</Typography>
                    <Typography fontWeight={500}>{categoriaDetalle.nombre}</Typography>
                  </Grid>
                </Grid>
                <Divider sx={{ my: 3 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ImageIcon color="primary" sx={{ fontSize: 22 }} />
                  Imagen
                </Typography>
                {categoriaDetalle.imagen && (
                  <Box textAlign="center" mb={3}>
                    <img src={categoriaDetalle.imagen} alt="Categoría" style={{ maxWidth: 200, maxHeight: 200, borderRadius: 16, border: '2px solid #e0e0e0', boxShadow: '0 4px 16px rgba(25,118,210,0.08)' }} />
                  </Box>
                )}
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <InfoIcon color="primary" sx={{ fontSize: 22 }} />
                  Descripción
                </Typography>
                <Paper elevation={0} sx={{ p: 2, backgroundColor: '#f8f9fa', borderRadius: 2, border: '1px solid #e0e0e0', mb: 2 }}>
                  <Typography fontWeight={500}>{categoriaDetalle.descripcion || 'Sin descripción'}</Typography>
                </Paper>
              </>
            ) : (
              <Typography>No se encontraron detalles</Typography>
            )}
          </Paper>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, backgroundColor: '#f8f9fa', borderTop: '1px solid #e0e0e0' }}>
          <Button onClick={() => setVerDetalleOpen(false)} variant="contained" color="primary">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Confirmación Eliminar */}
      <Eliminar
        id={categoriaEliminar?.id}
        open={eliminarOpen}
        onClose={() => setEliminarOpen(false)}
        onEliminado={handleEliminadoExitoso}
        onError={(errorMsg) => showAlert(`Error: ${errorMsg}`, 'error')}
        nombre={categoriaEliminar?.nombre || ''}
        tipoEntidad="categoría"
        deleteApi={deleteCategoria}
      />
    </Box>
  );
};

export default Categorias;