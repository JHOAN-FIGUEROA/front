import { useEffect, useState } from 'react';
import {
  Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert, IconButton, Stack, Pagination, Switch, Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, TextField, Snackbar, MenuItem
} from '@mui/material';
import { getUsuarios, getUsuarioById, updateUsuario } from '../api';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Buscador from '../components/Buscador';
import VerDetalle from '../components/VerDetalle';
import Editar from '../components/Editar';
import CambiarEstado from '../components/CambiarEstado';
import Eliminar from '../components/Eliminar';
import Crear from '../components/Crear';
import AddIcon from '@mui/icons-material/Add';
import { useSearchParams } from 'react-router-dom';

const USUARIOS_POR_PAGINA = 5;
const CAMPOS_EDITABLES = [
  { name: 'tipodocumento', label: 'Tipo de Documento', select: true, options: ['CC', 'CE', 'TI', 'NIT'] },
  { name: 'documento', label: 'Documento' },
  { name: 'nombre', label: 'Nombre' },
  { name: 'apellido', label: 'Apellido' },
  { name: 'email', label: 'Email' },
  { name: 'municipio', label: 'Municipio' },
  { name: 'barrio', label: 'Barrio' },
  { name: 'dirrecion', label: 'Dirección' },
  { name: 'complemento', label: 'Complemento' },
];

const CAMPOS_CREAR = [
  { name: 'tipodocumento', label: 'Tipo de Documento', select: true, options: ['CC', 'CE', 'TI', 'NIT'] },
  { name: 'documento', label: 'Documento' },
  { name: 'nombre', label: 'Nombre' },
  { name: 'apellido', label: 'Apellido' },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'password', label: 'Contraseña', type: 'password' },
  { name: 'municipio', label: 'Municipio' },
  { name: 'complemento', label: 'Complemento', required: false },
  { name: 'barrio', label: 'Barrio' },
  { name: 'dirrecion', label: 'Dirección' },
  { name: 'rol_idrol', label: 'Rol', type: 'number' },
];

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const [searchParams, setSearchParams] = useSearchParams();

  const initialPage = parseInt(searchParams.get('page')) || 1;
  const [pagina, setPagina] = useState(initialPage);

  const [totalPaginasAPI, setTotalPaginasAPI] = useState(1);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [usuarioDetalle, setUsuarioDetalle] = useState(null);
  const [detalleLoading, setDetalleLoading] = useState(false);
  const [detalleError, setDetalleError] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editUsuario, setEditUsuario] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [eliminarOpen, setEliminarOpen] = useState(false);
  const [usuarioEliminar, setUsuarioEliminar] = useState(null);
  const [crearOpen, setCrearOpen] = useState(false);
  const [crearSuccess, setCrearSuccess] = useState(false);

  useEffect(() => {
    const fetchUsuarios = async () => {
      setLoading(true);
      setError('');
      try {
        const result = await getUsuarios(pagina, USUARIOS_POR_PAGINA, busqueda);

        if (result.error) {
          let errorMessage = result.detalles || 'Error al cargar usuarios.';
          let errorTitle = 'Error de Carga';

          if (result.status) {
            switch (result.status) {
              case 404:
                errorMessage = 'No se encontraron usuarios.';
                errorTitle = 'No Encontrado';
                break;
              default:
                errorTitle = `Error ${result.status}`;
            }
          }
          setError(errorMessage);
          setUsuarios([]);
          setTotalPaginasAPI(1);
        } else if (result.success && result.data) {
          setUsuarios(result.data.usuarios || []);
          setTotalPaginasAPI(result.data.paginacion?.totalPaginas || 1);
        }
      } catch (err) {
        setError('Error inesperado al cargar usuarios.' + err.message);
        setUsuarios([]);
        setTotalPaginasAPI(1);
      } finally {
        setLoading(false);
      }
    };
    fetchUsuarios();
  }, [pagina, busqueda]);

  useEffect(() => {
    const pageFromUrl = parseInt(searchParams.get('page')) || 1;
    if (pageFromUrl !== pagina) {
      setPagina(pageFromUrl);
    }
  }, [searchParams]);

  const usuariosPagina = usuarios;

  const handleChangePagina = (event, value) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('page', value.toString());
    setSearchParams(newSearchParams);
  };

  const handleSearchChange = (e) => {
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
  };

  const handleVerDetalle = async (id) => {
    setDetalleOpen(true);
    setUsuarioDetalle(null);
    setDetalleLoading(true);
    setDetalleError('');
    try {
      const data = await getUsuarioById(id);
      setUsuarioDetalle(data);
    } catch (err) {
      setDetalleError(err.message);
    } finally {
      setDetalleLoading(false);
    }
  };

  const handleCerrarDetalle = () => {
    setDetalleOpen(false);
    setUsuarioDetalle(null);
    setDetalleError('');
  };

  const handleEditarUsuario = async (id) => {
    setEditOpen(true);
    setEditUsuario(null);
    setEditForm({});
    setEditLoading(true);
    setEditError('');
    try {
      const data = await getUsuarioById(id);
      setEditUsuario(data);
      setEditForm({ ...data });
    } catch (err) {
      setEditError(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleGuardarEdicion = async () => {
    if (!editUsuario) return;
    setEditLoading(true);
    setEditError('');
    try {
      const dataToSend = {};
      CAMPOS_EDITABLES.forEach(({ name }) => {
        if (name === 'password' && editForm[name] === editUsuario[name]) {
          return;
        }
        if (editForm[name] !== editUsuario[name]) {
          dataToSend[name] = editForm[name];
        }
      });
      if (Object.keys(dataToSend).length === 0) {
        setEditError('No hay cambios para guardar.');
        setEditLoading(false);
        return;
      }
      await updateUsuario(editUsuario.idusuario, dataToSend);
      setSuccessMsg('Usuario actualizado correctamente');
      setUsuarios((prev) => prev.map(u => u.idusuario === editUsuario.idusuario ? { ...u, ...dataToSend } : u));
      setEditOpen(false);
    } catch (err) {
      setEditError(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  const handleCerrarEdicion = () => {
    setEditOpen(false);
    setEditUsuario(null);
    setEditForm({});
    setEditError('');
  };

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>Usuarios Registrados</Typography>
      <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" mb={2} gap={2}>
        <Box sx={{ flexGrow: 1 }}>
          <Buscador
            value={busqueda}
            onChange={handleSearchChange}
            placeholder="Buscar usuario..."
          />
        </Box>
        <Button
          variant="contained"
          color="success"
          onClick={() => setCrearOpen(true)}
          sx={{ minWidth: 140, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}
          startIcon={<AddIcon />}
        >
          Registrar
        </Button>
      </Box>
      <Box mb={2} height={4}>
        {loading && <CircularProgress size={28} />}
        {error && <Alert severity="error">{error}</Alert>}
      </Box>
      <TableContainer component={Paper} sx={{ margin: '0 auto', boxShadow: 2, overflowX: 'auto' }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell><b>Nombre</b></TableCell>
              <TableCell><b>Email</b></TableCell>
              <TableCell align="center"><b>Estado</b></TableCell>
              <TableCell align="center"><b>Acciones</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} align="center"><CircularProgress size={24} /></TableCell></TableRow>
            ) : usuariosPagina.length > 0 ? (
              usuariosPagina.map((usuario, idx) => (
                <TableRow key={usuario.idusuario || idx}>
                  <TableCell>{usuario.nombre} {usuario.apellido}</TableCell>
                  <TableCell>{usuario.email}</TableCell>
                  <TableCell align="center">
                    <CambiarEstado
                      id={usuario.idusuario}
                      estadoActual={usuario.estado === true || usuario.estado === 'true' || usuario.estado === 1 || usuario.estado === '1'}
                      onEstadoCambiado={(nuevoEstado) => {
                        setUsuarios((prev) => prev.map(u => u.idusuario === usuario.idusuario ? { ...u, estado: nuevoEstado } : u));
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton color="info" size="small" onClick={() => handleVerDetalle(usuario.idusuario)}><VisibilityIcon /></IconButton>
                    <IconButton color="warning" size="small" onClick={() => handleEditarUsuario(usuario.idusuario)}><EditIcon /></IconButton>
                    <IconButton color="error" size="small" onClick={() => { setUsuarioEliminar(usuario); setEliminarOpen(true); }}><DeleteIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (error ? null : (
              <TableRow>
                <TableCell colSpan={4} align="center">No se encontraron usuarios.</TableCell>
              </TableRow>
            ))
            }
          </TableBody>
        </Table>
      </TableContainer>

      {!loading && totalPaginasAPI > 1 && (
         <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
               count={totalPaginasAPI}
               page={pagina}
               onChange={handleChangePagina}
               color="primary"
            />
         </Box>
      )}

      <VerDetalle
        open={detalleOpen}
        onClose={handleCerrarDetalle}
        usuarioDetalle={usuarioDetalle}
        loading={detalleLoading}
        error={detalleError}
      />

      <Editar
        open={editOpen}
        onClose={handleCerrarEdicion}
        usuario={editUsuario}
        form={editForm}
        onFormChange={handleEditFormChange}
        onSave={handleGuardarEdicion}
        loading={editLoading}
        error={editError}
        camposEditables={CAMPOS_EDITABLES}
      />

      <Snackbar
        open={!!successMsg}
        autoHideDuration={3000}
        onClose={() => setSuccessMsg('')}
        message={successMsg}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      />

      <Eliminar
        id={usuarioEliminar?.idusuario}
        open={eliminarOpen}
        onClose={() => setEliminarOpen(false)}
        onEliminado={() => {
          setEliminarOpen(false);
          const fetchUsuariosAfterDelete = async () => {
             setLoading(true);
             setError('');
             try {
               let currentPage = pagina;
               let result = await getUsuarios(currentPage, USUARIOS_POR_PAGINA, busqueda);

               if (result.success && result.data && result.data.usuarios.length === 0 && currentPage > 1) {
                  currentPage = currentPage - 1;
                  const newSearchParams = new URLSearchParams(searchParams);
                  newSearchParams.set('page', currentPage.toString());
                  setSearchParams(newSearchParams);
                  result = await getUsuarios(currentPage, USUARIOS_POR_PAGINA, busqueda);
               }

               if (result.error) {
                 let errorMessage = result.detalles || 'Error al recargar usuarios después de eliminar.';
                 let errorTitle = 'Error de Carga';
                 if (result.status) {
                    errorTitle = `Error ${result.status}`;
                 }
                 setError(errorMessage);
                 setUsuarios([]);
                 setTotalPaginasAPI(1);
               } else if (result.success && result.data) {
                 setUsuarios(result.data.usuarios || []);
                 setTotalPaginasAPI(result.data.paginacion?.totalPaginas || 1);
               }
             } catch (err) {
               setError('Error inesperado al recargar usuarios después de eliminar.' + err.message);
               setUsuarios([]);
               setTotalPaginasAPI(1);
             } finally {
               setLoading(false);
             }
          };
          fetchUsuariosAfterDelete();
        }}
        nombre={usuarioEliminar ? `${usuarioEliminar.nombre} ${usuarioEliminar.apellido}` : ''}
        tipoEntidad="usuario"
      />

      <Crear
        open={crearOpen}
        onClose={() => setCrearOpen(false)}
        onCreado={nuevoUsuario => {
          setCrearOpen(false);
          const usuarioConEstado = {
            ...nuevoUsuario,
            estado: nuevoUsuario.estado === true || nuevoUsuario.estado === 'true' || nuevoUsuario.estado === 1 || nuevoUsuario.estado === '1',
          };
          const fetchUsuariosAfterCreate = async () => {
             setLoading(true);
             setError('');
             try {
               const result = await getUsuarios(1, USUARIOS_POR_PAGINA, busqueda);

               if (result.error) {
                 let errorMessage = result.detalles || 'Error al recargar usuarios después de crear.';
                 let errorTitle = 'Error de Carga';
                 if (result.status) {
                    errorTitle = `Error ${result.status}`;
                 }
                 setError(errorMessage);
                 setUsuarios([]);
                 setTotalPaginasAPI(1);
               } else if (result.success && result.data) {
                 setUsuarios(result.data.usuarios || []);
                 setTotalPaginasAPI(result.data.paginacion?.totalPaginas || 1);
                 setPagina(1);
                 const newSearchParams = new URLSearchParams(searchParams);
                 newSearchParams.set('page', '1');
                 setSearchParams(newSearchParams);
               }
             } catch (err) {
               setError('Error inesperado al recargar usuarios después de crear.' + err.message);
               setUsuarios([]);
               setTotalPaginasAPI(1);
             } finally {
               setLoading(false);
             }
          };
          fetchUsuariosAfterCreate();
          setCrearSuccess(true);
        }}
        campos={CAMPOS_CREAR}
        titulo="Registrar Usuario"
      />
      <Snackbar open={crearSuccess} autoHideDuration={2000} onClose={() => setCrearSuccess(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity="success" onClose={() => setCrearSuccess(false)}>
          Usuario creado correctamente
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Usuarios; 