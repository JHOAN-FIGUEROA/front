import { useEffect, useState, useCallback } from 'react';
import {
  Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, 
  CircularProgress, Alert, IconButton, Stack, Pagination, Button, Snackbar, Dialog, 
  DialogTitle, DialogContent, DialogActions, Grid, TextField
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
      setEditCategoriaData(prev => ({ ...prev, imagen: file }));
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setEditPreviewImagen(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGuardarEdicionCategoria = async (e) => {
    e.preventDefault();
    if (!categoriaAEditar) return;

    setEditCategoriaLoading(true);
    setEditCategoriaError('');

    try {
      const formData = new FormData();
      formData.append('nombre', editCategoriaData.nombre);
      formData.append('descripcion', editCategoriaData.descripcion || '');
      if (editCategoriaData.imagen) {
        formData.append('imagen', editCategoriaData.imagen);
      }
      
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

  const handleCrearCategoria = async (e) => {
    e.preventDefault();
    setCrearLoading(true);
    setCrearError('');
    
    try {
      if (!nuevaCategoria.nombre) { 
        throw new Error('El nombre es obligatorio');
      }
      
      const formData = new FormData();
      formData.append('nombre', nuevaCategoria.nombre);
      formData.append('descripcion', nuevaCategoria.descripcion || '');
      if (nuevaCategoria.imagen) {
        formData.append('imagen', nuevaCategoria.imagen);
      }
      
      await createCategoria(formData);
      
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
      
      // Refrescar lista y volver a primera página
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('page', '1');
      setSearchParams(newSearchParams);
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

  const handleImagenChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNuevaCategoria(prev => ({ ...prev, imagen: file }));
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewImagen(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEliminadoExitoso = () => {
    setEliminarOpen(false);
    showAlert('Categoría eliminada correctamente', 'success');
    
    const currentPage = parseInt(searchParams.get('page')) || 1;
    const currentSearch = searchParams.get('search') || '';
    fetchCategoriasCallback(currentPage, currentSearch);
  };

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
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Diálogo Crear */}
      <Dialog open={crearOpen} onClose={() => setCrearOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleCrearCategoria}>
          <DialogTitle>Registrar Nueva Categoría</DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  label="Nombre"
                  name="nombre"
                  value={nuevaCategoria.nombre}
                  onChange={e => setNuevaCategoria(prev => ({ ...prev, nombre: e.target.value }))}
                  fullWidth
                  required
                  autoFocus
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
                />
              </Grid>
              
              <Grid item xs={12}>
                <Button variant="outlined" component="label" fullWidth>
                  Subir Imagen
                  <input 
                    type="file" 
                    hidden 
                    accept="image/*"
                    onChange={handleImagenChange}
                  />
                </Button>
                
                {previewImagen && (
                  <Box mt={2} textAlign="center">
                    <img 
                      src={previewImagen} 
                      alt="Preview" 
                      style={{ maxWidth: '100%', maxHeight: 200 }} 
                    />
                  </Box>
                )}
              </Grid>
            </Grid>
            
            {crearError && <Alert severity="error" sx={{ mt: 2 }}>{crearError}</Alert>}
          </DialogContent>
          
          <DialogActions>
            <Button onClick={() => setCrearOpen(false)} color="secondary">Cancelar</Button>
            <Button type="submit" color="primary" disabled={crearLoading}>
              {crearLoading ? <CircularProgress size={24} /> : 'Registrar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      
      {/* Diálogo Editar */}
      <Dialog open={editCategoriaOpen} onClose={handleCerrarEdicionCategoria} maxWidth="sm" fullWidth>
        <form onSubmit={handleGuardarEdicionCategoria}>
          <DialogTitle>Editar Categoría: {categoriaAEditar?.nombre}</DialogTitle>
          <DialogContent dividers>
            {editCategoriaLoading && <CircularProgress sx={{ display: 'block', mx: 'auto' }} />}
            {editCategoriaError && <Alert severity="error">{editCategoriaError}</Alert>}
            
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  label="Nombre"
                  name="nombre"
                  value={editCategoriaData.nombre}
                  onChange={handleEditCategoriaFormChange}
                  fullWidth
                  required
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
                />
              </Grid>
              
              <Grid item xs={12}>
                <Button variant="outlined" component="label" fullWidth>
                  Cambiar Imagen
                  <input 
                    type="file" 
                    hidden 
                    accept="image/*"
                    onChange={handleEditImagenChange}
                  />
                </Button>
                
                {(editPreviewImagen || categoriaAEditar?.imagen) && (
                  <Box mt={2} textAlign="center">
                    <img 
                      src={editPreviewImagen || categoriaAEditar.imagen} 
                      alt="Preview" 
                      style={{ maxWidth: '100%', maxHeight: 200 }} 
                    />
                  </Box>
                )}
              </Grid>
            </Grid>
          </DialogContent>
          
          <DialogActions>
            <Button onClick={handleCerrarEdicionCategoria} color="secondary">Cancelar</Button>
            <Button type="submit" color="primary" disabled={editCategoriaLoading}>
              {editCategoriaLoading ? <CircularProgress size={24} /> : 'Guardar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      
      {/* Diálogo Ver Detalle */}
      <Dialog open={verDetalleOpen} onClose={() => setVerDetalleOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Detalles de Categoría</DialogTitle>
        <DialogContent dividers>
          {categoriaDetalle ? (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle1"><b>ID:</b> {categoriaDetalle.id}</Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle1"><b>Nombre:</b> {categoriaDetalle.nombre}</Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle1"><b>Descripción:</b> {categoriaDetalle.descripcion || 'N/A'}</Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle1">
                  <b>Estado:</b> {categoriaDetalle.estado ? 'Activo' : 'Inactivo'}
                </Typography>
              </Grid>
              
              {categoriaDetalle.imagen && (
                <Grid item xs={12} textAlign="center">
                  <img 
                    src={categoriaDetalle.imagen} 
                    alt="Categoría" 
                    style={{ maxWidth: '100%', maxHeight: 300 }} 
                  />
                </Grid>
              )}
            </Grid>
          ) : (
            <Typography>No se encontraron detalles</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVerDetalleOpen(false)}>Cerrar</Button>
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