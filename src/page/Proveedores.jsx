import { useEffect, useState, useCallback } from 'react';
import {
  Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert, Button, Snackbar, Pagination, TextField, IconButton, Stack
} from '@mui/material';
import { getProveedores } from '../api';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Buscador from '../components/Buscador';

const PROVEEDORES_POR_PAGINA = 5;

const Proveedores = () => {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagina, setPagina] = useState(1);
  const [totalPaginasAPI, setTotalPaginasAPI] = useState(1);
  const [successMsg, setSuccessMsg] = useState('');
  const [busqueda, setBusqueda] = useState('');

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
          onClick={() => { /* Lógica para abrir el modal de crear proveedor */ }}
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
                    <IconButton color="info" size="small" onClick={() => { /* Lógica para ver detalle */ }} title="Ver Detalle">
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                    <IconButton color="warning" size="small" onClick={() => { /* Lógica para editar */ }} title="Editar">
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton color="error" size="small" onClick={() => { /* Lógica para eliminar */ }} title="Eliminar">
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
    </Box>
  );
};

export default Proveedores;
