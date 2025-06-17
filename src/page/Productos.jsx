import { useEffect, useState, useCallback } from 'react';
import {
  Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, 
  CircularProgress, Alert, IconButton, Stack, Pagination, Button, Snackbar, Dialog, 
  DialogTitle, DialogContent, DialogActions, Grid, TextField, Chip, MenuItem
} from '@mui/material';
import { 
  getProductos,
  createProducto,
  updateProducto,
  deleteProducto,
  updateEstadoProducto,
  getCategoriasActivas
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
import InfoIcon from '@mui/icons-material/Info';
import ImageIcon from '@mui/icons-material/Image';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import InventoryIcon from '@mui/icons-material/Inventory';
import CategoryIcon from '@mui/icons-material/Category';

const PRODUCTOS_POR_PAGINA = 5;

const Productos = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [searchParams, setSearchParams] = useSearchParams();
  const [pagina, setPagina] = useState(parseInt(searchParams.get('page')) || 1);
  const [busqueda, setBusqueda] = useState(searchParams.get('search') || '');

  const [totalPaginasAPI, setTotalPaginasAPI] = useState(1);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const [eliminarOpen, setEliminarOpen] = useState(false);
  const [productoEliminar, setProductoEliminar] = useState(null);
  
  const [crearOpen, setCrearOpen] = useState(false);
  const [nuevoProducto, setNuevoProducto] = useState({ 
    nombre: '', 
    descripcion: '', 
    preciocompra: '',
    margenganancia: '',
    idcategoria: '',
    codigoproducto: '',
    imagen: null 
  });
  const [previewImagen, setPreviewImagen] = useState(null);
  const [crearLoading, setCrearLoading] = useState(false);
  const [crearError, setCrearError] = useState('');

  const [editProductoOpen, setEditProductoOpen] = useState(false);
  const [productoAEditar, setProductoAEditar] = useState(null);
  const [editProductoData, setEditProductoData] = useState({ 
    nombre: '', 
    descripcion: '', 
    preciocompra: '',
    margenganancia: '',
    idcategoria: '',
    codigoproducto: '',
    imagen: null 
  });
  const [editPreviewImagen, setEditPreviewImagen] = useState(null);
  const [editProductoLoading, setEditProductoLoading] = useState(false);
  const [editProductoError, setEditProductoError] = useState('');

  const [verDetalleOpen, setVerDetalleOpen] = useState(false);
  const [productoDetalle, setProductoDetalle] = useState(null);

  const [crearValidation, setCrearValidation] = useState({ 
    nombre: '', 
    descripcion: '', 
    preciocompra: '',
    margenganancia: '',
    idcategoria: '',
    codigoproducto: ''
  });
  const [editValidation, setEditValidation] = useState({ 
    nombre: '', 
    descripcion: '', 
    preciocompra: '',
    margenganancia: '',
    idcategoria: '',
    codigoproducto: ''
  });

  const [categorias, setCategorias] = useState([]);
  const [loadingCategorias, setLoadingCategorias] = useState(false);
  const [errorCategorias, setErrorCategorias] = useState('');

  const showAlert = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ open: false, message: '', severity: 'info' });
  };

  const fetchProductosCallback = useCallback(async (currentPage, currentSearch) => {
    setLoading(true);
    setError('');
    try {
      const result = await getProductos(currentPage, PRODUCTOS_POR_PAGINA, currentSearch);
      
      if (result.error) {
        setError(result.detalles || 'Error al cargar productos.');
        setProductos([]);
        setTotalPaginasAPI(1);
      } else if (result.success && result.data) {
        const productosData = result.data.data?.productos || [];
        const paginacionData = result.data.data?.paginacion || {};
        
        setProductos(productosData);
        setTotalPaginasAPI(paginacionData.totalPaginas || 1);
        
        if (currentPage > (paginacionData.totalPaginas || 1) && (paginacionData.totalPaginas || 1) > 0) {
          const newPage = paginacionData.totalPaginas;
          const newSearchParams = new URLSearchParams(searchParams);
          newSearchParams.set('page', newPage.toString());
          setSearchParams(newSearchParams, { replace: true });
        }
      } else {
        setError('No se recibieron datos de productos');
        setProductos([]);
        setTotalPaginasAPI(1);
      }
    } catch (err) {
      setError('Error inesperado: ' + (err.message || ''));
      setProductos([]);
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
    
    fetchProductosCallback(pageFromUrl, searchFromUrl);
  }, [searchParams, fetchProductosCallback]);

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

  const handleEditarProducto = (producto) => {
    setProductoAEditar(producto);
    setEditProductoData({
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      preciocompra: producto.preciocompra,
      margenganancia: producto.margenganancia,
      idcategoria: producto.idcategoria,
      codigoproducto: producto.codigoproducto,
      imagen: null
    });
    setEditPreviewImagen(producto.imagen);
    setEditProductoOpen(true);
  };

  const handleEditProductoFormChange = (e) => {
    const { name, value } = e.target;
    setEditProductoData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditImagenChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEditProductoData(prev => ({ ...prev, imagen: file }));
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setEditPreviewImagen(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGuardarEdicionProducto = async (e) => {
    e.preventDefault();
    if (!productoAEditar || !productoAEditar.idproducto) {
      setEditProductoError('ID de producto no válido.');
      return;
    }

    setEditProductoLoading(true);
    setEditProductoError('');

    try {
      if (!editProductoData.idcategoria) {
        throw new Error('La categoría es obligatoria');
      }

      if (!categorias.some(cat => cat.idcategoria === editProductoData.idcategoria)) {
        throw new Error('La categoría seleccionada no es válida');
      }

      const formData = new FormData();
      formData.append('nombre', editProductoData.nombre);
      formData.append('detalleproducto', editProductoData.descripcion || '');
      formData.append('preciocompra', editProductoData.preciocompra);
      formData.append('margenganancia', editProductoData.margenganancia);
      formData.append('idcategoria', editProductoData.idcategoria);
      formData.append('codigoproducto', editProductoData.codigoproducto);
      
      if (editProductoData.imagen instanceof File) {
        formData.append('imagen', editProductoData.imagen);
      }
      
      await updateProducto(productoAEditar.idproducto, formData);
      
      Swal.fire({
        icon: 'success',
        title: '¡Producto Actualizado!',
        text: 'Los cambios han sido guardados',
        timer: 2000,
        showConfirmButton: false,
        background: '#fff'
      });
      
      setEditProductoOpen(false);
      const currentPage = parseInt(searchParams.get('page')) || 1;
      const currentSearch = searchParams.get('search') || '';
      fetchProductosCallback(currentPage, currentSearch);
    } catch (err) {
      const errorMsg = err.message || 'Error al guardar el producto';
      setEditProductoError(errorMsg);
      Swal.fire({
        icon: 'error',
        title: 'Error al Actualizar',
        text: errorMsg,
        confirmButtonColor: '#2E8B57',
        background: '#fff'
      });
    } finally {
      setEditProductoLoading(false);
    }
  };

  const handleCerrarEdicionProducto = () => {
    setEditProductoOpen(false);
    setProductoAEditar(null);
    setEditProductoData({ 
      nombre: '', 
      descripcion: '', 
      preciocompra: '',
      margenganancia: '',
      idcategoria: '',
      codigoproducto: '',
      imagen: null 
    });
    setEditPreviewImagen(null);
  };

  const handleVerDetalle = (producto) => {
    setProductoDetalle(producto);
    setVerDetalleOpen(true);
  };

  const handleImagenChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNuevoProducto(prev => ({ ...prev, imagen: file }));
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewImagen(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCrearProducto = async (e) => {
    e.preventDefault();
    setCrearLoading(true);
    setCrearError('');
    
    try {
      if (!nuevoProducto.nombre) { 
        throw new Error('El nombre es obligatorio');
      }

      if (nuevoProducto.nombre.length > 50) {
        throw new Error('El nombre debe tener máximo 50 caracteres');
      }

      if (nuevoProducto.descripcion && nuevoProducto.descripcion.length > 200) {
        throw new Error('La descripción debe tener máximo 200 caracteres');
      }

      if (!nuevoProducto.preciocompra || nuevoProducto.preciocompra <= 0) {
        throw new Error('El precio de compra debe ser mayor a 0');
      }

      if (!nuevoProducto.margenganancia || nuevoProducto.margenganancia < 0) {
        throw new Error('El margen de ganancia no puede ser negativo');
      }

      if (!nuevoProducto.idcategoria) {
        throw new Error('La categoría es obligatoria');
      }

      if (!categorias.some(cat => cat.idcategoria === nuevoProducto.idcategoria)) {
        throw new Error('La categoría seleccionada no es válida');
      }
      
      const formData = new FormData();
      formData.append('nombre', nuevoProducto.nombre);
      formData.append('detalleproducto', nuevoProducto.descripcion || '');
      formData.append('preciocompra', nuevoProducto.preciocompra);
      formData.append('margenganancia', nuevoProducto.margenganancia);
      formData.append('idcategoria', nuevoProducto.idcategoria);
      formData.append('codigoproducto', nuevoProducto.codigoproducto);
      
      if (nuevoProducto.imagen instanceof File) {
        formData.append('imagen', nuevoProducto.imagen);
      }
      
      const response = await createProducto(formData);
      
      if (response.error) {
        throw new Error(response.detalles || 'Error al crear el producto');
      }
      
      Swal.fire({
        icon: 'success',
        title: '¡Producto Creado!',
        text: 'El producto ha sido registrado',
        timer: 2000,
        showConfirmButton: false,
        background: '#fff'
      });
      
      setCrearOpen(false);
      setNuevoProducto({ 
        nombre: '', 
        descripcion: '', 
        preciocompra: '',
        margenganancia: '',
        idcategoria: '',
        codigoproducto: '',
        imagen: null 
      });
      setPreviewImagen(null);
      
      fetchProductosCallback(1, busqueda);
    } catch (err) {
      const errorMsg = err.message || 'Error al crear el producto';
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
      title: "¡Producto Eliminado!",
      text: mensaje || "El producto ha sido eliminado correctamente",
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
    fetchProductosCallback(currentPage, currentSearch);
  };

  // VALIDACIONES EN TIEMPO REAL
  const validateNombreProducto = (nombre) => {
    if (!nombre.trim()) return 'El nombre es obligatorio';
    if (nombre.length > 50) return 'El nombre debe tener máximo 50 caracteres';
    return '';
  };

  const validateDescripcionProducto = (descripcion) => {
    if (!descripcion) return '';
    if (descripcion.length > 200) return 'La descripción debe tener máximo 200 caracteres';
    return '';
  };

  const validatePrecioCompra = (precio) => {
    if (!precio) return 'El precio de compra es obligatorio';
    if (precio <= 0) return 'El precio debe ser mayor a 0';
    return '';
  };

  const validateMargenGanancia = (margen) => {
    if (!margen) return 'El margen de ganancia es obligatorio';
    if (margen < 0) return 'El margen no puede ser negativo';
    return '';
  };

  const validateCategoria = (idcategoria) => {
    if (!idcategoria) return 'La categoría es obligatoria';
    if (!categorias.some(cat => cat.idcategoria === idcategoria)) return 'La categoría seleccionada no es válida';
    return '';
  };

  const validateCodigoProducto = (codigo) => {
    if (!codigo || !codigo.trim()) return 'El código de producto es obligatorio';
    if (codigo.length > 20) return 'Máximo 20 caracteres';
    return '';
  };

  useEffect(() => {
    setCrearValidation({
      nombre: validateNombreProducto(nuevoProducto.nombre),
      descripcion: validateDescripcionProducto(nuevoProducto.descripcion),
      preciocompra: validatePrecioCompra(nuevoProducto.preciocompra),
      margenganancia: validateMargenGanancia(nuevoProducto.margenganancia),
      idcategoria: validateCategoria(nuevoProducto.idcategoria),
      codigoproducto: validateCodigoProducto(nuevoProducto.codigoproducto)
    });
  }, [nuevoProducto, categorias]);

  useEffect(() => {
    setEditValidation({
      nombre: validateNombreProducto(editProductoData.nombre),
      descripcion: validateDescripcionProducto(editProductoData.descripcion),
      preciocompra: validatePrecioCompra(editProductoData.preciocompra),
      margenganancia: validateMargenGanancia(editProductoData.margenganancia),
      idcategoria: validateCategoria(editProductoData.idcategoria),
      codigoproducto: validateCodigoProducto(editProductoData.codigoproducto)
    });
  }, [editProductoData, categorias]);

  // Función para cargar categorías
  const cargarCategorias = async () => {
    setLoadingCategorias(true);
    setErrorCategorias('');
    try {
      const result = await getCategoriasActivas();
      if (result.error) {
        setErrorCategorias(result.detalles || 'Error al cargar categorías');
        setCategorias([]);
      } else {
        setCategorias(result.data || []);
      }
    } catch (err) {
      setErrorCategorias('Error al cargar categorías: ' + err.message);
      setCategorias([]);
    } finally {
      setLoadingCategorias(false);
    }
  };

  // Cargar categorías al montar el componente
  useEffect(() => {
    cargarCategorias();
  }, []);

  return (
    <Box p={3} sx={{ position: 'relative' }}>
      <Typography variant="h5" gutterBottom>Productos Registrados</Typography>
      
      <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} 
        alignItems="center" justifyContent="space-between" mb={2} gap={2}>
        
        <Box sx={{ flexGrow: 1, width: {xs: '100%', sm: 350} }}>
          <Buscador
            value={busqueda}
            onChange={handleSearchChange}
            placeholder="Buscar producto (Nombre, Descripción, Estado...)"
          />
        </Box>
        
        <Button
          variant="contained"
          color="success"
          onClick={() => setCrearOpen(true)}
          sx={{ minWidth: 170, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}
          startIcon={<AddIcon />}
        >
          Nuevo Producto
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
              <TableCell><b>Precio Compra</b></TableCell>
              <TableCell><b>Precio Venta</b></TableCell>
              <TableCell><b>Stock</b></TableCell>
              <TableCell align="center"><b>Estado</b></TableCell>
              <TableCell align="center"><b>Acciones</b></TableCell>
            </TableRow>
          </TableHead>
          
          <TableBody>
            {!loading && productos.length === 0 && !error && (
              <TableRow>
                <TableCell colSpan={7} align="center"> 
                  {busqueda ? 'No se encontraron productos' : 'No hay productos registrados'}
                </TableCell>
              </TableRow>
            )}
            
            {productos.map((producto, idx) => (
              <TableRow key={producto.idproducto || idx}>
                <TableCell>{(pagina - 1) * PRODUCTOS_POR_PAGINA + idx + 1}</TableCell>
                <TableCell>{producto.nombre}</TableCell>
                <TableCell>COP {producto.preciocompra}</TableCell>
                <TableCell>COP {producto.precioventa}</TableCell>
                <TableCell>{producto.stock ?? 0}</TableCell>
                
                <TableCell align="center">
                  <CambiarEstado
                    id={producto.idproducto}
                    estadoActual={producto.estado}
                    onEstadoCambiado={(id, nuevoEstado, errorMsg) => {
                      if (errorMsg) {
                        showAlert(`Error: ${errorMsg}`, 'error');
                      } else {
                        setProductos(prev => prev.map(p => 
                          p.idproducto === id ? { ...p, estado: nuevoEstado } : p
                        ));
                        showAlert('Estado actualizado', 'success');
                      }
                    }}
                    updateEstadoApi={updateEstadoProducto}
                  />
                </TableCell>
                
                <TableCell align="center">
                  <Stack direction="row" spacing={0.5} justifyContent="center">
                    <IconButton color="info" size="small" 
                      onClick={() => handleVerDetalle(producto)}>
                      <VisibilityIcon />
                    </IconButton>
                    
                    {producto.estado && (
                      <>
                        <IconButton color="warning" size="small" 
                          onClick={() => handleEditarProducto(producto)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton color="error" size="small" 
                          onClick={() => { 
                            setProductoEliminar(producto); 
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
      <Dialog open={crearOpen} onClose={() => setCrearOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleCrearProducto} autoComplete="off" noValidate>
          <DialogTitle
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              backgroundColor: '#f8f9fa',
              borderBottom: '1px solid #e0e0e0',
              py: 2.5,
            }}
          >
            <AddIcon color="primary" sx={{ fontSize: 28 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Registrar Nuevo Producto
            </Typography>
          </DialogTitle>
          <DialogContent dividers sx={{ p: 0, backgroundColor: '#f8f9fa' }}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2, backgroundColor: '#fff', m: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <InfoIcon color="primary" sx={{ fontSize: 22 }} />
                Información General
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Nombre"
                    name="nombre"
                    value={nuevoProducto.nombre}
                    onChange={e => setNuevoProducto(prev => ({ ...prev, nombre: e.target.value }))}
                    fullWidth
                    required
                    autoFocus
                    error={!!crearValidation.nombre}
                    helperText={crearValidation.nombre}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Descripción"
                    name="descripcion"
                    value={nuevoProducto.descripcion}
                    onChange={e => setNuevoProducto(prev => ({ ...prev, descripcion: e.target.value }))}
                    fullWidth
                    multiline
                    rows={3}
                    error={!!crearValidation.descripcion}
                    helperText={crearValidation.descripcion}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Precio de Compra"
                    name="preciocompra"
                    type="number"
                    value={nuevoProducto.preciocompra}
                    onChange={e => setNuevoProducto(prev => ({ ...prev, preciocompra: e.target.value }))}
                    fullWidth
                    required
                    error={!!crearValidation.preciocompra}
                    helperText={crearValidation.preciocompra}
                    InputProps={{
                      startAdornment: <Typography>$</Typography>
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Margen de Ganancia (%)"
                    name="margenganancia"
                    type="number"
                    value={nuevoProducto.margenganancia}
                    onChange={e => setNuevoProducto(prev => ({ ...prev, margenganancia: e.target.value }))}
                    fullWidth
                    required
                    error={!!crearValidation.margenganancia}
                    helperText={crearValidation.margenganancia}
                    InputProps={{
                      endAdornment: <Typography>%</Typography>
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Categoría"
                    name="idcategoria"
                    value={nuevoProducto.idcategoria}
                    onChange={e => setNuevoProducto(prev => ({ ...prev, idcategoria: e.target.value }))}
                    fullWidth
                    required
                    error={!!crearValidation.idcategoria}
                    helperText={crearValidation.idcategoria}
                  >
                    {loadingCategorias ? (
                      <MenuItem disabled>
                        <CircularProgress size={20} />
                        Cargando categorías...
                      </MenuItem>
                    ) : errorCategorias ? (
                      <MenuItem disabled>
                        <Alert severity="error" sx={{ width: '100%' }}>{errorCategorias}</Alert>
                      </MenuItem>
                    ) : categorias.length === 0 ? (
                      <MenuItem disabled>No hay categorías disponibles</MenuItem>
                    ) : (
                      categorias.map((categoria) => (
                        <MenuItem key={categoria.idcategoria} value={categoria.idcategoria}>
                          {categoria.nombre}
                        </MenuItem>
                      ))
                    )}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Código de Producto"
                    name="codigoproducto"
                    value={nuevoProducto.codigoproducto}
                    onChange={e => setNuevoProducto(prev => ({ ...prev, codigoproducto: e.target.value }))}
                    fullWidth
                    required
                    error={!!crearValidation.codigoproducto}
                    helperText={crearValidation.codigoproducto}
                  />
                </Grid>
              </Grid>
              <Box mt={3}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ImageIcon color="primary" sx={{ fontSize: 22 }} />
                  Imagen del Producto
                </Typography>
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
                      style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, border: '1px solid #e0e0e0' }}
                    />
                  </Box>
                )}
              </Box>
              {crearError && <Alert severity="error" sx={{ mt: 2 }}>{crearError}</Alert>}
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
      <Dialog open={editProductoOpen} onClose={handleCerrarEdicionProducto} maxWidth="sm" fullWidth>
        <form onSubmit={handleGuardarEdicionProducto} autoComplete="off" noValidate>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0', py: 2.5 }}>
            <EditIcon color="primary" sx={{ fontSize: 28 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Editar Producto: {productoAEditar?.nombre}
            </Typography>
          </DialogTitle>
          <DialogContent dividers sx={{ p: 0, backgroundColor: '#f8f9fa' }}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2, backgroundColor: '#fff', m: 2 }}>
              {editProductoLoading && <CircularProgress sx={{ display: 'block', mx: 'auto' }} />}
              {editProductoError && <Alert severity="error">{editProductoError}</Alert>}
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>Nombre</Typography>
                  <TextField
                    label="Nombre"
                    name="nombre"
                    value={editProductoData.nombre}
                    onChange={handleEditProductoFormChange}
                    fullWidth
                    required
                    autoFocus
                    error={!!editValidation.nombre}
                    helperText={editValidation.nombre}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>Descripción</Typography>
                  <TextField
                    label="Descripción"
                    name="descripcion"
                    value={editProductoData.descripcion}
                    onChange={handleEditProductoFormChange}
                    fullWidth
                    multiline
                    rows={3}
                    error={!!editValidation.descripcion}
                    helperText={editValidation.descripcion}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>Precio de Compra</Typography>
                  <TextField
                    label="Precio de Compra"
                    name="preciocompra"
                    type="number"
                    value={editProductoData.preciocompra}
                    onChange={handleEditProductoFormChange}
                    fullWidth
                    required
                    error={!!editValidation.preciocompra}
                    helperText={editValidation.preciocompra}
                    InputProps={{
                      startAdornment: <Typography>$</Typography>
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>Margen de Ganancia</Typography>
                  <TextField
                    label="Margen de Ganancia (%)"
                    name="margenganancia"
                    type="number"
                    value={editProductoData.margenganancia}
                    onChange={handleEditProductoFormChange}
                    fullWidth
                    required
                    error={!!editValidation.margenganancia}
                    helperText={editValidation.margenganancia}
                    InputProps={{
                      endAdornment: <Typography>%</Typography>
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>Categoría</Typography>
                  <TextField
                    select
                    label="Categoría"
                    name="idcategoria"
                    value={editProductoData.idcategoria}
                    onChange={handleEditProductoFormChange}
                    fullWidth
                    required
                    error={!!editValidation.idcategoria}
                    helperText={editValidation.idcategoria}
                  >
                    {loadingCategorias ? (
                      <MenuItem disabled>
                        <CircularProgress size={20} />
                        Cargando categorías...
                      </MenuItem>
                    ) : errorCategorias ? (
                      <MenuItem disabled>
                        <Alert severity="error" sx={{ width: '100%' }}>{errorCategorias}</Alert>
                      </MenuItem>
                    ) : categorias.length === 0 ? (
                      <MenuItem disabled>No hay categorías disponibles</MenuItem>
                    ) : (
                      categorias.map((categoria) => (
                        <MenuItem key={categoria.idcategoria} value={categoria.idcategoria}>
                          {categoria.nombre}
                        </MenuItem>
                      ))
                    )}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Código de Producto"
                    name="codigoproducto"
                    value={editProductoData.codigoproducto}
                    onChange={handleEditProductoFormChange}
                    fullWidth
                    required
                    error={!!editValidation.codigoproducto}
                    helperText={editValidation.codigoproducto}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>Imagen</Typography>
                  <Button variant="outlined" component="label" fullWidth>
                    Cambiar Imagen
                    <input 
                      type="file" 
                      hidden 
                      accept="image/*"
                      onChange={handleEditImagenChange}
                    />
                  </Button>
                  {(editPreviewImagen || productoAEditar?.imagen) && (
                    <Box mt={2} textAlign="center">
                      <img 
                        src={editPreviewImagen || productoAEditar.imagen} 
                        alt="Preview" 
                        style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, border: '1px solid #e0e0e0' }} 
                      />
                    </Box>
                  )}
                </Grid>
              </Grid>
            </Paper>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, backgroundColor: '#f8f9fa', borderTop: '1px solid #e0e0e0' }}>
            <Button onClick={handleCerrarEdicionProducto} color="secondary" variant="outlined">Cancelar</Button>
            <Button type="submit" color="primary" variant="contained" disabled={editProductoLoading || Object.values(editValidation).some(v => v)}>
              {editProductoLoading ? <CircularProgress size={24} /> : 'Guardar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      
      {/* Diálogo Ver Detalle */}
      <Dialog open={verDetalleOpen} onClose={() => setVerDetalleOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            backgroundColor: '#f8f9fa',
            borderBottom: '1px solid #e0e0e0',
            py: 2.5,
          }}
        >
          <VisibilityIcon color="primary" sx={{ fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Detalles del Producto
          </Typography>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, backgroundColor: '#f8f9fa' }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, backgroundColor: '#fff', m: 2 }}>
            {productoDetalle ? (
              <>
                {/* Información General */}
                <Box mb={3}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InfoIcon color="primary" sx={{ fontSize: 22 }} />
                    Información General
                  </Typography>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={3}><Typography color="text.secondary" fontWeight={600}>ID</Typography></Grid>
                    <Grid item xs={9}><Typography fontWeight={500}>{productoDetalle.id}</Typography></Grid>
                    <Grid item xs={3}><Typography color="text.secondary" fontWeight={600}>Nombre</Typography></Grid>
                    <Grid item xs={9}><Typography fontWeight={500}>{productoDetalle.nombre}</Typography></Grid>
                    <Grid item xs={3}><Typography color="text.secondary" fontWeight={600}>Descripción</Typography></Grid>
                    <Grid item xs={9}><Typography fontWeight={500}>{productoDetalle.descripcion || 'N/A'}</Typography></Grid>
                    <Grid item xs={3}><Typography color="text.secondary" fontWeight={600}>Estado</Typography></Grid>
                    <Grid item xs={9}>
                      <Chip
                        label={productoDetalle.estado ? 'Activo' : 'Inactivo'}
                        color={productoDetalle.estado ? 'success' : 'error'}
                        size="small"
                        icon={productoDetalle.estado ? <CheckCircleIcon /> : <CancelIcon />}
                        sx={{ fontWeight: 600 }}
                      />
                    </Grid>
                  </Grid>
                </Box>

                {/* Información de Precios y Stock */}
                <Box mb={3}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AttachMoneyIcon color="primary" sx={{ fontSize: 22 }} />
                    Información de Precios y Stock
                  </Typography>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={3}><Typography color="text.secondary" fontWeight={600}>Precio Compra</Typography></Grid>
                    <Grid item xs={9}><Typography fontWeight={500}>COP {productoDetalle.preciocompra}</Typography></Grid>
                    <Grid item xs={3}><Typography color="text.secondary" fontWeight={600}>Margen (%)</Typography></Grid>
                    <Grid item xs={9}><Typography fontWeight={500}>{productoDetalle.margenganancia}%</Typography></Grid>
                    <Grid item xs={3}><Typography color="text.secondary" fontWeight={600}>Precio Venta</Typography></Grid>
                    <Grid item xs={9}><Typography fontWeight={500}>COP {productoDetalle.precioventa}</Typography></Grid>
                    <Grid item xs={3}><Typography color="text.secondary" fontWeight={600}>Stock</Typography></Grid>
                    <Grid item xs={9}><Typography fontWeight={500}>{productoDetalle.stock ?? 0}</Typography></Grid>
                  </Grid>
                </Box>

                {/* Información de Categoría */}
                <Box mb={3}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CategoryIcon color="primary" sx={{ fontSize: 22 }} />
                    Información de Categoría
                  </Typography>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={3}><Typography color="text.secondary" fontWeight={600}>Categoría</Typography></Grid>
                    <Grid item xs={9}>
                      <Typography fontWeight={500}>
                        {categorias.find(cat => cat.idcategoria === productoDetalle.idcategoria)?.nombre || 'N/A'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>

                {/* Imagen */}
                {productoDetalle.imagen && (
                  <Box mb={2}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ImageIcon color="primary" sx={{ fontSize: 22 }} />
                      Imagen del Producto
                    </Typography>
                    <Box textAlign="center">
                      <img
                        src={productoDetalle.imagen}
                        alt="Producto"
                        style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8, border: '1px solid #e0e0e0' }}
                      />
                    </Box>
                  </Box>
                )}
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
        id={productoEliminar?.idproducto}
        open={eliminarOpen}
        onClose={() => setEliminarOpen(false)}
        onEliminado={handleEliminadoExitoso}
        onError={(errorMsg) => showAlert(`Error: ${errorMsg}`, 'error')}
        nombre={productoEliminar?.nombre || ''}
        tipoEntidad="producto"
        deleteApi={deleteProducto}
      />
    </Box>
  );
};

export default Productos; 