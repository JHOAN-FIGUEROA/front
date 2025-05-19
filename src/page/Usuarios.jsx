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

const USUARIOS_POR_PAGINA = 5;
const CAMPOS_EDITABLES = [
  { name: 'nombre', label: 'Nombre' },
  { name: 'apellido', label: 'Apellido' },
  { name: 'email', label: 'Email' },
  { name: 'tipodocumento', label: 'Tipo de Documento', select: true, options: ['CC', 'CE', 'TI', 'NIT'] },
  { name: 'documento', label: 'Documento' },
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
  const [pagina, setPagina] = useState(1);
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
      try {
        const data = await getUsuarios();
        let lista = [];
        if (Array.isArray(data)) {
          lista = data;
        } else if (Array.isArray(data.usuarios)) {
          lista = data.usuarios;
        } else if (Array.isArray(data.data)) {
          lista = data.data;
        }
        setUsuarios(lista);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUsuarios();
  }, []);

  // Filtrado por búsqueda
  const usuariosFiltrados = usuarios.filter((usuario) => {
    const texto = `${usuario.nombre} ${usuario.apellido} ${usuario.email}`.toLowerCase();
    const busq = busqueda.trim().toLowerCase();
    let estadoBool = false;
    if (usuario.estado === true || usuario.estado === 'true' || usuario.estado === 1 || usuario.estado === '1') {
      estadoBool = true;
    }
    if (busq === 'activo') return estadoBool === true;
    if (busq === 'inactivo') return estadoBool === false;
    return texto.includes(busq);
  });

  // Paginación
  const totalPaginas = Math.ceil(usuariosFiltrados.length / USUARIOS_POR_PAGINA);
  const usuariosPagina = usuariosFiltrados.slice(
    (pagina - 1) * USUARIOS_POR_PAGINA,
    pagina * USUARIOS_POR_PAGINA
  );

  const handleChangePagina = (event, value) => {
    setPagina(value);
  };

  // Ver detalle de usuario
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

  // Editar usuario
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
      // Solo enviar los campos que cambiaron
      const dataToSend = {};
      CAMPOS_EDITABLES.forEach(({ name }) => {
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
      // Actualizar la tabla localmente
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
      <Box mb={2} height={4} display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          {loading && <CircularProgress size={28} />}
          {error && <Alert severity="error">{error}</Alert>}
        </Box>
        <Button
          variant="contained"
          color="success"
          onClick={() => setCrearOpen(true)}
          sx={{ minWidth: 140, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}
          startIcon={<AddIcon />}
        >
          Registrar
        </Button>
      </Box>
      <Stack direction="row" spacing={2} alignItems="center" mb={2}>
        <Buscador
          value={busqueda}
          onChange={e => { setBusqueda(e.target.value); setPagina(1); }}
          placeholder="Buscar usuario..."
        />
      </Stack>
      <TableContainer component={Paper} sx={{ maxWidth: 1000, margin: '0 auto', boxShadow: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><b>Nombre</b></TableCell>
              <TableCell><b>Email</b></TableCell>
              <TableCell align="center"><b>Estado</b></TableCell>
              <TableCell align="center"><b>Acciones</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {usuariosPagina.length > 0 ? (
              usuariosPagina.map((usuario, idx) => (
                <TableRow key={idx}>
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
            ) : (
              <TableRow>
                <TableCell colSpan={4} align="center">No hay usuarios registrados.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {totalPaginas > 1 && (
        <Stack direction="row" justifyContent="center" alignItems="center" mt={3}>
          <Pagination
            count={totalPaginas}
            page={pagina}
            onChange={handleChangePagina}
            color="primary"
            shape="rounded"
          />
        </Stack>
      )}

      {/* Modal de detalle de usuario */}
      <VerDetalle
        open={detalleOpen}
        onClose={handleCerrarDetalle}
        usuarioDetalle={usuarioDetalle}
        loading={detalleLoading}
        error={detalleError}
      />

      {/* Modal de edición de usuario */}
      <Editar
        open={editOpen}
        onClose={handleCerrarEdicion}
        usuario={editUsuario}
        loading={editLoading}
        error={editError}
        form={editForm}
        onFormChange={handleEditFormChange}
        onSave={handleGuardarEdicion}
        camposEditables={CAMPOS_EDITABLES}
        loadingSave={editLoading}
      />

      {/* Snackbar de éxito */}
      <Snackbar
        open={!!successMsg}
        autoHideDuration={3000}
        onClose={() => setSuccessMsg('')}
        message={successMsg}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      />

      {/* Diálogo de eliminar usuario */}
      <Eliminar
        id={usuarioEliminar?.idusuario}
        open={eliminarOpen}
        onClose={() => setEliminarOpen(false)}
        onEliminado={() => {
          setEliminarOpen(false);
          setUsuarios((prev) => prev.filter(u => u.idusuario !== usuarioEliminar?.idusuario));
        }}
        nombre={usuarioEliminar ? `${usuarioEliminar.nombre} ${usuarioEliminar.apellido}` : ''}
        tipoEntidad="usuario"
      />

      {/* Modal de crear usuario */}
      <Crear
        open={crearOpen}
        onClose={() => setCrearOpen(false)}
        onCreado={nuevoUsuario => {
          setCrearOpen(false);
          // Asegurarse de que el campo estado sea booleano
          const usuarioConEstado = {
            ...nuevoUsuario,
            estado: nuevoUsuario.estado === true || nuevoUsuario.estado === 'true' || nuevoUsuario.estado === 1 || nuevoUsuario.estado === '1',
          };
          setUsuarios(prev => [usuarioConEstado, ...prev]);
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