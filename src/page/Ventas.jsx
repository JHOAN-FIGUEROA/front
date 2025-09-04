import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert, Button, Snackbar, Pagination, IconButton, Stack, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Chip, TextField, Tooltip, Select, MenuItem, InputLabel, FormControl, InputAdornment, Backdrop
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
import ScheduleIcon from '@mui/icons-material/Schedule';
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
  const pagina = Number.parseInt(searchParams.get('page')) || 1;
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
  const [pdfLoading, setPdfLoading] = useState(false);

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
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      return 'N/A';
    }
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

  // Función para traducir el filtro de estado a lo que espera el backend
  const getEstadoParamVentas = (estado) => {
    if (estado === 'anulada') return 'ANULADA';
    if (estado === 'completada') return 'COMPLETADA';
    if (estado === 'pendiente') return 'PENDIENTE';
    return '';
  };

  // Fetch ventas - con paginación del API cuando no hay búsqueda
  const fetchVentas = useCallback(async (currentPage, currentSearch, estadoFiltro = filtroEstado) => {
    setLoading(true);
    setError('');
    try {
      const estadoParam = getEstadoParamVentas(estadoFiltro);
      
      if (currentSearch && currentSearch.trim()) {
        // Si hay búsqueda, traer todas las ventas para filtrado local
        const result = await getVentas(currentPage, 1000, currentSearch, estadoParam);
        if (result.error) {
          setError(result.detalles || 'Error al cargar ventas.');
          setVentas([]);
          setTotalPaginasAPI(1);
        } else if (result.success && result.data) {
          const ventasBase = result.data.ventas || [];
          setVentas(ventasBase);
          setTotalPaginasAPI(1); // Solo una página ya que cargamos todo para búsqueda
        } else {
          setVentas([]);
          setTotalPaginasAPI(1);
        }
      } else {
        // Si no hay búsqueda, usar paginación del API
        const result = await getVentas(currentPage, VENTAS_POR_PAGINA, '', estadoParam);
        if (result.error) {
          setError(result.detalles || 'Error al cargar ventas.');
          setVentas([]);
          setTotalPaginasAPI(1);
        } else if (result.success && result.data) {
          const ventasBase = result.data.ventas || [];
          setVentas(ventasBase);
          // Usar el total de páginas del API
          const totalVentas = result.data.total || ventasBase.length;
          const totalPaginas = Math.ceil(totalVentas / VENTAS_POR_PAGINA);
          setTotalPaginasAPI(totalPaginas);
        } else {
          setVentas([]);
          setTotalPaginasAPI(1);
        }
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
    setBusqueda(searchFromUrl);
    // Cargar datos con búsqueda si existe
    fetchVentas(pageFromUrl, searchFromUrl, getEstadoParamVentas(filtroEstado));
  }, [fetchVentas, filtroEstado]);

  // Efecto para manejar cambios en la búsqueda
  useEffect(() => {
    if (busqueda !== searchParams.get('search')) {
      const newSearchParams = new URLSearchParams(searchParams);
      if (busqueda) {
        newSearchParams.set('search', busqueda);
      } else {
        newSearchParams.delete('search');
      }
      newSearchParams.set('page', '1');
      setSearchParams(newSearchParams);
      
      // Recargar datos con la nueva búsqueda
      fetchVentas(1, busqueda, getEstadoParamVentas(filtroEstado));
    }
  }, [busqueda, searchParams, setSearchParams, fetchVentas, filtroEstado]);

  // Filtrado local mejorado para ventas
  console.log('🔍 Búsqueda actual:', busqueda, 'Tipo:', typeof busqueda, 'Longitud:', busqueda?.length);
  const ventasFiltradas = ventas
    .filter(venta => {
      // Filtro por estado
      if (filtroEstado === 'activa') return venta.estado === 'ACTIVA' || venta.estado === 'COMPLETADA';
      if (filtroEstado === 'anulada') return venta.estado === 'ANULADA';
      if (filtroEstado === 'completada') return venta.estado === 'COMPLETADA';
      if (filtroEstado === 'pendiente') return venta.estado === 'PENDIENTE';
      return true;
    })
    .filter(venta => {
      // Si no hay búsqueda, mostrar todas las ventas
      if (!busqueda || !busqueda.trim()) return true;
      
      const terminoBusqueda = busqueda.trim();
      const terminoBusquedaLower = terminoBusqueda.toLowerCase();
      
      // Validar que la venta existe
      if (!venta) return false;

      // Buscar por estado
      if (terminoBusquedaLower === 'activo' || terminoBusquedaLower === 'activa') {
        return venta.estado === 'ACTIVA' || venta.estado === 'COMPLETADA';
      }
      if (terminoBusquedaLower === 'anulada' || terminoBusquedaLower === 'anulado') {
        return venta.estado === 'ANULADA';
      }
      if (terminoBusquedaLower === 'completada' || terminoBusquedaLower === 'completado') {
        return venta.estado === 'COMPLETADA';
      }
      if (terminoBusquedaLower === 'pendiente' || terminoBusquedaLower === 'pedido') {
        return venta.estado === 'PENDIENTE';
      }

      // Buscar por nombre de cliente
      let nombreCliente = '';
      if (typeof venta.cliente === 'string') {
        nombreCliente = venta.cliente;
      } else if (venta.cliente && typeof venta.cliente === 'object') {
        nombreCliente = `${venta.cliente.nombre || ''} ${venta.cliente.apellido || ''}`.trim();
      }
      
      // Buscar en cliente_info si existe
      if (venta.cliente_info && venta.cliente_info.nombre && venta.cliente_info.apellido) {
        const nombreClienteInfo = `${venta.cliente_info.nombre} ${venta.cliente_info.apellido}`.trim();
        if (nombreClienteInfo.toLowerCase().includes(terminoBusquedaLower)) {
          return true;
        }
      }
      
      // Verificar si coincide con el nombre del cliente
      if (nombreCliente && nombreCliente.toLowerCase().includes(terminoBusquedaLower)) {
        return true;
      }
      
      // Búsqueda por palabras individuales
      if (terminoBusquedaLower.includes(' ') && nombreCliente) {
        const palabrasBusqueda = terminoBusquedaLower.split(' ').filter(p => p.length > 2);
        const palabrasCliente = nombreCliente.toLowerCase().split(' ');
        
        const todasLasPalabrasCoinciden = palabrasBusqueda.every(palabraBusqueda => 
          palabrasCliente.some(palabraCliente => palabraCliente.includes(palabraBusqueda))
        );
        
        if (todasLasPalabrasCoinciden) {
          return true;
        }
      }

      // Buscar por documento de cliente
      const posiblesDocumentos = [
        venta.documentocliente,
        venta.documento_cliente,
        venta.cliente_documento,
        venta.id_cliente,
        venta.cliente_id,
        venta.documento,
        venta.id,
        venta.cliente_info?.documentocliente,
        venta.cliente?.documento,
        venta.cliente?.id,
        venta.cliente?.documentocliente,
        venta.cliente?.documento_cliente
      ].filter(Boolean).map(String);
      
      // Buscar en todos los documentos posibles
      for (const doc of posiblesDocumentos) {
        if (doc.toLowerCase().includes(terminoBusquedaLower)) {
          return true;
        }
      }
      
      // Búsqueda por números en el nombre del cliente
      if (/^\d+$/.test(terminoBusqueda) && nombreCliente) {
        const numerosEnNombre = nombreCliente.match(/\d+/g);
        if (numerosEnNombre && numerosEnNombre.some(num => num.includes(terminoBusqueda))) {
          return true;
        }
      }

      // Buscar por fecha de venta
      if (venta.fechaventa) {
        try {
          const fechaOriginal = new Date(venta.fechaventa);
          if (!isNaN(fechaOriginal.getTime())) {
            const fechaFormateada = fechaOriginal.toLocaleDateString('es-ES', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            });
            
            const fechaISO = fechaOriginal.toISOString().split('T')[0];
            
            const fechaMMDDYYYY = fechaOriginal.toLocaleDateString('en-US', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            });
            
            if (fechaFormateada.includes(terminoBusqueda) || 
                fechaISO.includes(terminoBusqueda) || 
                fechaMMDDYYYY.includes(terminoBusqueda) ||
                fechaFormateada.replace(/\//g, '').includes(terminoBusqueda.replace(/\//g, '')) ||
                fechaISO.replace(/-/g, '').includes(terminoBusqueda.replace(/-/g, ''))) {
              return true;
            }
          }
        } catch (error) {
          // Silenciar errores de fecha
        }
      }

      // Buscar por ID de venta
      const idVenta = String(venta.idventas || '').toLowerCase();
      if (idVenta.includes(terminoBusquedaLower)) {
        return true;
      }

      // Buscar por total de venta
      const totalVenta = String(venta.total || '').replace(/[^\d]/g, '');
      const terminoNumerico = terminoBusqueda.replace(/[^\d]/g, '');
      if (totalVenta.includes(terminoNumerico)) return true;

      return false;
    });

  // Calcular paginación local para los resultados filtrados
  const totalPaginasLocal = Math.ceil(ventasFiltradas.length / VENTAS_POR_PAGINA);
  const ventasPaginadas = ventasFiltradas.slice(
    (pagina - 1) * VENTAS_POR_PAGINA,
    pagina * VENTAS_POR_PAGINA
  );

  // Actualizar total de páginas según si hay búsqueda o no
  const totalPaginasFinal = busqueda ? totalPaginasLocal : totalPaginasAPI;

  // Handler para ver detalle de venta
  const handleVerDetalleVenta = async (idventas) => {
    setDetalleLoading(true);
    setDetalleError('');
    setDetalleOpen(true);
    try {
      const response = await getVentaById(idventas);
      if (response && response.data) {
        setVentaDetalle(response);
        // Debug: mostrar información del cliente en el detalle
        if (response.data.cliente) {
          console.log('🔍 Detalle del cliente en venta', idventas, ':', response.data.cliente);
        }
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
        let nuevoForm = { ...prev };
        if (prev.tipo === 'VENTA_RAPIDA') {
          const cf = clientesArray.find(c => c.nombre?.toLowerCase() === 'consumidor' && c.apellido?.toLowerCase() === 'final');
          if (cf) {
            nuevoForm.documentocliente = cf.id;
          } else {
            Swal.fire({ icon: 'error', title: 'Cliente "Consumidor Final" no encontrado', text: 'No existe el cliente "Consumidor Final" en la base de datos. Por favor créalo antes de realizar una venta rápida.' });
            nuevoForm.documentocliente = '';
          }
        } else {
          nuevoForm.documentocliente = '';
        }
        return nuevoForm;
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
    // Obtener productos activos SOLO con stock
    const result = await getProductosActivos(true);
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
      // Mostrar SweetAlert para cada error
      if (validationErrors.tipo) {
        Swal.fire({ icon: 'warning', title: 'Tipo de venta requerido', text: validationErrors.tipo });
        return;
      }
      if (validationErrors.fechaventa) {
        Swal.fire({ icon: 'warning', title: 'Fecha requerida', text: validationErrors.fechaventa });
        return;
      }
      if (validationErrors.documentocliente) {
        Swal.fire({ icon: 'warning', title: 'Cliente requerido', text: validationErrors.documentocliente });
        return;
      }
      if (validationErrors.productos) {
        Swal.fire({ icon: 'warning', title: 'Productos requeridos', text: validationErrors.productos });
        return;
      }
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

  const handleFiltroEstado = (nuevoEstado) => {
    setFiltroEstado(nuevoEstado);
    // Solo recargar datos sin búsqueda
    fetchVentas(1, '', getEstadoParamVentas(nuevoEstado));
  };

  const handleDescargarPDF = async (idventas) => {
    setPdfLoading(true);
    try {
      const result = await getVentaPDF(idventas);
      if (result.success && result.data) {
        const url = window.URL.createObjectURL(new Blob([result.data], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `venta_${idventas}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        openSnackbar(result.detalles || 'Error al generar PDF', 'error');
      }
    } catch (err) {
      openSnackbar('Error inesperado al generar PDF', 'error');
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <Box p={2}>
      <Typography variant="h5" gutterBottom sx={{ mb: 1 }}>Ventas Registradas</Typography>
      <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" mb={1} gap={1}>
        <Box sx={{ flexGrow: 1, width: { xs: '100%', sm: 300 } }}>
          <Buscador
            value={busqueda}
            onChange={e => {
              const newSearchTerm = e.target.value;
              setBusqueda(newSearchTerm);
              // Solo actualizar URL, no hacer llamada a API
              const newSearchParams = new URLSearchParams(searchParams);
              if (newSearchTerm) {
                newSearchParams.set('search', newSearchTerm);
              } else {
                newSearchParams.delete('search');
              }
              newSearchParams.set('page', '1');
              setSearchParams(newSearchParams);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                // Forzar la búsqueda al presionar Enter
                console.log('Búsqueda con Enter:', busqueda);
              }
            }}
            placeholder="Buscar por cliente, documento, fecha..."
          />
          {busqueda && (
            <Button
              size="small"
              onClick={() => {
                setBusqueda('');
                // Solo limpiar búsqueda, no recargar datos
                const newSearchParams = new URLSearchParams(searchParams);
                newSearchParams.delete('search');
                newSearchParams.set('page', '1');
                setSearchParams(newSearchParams);
              }}
              sx={{ mt: 0.5, fontSize: '0.75rem' }}
            >
              Limpiar búsqueda
            </Button>
          )}
        </Box>
        <Button
          variant="contained"
          color="success"
          onClick={handleCrearOpen}
          sx={{ minWidth: 120, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}
          startIcon={<AddIcon />}
        >
          Nueva Venta
        </Button>
      </Box>
      <Box display="flex" justifyContent="center" gap={1} my={1}>
        <Button variant={filtroEstado === 'pendiente' ? 'contained' : 'outlined'} size="small" onClick={() => handleFiltroEstado('pendiente')}>Pedidos</Button>
        <Button variant={filtroEstado === 'completada' ? 'contained' : 'outlined'} size="small" onClick={() => handleFiltroEstado('completada')}>Completadas</Button>
        <Button variant={filtroEstado === 'anulada' ? 'contained' : 'outlined'} size="small" onClick={() => handleFiltroEstado('anulada')}>Anuladas</Button>
        <Button variant={filtroEstado === '' ? 'contained' : 'outlined'} size="small" onClick={() => handleFiltroEstado('')}>Todas</Button>
      </Box>
      <Box mb={1} height={32} display="flex" alignItems="center" justifyContent="center">
        {loading && <CircularProgress size={24} />}
        {error && !loading && <Alert severity="error" sx={{ width: '100%', py: 0.5 }}>{error}</Alert>}
        {!loading && !error && busqueda && (
          <Alert severity="info" sx={{ width: '100%', py: 0.5 }}>
            Se encontraron {ventasFiltradas.length} venta{ventasFiltradas.length !== 1 ? 's' : ''} que coinciden con "{busqueda}"
          </Alert>
        )}
      </Box>
      <TableContainer component={Paper} sx={{ boxShadow: 1, mb: 1 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ py: 1 }}><b>#</b></TableCell>
              <TableCell sx={{ py: 1 }}><b>Fecha</b></TableCell>
              <TableCell sx={{ width: 160, py: 1 }}><b>Cliente</b></TableCell>
              <TableCell sx={{ width: 100, py: 1 }}><b>Documento</b></TableCell>
              <TableCell align="right" sx={{ width: 100, py: 1 }}><b>Total</b></TableCell>
              <TableCell align="center" sx={{ py: 1 }}><b>Estado</b></TableCell>
              <TableCell align="center" sx={{ py: 1 }}><b>Acciones</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading && ventasPaginadas.length === 0 && !error && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 2 }}>
                  {busqueda ? 
                    `No se encontraron ventas que coincidan con "${busqueda}"` : 
                    'No hay ventas registradas.'
                  }
                </TableCell>
              </TableRow>
            )}
            {ventasPaginadas.map((venta, idx) => {
              const clienteNombre = venta.cliente || '';
              const estado = venta.estado || 'ACTIVA';
              let colorEstado = 'default';
              let iconEstado = null;
              let labelEstado = estado || 'SIN ESTADO';
              if (estado === 'ACTIVA' || estado === 'COMPLETADA') { colorEstado = 'success'; iconEstado = <CheckCircleIcon />; }
              else if (estado === 'ANULADA') { colorEstado = 'error'; iconEstado = <CancelIcon />; }
              else if (estado === 'PENDIENTE') { colorEstado = 'warning'; iconEstado = <ScheduleIcon />; labelEstado = 'PEDIDO'; }
              else if (estado === 'CONFIRMADA') { colorEstado = 'info'; iconEstado = <CheckCircleIcon />; }
              else { colorEstado = 'default'; iconEstado = null; }
              return (
                <TableRow key={venta.idventas} sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
                  <TableCell sx={{ py: 1 }}>{(pagina - 1) * VENTAS_POR_PAGINA + idx + 1}</TableCell>
                  <TableCell sx={{ py: 1 }}>{formatDate(venta.fechaventa)}</TableCell>
                  <TableCell sx={{ width: 160, py: 1 }}>{clienteNombre}</TableCell>
                  <TableCell sx={{ width: 100, py: 1 }}>
                    {(() => {
                      // Intentar obtener el documento del cliente de diferentes formas
                      if (venta.documentocliente) return venta.documentocliente;
                      if (venta.documento_cliente) return venta.documento_cliente;
                      if (venta.cliente_documento) return venta.cliente_documento;
                      if (venta.id_cliente) return venta.id_cliente;
                      if (venta.cliente_id) return venta.cliente_id;
                      if (venta.documento) return venta.documento;
                      if (venta.id) return venta.id;
                      if (venta.cliente_info && venta.cliente_info.documentocliente) return venta.cliente_info.documentocliente;
                      if (venta.cliente && typeof venta.cliente === 'object') {
                        return venta.cliente.documento || venta.cliente.id || venta.cliente.documentocliente || venta.cliente.documento_cliente || 'N/A';
                      }
                      return 'N/A';
                    })()}
                  </TableCell>
                  <TableCell align="right" sx={{ width: 100, py: 1 }}>{formatCurrency(venta.total)}</TableCell>
                  <TableCell align="center" sx={{ py: 1 }}>
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
                  <TableCell align="center" sx={{ py: 1 }}>
                    <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center">
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
                          onClick={() => handleDescargarPDF(venta.idventas)}
                        >
                          <PictureAsPdfIcon fontSize="small" />
                        </IconButton>
                      </span></Tooltip>
                      {estado !== 'ANULADA' ? (
                        <Tooltip title="Anular Venta"><span>
                          <IconButton 
                            color="error" 
                            size="small" 
                            onClick={() => { setAnularOpen(true); setVentaAnular(venta); }}
                          >
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        </span></Tooltip>
                      ) : (
                        <IconButton style={{ visibility: 'hidden' }} size="small">
                          <CancelIcon fontSize="small" />
                        </IconButton>
                      )}
                      {estado === 'PENDIENTE' && (
                        <Tooltip title="Confirmar Pedido"><span>
                          <IconButton
                            color="success"
                            size="small"
                            onClick={async () => {
                              const result = await Swal.fire({
                                title: '¿Confirmar Pedido?',
                                text: `¿Estás seguro de que deseas confirmar el pedido #${venta.idventas}?`,
                                icon: 'question',
                                showCancelButton: true,
                                confirmButtonColor: '#28a745',
                                cancelButtonColor: '#6c757d',
                                confirmButtonText: 'Sí, Confirmar',
                                cancelButtonText: 'Cancelar',
                                reverseButtons: true,
                                customClass: {
                                  popup: 'swal2-custom-popup',
                                  title: 'swal2-custom-title',
                                  confirmButton: 'swal2-custom-confirm',
                                  cancelButton: 'swal2-custom-cancel'
                                }
                              });

                              if (result.isConfirmed) {
                                setConfirmarLoading(true);
                                const apiResult = await confirmarVenta(venta.idventas);
                                setConfirmarLoading(false);
                                
                                if (apiResult && apiResult.success) {
                                  Swal.fire({
                                    icon: 'success',
                                    title: '¡Pedido Confirmado!',
                                    text: 'El pedido ha sido confirmado y convertido en venta exitosamente.',
                                    timer: 2000,
                                    showConfirmButton: false,
                                    background: '#f8fff8',
                                    customClass: {
                                      popup: 'swal2-success-popup'
                                    }
                                  });
                                  fetchVentas(pagina, busqueda);
                                } else {
                                  Swal.fire({
                                    icon: 'error',
                                    title: 'Error al Confirmar',
                                    text: apiResult.message || apiResult.detalles || 'Ocurrió un error al confirmar el pedido.',
                                    confirmButtonColor: '#dc3545'
                                  });
                                }
                              }
                            }}
                          >
                            <CheckCircleIcon fontSize="small" />
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
      {/* Paginación más visible y compacta */}
      {!loading && totalPaginasFinal > 1 && (
        <Box display="flex" justifyContent="center" mt={1} mb={1} p={1} sx={{ backgroundColor: '#f8f9fa', borderRadius: 1 }}>
          <Pagination
            count={totalPaginasFinal}
            page={pagina}
            onChange={(e, value) => {
              const newSearchParams = new URLSearchParams(searchParams);
              newSearchParams.set('page', value.toString());
              setSearchParams(newSearchParams);
              
              // Si no hay búsqueda, recargar datos del API con la nueva página
              if (!busqueda) {
                fetchVentas(value, '', getEstadoParamVentas(filtroEstado));
              }
            }}
            color="primary"
            showFirstButton 
            showLastButton
            size="small"
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
                      <CheckCircleIcon color={['ACTIVA','COMPLETADA'].includes(ventaDetalle.data.estado) ? "success" : ventaDetalle.data.estado === 'ANULADA' ? "error" : ventaDetalle.data.estado === 'PENDIENTE' ? "warning" : "info"} sx={{ fontSize: 24 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>Estado</Typography>
                      <Chip 
                        label={ventaDetalle.data.estado || 'Sin Estado'} 
                        color={['ACTIVA','COMPLETADA'].includes(ventaDetalle.data.estado) ? "success" : ventaDetalle.data.estado === 'ANULADA' ? "error" : ventaDetalle.data.estado === 'PENDIENTE' ? "warning" : "info"}
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
      <Dialog
  open={crearOpen}
  onClose={() => setCrearOpen(false)}
  maxWidth="md"
  fullWidth
  PaperProps={{
    sx: {
      maxWidth: 990, // más compacto
      borderRadius: 3,
      background: '#f8f9fa',
      p: 0
    }
  }}
>
  <DialogTitle sx={{
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    background: '#1976d2',
    color: '#fff',
    py: 3,
    px: 4,
    fontSize: 28,
    fontWeight: 700
  }}>
    <AddShoppingCartIcon sx={{ fontSize: 36 }} />
    Registrar Nueva Venta
  </DialogTitle>
  <DialogContent sx={{ px: 4, py: 3 }}>
    {crearLoading ? (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight={200}>
        <CircularProgress size={40} />
        <Typography variant="h6" mt={2}>Cargando datos...</Typography>
      </Box>
    ) : (
      <Grid container spacing={2}>
        {/* Columna izquierda: Datos Generales y Cliente */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Datos Generales</Typography>
            <FormControl fullWidth margin="dense">
              <InputLabel id="tipo-venta-label">Tipo de Venta</InputLabel>
              <Select
                labelId="tipo-venta-label"
                name="tipo"
                value={crearForm.tipo}
                label="Tipo de Venta"
                onChange={(e) => {
                  const nuevoTipo = e.target.value;
                  setCrearForm(prev => {
                    let nuevoForm = { ...prev, tipo: nuevoTipo };
                    if (nuevoTipo === 'VENTA_RAPIDA') {
                      const cf = clientes.find(c => c.nombre?.toLowerCase() === 'consumidor' && c.apellido?.toLowerCase() === 'final');
                      nuevoForm.documentocliente = cf ? cf.id : '';
                    } else {
                      nuevoForm.documentocliente = '';
                    }
                    return nuevoForm;
                  });
                }}
                size="small"
              >
                <MenuItem value="VENTA_DIRECTA">Venta Directa</MenuItem>
                <MenuItem value="VENTA_RAPIDA">Venta Rápida</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Fecha de Venta"
              name="fechaventa"
              type="date"
              value={crearForm.fechaventa}
              onChange={handleCrearChange}
              fullWidth
              required
              margin="dense"
              size="small"
              InputLabelProps={{ shrink: true }}
              error={!!crearValidation.fechaventa}
              helperText={crearValidation.fechaventa}
            />
          </Paper>
          <Paper elevation={0} sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Cliente</Typography>
            {crearForm.tipo === 'VENTA_RAPIDA' ? (
              <TextField
                label="Cliente"
                value={(() => {
                  const cf = clientes.find(c => c.nombre?.toLowerCase() === 'consumidor' && c.apellido?.toLowerCase() === 'final');
                  return cf ? `${cf.nombre} ${cf.apellido}` : '';
                })()}
                fullWidth
                margin="dense"
                InputProps={{ readOnly: true }}
                disabled
                size="small"
              />
            ) : (
              <Autocomplete
                options={clientes.filter(c => !(c.nombre?.toLowerCase() === 'consumidor' && c.apellido?.toLowerCase() === 'final'))}
                getOptionLabel={option => `${option.nombre} ${option.apellido} (${option.id})`}
                value={clientes.find(c => c.id === crearForm.documentocliente) || null}
                onChange={(_, value) => setCrearForm(prev => ({ ...prev, documentocliente: value ? value.id : '' }))}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={params => (
                  <TextField
                    {...params}
                    label="Buscar Cliente"
                    placeholder="Nombre, apellido o documento"
                    fullWidth
                    margin="dense"
                    required
                    size="small"
                    error={!!crearValidation.documentocliente}
                    helperText={crearValidation.documentocliente}
                  />
                )}
                noOptionsText="No se encontró ningún cliente"
              />
            )}
          </Paper>
        </Grid>
        {/* Columna derecha: Productos */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Productos</Typography>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mb: 2, fontWeight: 700, fontSize: 16 }}
              onClick={handleOpenProductosModal}
              startIcon={<AddIcon />}
            >
              + AGREGAR PRODUCTOS
            </Button>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Producto</TableCell>
                    <TableCell>Presentación</TableCell>
                    <TableCell align="center">Cantidad</TableCell>
                    <TableCell align="right">Subtotal</TableCell>
                    <TableCell align="center">{/* Columna para eliminar */}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {crearForm.productos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Box display="flex" flexDirection="column" alignItems="center" py={2}>
                          <AddShoppingCartIcon sx={{ fontSize: 48, color: '#bdbdbd', mb: 1 }} />
                          <Typography color="text.secondary">Aún no hay productos</Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    crearForm.productos.map(prod => {
                      const presentacion = (presentacionesPorProducto[prod.idproducto] || []).find(p => p.idpresentacion === prod.idpresentacion);
                      const factor = presentacion?.factor_conversion ? parseFloat(presentacion.factor_conversion) : 1;
                      const subtotal = (Number(prod.cantidad) || 0) * factor * prod.precioventa;
                      return (
                        <TableRow key={prod.idproducto + '-' + prod.idpresentacion}>
                          <TableCell>{prod.nombre}</TableCell>
                          <TableCell>{presentacion?.nombre || ''}</TableCell>
                          <TableCell align="center">{prod.cantidad}</TableCell>
                          <TableCell align="right">{formatCurrency(subtotal)}</TableCell>
                          <TableCell align="center">
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => handleRemoveProducto(prod.idproducto)}
                              title="Eliminar producto"
                            >
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
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Total: {formatCurrency(crearForm.productos.reduce((acc, p) => {
                  const presentacion = (presentacionesPorProducto[p.idproducto] || []).find(pr => pr.idpresentacion === p.idpresentacion);
                  const factor = presentacion?.factor_conversion ? parseFloat(presentacion.factor_conversion) : 1;
                  return acc + ((Number(p.cantidad) || 0) * factor * p.precioventa);
                }, 0))}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    )}
  </DialogContent>
  <DialogActions sx={{ px: 4, pb: 3, pt: 2 }}>
    <Button onClick={() => setCrearOpen(false)} color="error" variant="text" sx={{ fontWeight: 700, fontSize: 16 }}>
      CANCELAR
    </Button>
    <Button
      onClick={handleCrearVenta}
      variant="contained"
      color="success"
      sx={{ fontWeight: 700, fontSize: 16 }}
      disabled={crearLoading}
    >
      GUARDAR VENTA
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
                const res = await buscarUnidadPorCodigo(productosBusqueda.trim(), true);
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
                ) : (
                  (() => {
                    const productosFiltrados = productosActivos
                      .filter(p => 
                        p.nombre.toLowerCase().includes(productosBusqueda.toLowerCase()) ||
                        p.codigoproducto.toLowerCase().includes(productosBusqueda.toLowerCase())
                      );
                    if (productosFiltrados.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={5} align="center" style={{ color: '#888' }}>
                            No se encontró ningún producto
                          </TableCell>
                        </TableRow>
                      );
                    }
                    return productosFiltrados.slice(0, 5).map(p => (
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
                    ));
                  })()
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
      {/* Loader para generación de PDF */}
      <Backdrop open={pdfLoading} sx={{ zIndex: 2000, color: '#fff' }}>
        <CircularProgress color="inherit" />
        <span style={{ marginLeft: 16, fontWeight: 600 }}>Generando PDF...</span>
      </Backdrop>
    </Box>
  );
};

export default Ventas;