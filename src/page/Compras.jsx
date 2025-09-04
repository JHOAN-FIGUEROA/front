import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert, Button, Snackbar, Pagination, IconButton, Stack, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Chip, TextField, Tooltip, Select, MenuItem, InputLabel, FormControl, InputAdornment, Backdrop
} from '@mui/material';
import { getCompras, getCompraById, anularCompra, createCompra, getProveedoresActivos, getProductosActivos, getProveedores, getUnidades, getProductos, getCompraPDF } from '../api';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CancelIcon from '@mui/icons-material/Cancel';
import Buscador from '../components/Buscador';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import DeleteIcon from '@mui/icons-material/Delete';
import StorefrontIcon from '@mui/icons-material/Storefront';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import InventoryIcon from '@mui/icons-material/Inventory';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import Autocomplete from '@mui/material/Autocomplete';
import { useSearchParams } from 'react-router-dom';

const COMPRAS_POR_PAGINA = 5;

const Compras = () => {
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const [pagina, setPagina] = useState(parseInt(searchParams.get('page')) || 1);
  const [totalPaginasAPI, setTotalPaginasAPI] = useState(1);
  const [busqueda, setBusqueda] = useState(searchParams.get('search') || '');
  const [searchParameter, setSearchParameter] = useState('nrodecompra');
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [compraDetalle, setCompraDetalle] = useState(null);
  const [detalleLoading, setDetalleLoading] = useState(false);
  const [detalleError, setDetalleError] = useState('');
  const [anularOpen, setAnularOpen] = useState(false);
  const [compraAnular, setCompraAnular] = useState(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');
  const [anularLoading, setAnularLoading] = useState(false);

  // Estados para crear compra
  const [crearOpen, setCrearOpen] = useState(false);
  const [crearLoading, setCrearLoading] = useState(false);
  const [crearError, setCrearError] = useState('');
  const initialCrearForm = {
    nrodecompra: '',
    fechadecompra: new Date().toISOString().split('T')[0],
    nitproveedor: null,
    productos: [],
  };
  const [crearForm, setCrearForm] = useState(initialCrearForm);
  const [crearValidation, setCrearValidation] = useState({});
  const [proveedoresActivos, setProveedoresActivos] = useState([]);
  const [productosActivos, setProductosActivos] = useState([]);
  const [productosBusqueda, setProductosBusqueda] = useState('');
  const [productosModalOpen, setProductosModalOpen] = useState(false);

  // Estado unificado para el Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Agrega un estado exclusivo para el Snackbar de producto añadido
  const [snackbarProducto, setSnackbarProducto] = useState({ open: false, message: '', severity: 'success' });

  // Función helper para mostrar el Snackbar
  const openSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const [presentaciones, setPresentaciones] = useState([]);
  const [presentacionesPorProducto, setPresentacionesPorProducto] = useState({});
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [presentacionSeleccionada, setPresentacionSeleccionada] = useState(null);
  const [cantidadPresentacion, setCantidadPresentacion] = useState(1);

  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef(null);

  // Función para obtener los días del mes
  function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  // Función para manejar el click fuera del calendario
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

  // Estado para el mes y año actual del calendario
  const fechaActual = new Date(crearForm.fechadecompra);
  const [calendarMonth, setCalendarMonth] = useState(fechaActual.getMonth());
  const [calendarYear, setCalendarYear] = useState(fechaActual.getFullYear());

  // Límites
  const today = new Date();
  today.setHours(0,0,0,0);
  const minDate = new Date();
  minDate.setDate(today.getDate() - 30);
  minDate.setHours(0,0,0,0);

  // Función para seleccionar fecha
  const handleSelectDate = (day) => {
    const selected = new Date(calendarYear, calendarMonth, day);
    if (selected >= minDate && selected <= today) {
      setCrearForm(prev => ({ ...prev, fechadecompra: selected.toISOString().split('T')[0] }));
      setShowCalendar(false);
    }
  };

  const [filtroEstado, setFiltroEstado] = useState('');

  // Estados para búsqueda por parámetros
  const [parametrosBusqueda, setParametrosBusqueda] = useState({
    nrodecompra: '',
    fechadecompra: '',
    nombreproveedor: '',
    nitproveedor: '',
    estado: ''
  });

  // Función para traducir el filtro de estado a número
  const getEstadoParam = (estado) => {
    if (estado === 'activa') return 1;
    if (estado === 'anulada') return 0;
    return '';
  };

  const fetchCompras = useCallback(async (currentPage, parametros = parametrosBusqueda, estadoFiltro = filtroEstado) => {
    setLoading(true);
    setError('');
    try {
      // Construir parámetros de búsqueda
      const params = {
        page: currentPage,
        limit: COMPRAS_POR_PAGINA,
        ...parametros
      };

      // Agregar filtro de estado si está seleccionado
      const estadoParam = getEstadoParam(estadoFiltro);
      if (estadoParam !== '') {
        params.estado = estadoParam;
      }

      // Limpiar parámetros vacíos
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const result = await getCompras(params.page, params.limit, '', params.estado, {
        nrodecompra: params.nrodecompra,
        fechadecompra: params.fechadecompra,
        nombreproveedor: params.nombreproveedor,
        nitproveedor: params.nitproveedor
      });
      
      if (result.error) {
        setError(result.detalles || 'Error al cargar compras.');
        setCompras([]);
        setTotalPaginasAPI(1);
        if (currentPage > 1) {
          const newSearchParams = new URLSearchParams(searchParams);
          newSearchParams.set('page', '1');
          setSearchParams(newSearchParams, { replace: true });
        }
      } else if (result.success && result.data) {
        setCompras(result.data.compras || []);
        const totalPaginas = result.data.pages || 1;   // 👈 usamos "pages" del backend
        setTotalPaginasAPI(totalPaginas);
        if (currentPage > totalPaginas && totalPaginas > 0) {
          const newSearchParams = new URLSearchParams(searchParams);
          newSearchParams.set('page', totalPaginas.toString());
          setSearchParams(newSearchParams, { replace: true });
        } else if (currentPage !== (parseInt(searchParams.get('page')) || 1)) {
          const newSearchParams = new URLSearchParams(searchParams);
          newSearchParams.set('page', currentPage.toString());
          setSearchParams(newSearchParams, { replace: true });
        }
      } else {
        setCompras([]);
        setTotalPaginasAPI(1);
      }
    } catch (err) {
      setError('Error inesperado al cargar compras: ' + (err.message || ''));
      setCompras([]);
      setTotalPaginasAPI(1);
    } finally {
      setLoading(false);
    }
  }, [searchParams, setSearchParams, filtroEstado, parametrosBusqueda]);

  useEffect(() => {
    const pageFromUrl = parseInt(searchParams.get('page')) || 1;
    const searchFromUrl = searchParams.get('search') || '';

    if (pageFromUrl !== pagina) setPagina(pageFromUrl);
    if (searchFromUrl !== busqueda) setBusqueda(searchFromUrl);
    
    fetchCompras(pageFromUrl, parametrosBusqueda, getEstadoParam(filtroEstado));
  }, [searchParams, fetchCompras, filtroEstado]);

  // Búsqueda con debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (busqueda && busqueda.trim()) {
        // Construir parámetros de búsqueda según searchParameter
        const termino = busqueda.trim();
        const newParametros = {
          nrodecompra: '',
          fechadecompra: '',
          nombreproveedor: '',
          nitproveedor: '',
          estado: ''
        };
        newParametros[searchParameter] = termino;
        setParametrosBusqueda(newParametros);
      } else {
        // Limpiar búsqueda
        setParametrosBusqueda({
          nrodecompra: '',
          fechadecompra: '',
          nombreproveedor: '',
          nitproveedor: '',
          estado: ''
        });
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [busqueda, searchParameter]);

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

  // Las compras ya vienen filtradas del API, no necesitamos filtrado local

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ open: false, message: '', severity: 'info' });
  };

  const handleVerDetalleCompra = async (idcompras) => {
    setDetalleLoading(true);
    setDetalleError('');
    try {
      const response = await getCompraById(idcompras);
      if (response && response.data) {
        setCompraDetalle(response.data);
      } else {
        throw new Error('Formato de respuesta de API inesperado');
      }
      setDetalleOpen(true);
    } catch (error) {
      setDetalleError(error.message || 'Error al cargar los detalles de la compra');
      openSnackbar(error.message || 'Error al cargar los detalles de la compra', 'error');
    } finally {
      setDetalleLoading(false);
    }
  };

  const handleAnularCompra = async (compra) => {
    setCompraAnular(compra);
    setMotivoAnulacion('');
    setAnularOpen(true);
  };

  const handleConfirmarAnulacion = async () => {
    if (!compraAnular || !motivoAnulacion.trim() || motivoAnulacion.trim().length < 10 || motivoAnulacion.trim().length > 50) {
      openSnackbar('Debe ingresar un motivo de anulación válido (10 a 50 caracteres)', 'error');
      return;
    }

    setAnularLoading(true);
    const result = await anularCompra(compraAnular.idcompras, motivoAnulacion.trim());
    setAnularLoading(false);

    if (result.error) {
      setAnularOpen(false);
      Swal.fire({
        icon: 'error',
        title: 'Error al anular',
        text: result.message,
        confirmButtonColor: '#d33',
        background: '#fff',
        customClass: {
          popup: 'animated fadeInDown'
        },
        didOpen: (popup) => {
          popup.style.zIndex = 9999;
        }
      });
    } else {
      setAnularOpen(false);
      setCompraAnular(null);
      setMotivoAnulacion('');
      Swal.fire({
        icon: 'success',
        title: '¡Compra Anulada!',
        text: result.message || 'La compra ha sido anulada correctamente',
        timer: 2000,
        showConfirmButton: false,
        position: 'center',
        background: '#fff',
        customClass: {
          popup: 'animated fadeInDown'
        },
        didOpen: (popup) => {
          popup.style.zIndex = 9999;
        }
      });
              const currentPage = parseInt(searchParams.get('page')) || 1;
              fetchCompras(currentPage, parametrosBusqueda, getEstadoParam(filtroEstado));
    }
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

  // --- Handlers para Crear Compra ---
  const handleCrearOpen = async () => {
    setCrearOpen(true);
    setCrearLoading(true);
    const result = await getProveedores(1, 1000);
    if (result.success) {
      // Soporta ambos formatos de respuesta
      const proveedoresArray = Array.isArray(result.data)
        ? result.data
        : (result.data?.proveedores || []);
      const activos = proveedoresArray.filter(p => p.estado === true || p.estado === 1 || p.estado === 'true');
      setProveedoresActivos(activos);
    } else {
      openSnackbar(result.detalles || 'Error al cargar proveedores', 'error');
    }
    setCrearLoading(false);
  };

  const handleCrearClose = () => {
    setCrearOpen(false);
    setCrearForm(initialCrearForm);
    setCrearValidation({});
    setProveedoresActivos([]);
  };

  const validateField = (name, value) => {
    let error = '';
    if (name === 'nrodecompra') {
      if (!/^\d{5,}$/.test(value)) {
        error = 'Debe ser un número entero de al menos 5 dígitos.';
      }
    }
    if (name === 'fechadecompra') {
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
    setCrearValidation(prev => ({ ...prev, [name]: error }));
  };

  const handleCrearChange = (e) => {
    const { name, value } = e.target;
    setCrearForm(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handleProveedorSelect = (nit) => {
    setCrearForm(prev => ({ ...prev, nitproveedor: prev.nitproveedor === nit ? null : nit }));
  };

  const handleOpenProductosModal = async () => {
    setProductosModalOpen(true);
    const result = await getProductos(1, 1000);
    if (result.success) {
      // Filtrar productos activos
      const productosActivos = (result.data?.productos || result.data?.data?.productos || []).filter(p => p.estado === true || p.estado === 1 || p.estado === 'true');
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
  };

  const handleSelectProducto = (producto) => {
    setProductoSeleccionado(producto);
    const presentacionesDisponibles = presentacionesPorProducto[producto.idproducto] || [];
    setPresentacionSeleccionada(presentacionesDisponibles[0] || null);
    setCantidadPresentacion(1);
  };

  const handleAddProducto = () => {
    if (!productoSeleccionado || !presentacionSeleccionada) return;
    setCrearForm(prev => {
      const productos = prev.productos.map(p => {
        if (p.idproducto === productoSeleccionado.idproducto && p.idpresentacion === presentacionSeleccionada.idpresentacion) {
          return {
            ...p,
            cantidad: (Number(p.cantidad) || 0) + (Number(cantidadPresentacion) || 0),
            // NO actualizar preciodecompra, se mantiene el del primer registro
          };
        }
        return p;
      });
      const existe = prev.productos.some(p => p.idproducto === productoSeleccionado.idproducto && p.idpresentacion === presentacionSeleccionada.idpresentacion);
      if (!existe) {
        productos.push({
          idproducto: productoSeleccionado.idproducto,
          nombre: productoSeleccionado.nombre,
          codigoproducto: productoSeleccionado.codigoproducto,
          idpresentacion: presentacionSeleccionada.idpresentacion,
          presentacion_nombre: presentacionSeleccionada.nombre,
          factor_conversion: parseFloat(presentacionSeleccionada.factor_conversion),
          cantidad: cantidadPresentacion,
          preciodecompra: Number(productoSeleccionado.preciocompra) || 0,
        });
      }
      return { ...prev, productos };
    });
    Swal.fire({
      position: 'top',
      icon: 'success',
      title: `${productoSeleccionado.nombre} (${presentacionSeleccionada.nombre}) agregado a la compra`,
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

  const handleCrearCompra = async () => {
    // Validaciones finales
    if (!crearForm.nrodecompra) {
      Swal.fire({
        toast: true,
        position: 'top',
        icon: 'error',
        title: 'El número de compra es obligatorio.',
        showConfirmButton: false,
        timer: 1800,
        background: '#fff',
        width: 350,
        customClass: { popup: 'swal2-toast', title: 'swal2-title-custom' },
      });
      return;
    } else if (!/^\d{5,}$/.test(crearForm.nrodecompra)) {
      Swal.fire({
        toast: true,
        position: 'top',
        icon: 'error',
        title: 'Debe ser un número entero de al menos 5 dígitos.',
        showConfirmButton: false,
        timer: 1800,
        background: '#fff',
        width: 350,
        customClass: { popup: 'swal2-toast', title: 'swal2-title-custom' },
      });
      return;
    }
    if (!crearForm.nitproveedor) {
      Swal.fire({
        toast: true,
        position: 'top',
        icon: 'error',
        title: 'Debe seleccionar un proveedor.',
        showConfirmButton: false,
        timer: 1800,
        background: '#fff',
        width: 350,
        customClass: { popup: 'swal2-toast', title: 'swal2-title-custom' },
      });
      return;
    }
    if (crearForm.productos.length === 0) {
      Swal.fire({
        toast: true,
        position: 'top',
        icon: 'error',
        title: 'Debe agregar al menos un producto a la compra.',
        showConfirmButton: false,
        timer: 1800,
        background: '#fff',
        width: 350,
        customClass: { popup: 'swal2-toast', title: 'swal2-title-custom' },
      });
      return;
    }

    setCrearLoading(true);
    setCrearError('');
    
    try {
      const dataToSend = {
        ...crearForm,
        productos: crearForm.productos.map(({ nombre, codigoproducto, ...rest }) => rest)
      };

      const result = await createCompra(dataToSend);
      
      if (result.error || !result.success) {
        const errorMsg = result.message || result.detalles || result.error || (typeof result === 'string' ? result : JSON.stringify(result)) || 'Ocurrió un error inesperado.';
        setCrearError(errorMsg);
        Swal.fire({
          icon: 'error',
          title: 'Error al crear la compra',
          text: errorMsg,
          confirmButtonColor: '#2E8B57',
          background: '#fff',
          customClass: {
            popup: 'animated fadeInDown'
          },
          zIndex: 9999,
          didOpen: (popup) => {
            popup.style.zIndex = 9999;
          }
        });
      } else {
        setCrearError('');
        handleCrearClose();
        Swal.fire({
          icon: 'success',
          title: '¡Compra Creada!',
          text: 'La compra ha sido registrada correctamente.',
          timer: 2000,
          showConfirmButton: false,
          confirmButtonColor: '#2E8B57',
          background: '#fff',
          customClass: {
            popup: 'animated fadeInDown'
          },
          zIndex: 9999,
          didOpen: (popup) => {
            popup.style.zIndex = 9999;
          }
        });
        const currentPage = parseInt(searchParams.get('page')) || 1;
        fetchCompras(currentPage, parametrosBusqueda, getEstadoParam(filtroEstado));
      }
    } catch (err) {
      // Capturar errores de duplicidad y otros errores del backend
      const errorMsg = err.response?.data?.error || err.response?.data?.detalles || err.message || 'Error al crear la compra';
      setCrearError(errorMsg);
      
      // Detectar errores de duplicidad usando las propiedades del error
      const isDuplicateError = err.isDuplicateError || 
                              err.status === 409 || 
                              errorMsg.toLowerCase().includes('duplicado') || 
                              errorMsg.toLowerCase().includes('ya existe') || 
                              errorMsg.toLowerCase().includes('ya está registrado');
      
      if (isDuplicateError) {
        Swal.fire({
          icon: 'warning',
          title: 'Número de Compra Duplicado',
          text: `El número de compra ${crearForm.nrodecompra} ya está registrado en el sistema.`,
          confirmButtonColor: '#2E8B57',
          background: '#fff',
          customClass: {
            popup: 'animated fadeInDown'
          },
          zIndex: 9999,
          didOpen: (popup) => {
            popup.style.zIndex = 9999;
          }
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error al crear la compra',
          text: errorMsg,
          confirmButtonColor: '#2E8B57',
          background: '#fff',
          customClass: {
            popup: 'animated fadeInDown'
          },
          zIndex: 9999,
          didOpen: (popup) => {
            popup.style.zIndex = 9999;
          }
        });
      }
    } finally {
      setCrearLoading(false);
    }
  };

  // Antes del return, calcula los límites de fecha
  const todayStr = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

  const [pdfLoading, setPdfLoading] = useState(false);

  const handleDescargarPDF = async (idcompras) => {
    setPdfLoading(true);
    try {
      const result = await getCompraPDF(idcompras);
      if (result.success && result.data) {
        const url = window.URL.createObjectURL(new Blob([result.data], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `compra_${idcompras}.pdf`);
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

  // Al inicio del componente, asegúrate de cargar proveedoresActivos si no está cargado
  useEffect(() => {
    if (proveedoresActivos.length === 0) {
      getProveedores(1, 1000).then(result => {
        if (result.success) {
          const proveedoresArray = Array.isArray(result.data)
            ? result.data
            : (result.data?.proveedores || []);
          const activos = proveedoresArray.filter(p => p.estado === true || p.estado === 1 || p.estado === 'true');
          setProveedoresActivos(activos);
        }
      });
    }
  }, []);

  const handleFiltroEstado = (nuevoEstado) => {
    setFiltroEstado(nuevoEstado);
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('page', '1');
    setSearchParams(newSearchParams);
  };

  // 1. Agrega un estado para controlar si ya se mostró el SweetAlert
  const [alertaNoProducto, setAlertaNoProducto] = useState(false);

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>Compras Registradas</Typography>
      <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" mb={2} gap={2}>
        <Box sx={{ flexGrow: 1, width: { xs: '100%', sm: 350 }, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Buscador
            value={busqueda}
            onChange={handleSearchChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                // Forzar la búsqueda al presionar Enter
                console.log('Búsqueda con Enter:', busqueda);
              }
            }}
            placeholder="Buscar..."
            sx={{ flexGrow: 1 }}
          />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel id="search-parameter-label">Parámetro</InputLabel>
            <Select
              labelId="search-parameter-label"
              id="search-parameter-select"
              value={searchParameter}
              label="Parámetro"
              onChange={(e) => setSearchParameter(e.target.value)}
            >
              <MenuItem value="nrodecompra">Número de Compra</MenuItem>
              <MenuItem value="fechadecompra">Fecha de Compra</MenuItem>
              <MenuItem value="nombreproveedor">Nombre Proveedor</MenuItem>
              <MenuItem value="nitproveedor">NIT Proveedor</MenuItem>
            </Select>
          </FormControl>
          {busqueda && (
            <Button
              size="small"
              onClick={() => {
                setBusqueda('');
                setParametrosBusqueda({
                  nrodecompra: '',
                  fechadecompra: '',
                  nombreproveedor: '',
                  nitproveedor: '',
                  estado: ''
                });
                const newSearchParams = new URLSearchParams(searchParams);
                newSearchParams.delete('search');
                newSearchParams.set('page', '1');
                setSearchParams(newSearchParams);
              }}
              sx={{ mt: 1, fontSize: '0.75rem' }}
            >
              Limpiar búsqueda
            </Button>
          )}
        </Box>
        <Button
          variant="contained"
          color="success"
          onClick={handleCrearOpen}
          sx={{ minWidth: 140, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}
          startIcon={<AddIcon />}
        >
          Nueva Compra
        </Button>
      </Box>
      {/* Filtros de compras */}
      <Box display="flex" justifyContent="center" gap={2} my={2}>
        <Button variant={filtroEstado === 'activa' ? 'contained' : 'outlined'} onClick={() => handleFiltroEstado('activa')}>Activas</Button>
        <Button variant={filtroEstado === 'anulada' ? 'contained' : 'outlined'} onClick={() => handleFiltroEstado('anulada')}>Anuladas</Button>
        <Button variant={filtroEstado === '' ? 'contained' : 'outlined'} onClick={() => handleFiltroEstado('')}>Todas</Button>
      </Box>
      <Box mb={2} height={40} display="flex" alignItems="center" justifyContent="center">
        {loading && <CircularProgress size={28} />}
        {error && !loading && <Alert severity="error" sx={{ width: '100%' }}>{error}</Alert>}
        {!loading && !error && busqueda && (
          <Alert severity="info" sx={{ width: '100%' }}>
            Búsqueda: "{busqueda}" - {compras.length} resultado{compras.length !== 1 ? 's' : ''} encontrado{compras.length !== 1 ? 's' : ''}
          </Alert>
        )}
      </Box>
      <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><b>#</b></TableCell>
              <TableCell><b>N° Compra</b></TableCell>
              <TableCell><b>Fecha</b></TableCell>
              <TableCell><b>Proveedor</b></TableCell>
              <TableCell align="right"><b>Total</b></TableCell>
              <TableCell align="center"><b>Estado</b></TableCell>
              <TableCell align="center"><b>Acciones</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading && compras.length === 0 && !error && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  {busqueda ? 
                    `No se encontraron compras que coincidan con "${busqueda}"` : 
                    'No hay compras registradas.'
                  }
                </TableCell>
              </TableRow>
            )}
            {compras.map((compra, idx) => {
              const compraActiva = compra.estado === 1;
              return (
                <TableRow key={idx}>
                  <TableCell>{(pagina - 1) * COMPRAS_POR_PAGINA + idx + 1}</TableCell>
                  <TableCell>{compra.nrodecompra}</TableCell>
                  <TableCell>{formatDate(compra.fechadecompra)}</TableCell>
                  <TableCell>{compra.nitproveedor_proveedor?.nombre || compra.proveedor_info?.nombre || ''}</TableCell>
                  <TableCell align="right">{formatCurrency(compra.total)}</TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={compraActiva ? "Activa" : "Anulada"} 
                      color={compraActiva ? "success" : "error"}
                      icon={compraActiva ? <CheckCircleIcon /> : <CancelIcon />}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center">
                      <IconButton 
                        color="info" 
                        size="small" 
                        title="Ver Detalle"
                        onClick={() => handleVerDetalleCompra(compra.idcompras)}
                        disabled={detalleLoading}
                      >
                        {detalleLoading && compraDetalle?.compra?.idcompras === compra.idcompras ? (
                          <CircularProgress size={20} />
                        ) : (
                          <VisibilityIcon fontSize="small" />
                        )}
                      </IconButton>
                      <IconButton
                        color="primary"
                        size="small"
                        title="Descargar PDF"
                        onClick={() => handleDescargarPDF(compra.idcompras)}
                      >
                        <PictureAsPdfIcon fontSize="small" />
                      </IconButton>
                      {compraActiva ? (
                        <IconButton 
                          color="error" 
                          size="small" 
                          onClick={() => handleAnularCompra(compra)} 
                          title="Anular Compra"
                        >
                          <CancelIcon fontSize="small" />
                        </IconButton>
                      ) : (
                        <span style={{ width: 40, display: 'inline-block' }}></span>
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
        autoHideDuration={1000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={handleCloseSnackbar} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Modal de Detalle */}
      <Dialog open={detalleOpen} onClose={() => setDetalleOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0', py: 2.5 }}>
          <VisibilityIcon color="primary" sx={{ fontSize: 28 }} />
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>Detalles de la Compra</Typography>
        </DialogTitle>
        <DialogContent dividers sx={{ p: { xs: 1, sm: 3 }, maxHeight: { xs: '80vh', sm: '70vh' }, overflowY: 'auto' }}>
          {detalleLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress size={40} />
            </Box>
          ) : detalleError ? (
            <Alert severity="error" sx={{ mb: 2 }}>{detalleError}</Alert>
          ) : compraDetalle ? (
            <>
              {/* Información de la Compra */}
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                <ShoppingCartIcon color="primary" sx={{ fontSize: 32 }} />
                Información de la Compra
              </Typography>
              <Grid container spacing={3} sx={{ mb: 4 }}>
                {/* Información básica */}
                <Grid item xs={12} sm={6}>
                  <Paper elevation={0} sx={{ p: { xs: 1, sm: 2 }, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <ReceiptIcon color="primary" sx={{ fontSize: 24 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>Información de Compra</Typography>
                    </Box>
                    <Typography variant="subtitle1" color="text.secondary">Número de Compra</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500, mb: 2 }}>{compraDetalle.compra?.nrodecompra}</Typography>
                    <Typography variant="subtitle1" color="text.secondary">ID Compra</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500, mb: 2 }}>{compraDetalle.compra?.idcompras}</Typography>
                    <Typography variant="subtitle1" color="text.secondary">Proveedor</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>{compraDetalle.compra?.nitproveedor_proveedor?.nombre || compraDetalle.compra?.proveedor_info?.nombre || ''}</Typography>
                  </Paper>
                </Grid>
                {/* Fechas */}
                <Grid item xs={12} sm={6}>
                  <Paper elevation={0} sx={{ p: { xs: 1, sm: 2 }, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <CalendarTodayIcon color="primary" sx={{ fontSize: 24 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>Fechas</Typography>
                    </Box>
                    <Typography variant="subtitle1" color="text.secondary">Fecha de Compra</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500, mb: 2 }}>{formatDate(compraDetalle.compra?.fechadecompra)}</Typography>
                    <Typography variant="subtitle1" color="text.secondary">Fecha de Registro</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>{formatDate(compraDetalle.compra?.fechaderegistro)}</Typography>
                  </Paper>
                </Grid>
                {/* Total y Estado */}
                <Grid item xs={12} sm={6}>
                  <Paper elevation={0} sx={{ p: { xs: 1, sm: 2 }, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <AttachMoneyIcon color="primary" sx={{ fontSize: 24 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>Total</Typography>
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {formatCurrency(compraDetalle.compra?.total)}
                    </Typography>
                  </Paper>
                </Grid>
                {/* Estado */}
                <Grid item xs={12} sm={6}>
                  <Paper elevation={0} sx={{ p: { xs: 1, sm: 2 }, backgroundColor: '#f8f9fa', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CheckCircleIcon color={compraDetalle.compra?.estado ? "success" : "error"} sx={{ fontSize: 24 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Estado</Typography>
                    <Chip 
                      label={compraDetalle.compra?.estado ? "Activa" : "Anulada"} 
                      color={compraDetalle.compra?.estado ? "success" : "error"}
                      icon={compraDetalle.compra?.estado ? <CheckCircleIcon /> : <CancelIcon />}
                      sx={{ fontWeight: 600, ml: 2 }}
                    />
                  </Paper>
                </Grid>
                {/* Motivo de anulación */}
                {!compraDetalle.compra?.estado && compraDetalle.compra?.motivo_anulacion && (
                  <Grid item xs={12}>
                    <Paper elevation={0} sx={{ p: { xs: 1, sm: 2 }, backgroundColor: '#fff3cd', borderRadius: 2, border: '1px solid #ffeaa7' }}>
                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <CancelIcon color="warning" sx={{ fontSize: 24 }} />
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#856404' }}>Motivo de Anulación</Typography>
                      </Box>
                      <Typography variant="body1" sx={{ color: '#856404' }}>
                        {compraDetalle.compra.motivo_anulacion}
                      </Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>

              {/* Detalle de Productos */}
              {compraDetalle.detalle && compraDetalle.detalle.length > 0 && (
                <>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ShoppingCartIcon color="primary" sx={{ fontSize: 32 }} />
                    Productos de la Compra
                  </Typography>
                  <TableContainer component={Paper} sx={{ boxShadow: 2, mb: 2, maxHeight: 400, overflowX: { xs: 'auto', sm: 'visible' } }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell><b>#</b></TableCell>
                          <TableCell><b>Producto</b></TableCell>
                          <TableCell><b>Código</b></TableCell>
                          <TableCell align="center"><b>Cantidad</b></TableCell>
                          <TableCell align="right"><b>Precio Compra</b></TableCell>
                          <TableCell align="right"><b>Subtotal</b></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {compraDetalle.detalle.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell>{item.idproducto_producto?.nombre || 'N/A'}</TableCell>
                            <TableCell>{item.idproducto_producto?.codigoproducto || 'N/A'}</TableCell>
                            <TableCell align="center">{item.cantidad}</TableCell>
                            <TableCell align="right">{formatCurrency(item.preciodecompra)}</TableCell>
                            <TableCell align="right">{formatCurrency(item.subtotal)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <Box display="flex" justifyContent="flex-end">
                    <Paper elevation={0} sx={{ p: { xs: 1, sm: 2 }, backgroundColor: '#e3f2fd', borderRadius: 2, border: '1px solid #2196f3' }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        Total: {formatCurrency(compraDetalle.compra?.total)}
                      </Typography>
                    </Paper>
                  </Box>
                </>
              )}
            </>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ p: { xs: 1, sm: 2 }, backgroundColor: '#f8f9fa', borderTop: '1px solid #e0e0e0' }}>
          <Button onClick={() => setDetalleOpen(false)} variant="contained" color="primary">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Anulación */}
      <Dialog open={anularOpen} onClose={() => setAnularOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0', py: 2.5 }}>
          <CancelIcon color="error" sx={{ fontSize: 28 }} />
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>Anular Compra</Typography>
        </DialogTitle>
        <DialogContent dividers sx={{ p: { xs: 1, sm: 3 }, backgroundColor: '#fff' }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            ¿Está seguro que desea anular la compra <strong>#{compraAnular?.nrodecompra}</strong>?
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
        <DialogActions sx={{ p: { xs: 1, sm: 2 }, backgroundColor: '#f8f9fa', borderTop: '1px solid #e0e0e0' }}>
          <Button onClick={() => setAnularOpen(false)} color="secondary" variant="outlined">
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmarAnulacion} 
            color="error" 
            variant="contained" 
            disabled={anularLoading || motivoAnulacion.trim().length < 10 || motivoAnulacion.trim().length > 50}
          >
            {anularLoading ? <CircularProgress size={24} /> : 'Anular Compra'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- Modal Crear Compra --- */}
      <Dialog open={crearOpen} onClose={handleCrearClose} maxWidth="md" fullWidth
        PaperProps={{
          sx: {
            maxWidth: 1380,
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
          Registrar Nueva Compra
        </DialogTitle>
        <DialogContent sx={{ px: 4, py: 3 }}>
          <Grid container spacing={2}>
            {/* Columna Izquierda: Datos Generales y Proveedor */}
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Datos Generales</Typography>
                <TextField
                  label="Número de Compra"
                  name="nrodecompra"
                  value={crearForm.nrodecompra}
                  onChange={handleCrearChange}
                  fullWidth
                  required
                  margin="dense"
                  type="number"
                  size="small"
                  error={!!crearValidation.nrodecompra}
                  helperText={crearValidation.nrodecompra}
                />
                <TextField
                  label="Fecha de Compra"
                  name="fechadecompra"
                  value={crearForm.fechadecompra}
                  fullWidth
                  required
                  margin="dense"
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  error={!!crearValidation.fechadecompra}
                  helperText={crearValidation.fechadecompra}
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <InputAdornment position="end">
                        <CalendarTodayIcon color="action" style={{ cursor: 'pointer' }} onClick={() => setShowCalendar(v => !v)} />
                      </InputAdornment>
                    )
                  }}
                  onClick={() => setShowCalendar(true)}
                />
                {showCalendar && (
                  <div ref={calendarRef} style={{ position: 'absolute', zIndex: 9999, background: '#fff', border: '1px solid #ccc', borderRadius: 8, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Button size="small" onClick={() => {
                        const prevMonth = calendarMonth === 0 ? 11 : calendarMonth - 1;
                        const prevYear = calendarMonth === 0 ? calendarYear - 1 : calendarYear;
                        setCalendarMonth(prevMonth);
                        setCalendarYear(prevYear);
                      }} disabled={new Date(calendarYear, calendarMonth, 1) <= minDate}> {'<'} </Button>
                      <Typography variant="subtitle1">{new Date(calendarYear, calendarMonth).toLocaleString('es-ES', { month: 'long', year: 'numeric' })}</Typography>
                      <Button size="small" onClick={() => {
                        const nextMonth = calendarMonth === 11 ? 0 : calendarMonth + 1;
                        const nextYear = calendarMonth === 11 ? calendarYear + 1 : calendarYear;
                        setCalendarMonth(nextMonth);
                        setCalendarYear(nextYear);
                      }} disabled={new Date(calendarYear, calendarMonth + 1, 0) >= today}> {'>'} </Button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 32px)', gap: 2 }}>
                      {[...Array(7)].map((_, i) => (
                        <Typography key={i} align="center" variant="caption" sx={{ fontWeight: 700 }}>{['D','L','M','M','J','V','S'][i]}</Typography>
                      ))}
                      {(() => {
                        const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
                        const days = getDaysInMonth(calendarYear, calendarMonth);
                        const cells = [];
                        for (let i = 0; i < firstDay; i++) cells.push(<div key={'empty'+i}></div>);
                        for (let d = 1; d <= days; d++) {
                          const dateObj = new Date(calendarYear, calendarMonth, d);
                          const disabled = dateObj < minDate || dateObj > today;
                          cells.push(
                            <Button
                              key={d}
                              size="small"
                              variant={crearForm.fechadecompra === dateObj.toISOString().split('T')[0] ? 'contained' : 'text'}
                              color={disabled ? 'inherit' : 'primary'}
                              disabled={disabled}
                              onClick={() => handleSelectDate(d)}
                              sx={{ minWidth: 0, width: 32, height: 32, m: 0.2 }}
                            >
                              {d}
                            </Button>
                          );
                        }
                        return cells;
                      })()}
                    </div>
                  </div>
                )}
              </Paper>
              <Paper elevation={0} sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Proveedor</Typography>
                <Autocomplete
                  options={proveedoresActivos}
                  getOptionLabel={option => `${option.nombre} (${option.nitproveedor})`}
                  value={proveedoresActivos.find(p => p.nitproveedor === crearForm.nitproveedor) || null}
                  onChange={(_, value) => setCrearForm(prev => ({ ...prev, nitproveedor: value ? value.nitproveedor : null }))}
                  isOptionEqualToValue={(option, value) => option.nitproveedor === value.nitproveedor}
                  renderInput={params => (
                    <TextField
                      {...params}
                      label="Buscar Proveedor"
                      placeholder="Nombre o NIT"
                      fullWidth
                      margin="dense"
                      size="small"
                    />
                  )}
                  noOptionsText="No se encontró ningún proveedor"
                  sx={{ minWidth: 250 }}
                />
              </Paper>
            </Grid>
            {/* Columna Derecha: Productos */}
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
                        <TableCell align="right">Precio Unitario</TableCell>
                        <TableCell align="right">Subtotal</TableCell>
                        <TableCell align="center">{/* Eliminar */}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {crearForm.productos.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            <Box display="flex" flexDirection="column" alignItems="center" py={2}>
                              <AddShoppingCartIcon sx={{ fontSize: 48, color: '#bdbdbd', mb: 1 }} />
                              <Typography color="text.secondary">Aún no hay productos</Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ) : (
                        crearForm.productos.map(prod => {
                          const presentaciones = presentacionesPorProducto[prod.idproducto] || [];
                          const presentacion = presentaciones.find(p => p.idpresentacion === prod.idpresentacion);
                          const cantidadPresentaciones = Number(prod.cantidad) || 0;
                          const precioPresentacion = Number(prod.preciodecompra) || 0;
                          const subtotal = cantidadPresentaciones * precioPresentacion;
                          return (
                            <TableRow key={prod.idproducto + '-' + prod.idpresentacion}>
                              <TableCell>{prod.nombre}</TableCell>
                              <TableCell>
                                <FormControl fullWidth size="small">
                                  <Select
                                    value={prod.idpresentacion}
                                    onChange={e => handlePresentacionChange(prod.idproducto, prod.idpresentacion, Number(e.target.value))}
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
                                    handleProductoChange(prod.idproducto, prod.idpresentacion, 'cantidad', e.target.value === '' ? '' : Number(e.target.value));
                                  }}
                                  onBlur={e => {
                                    if (prod.cantidad === '' || prod.cantidad < 1) {
                                      handleProductoChange(prod.idproducto, prod.idpresentacion, 'cantidad', 1);
                                    }
                                  }}
                                  sx={{ width: '80px' }}
                                  inputProps={{ min: 1, style: { textAlign: 'center' } }}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell align="right">{formatCurrency(precioPresentacion)}</TableCell>
                              <TableCell align="right">{formatCurrency(subtotal)}</TableCell>
                              <TableCell align="center">
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
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Total: {formatCurrency(
                      crearForm.productos.reduce((acc, p) => {
                        const cantidadPresentaciones = Number(p.cantidad) || 0;
                        const precioPresentacion = Number(p.preciodecompra) || 0;
                        return acc + (cantidadPresentaciones * precioPresentacion);
                      }, 0)
                    )}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
          {/* Mostrar error de creación si existe */}
          {crearError && (
            <Alert severity="error" sx={{ mt: 3 }}>
              {crearError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 3, pt: 2 }}>
          <Button onClick={handleCrearClose} color="error" variant="text" sx={{ fontWeight: 700, fontSize: 16 }}>
            CANCELAR
          </Button>
          <Button onClick={handleCrearCompra} variant="contained" color="success" sx={{ fontWeight: 700, fontSize: 16 }} disabled={crearLoading}>
            {crearLoading ? <CircularProgress size={24} /> : 'GUARDAR COMPRA'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* --- Sub-Modal para Agregar Productos --- */}
      <Dialog open={productosModalOpen} onClose={() => setProductosModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ mb: 2 }}>Seleccionar Productos</DialogTitle>
        <DialogContent>
          <Buscador
            value={productosBusqueda}
            onChange={(e) => setProductosBusqueda(e.target.value)}
            placeholder="Buscar producto por nombre o código..."
            sx={{ width: '100%', minWidth: 250, mb: 2, mt: 2 }}
            onBlur={() => {
              const productosFiltrados = productosActivos.filter(p =>
                p.nombre.toLowerCase().includes(productosBusqueda.toLowerCase()) ||
                p.codigoproducto.toLowerCase().includes(productosBusqueda.toLowerCase())
              );
              if (productosBusqueda.trim() && productosFiltrados.length === 0 && !alertaNoProducto) {
                setAlertaNoProducto(true);
                Swal.fire({
                  icon: 'warning',
                  title: 'No se encontró ningún producto',
                  text: 'No se encontró ningún producto con ese código o nombre.',
                  timer: 1800,
                  showConfirmButton: false
                });
              }
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                const productosFiltrados = productosActivos.filter(p =>
                  p.nombre.toLowerCase().includes(productosBusqueda.toLowerCase()) ||
                  p.codigoproducto.toLowerCase().includes(productosBusqueda.toLowerCase())
                );
                if (productosBusqueda.trim() && productosFiltrados.length === 0 && !alertaNoProducto) {
                  setAlertaNoProducto(true);
                  Swal.fire({
                    icon: 'warning',
                    title: 'No se encontró ningún producto',
                    text: 'No se encontró ningún producto con ese código o nombre.',
                    timer: 1800,
                    showConfirmButton: false
                  });
                }
              }
            }}
          />
          <TableContainer component={Paper} sx={{ maxHeight: 400, overflowX: { xs: 'auto', sm: 'visible' } }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 200 }}>Producto</TableCell>
                  <TableCell>Código</TableCell>
                  <TableCell>Stock</TableCell>
                  <TableCell>Precio Compra Actual</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(() => {
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
                    <TableRow key={p.idproducto} hover onClick={() => handleSelectProducto(p)} selected={productoSeleccionado?.idproducto === p.idproducto}>
                      <TableCell sx={{ minWidth: 200 }}>{p.nombre}</TableCell>
                      <TableCell>{p.codigoproducto}</TableCell>
                      <TableCell>{p.stock}</TableCell>
                      <TableCell>{formatCurrency(p.preciocompra)}</TableCell>
                      <TableCell>
                        <Button variant="outlined" size="small" onClick={() => handleSelectProducto(p)}>Seleccionar</Button>
                      </TableCell>
                    </TableRow>
                  ));
                })()}
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
                    setCantidadPresentacion(val);
                  }}
                  onBlur={() => {
                    if (!cantidadPresentacion || cantidadPresentacion < 1) setCantidadPresentacion(1);
                  }}
                  sx={{ width: '100%' }}
                  inputProps={{ min: 1, style: { textAlign: 'center' } }}
                />
              </Box>
              <Box flex={1} minWidth={150}>
                <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                  Precio Compra
                </Typography>
                <TextField
                  label="Precio Compra"
                  type="number"
                  value={productoSeleccionado.preciocompra}
                  onChange={e => {
                    const value = e.target.value;
                    setProductoSeleccionado(prev => ({ ...prev, preciocompra: value === '' ? '' : Number(value) }));
                  }}
                  inputProps={{ min: 0, step: 'any', style: { textAlign: 'center', fontWeight: 700, color: '#388e3c' } }}
                  size="small"
                  sx={{ width: '100%' }}
                />
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
                      title: `${productoSeleccionado?.nombre || ''} (${presentacionSeleccionada?.nombre || ''}) agregado a la compra`,
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
                  Agregar a la compra
                </Button>
              </Box>
              {presentacionSeleccionada && productoSeleccionado && (
                <Box mt={2}>
                  <Typography variant="body2" color="text.secondary">
                    <b>Precio de la presentación:</b> COP $ {Number(productoSeleccionado.preciocompra).toLocaleString('es-CO')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <b>Factor de conversión:</b> {presentacionSeleccionada.factor_conversion}
                  </Typography>
                  <Typography variant="body2" color="primary.main">
                    <b>Precio por unidad:</b> COP $ {(
                      Number(productoSeleccionado.preciocompra) && Number(presentacionSeleccionada.factor_conversion)
                        ? Math.round(Number(productoSeleccionado.preciocompra) / Number(presentacionSeleccionada.factor_conversion))
                        : 0
                    ).toLocaleString('es-CO')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    El campo "Precio Compra Actual" en la lista de productos siempre muestra el precio por unidad, que es el que se usa para calcular el precio de venta y el margen de ganancia.
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

export default Compras;