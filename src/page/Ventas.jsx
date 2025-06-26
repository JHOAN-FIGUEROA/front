import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert, Button, Snackbar, Pagination, IconButton, Stack, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Chip, TextField, Tooltip, Select, MenuItem, InputLabel, FormControl, InputAdornment
} from '@mui/material';
import { getVentas, getVentaById, anularVenta, createVenta, getClientesActivos, getUnidades, getProductosActivos, getVentaPDF, confirmarVenta, buscarUnidadPorCodigo } from '../api';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CancelIcon from '@mui/icons-material/Cancel';
import Buscador from '../components/Buscador';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useSearchParams } from 'react-router-dom';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import InventoryIcon from '@mui/icons-material/Inventory';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import Autocomplete from '@mui/material/Autocomplete';

const VENTAS_POR_PAGINA = 5;

const Ventas = () => {
  // Estados principales
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const [pagina, setPagina] = useState(Number.parseInt(searchParams.get('page')) || 1);
  const [totalPaginasAPI, setTotalPaginasAPI] = useState(1);
  const [busqueda, setBusqueda] = useState(searchParams.get('search') || '');
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [ventaDetalle, setVentaDetalle] = useState(null);
  const [detalleLoading, setDetalleLoading] = useState(false);
  const [detalleError, setDetalleError] = useState('');
  const [anularOpen, setAnularOpen] = useState(false);
  const [ventaAnular, setVentaAnular] = useState(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');
  const [anularLoading, setAnularLoading] = useState(false);
  const [confirmarLoading, setConfirmarLoading] = useState(false);

  // Estados para crear venta
  const [crearOpen, setCrearOpen] = useState(false);
  const [crearLoading, setCrearLoading] = useState(false);
  const initialCrearForm = {
    documentocliente: '',
    tipo: 'VENTA_DIRECTA',
    fechaventa: new Date().toISOString().split('T')[0],
    productos: [],
  };
  const [crearForm, setCrearForm] = useState(initialCrearForm);
  const [crearValidation, setCrearValidation] = useState({});
  const [clientes, setClientes] = useState([]);
  const [productosActivos, setProductosActivos] = useState([]);
  const [productosBusqueda, setProductosBusqueda] = useState('');
  const [productosModalOpen, setProductosModalOpen] = useState(false);
  const [presentaciones, setPresentaciones] = useState([]);
  const [presentacionesPorProducto, setPresentacionesPorProducto] = useState({});
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [presentacionSeleccionada, setPresentacionSeleccionada] = useState(null);
  const [cantidadPresentacion, setCantidadPresentacion] = useState(1);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [productosLoading, setProductosLoading] = useState(false);

  // Calendario manual para fecha de venta
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef(null);
  function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }
  useEffect(() => {
    function handleClickOutside(event) {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
    }
    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCalendar]);
  const fechaActual = new Date(crearForm.fechaventa);
  const [calendarMonth, setCalendarMonth] = useState(fechaActual.getMonth());
  const [calendarYear, setCalendarYear] = useState(fechaActual.getFullYear());
  const today = new Date();
  today.setHours(0,0,0,0);
  const minDate = new Date();
  minDate.setDate(today.getDate() - 30);
  minDate.setHours(0,0,0,0);
  const handleSelectDate = (day) => {
    const selected = new Date(calendarYear, calendarMonth, day);
    if (selected >= minDate && selected <= today) {
      setCrearForm(prev => ({ ...prev, fechaventa: selected.toISOString().split('T')[0] }));
      setShowCalendar(false);
    }
  };

  // Helpers
  const openSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Agrega un estado para el filtro de estado de ventas
  const [filtroEstado, setFiltroEstado] = useState('');

  // Fetch ventas
  const fetchVentas = useCallback(async (currentPage, currentSearch) => {
    setLoading(true);
    setError('');
    try {
      const result = await getVentas(currentPage, VENTAS_POR_PAGINA, currentSearch);
      if (result.error) {
        setError(result.detalles || 'Error al cargar ventas.');
        setVentas([]);
        setTotalPaginasAPI(1);
      } else if (result.success && result.data) {
        const ventasBase = result.data.ventas || [];
        // Obtener el estado real de cada venta
        const ventasConEstado = await Promise.all(ventasBase.map(async v => {
          try {
            const detalle = await getVentaById(v.idventas);
            return { ...v, estado: detalle.data.estado };
          } catch {
            return v;
          }
        }));
        setVentas(ventasConEstado);
        setTotalPaginasAPI(result.data.pages || 1);
      } else {
        setVentas([]);
        setTotalPaginasAPI(1);
      }
    } catch (err) {
      setError('Error inesperado al cargar ventas: ' + (err.message || ''));
      setVentas([]);
      setTotalPaginasAPI(1);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const pageFromUrl = Number.parseInt(searchParams.get('page')) || 1;
    const searchFromUrl = searchParams.get('search') || '';
    setPagina(pageFromUrl);
    setBusqueda(searchFromUrl);
    fetchVentas(pageFromUrl, searchFromUrl);
  }, [searchParams, fetchVentas]);

  // Filtrado frontend de ventas
  const ventasFiltradas = ventas
    .filter(venta => {
      if (filtroEstado === 'activa') return venta.estado === 'ACTIVA' || venta.estado === 'COMPLETADA';
      if (filtroEstado === 'anulada') return venta.estado === 'ANULADA';
      if (filtroEstado === 'completada') return venta.estado === 'COMPLETADA';
      return true;
    })
    .filter(venta => {
      if (!busqueda) return true;
      const termino = busqueda.toLowerCase().trim();
      const clienteNombre = venta.cliente?.toLowerCase?.() || '';
      return (
        venta.fechaventa?.toString().includes(termino) ||
        clienteNombre.includes(termino) ||
        venta.total?.toString().includes(termino)
      );
    });

  // Handler para ver detalle de venta
  const handleVerDetalleVenta = async (idventas) => {
    setDetalleLoading(true);
    setDetalleError('');
    setDetalleOpen(true);
    try {
      const response = await getVentaById(idventas);
      if (response && response.data) {
        setVentaDetalle(response);
      } else {
        throw new Error('Formato de respuesta de API inesperado');
      }
    } catch (error) {
      setDetalleError(error.message || 'Error al cargar los detalles de la venta');
      setVentaDetalle(null);
    } finally {
      setDetalleLoading(false);
    }
  };

  // Handlers para crear venta (adaptados de Compras.jsx)
  const handleCrearOpen = async () => {
    setCrearOpen(true);
    setCrearLoading(true);
    const result = await getClientesActivos();
    let clientesArray = [];
    if (result.success) {
      clientesArray = Array.isArray(result.data?.clientes) ? result.data.clientes : [];
      setClientes(clientesArray);
      setCrearForm(prev => {
        if (prev.tipo === 'VENTA_RAPIDA') {
          const cf = clientesArray.find(c => c.nombre?.toLowerCase() === 'consumidor' && c.apellido?.toLowerCase() === 'final');
          return { ...prev, documentocliente: cf ? cf.id : '' };
        }
        return prev;
      });
    } else {
      openSnackbar(result.detalles || 'Error al cargar clientes', 'error');
    }
    setCrearLoading(false);
  };
  const handleCrearClose = () => {
    setCrearOpen(false);
    setCrearForm(initialCrearForm);
    setCrearValidation({});
    setClientes([]);
    setCrearLoading(false);
  };
  const validateField = (name, value) => {
    let error = '';
    if (name === 'fechaventa') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(value);
      selectedDate.setHours(0,0,0,0);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      thirtyDaysAgo.setHours(0, 0, 0, 0);
      if (selectedDate > today) {
        error = 'La fecha no puede ser futura.';
      } else if (selectedDate < thirtyDaysAgo) {
        error = 'La fecha no puede ser de más de 30 días en el pasado.';
      }
    }
    if (name === 'documentocliente') {
      if (!value) {
        error = 'Debe seleccionar un cliente.';
      }
    }
    setCrearValidation(prev => ({ ...prev, [name]: error }));
  };
  const handleCrearChange = (e) => {
    const { name, value } = e.target;
    setCrearForm(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };
  const handleClienteSelect = (id) => {
    setCrearForm(prev => ({ ...prev, documentocliente: prev.documentocliente === id ? '' : id }));
  };
  const handleOpenProductosModal = async () => {
    setProductosModalOpen(true);
    setProductosLoading(true);
    // Obtener productos activos
    const result = await getProductosActivos();
    let productosActivos = [];
    if (result.success) {
      productosActivos = Array.isArray(result.data?.productos) ? result.data.productos : [];
      setProductosActivos(productosActivos);
      // Obtener todas las presentaciones
      const unidadesRes = await getUnidades(1, 1000);
      if (unidadesRes.success) {
        setPresentaciones(unidadesRes.data.unidades || []);
        // Agrupar presentaciones por producto
        const agrupadas = {};
        (unidadesRes.data.unidades || []).forEach(u => {
          if (!agrupadas[u.producto_idproducto]) agrupadas[u.producto_idproducto] = [];
          agrupadas[u.producto_idproducto].push(u);
        });
        setPresentacionesPorProducto(agrupadas);
      } else {
        setPresentaciones([]);
        setPresentacionesPorProducto({});
      }
    } else {
      openSnackbar(result.detalles || 'Error al cargar productos', 'error');
    }
    setProductosLoading(false);
  };
  const handleSelectProducto = (producto) => {
    setProductoSeleccionado(producto);
    const presentacionesDisponibles = presentacionesPorProducto[producto.idproducto] || [];
    setPresentacionSeleccionada(presentacionesDisponibles[0] || null);
    setCantidadPresentacion(1);
  };
  const handleAddProducto = () => {
    if (!productoSeleccionado || !presentacionSeleccionada) return;
    const productoExistente = crearForm.productos.find(p => p.idproducto === productoSeleccionado.idproducto && p.idpresentacion === presentacionSeleccionada.idpresentacion);
    if (productoExistente) {
      openSnackbar('El producto con esa presentación ya está en la lista.', 'warning');
      return;
    }
    const nuevoProducto = {
      idproducto: productoSeleccionado.idproducto,
      nombre: productoSeleccionado.nombre,
      codigoproducto: productoSeleccionado.codigoproducto,
      idpresentacion: presentacionSeleccionada.idpresentacion,
      presentacion_nombre: presentacionSeleccionada.nombre,
      factor_conversion: parseFloat(presentacionSeleccionada.factor_conversion),
      cantidad: cantidadPresentacion,
      precioventa: Number(productoSeleccionado.precioventa) || 0,
      stock_presentacion: productoSeleccionado.stock !== undefined ? productoSeleccionado.stock : (productoSeleccionado.stock_presentacion !== undefined ? productoSeleccionado.stock_presentacion : 0),
    };
    setCrearForm(prev => ({ ...prev, productos: [...prev.productos, nuevoProducto] }));
    Swal.fire({
      position: 'top',
      icon: 'success',
      title: `${productoSeleccionado.nombre} (${presentacionSeleccionada.nombre}) agregado a la venta`,
      showConfirmButton: false,
      timer: 1200,
      width: 350,
      toast: true,
      background: '#f6fff6',
      customClass: {
        popup: 'swal2-toast',
        title: 'swal2-title-custom',
      },
    });
    setProductoSeleccionado(null);
    setPresentacionSeleccionada(null);
    setCantidadPresentacion(1);
  };
  const handleProductoChange = (idproducto, idpresentacion, field, value) => {
    setCrearForm(prev => ({
      ...prev,
      productos: prev.productos.map(p =>
        p.idproducto === idproducto && p.idpresentacion === idpresentacion
          ? { ...p, [field]: value === '' ? '' : value }
          : p
      )
    }));
  };
  const handlePresentacionChange = (idproducto, idpresentacion, nuevaPresentacionId) => {
    const nuevaPresentacion = presentaciones.find(p => p.idpresentacion === nuevaPresentacionId);
    setCrearForm(prev => ({
      ...prev,
      productos: prev.productos.map(p =>
        p.idproducto === idproducto && p.idpresentacion === idpresentacion
          ? {
              ...p,
              idpresentacion: nuevaPresentacion.idpresentacion,
              presentacion_nombre: nuevaPresentacion.nombre,
              factor_conversion: parseFloat(nuevaPresentacion.factor_conversion),
              stock_presentacion: nuevaPresentacion.stock !== undefined ? nuevaPresentacion.stock : (nuevaPresentacion.stock_presentacion !== undefined ? nuevaPresentacion.stock_presentacion : 0),
              cantidad: p.cantidad > (nuevaPresentacion.stock !== undefined ? nuevaPresentacion.stock : (nuevaPresentacion.stock_presentacion !== undefined ? nuevaPresentacion.stock_presentacion : 0)) ? (nuevaPresentacion.stock !== undefined ? nuevaPresentacion.stock : (nuevaPresentacion.stock_presentacion !== undefined ? nuevaPresentacion.stock_presentacion : 0)) : p.cantidad
            }
          : p
      )
    }));
  };
  const handleRemoveProducto = (idproducto) => {
    setCrearForm(prev => ({
      ...prev,
      productos: prev.productos.filter(p => p.idproducto !== idproducto)
    }));
  };
  const handleCrearVenta = async () => {
    const validationErrors = {};
    if (!crearForm.tipo) validationErrors.tipo = 'Debe seleccionar el tipo de venta.';
    if (!crearForm.fechaventa) validationErrors.fechaventa = 'Debe seleccionar la fecha de venta.';
    if (!crearForm.documentocliente) validationErrors.documentocliente = 'Debe seleccionar un cliente.';
    if (crearForm.productos.length === 0) validationErrors.productos = 'Debe agregar al menos un producto a la venta.';
    setCrearValidation(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }
    setCrearLoading(true);
    // Si es venta rápida, enviar como VENTA_DIRECTA a la API
    const dataToSend = {
      ...crearForm,
      tipo: crearForm.tipo === 'VENTA_RAPIDA' ? 'VENTA_DIRECTA' : crearForm.tipo,
      productos: crearForm.productos.map(({ nombre, codigoproducto, presentacion_nombre, factor_conversion, ...rest }) => rest)
    };
    try {
      const result = await createVenta(dataToSend);
      setCrearLoading(false);
      if (result.error || !result.success) {
        Swal.fire({
          icon: 'error',
          title: 'Error al crear la venta',
          text: result.message || result.detalles || 'Ocurrió un error inesperado.',
        });
      } else {
        handleCrearClose();
        Swal.fire({
          icon: 'success',
          title: '¡Venta Creada!',
          text: 'La venta ha sido registrada correctamente.',
          timer: 2000,
          showConfirmButton: false,
        });
        // Descargar automáticamente la factura PDF de la venta
        if (result.data && result.data.idventas) {
          const pdfResult = await getVentaPDF(result.data.idventas);
          if (pdfResult.success && pdfResult.data) {
            const url = window.URL.createObjectURL(new Blob([pdfResult.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `venta_${result.data.idventas}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
          }
        }
        fetchVentas(1, '');
      }
    } catch (err) {
      setCrearLoading(false);
      Swal.fire({
        icon: 'error',
        title: 'Error al crear la venta',
        text: err.message || 'Ocurrió un error inesperado.',
      });
    }
  };
  const handleCloseProductosModal = () => {
    setProductosModalOpen(false);
    setProductosActivos([]);
    setPresentaciones([]);
    setPresentacionesPorProducto({});
    setProductoSeleccionado(null);
    setPresentacionSeleccionada(null);
    setCantidadPresentacion(1);
  };

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>Ventas Registradas</Typography>
      <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" mb={2} gap={2}>
        <Box sx={{ flexGrow: 1, width: { xs: '100%', sm: 350 } }}>
          <Buscador
            value={busqueda}
            onChange={e => {
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
            }}
            placeholder="Buscar Venta"
          />
        </Box>
        <Button
          variant="contained"
          color="success"
          onClick={handleCrearOpen}
          sx={{ minWidth: 140, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}
          startIcon={<AddIcon />}
        >
          Nueva Venta
        </Button>
      </Box>
      <Box display="flex" justifyContent="center" gap={2} my={2}>
        <Button variant={filtroEstado === 'anulada' ? 'contained' : 'outlined'} onClick={() => setFiltroEstado('anulada')}>Anuladas</Button>
        <Button variant={filtroEstado === 'completada' ? 'contained' : 'outlined'} onClick={() => setFiltroEstado('completada')}>Completadas</Button>
        <Button variant={filtroEstado === '' ? 'contained' : 'outlined'} onClick={() => setFiltroEstado('')}>Todas</Button>
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
              <TableCell><b>Fecha</b></TableCell>
              <TableCell sx={{ width: 180 }}><b>Cliente</b></TableCell>
              <TableCell align="right" sx={{ width: 120 }}><b>Total</b></TableCell>
              <TableCell align="center"><b>Estado</b></TableCell>
              <TableCell align="center"><b>Acciones</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading && ventasFiltradas.length === 0 && !error && (
              <TableRow>
                <TableCell colSpan={6} align="center">No hay ventas registradas.</TableCell>
              </TableRow>
            )}
            {ventasFiltradas.map((venta, idx) => {
              const clienteNombre = venta.cliente || '';
              const estado = venta.estado || 'ACTIVA';
              let colorEstado = 'default';
              let iconEstado = null;
              let labelEstado = estado || 'SIN ESTADO';
              if (estado === 'ACTIVA' || estado === 'COMPLETADA') { colorEstado = 'success'; iconEstado = <CheckCircleIcon />; }
              else if (estado === 'ANULADA') { colorEstado = 'error'; iconEstado = <CancelIcon />; }
              else if (estado === 'PEDIDO') { colorEstado = 'warning'; iconEstado = <QrCodeScannerIcon />; }
              else if (estado === 'CONFIRMADA') { colorEstado = 'info'; iconEstado = <CheckCircleIcon />; }
              else { colorEstado = 'default'; iconEstado = null; }
              return (
                <TableRow key={venta.idventas}>
                  <TableCell>{(pagina - 1) * VENTAS_POR_PAGINA + idx + 1}</TableCell>
                  <TableCell>{formatDate(venta.fechaventa)}</TableCell>
                  <TableCell sx={{ width: 180 }}>{clienteNombre}</TableCell>
                  <TableCell align="right" sx={{ width: 120 }}>{formatCurrency(venta.total)}</TableCell>
                  <TableCell align="center">
                    {labelEstado && (
                      <Chip 
                        label={labelEstado}
                        color={colorEstado}
                        icon={iconEstado}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      <Tooltip title="Ver Detalle"><span>
                        <IconButton 
                          color="info" 
                          size="small" 
                          onClick={() => handleVerDetalleVenta(venta.idventas)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </span></Tooltip>
                      <Tooltip title="Descargar PDF"><span>
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={async () => {
                            const result = await getVentaPDF(venta.idventas);
                            if (result.success && result.data) {
                              const url = window.URL.createObjectURL(new Blob([result.data], { type: 'application/pdf' }));
                              const link = document.createElement('a');
                              link.href = url;
                              link.setAttribute('download', `venta_${venta.idventas}.pdf`);
                              document.body.appendChild(link);
                              link.click();
                              link.parentNode.removeChild(link);
                              window.URL.revokeObjectURL(url);
                            } else {
                              openSnackbar(result.detalles || 'Error al generar PDF', 'error');
                            }
                          }}
                        >
                          <PictureAsPdfIcon fontSize="small" />
                        </IconButton>
                      </span></Tooltip>
                      {estado === 'PEDIDO' && (
                        <Tooltip title="Confirmar Venta"><span>
                          <IconButton
                            color="success"
                            size="small"
                            onClick={async () => {
                              setConfirmarLoading(true);
                              const result = await confirmarVenta(venta.idventas);
                              setConfirmarLoading(false);
                              if (result && result.success) {
                                openSnackbar('Venta confirmada correctamente', 'success');
                                fetchVentas(pagina, busqueda);
                              } else {
                                openSnackbar(result.message || result.detalles || 'Error al confirmar venta', 'error');
                              }
                            }}
                          >
                            <CheckCircleIcon fontSize="small" />
                          </IconButton>
                        </span></Tooltip>
                      )}
                      {estado !== 'ANULADA' && (
                        <Tooltip title="Anular Venta"><span>
                          <IconButton 
                            color="error" 
                            size="small" 
                            onClick={() => { setAnularOpen(true); setVentaAnular(venta); }}
                          >
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        </span></Tooltip>
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
            onChange={(e, value) => {
              const newSearchParams = new URLSearchParams(searchParams);
              newSearchParams.set('page', value.toString());
              setSearchParams(newSearchParams);
            }}
            color="primary"
            showFirstButton 
            showLastButton
          />
        </Box>
      )}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={1000}
        onClose={() => setSnackbar({ open: false, message: '', severity: 'info' })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ open: false, message: '', severity: 'info' })} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      {/* Modal de Detalle de Venta */}
      <Dialog open={detalleOpen} onClose={() => setDetalleOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0', py: 2.5 }}>
          <VisibilityIcon color="primary" sx={{ fontSize: 28 }} />
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>Detalles de la Venta</Typography>
        </DialogTitle>
        <DialogContent dividers sx={{ p: { xs: 1, sm: 3 }, maxHeight: { xs: '80vh', sm: '70vh' }, overflowY: 'auto' }}>
          {detalleLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress size={40} />
            </Box>
          ) : detalleError ? (
            <Alert severity="error" sx={{ mb: 2 }}>{detalleError}</Alert>
          ) : ventaDetalle && ventaDetalle.data ? (
            <>
              {/* Información de la Venta */}
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                <ShoppingCartIcon color="primary" sx={{ fontSize: 32 }} />
                Información de la Venta
              </Typography>
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6}>
                  <Paper elevation={0} sx={{ p: { xs: 1, sm: 2 }, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <ReceiptIcon color="primary" sx={{ fontSize: 24 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>Información de Venta</Typography>
                    </Box>
                    <Typography variant="subtitle1" color="text.secondary">ID Venta</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500, mb: 2 }}>{ventaDetalle.data.idventas}</Typography>
                    <Typography variant="subtitle1" color="text.secondary">Cliente</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>{ventaDetalle.data.cliente?.nombre ? `${ventaDetalle.data.cliente.nombre} ${ventaDetalle.data.cliente.apellido}` : ventaDetalle.data.cliente || ''}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper elevation={0} sx={{ p: { xs: 1, sm: 2 }, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <CalendarTodayIcon color="primary" sx={{ fontSize: 24 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>Fecha</Typography>
                    </Box>
                    <Typography variant="subtitle1" color="text.secondary">Fecha de Venta</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500, mb: 2 }}>{formatDate(ventaDetalle.data.fechaventa)}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper elevation={0} sx={{ p: { xs: 1, sm: 2 }, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <AttachMoneyIcon color="primary" sx={{ fontSize: 24 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>Total</Typography>
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {formatCurrency(ventaDetalle.data.total)}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper elevation={0} sx={{ p: { xs: 1, sm: 2 }, backgroundColor: '#f8f9fa', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CheckCircleIcon color={['ACTIVA','COMPLETADA'].includes(ventaDetalle.data.estado) ? "success" : ventaDetalle.data.estado === 'ANULADA' ? "error" : ventaDetalle.data.estado === 'PEDIDO' ? "warning" : "info"} sx={{ fontSize: 24 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Estado</Typography>
                    <Chip 
                      label={ventaDetalle.data.estado || 'Sin Estado'} 
                      color={['ACTIVA','COMPLETADA'].includes(ventaDetalle.data.estado) ? "success" : ventaDetalle.data.estado === 'ANULADA' ? "error" : ventaDetalle.data.estado === 'PEDIDO' ? "warning" : "info"}
                      icon={<CheckCircleIcon />}
                      sx={{ fontWeight: 600, ml: 2 }}
                    />
                  </Paper>
                </Grid>
                {/* Motivo de anulación */}
                {ventaDetalle.data.estado === 'ANULADA' && ventaDetalle.data.motivo_anulacion && (
                  <Grid item xs={12}>
                    <Paper elevation={0} sx={{ p: { xs: 1, sm: 2 }, backgroundColor: '#fff3cd', borderRadius: 2, border: '1px solid #ffeaa7' }}>
                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <CancelIcon color="warning" sx={{ fontSize: 24 }} />
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#856404' }}>Motivo de Anulación</Typography>
                      </Box>
                      <Typography variant="body1" sx={{ color: '#856404' }}>
                        {ventaDetalle.data.motivo_anulacion}
                      </Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
              {/* Detalle de Productos */}
              {ventaDetalle.data.productos && ventaDetalle.data.productos.length > 0 && (
                <>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ShoppingCartIcon color="primary" sx={{ fontSize: 32 }} />
                    Productos de la Venta
                  </Typography>
                  <TableContainer component={Paper} sx={{ boxShadow: 2, mb: 2, maxHeight: 400, overflowX: { xs: 'auto', sm: 'visible' } }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell><b>#</b></TableCell>
                          <TableCell><b>Producto</b></TableCell>
                          <TableCell><b>Código</b></TableCell>
                          <TableCell><b>Presentación</b></TableCell>
                          <TableCell align="center"><b>Cantidad</b></TableCell>
                          <TableCell align="right"><b>Precio Venta</b></TableCell>
                          <TableCell align="right"><b>Subtotal</b></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {ventaDetalle.data.productos.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell>{item.nombre || 'N/A'}</TableCell>
                            <TableCell>{item.codigoproducto || 'N/A'}</TableCell>
                            <TableCell>{item.presentacion?.nombre || 'N/A'}</TableCell>
                            <TableCell align="center">{item.cantidad}</TableCell>
                            <TableCell align="right">{formatCurrency(item.precioventa)}</TableCell>
                            <TableCell align="right">{formatCurrency(item.subtotal)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <Box display="flex" justifyContent="flex-end">
                    <Paper elevation={0} sx={{ p: { xs: 1, sm: 2 }, backgroundColor: '#e3f2fd', borderRadius: 2, border: '1px solid #2196f3' }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        Total: {formatCurrency(ventaDetalle.data.total)}
                      </Typography>
                    </Paper>
                  </Box>
                </>
              )}
            </>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, backgroundColor: '#f8f9fa', borderTop: '1px solid #e0e0e0' }}>
          <Button onClick={() => setDetalleOpen(false)} variant="contained" color="primary">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
      {/* Modal de anulación de venta */}
      <Dialog open={anularOpen} onClose={() => setAnularOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0', py: 2.5 }}>
          <CancelIcon color="error" sx={{ fontSize: 28 }} />
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>Anular Venta</Typography>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3, backgroundColor: '#fff' }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            ¿Está seguro que desea anular la venta <strong>#{ventaAnular?.idventas}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Esta acción no se puede deshacer. Por favor, proporcione un motivo de anulación (10 a 50 caracteres).
          </Typography>
          <TextField
            label="Motivo de Anulación"
            value={motivoAnulacion}
            onChange={(e) => setMotivoAnulacion(e.target.value)}
            fullWidth
            multiline
            rows={3}
            required
            placeholder="Ingrese el motivo de anulación..."
            error={motivoAnulacion.length > 0 && (motivoAnulacion.length < 10 || motivoAnulacion.length > 50)}
            helperText={motivoAnulacion.length > 0 && (motivoAnulacion.length < 10 || motivoAnulacion.length > 50) ? 'El motivo debe tener entre 10 y 50 caracteres.' : ''}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, backgroundColor: '#f8f9fa', borderTop: '1px solid #e0e0e0' }}>
          <Button onClick={() => setAnularOpen(false)} color="secondary" variant="outlined">
            Cancelar
          </Button>
          <Button 
            onClick={async () => {
              if (motivoAnulacion.trim().length < 10 || motivoAnulacion.trim().length > 50) {
                openSnackbar('El motivo debe tener entre 10 y 50 caracteres.', 'error');
                return;
              }
              setAnularLoading(true);
              const result = await anularVenta(ventaAnular.idventas, motivoAnulacion.trim());
              setAnularLoading(false);
              if (result.error || result.success === false) {
                setAnularOpen(false);
                openSnackbar(result.message || result.detalles || 'Error al anular venta', 'error');
              } else {
                setAnularOpen(false);
                setVentaAnular(null);
                setMotivoAnulacion('');
                Swal.fire({
                  icon: 'success',
                  title: '¡Venta anulada correctamente!',
                  timer: 2000,
                  showConfirmButton: false,
                  position: 'center',
                  background: '#fff',
                  customClass: { popup: 'animated fadeInDown' }
                });
                openSnackbar('Venta anulada correctamente', 'success');
                fetchVentas(pagina, busqueda);
              }
            }}
            color="error" 
            variant="contained" 
            disabled={anularLoading || motivoAnulacion.trim().length < 10 || motivoAnulacion.trim().length > 50}
          >
            {anularLoading ? <CircularProgress size={24} /> : 'Anular Venta'}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Modal de creación de venta */}
      <Dialog open={crearOpen} onClose={() => setCrearOpen(false)} maxWidth="xl" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AddShoppingCartIcon color="primary" />
          <Typography variant="h6">Registrar Nueva Venta</Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            {/* Columna Izquierda: Datos Generales y Cliente */}
            <Grid item xs={12} md={5}>
              <Paper sx={{ p: { xs: 1, sm: 2 }, mb: { xs: 0, sm: 2 } }}>
                <Typography variant="h6" gutterBottom>Datos Generales</Typography>
                {/* Tipo de venta */}
                <FormControl fullWidth margin="normal">
                  <InputLabel id="tipo-venta-label">Tipo de Venta</InputLabel>
                  <Select
                    labelId="tipo-venta-label"
                    name="tipo"
                    value={crearForm.tipo}
                    label="Tipo de Venta"
                    onChange={(e) => setCrearForm(prev => ({ ...prev, tipo: e.target.value }))}
                  >
                    <MenuItem value="VENTA_DIRECTA">Venta Directa</MenuItem>
                    <MenuItem value="VENTA_RAPIDA">Venta Rápida</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label="Fecha de Venta"
                  name="fechaventa"
                  value={new Date().toISOString().split('T')[0]}
                  fullWidth
                  required
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                  InputProps={{ readOnly: true, disabled: true }}
                />
              </Paper>
              <Paper sx={{ p: { xs: 1, sm: 2 } }}>
                <Typography variant="h6" gutterBottom>Cliente</Typography>
                {crearForm.tipo === 'VENTA_RAPIDA' ? (
                  <TextField
                    label="Cliente"
                    value={(() => {
                      const cf = clientes.find(c => c.nombre?.toLowerCase() === 'consumidor' && c.apellido?.toLowerCase() === 'final');
                      return cf ? `${cf.nombre} ${cf.apellido}` : '';
                    })()}
                    fullWidth
                    margin="normal"
                    InputProps={{ readOnly: true }}
                    disabled
                  />
                ) : (
                  <Autocomplete
                    options={clientes.filter(c => !(c.nombre?.toLowerCase() === 'consumidor' && c.apellido?.toLowerCase() === 'final'))}
                    getOptionLabel={option => `${option.nombre} ${option.apellido} (${option.id})`}
                    renderOption={(props, option) => (
                      <li {...props} key={option.id}>
                        <PersonIcon sx={{ mr: 1 }} />
                        {option.nombre} {option.apellido} <span style={{ color: '#888', marginLeft: 8 }}>({option.id})</span>
                      </li>
                    )}
                    value={clientes.find(c => c.id === crearForm.documentocliente) || null}
                    onChange={(_, value) => setCrearForm(prev => ({ ...prev, documentocliente: value ? value.id : '' }))}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    renderInput={params => (
                      <TextField
                        {...params}
                        label="Buscar Cliente"
                        placeholder="Nombre, apellido o documento"
                        fullWidth
                        margin="normal"
                        required
                        error={!!crearValidation.documentocliente}
                        helperText={crearValidation.documentocliente}
                      />
                    )}
                    noOptionsText="No se encontró ningún cliente"
                    sx={{ minWidth: 250 }}
                  />
                )}
              </Paper>
            </Grid>
            {/* Columna Derecha: Productos */}
            <Grid item xs={12} md={7}>
              <Paper sx={{ p: { xs: 1, sm: 2 }, height: '100%' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Productos</Typography>
                  <Button variant="outlined" onClick={handleOpenProductosModal} startIcon={<AddIcon />}>
                    Agregar Productos
                  </Button>
                </Box>
                <TableContainer sx={{ maxHeight: 400, overflowX: { xs: 'auto', sm: 'visible' } }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Producto</TableCell>
                        <TableCell>Presentación</TableCell>
                        <TableCell align="center">Cantidad</TableCell>
                        <TableCell align="right">Precio Unitario</TableCell>
                        <TableCell align="right">Subtotal</TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {crearForm.productos.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center">Aún no hay productos</TableCell>
                        </TableRow>
                      ) : (
                        crearForm.productos.map(prod => {
                          const presentaciones = presentacionesPorProducto[prod.idproducto] || [];
                          const presentacion = presentaciones.find(p => p.idpresentacion === prod.idpresentacion);
                          const stockDisponible = prod.stock_presentacion !== undefined ? prod.stock_presentacion : (prod.stock !== undefined ? prod.stock : (prod.producto_stock !== undefined ? prod.producto_stock : (prod.producto?.stock || 0)));
                          const precioUnitario = prod.precioventa;
                          const subtotal = stockDisponible * precioUnitario;
                          return (
                            <TableRow key={prod.idproducto + '-' + prod.idpresentacion}>
                              <TableCell>{prod.nombre}</TableCell>
                              <TableCell>
                                <FormControl fullWidth size="small">
                                  <Select
                                    value={prod.idpresentacion}
                                    onChange={e => {
                                      const nueva = (presentacionesPorProducto[prod.idproducto] || []).find(pr => pr.idpresentacion === Number(e.target.value));
                                      // Si la presentación no tiene stock, asígnale el stock del producto seleccionado
                                      if (nueva && (nueva.stock === undefined || nueva.stock === null)) {
                                        nueva.stock = prod.stock;
                                      }
                                      setPresentacionSeleccionada(nueva);
                                    }}
                                    displayEmpty
                                  >
                                    {presentaciones.map(pr => (
                                      <MenuItem key={pr.idpresentacion} value={pr.idpresentacion}>
                                        {pr.nombre} (factor: {pr.factor_conversion})
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </TableCell>
                              <TableCell align="center">
                                <TextField
                                  type="number"
                                  value={prod.cantidad === '' ? '' : prod.cantidad}
                                  onChange={e => {
                                    const nuevaCantidad = e.target.value === '' ? '' : Number(e.target.value);
                                    // Validar stock disponible según factor de conversión
                                    const presentaciones = presentacionesPorProducto[prod.idproducto] || [];
                                    const presentacion = presentaciones.find(p => p.idpresentacion === prod.idpresentacion);
                                    const stock = prod.stock_presentacion !== undefined ? prod.stock_presentacion : (prod.stock !== undefined ? prod.stock : (prod.producto_stock !== undefined ? prod.producto_stock : (prod.producto?.stock || 0)));
                                    const factor = presentacion?.factor_conversion ? parseFloat(presentacion.factor_conversion) : 1;
                                    const maxCantidad = Math.floor(stock / factor);
                                    if (nuevaCantidad !== '' && nuevaCantidad > maxCantidad) {
                                      Swal.fire({ icon: 'error', title: 'Stock insuficiente', text: `No hay suficiente stock para esta presentación. Máximo permitido: ${maxCantidad}` });
                                      handleProductoChange(prod.idproducto, prod.idpresentacion, 'cantidad', maxCantidad);
                                      return;
                                    }
                                    handleProductoChange(prod.idproducto, prod.idpresentacion, 'cantidad', nuevaCantidad);
                                  }}
                                  onBlur={e => {
                                    if (prod.cantidad === '' || prod.cantidad < 1) {
                                      handleProductoChange(prod.idproducto, prod.idpresentacion, 'cantidad', 1);
                                    }
                                  }}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter' && productoSeleccionado && presentacionSeleccionada && cantidadPresentacion > 0) {
                                      e.preventDefault();
                                      handleAddProducto();
                                    }
                                  }}
                                  sx={{ width: '80px' }}
                                  inputProps={{ min: 1, style: { textAlign: 'center' } }}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell align="right">{formatCurrency(precioUnitario)}</TableCell>
                              <TableCell align="right">{formatCurrency(subtotal)}</TableCell>
                              <TableCell>
                                <IconButton size="small" color="error" onClick={() => handleRemoveProducto(prod.idproducto)}>
                                  <DeleteIcon />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Box mt={2} textAlign="right">
                  <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
                    Total de productos (unidades reales): {crearForm.productos.reduce((acc, p) => {
                      const presentacion = (presentacionesPorProducto[p.idproducto] || []).find(pr => pr.idpresentacion === p.idpresentacion);
                      return acc + ((Number(p.cantidad) || 0) * (presentacion ? parseFloat(presentacion.factor_conversion) : 1));
                    }, 0)}
                  </Typography>
                  <Typography variant="h6">
                    Total: {formatCurrency(crearForm.productos.reduce((acc, p) => {
                      const presentacion = (presentacionesPorProducto[p.idproducto] || []).find(pr => pr.idpresentacion === p.idpresentacion);
                      const stockDisponible = p.stock_presentacion !== undefined ? p.stock_presentacion : (p.stock !== undefined ? p.stock : (p.producto_stock !== undefined ? p.producto_stock : (p.producto?.stock || 0)));
                      return acc + (stockDisponible * p.precioventa);
                    }, 0))}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCrearOpen(false)} color="secondary">Cancelar</Button>
          <Button onClick={handleCrearVenta} variant="contained" color="primary" disabled={crearLoading}>
            {crearLoading ? <CircularProgress size={24} /> : 'Guardar Venta'}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Sub-Modal para Agregar Productos */}
      <Dialog open={productosModalOpen} onClose={handleCloseProductosModal} maxWidth="md" fullWidth>
        <DialogTitle>Seleccionar Productos</DialogTitle>
        <DialogContent>
          <Buscador
            value={productosBusqueda}
            onChange={(e) => setProductosBusqueda(e.target.value)}
            placeholder="Buscar producto por nombre o código..."
            sx={{ width: '100%', minWidth: 250, mb: 2, mt: 2 }}
            onKeyDown={async (e) => {
              if (e.key === 'Enter' && productosBusqueda.trim() !== '') {
                const res = await buscarUnidadPorCodigo(productosBusqueda.trim());
                if (res.success && res.data && res.data.data) {
                  const unidad = res.data.data;
                  const producto = unidad.producto;
                  if (!producto) {
                    Swal.fire({ icon: 'error', title: 'Producto no encontrado', text: 'No se encontró el producto para este código.' });
                    return;
                  }
                  // Validar stock antes de agregar
                  let yaExiste = false;
                  let stockDisponible = producto.stock;
                  setCrearForm(prev => {
                    let cantidadActual = 0;
                    const productos = prev.productos.map(p => {
                      if (p.idproducto === producto.idproducto && p.idpresentacion === unidad.idpresentacion) {
                        yaExiste = true;
                        cantidadActual = Number(p.cantidad) || 0;
                        return {
                          ...p,
                          cantidad: cantidadActual + 1,
                        };
                      }
                      return p;
                    });
                    const cantidadTotal = yaExiste ? cantidadActual + 1 : 1;
                    if (cantidadTotal > stockDisponible) {
                      Swal.fire({ icon: 'error', title: 'Stock insuficiente', text: `No hay suficiente stock para agregar este producto. Stock disponible: ${stockDisponible}` });
                      return prev;
                    }
                    if (!yaExiste) {
                      productos.push({
                        idproducto: producto.idproducto,
                        nombre: producto.nombre,
                        codigoproducto: producto.codigoproducto || '',
                        idpresentacion: unidad.idpresentacion,
                        presentacion_nombre: unidad.nombre,
                        factor_conversion: parseFloat(unidad.factor_conversion),
                        cantidad: 1,
                        precioventa: Number(producto.precioventa) || 0,
                        stock_presentacion: unidad.stock !== undefined ? unidad.stock : (unidad.stock_presentacion !== undefined ? unidad.stock_presentacion : 0),
                      });
                    }
                    Swal.fire({
                      position: 'top',
                      icon: 'success',
                      title: `${producto.nombre} (${unidad.nombre}) agregado a la venta`,
                      showConfirmButton: false,
                      timer: 1200,
                      width: 350,
                      toast: true,
                      background: '#f6fff6',
                      customClass: {
                        popup: 'swal2-toast',
                        title: 'swal2-title-custom',
                      },
                    });
                    setProductosBusqueda('');
                    return { ...prev, productos };
                  });
                  return;
                } else {
                  Swal.fire({ icon: 'error', title: 'No encontrado', text: res.detalles || 'No se encontró la presentación para este código.' });
                }
              }
            }}
          />
          <TableContainer component={Paper} sx={{ maxHeight: 400, mt: 2, overflowX: { xs: 'auto', sm: 'visible' } }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Producto</TableCell>
                  <TableCell>Código</TableCell>
                  <TableCell>Stock</TableCell>
                  <TableCell>Precio Venta Actual</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {productosLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <CircularProgress size={28} />
                    </TableCell>
                  </TableRow>
                ) : productosActivos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" style={{ color: '#888' }}>
                      No hay productos activos disponibles o falta el campo "precioventa" en los productos.<br/>
                      Revisa la consola para ver los datos recibidos.
                    </TableCell>
                  </TableRow>
                ) : (
                  productosActivos
                    .filter(p => 
                      p.nombre.toLowerCase().includes(productosBusqueda.toLowerCase()) ||
                      p.codigoproducto.toLowerCase().includes(productosBusqueda.toLowerCase())
                    )
                    .map(p => (
                      <TableRow key={p.idproducto} hover onClick={() => {
                        setProductoSeleccionado(p);
                        setPresentacionSeleccionada(null);
                        setCantidadPresentacion(1);
                      }} selected={productoSeleccionado?.idproducto === p.idproducto}>
                        <TableCell>{p.nombre}</TableCell>
                        <TableCell>{p.codigoproducto}</TableCell>
                        <TableCell>{p.stock}</TableCell>
                        <TableCell>{formatCurrency(Number(p.precioventa) || 0)}</TableCell>
                        <TableCell>
                          <Button variant="outlined" size="small" onClick={() => {
                            setProductoSeleccionado(p);
                            setPresentacionSeleccionada(null);
                            setCantidadPresentacion(1);
                          }}>Seleccionar</Button>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {/* Selector de presentación y cantidad */}
          {productoSeleccionado && (
            <Paper elevation={3} sx={{ mt: 3, p: 2, borderRadius: 3, bgcolor: '#f5f7fa', display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Box flex={1} minWidth={180}>
                <FormControl fullWidth>
                  <InputLabel id="presentacion-label">Presentación</InputLabel>
                  <Select
                    labelId="presentacion-label"
                    value={presentacionSeleccionada?.idpresentacion || ''}
                    label="Presentación"
                    onChange={e => {
                      const nueva = (presentacionesPorProducto[productoSeleccionado.idproducto] || []).find(pr => pr.idpresentacion === Number(e.target.value));
                      // Si la presentación no tiene stock, asígnale el stock del producto seleccionado
                      if (nueva && (nueva.stock === undefined || nueva.stock === null)) {
                        nueva.stock = productoSeleccionado.stock;
                      }
                      setPresentacionSeleccionada(nueva);
                    }}
                  >
                    {(presentacionesPorProducto[productoSeleccionado.idproducto] || []).map(pr => (
                      <MenuItem key={pr.idpresentacion} value={pr.idpresentacion}>
                        {pr.nombre} (factor: {pr.factor_conversion})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Box flex={1} minWidth={120}>
                <TextField
                  label="Cantidad"
                  type="number"
                  value={cantidadPresentacion === 0 ? '' : cantidadPresentacion}
                  onChange={e => {
                    const val = e.target.value === '' ? '' : Math.max(0, Number(e.target.value));
                    const stock = presentacionSeleccionada?.stock !== undefined ? presentacionSeleccionada.stock : 1;
                    const factor = presentacionSeleccionada?.factor_conversion ? parseFloat(presentacionSeleccionada.factor_conversion) : 1;
                    const maxCantidad = Math.floor(stock / factor);
                    if (val > maxCantidad) {
                      Swal.fire({ icon: 'error', title: 'Stock insuficiente', text: `No hay suficiente stock para esta presentación. Máximo permitido: ${maxCantidad}` });
                      setCantidadPresentacion(maxCantidad);
                      return;
                    }
                    setCantidadPresentacion(val);
                  }}
                  onBlur={() => {
                    if (!cantidadPresentacion || cantidadPresentacion < 1) setCantidadPresentacion(1);
                  }}
                  sx={{ width: '100%' }}
                  inputProps={{ min: 1, max: (() => {
                    const stock = presentacionSeleccionada?.stock !== undefined ? presentacionSeleccionada.stock : 1;
                    const factor = presentacionSeleccionada?.factor_conversion ? parseFloat(presentacionSeleccionada.factor_conversion) : 1;
                    return Math.floor(stock / factor);
                  })(), style: { textAlign: 'center' } }}
                />
              </Box>
              <Box flex={1} minWidth={150}>
                <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                  Precio Venta
                </Typography>
                <Typography variant="h6" sx={{ color: 'success.main', fontWeight: 700 }}>
                  {formatCurrency(Number(productoSeleccionado.precioventa) || 0)}
                </Typography>
              </Box>
              <Box flex={1} minWidth={180}>
                <Button
                  variant="contained"
                  color="success"
                  size="large"
                  startIcon={<AddCircleIcon />}
                  sx={{ minWidth: 180, fontWeight: 'bold', py: 1.2 }}
                  onClick={() => {
                    handleAddProducto();
                    Swal.fire({
                      position: 'top',
                      icon: 'success',
                      title: `${productoSeleccionado?.nombre || ''} (${presentacionSeleccionada?.nombre || ''}) agregado a la venta`,
                      showConfirmButton: false,
                      timer: 1200,
                      width: 350,
                      toast: true,
                      background: '#f6fff6',
                      customClass: {
                        popup: 'swal2-toast',
                        title: 'swal2-title-custom',
                      },
                    });
                  }}
                  disabled={
                    !productoSeleccionado ||
                    !presentacionSeleccionada ||
                    !cantidadPresentacion ||
                    cantidadPresentacion < 1
                  }
                >
                  Agregar a la venta
                </Button>
              </Box>
              {presentacionSeleccionada && cantidadPresentacion > 0 && (
                <Box flex={1} minWidth={200}>
                  <Typography variant="body2" sx={{ mt: 1, color: 'primary.main', fontWeight: 600 }}>
                    Total unidades reales: {cantidadPresentacion * parseFloat(presentacionSeleccionada.factor_conversion)}
                  </Typography>
                </Box>
              )}
            </Paper>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProductosModalOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Ventas; 