import { useEffect, useState, useCallback } from 'react';
import {
  Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert, Button, Snackbar, Pagination, Stack, IconButton
} from '@mui/material';
import { getClientes, updateEstadoCliente, deleteCliente, getClienteById, createCliente } from '../api';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Buscador from '../components/Buscador';
import VerDetalle from '../components/VerDetalle';
import Editar from '../components/Editar';
import Eliminar from '../components/Eliminar';
import CambiarEstado from '../components/CambiarEstado';
import Crear from '../components/Crear';

const CLIENTES_POR_PAGINA = 5;

const CAMPOS_EDITABLES = [
  { name: 'tipodocumento', label: 'Tipo Documento', select: true, options: ['CC', 'CE', 'NIT'], required: true },
  { name: 'documentocliente', label: 'Número de Documento', required: true },
  { name: 'nombre', label: 'Nombre', required: true },
  { name: 'apellido', label: 'Apellido', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'telefono', label: 'Teléfono', required: true },
  { name: 'municipio', label: 'Municipio', required: true },
  { name: 'barrio', label: 'Barrio', required: true },
  { name: 'direccion', label: 'Dirección', required: true },
  { name: 'complemento', label: 'Complemento', required: false }
];

const CAMPOS_CREAR = [
  { name: 'tipodocumento', label: 'Tipo Documento', select: true, options: ['CC', 'CE', 'NIT'], required: true },
  { name: 'documentocliente', label: 'Número de Documento', required: true },
  { name: 'nombre', label: 'Nombre', required: true },
  { name: 'apellido', label: 'Apellido', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'password', label: 'Contraseña', type: 'password', required: true },
  { name: 'telefono', label: 'Teléfono', required: true },
  { name: 'municipio', label: 'Municipio', required: true },
  { name: 'barrio', label: 'Barrio', required: true },
  { name: 'direccion', label: 'Dirección', required: true },
  { name: 'complemento', label: 'Complemento', required: false },
];

const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagina, setPagina] = useState(1);
  const [totalPaginasAPI, setTotalPaginasAPI] = useState(1);
  const [successMsg, setSuccessMsg] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [editarOpen, setEditarOpen] = useState(false);
  const [eliminarOpen, setEliminarOpen] = useState(false);
  const [clienteDetalle, setClienteDetalle] = useState(null);
  const [formData, setFormData] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [loadingSave, setLoadingSave] = useState(false);
  const [crearOpen, setCrearOpen] = useState(false);
  const [crearErrorInterno, setCrearErrorInterno] = useState('');

  const fetchClientes = useCallback(async (currentPage) => {
    setLoading(true);
    setError('');
    try {
      const result = await getClientes(currentPage, CLIENTES_POR_PAGINA);
      if (result.error) {
        setError(result.detalles || 'Error al cargar clientes.');
        setClientes([]);
        setTotalPaginasAPI(1);
      } else if (result.success && result.data) {
        // Convertir documentocliente a string después de recibir los datos
        const clientesConStringDocumento = (result.data.clientes || []).map(cliente => {
          return ({
            ...cliente,
            documentocliente: String(cliente.documentocliente) // Aseguramos que sea string
          });
        });
        setClientes(clientesConStringDocumento);
        setTotalPaginasAPI(result.data.paginacion?.totalPaginas || 1);
      } else {
        setClientes([]);
        setTotalPaginasAPI(1);
      }
    } catch (err) {
      setError('Error inesperado al cargar clientes: ' + (err.message || ''));
      setClientes([]);
      setTotalPaginasAPI(1);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClientes(pagina);
  }, [pagina]);

  const handleChangePagina = (event, value) => {
    setPagina(value);
  };

  const handleSearchChange = (e) => {
    const newSearchTerm = String(e.target.value || '');
    setBusqueda(newSearchTerm);
    setPagina(1);
  };

  const handleVerDetalle = async (id) => {
    try {
      const data = await getClienteById(id);
      setClienteDetalle(data);
      setDetalleOpen(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditar = async (id) => {
    try {
      const data = await getClienteById(id);
      setClienteSeleccionado(data);
      setFormData(data);
      setEditarOpen(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEliminar = (id) => {
    setClienteSeleccionado(id);
    setEliminarOpen(true);
  };

  const handleEstadoChange = async (id, nuevoEstado, errorMsg) => {
    if (errorMsg) {
      setError(errorMsg);
      return;
    }

    try {
      await updateEstadoCliente(id, nuevoEstado);
      setSuccessMsg('Estado actualizado exitosamente');
      // Actualizar el estado local
      setClientes(prevClientes => 
        prevClientes.map(cliente => 
          cliente.documentocliente === id ? { ...cliente, estado: nuevoEstado } : cliente
        )
      );
    } catch (err) {
      setError(err.message || 'Error al cambiar el estado del cliente');
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error de validación si existe
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSave = async () => {
    setLoadingSave(true);
    try {
      // Aquí iría la lógica para guardar los cambios
      setSuccessMsg('Cliente actualizado exitosamente');
      setEditarOpen(false);
      fetchClientes(pagina);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingSave(false);
    }
  };

  const handleClienteCreadoExitosamente = (nuevoCliente) => {
    setCrearOpen(false);
    setSuccessMsg('Cliente registrado correctamente');
    fetchClientes(pagina);
  };

  const handleCrearError = (errorMessage) => {
    setCrearErrorInterno(errorMessage);
    setError(errorMessage);
  };

  // Filtrar clientes localmente basado en el término de búsqueda
  const clientesFiltrados = clientes.filter(cliente => {
    if (!busqueda) {
      return true; // Mostrar todos si no hay búsqueda
    }
    const terminoBusquedaLower = busqueda.toLowerCase().trim();

    // Filtrar por estado si el término es "activo" o "inactivo"
    if (terminoBusquedaLower === "activo") {
      return cliente.estado === true; // Asumiendo que estado es booleano true para activo
    }
    if (terminoBusquedaLower === "inactivo") {
      return cliente.estado === false; // Asumiendo que estado es booleano false para inactivo
    }

    // Lógica de filtrado por texto en otros campos
    return (
      cliente.nombre?.toLowerCase().includes(terminoBusquedaLower) ||
      cliente.apellido?.toLowerCase().includes(terminoBusquedaLower) ||
      cliente.email?.toLowerCase().includes(terminoBusquedaLower) ||
      cliente.documentocliente?.toLowerCase().includes(terminoBusquedaLower) ||
      cliente.municipio?.toLowerCase().includes(terminoBusquedaLower) ||
      cliente.barrio?.toLowerCase().includes(terminoBusquedaLower) ||
      cliente.direccion?.toLowerCase().includes(terminoBusquedaLower)
    );
  });

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>Clientes Registrados</Typography>
      <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" mb={2} gap={2}>
        <Box sx={{ flexGrow: 1, width: { xs: '100%', sm: 350 } }}>
          <Buscador
            value={busqueda}
            onChange={handleSearchChange}
            placeholder="Buscar Cliente (Nombre, Documento, Activo...)"
          />
        </Box>
        <Button
          variant="contained"
          color="success"
          onClick={() => {
            setCrearErrorInterno('');
            setCrearOpen(true);
          }}
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
              <TableCell><b>Nombre</b></TableCell>
              <TableCell><b>Documento</b></TableCell>
              <TableCell><b>Email</b></TableCell>
              <TableCell><b>Teléfono</b></TableCell>
              <TableCell><b>Estado</b></TableCell>
              <TableCell align="center"><b>Acciones</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading && clientesFiltrados.length === 0 && !error && (
              <TableRow>
                <TableCell colSpan={7} align="center">No hay clientes registrados.</TableCell>
              </TableRow>
            )}
            {clientesFiltrados.map((cliente, idx) => {
              return (
                <TableRow key={idx}>
                  <TableCell>{(pagina - 1) * CLIENTES_POR_PAGINA + idx + 1}</TableCell>
                  <TableCell>{cliente.nombre} {cliente.apellido}</TableCell>
                  <TableCell>{cliente.tipodocumento} {cliente.documentocliente}</TableCell>
                  <TableCell>{cliente.email}</TableCell>
                  <TableCell>{cliente.telefono}</TableCell>
                  <TableCell>
                    <CambiarEstado
                      id={cliente.documentocliente}
                      estadoActual={Boolean(cliente.estado)}
                      onEstadoCambiado={handleEstadoChange}
                      updateEstadoApi={updateEstadoCliente}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      <IconButton 
                        color="info" 
                        size="small" 
                        onClick={() => handleVerDetalle(cliente.documentocliente)}
                        title="Ver Detalle"
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        color="warning" 
                        size="small" 
                        onClick={() => handleEditar(cliente.documentocliente)}
                        title="Editar"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        color="error" 
                        size="small" 
                        onClick={() => handleEliminar(cliente.documentocliente)}
                        title="Eliminar"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
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
        usuarioDetalle={clienteDetalle}
        loading={loading}
        error={error}
      />

      <Editar
        open={editarOpen}
        onClose={() => setEditarOpen(false)}
        usuario={clienteSeleccionado}
        loading={loading}
        apiError={error}
        validationErrors={validationErrors}
        form={formData}
        onFormChange={handleFormChange}
        onSave={handleSave}
        camposEditables={CAMPOS_EDITABLES}
        loadingSave={loadingSave}
        setApiError={setError}
      />

      <Eliminar
        id={clienteSeleccionado}
        open={eliminarOpen}
        onClose={() => setEliminarOpen(false)}
        onEliminado={() => {
          setSuccessMsg('Cliente eliminado exitosamente');
          fetchClientes(pagina);
        }}
        deleteApi={deleteCliente}
        tipoEntidad="cliente"
      />

      <Crear
        open={crearOpen}
        onClose={() => setCrearOpen(false)}
        onCreado={handleClienteCreadoExitosamente}
        campos={CAMPOS_CREAR}
        titulo="Registrar Cliente"
        onError={handleCrearError}
        tipo="cliente"
      />
    </Box>
  );
};

export default Clientes;
