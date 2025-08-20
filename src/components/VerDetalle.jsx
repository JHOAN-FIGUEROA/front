import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Grid, CircularProgress, Alert, Typography, Paper, Chip } from '@mui/material';
import { useEffect, useState } from 'react';
import { getProveedorByNit } from '../api';
import SecurityIcon from '@mui/icons-material/Security';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BadgeIcon from '@mui/icons-material/Badge';
import GroupIcon from '@mui/icons-material/Group';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

const VerDetalle = ({ open, onClose, usuarioDetalle, loading, error, setProveedorDetalle, nitproveedor, roles = [] }) => {
  const esRol = usuarioDetalle && 'permisos_asociados' in usuarioDetalle;
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState('');

  // Función para obtener el nombre del rol basado en el ID del rol
  const getRoleName = (roleId) => {
    if (!roles || roles.length === 0) {
      const defaultRoles = {
        1: 'Administrador',
        2: 'Vendedor',
        3: 'Comprador',
        4: 'Cliente'
      };
      return defaultRoles[roleId] || 'Usuario';
    }
    
    const role = roles.find(r => r.idrol === roleId);
    return role ? role.nombre : 'Usuario';
  };

  useEffect(() => {
    const fetchProveedor = async () => {
      if (nitproveedor) {
        setLoadingDetalle(true);
        setErrorDetalle('');
        try {
          const data = await getProveedorByNit(nitproveedor);
          setProveedorDetalle(data);
        } catch (err) {
          setErrorDetalle(err.message || 'Error al obtener los detalles del proveedor');
          console.error('Error al obtener el proveedor:', err);
        } finally {
          setLoadingDetalle(false);
        }
      }
    };

    if (open && nitproveedor) {
      fetchProveedor();
    }
  }, [open, nitproveedor, setProveedorDetalle]);

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0', py: 2.5 }}>
          <PersonIcon color="primary" sx={{ fontSize: 28 }} />
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
            Cargando Información del Usuario
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 0, backgroundColor: '#f8f9fa', minHeight: 200 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress size={40} />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0', py: 2.5 }}>
        <PersonIcon color="primary" sx={{ fontSize: 28 }} />
        <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
          Información del Usuario
        </Typography>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0, backgroundColor: '#f8f9fa', maxHeight: { xs: '80vh', sm: '70vh' }, overflowY: 'auto' }}>
        <Paper elevation={4} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 4, backgroundColor: '#fff', m: { xs: 1, sm: 3 }, boxShadow: '0 8px 32px rgba(0,0,0,0.10)' }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {usuarioDetalle && (
            <Grid container spacing={3}>
              {/* Información Personal */}
              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <PersonIcon color="primary" sx={{ fontSize: 24 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: 18 }}>Información Personal</Typography>
                </Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Nombre Completo</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {usuarioDetalle.nombre} {usuarioDetalle.apellido}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>Estado</Typography>
                <Chip
                  icon={usuarioDetalle.estado ? <CheckCircleIcon /> : <CancelIcon />}
                  label={usuarioDetalle.estado ? 'Activo' : 'Inactivo'}
                  color={usuarioDetalle.estado ? 'success' : 'error'}
                  size="medium"
                  sx={{ mt: 0.5, fontWeight: 600, fontSize: 16, px: 2, py: 1 }}
                />
              </Grid>
              {/* Contacto */}
              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <EmailIcon color="primary" sx={{ fontSize: 24 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: 18 }}>Contacto</Typography>
                </Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Email</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {usuarioDetalle.email}
                </Typography>
              </Grid>
              {/* Identificación */}
              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <BadgeIcon color="primary" sx={{ fontSize: 24 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: 18 }}>Identificación</Typography>
                </Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Tipo de Documento</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{usuarioDetalle.tipodocumento}</Typography>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>Número de Documento</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{usuarioDetalle.documento}</Typography>
              </Grid>
              {/* Rol del Usuario */}
              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <AdminPanelSettingsIcon color="primary" sx={{ fontSize: 24 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: 18 }}>Rol del Usuario</Typography>
                </Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Rol Asignado</Typography>
                <Chip
                  icon={<GroupIcon />}
                  label={getRoleName(usuarioDetalle.rol_idrol)}
                  color="primary"
                  size="medium"
                  sx={{ mt: 0.5, fontWeight: 600, fontSize: 16, px: 2, py: 1 }}
                />
              </Grid>
              {/* Ubicación */}
              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <LocationOnIcon color="primary" sx={{ fontSize: 24 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: 18 }}>Ubicación</Typography>
                </Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Municipio</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{usuarioDetalle.municipio || 'No especificado'}</Typography>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Barrio</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{usuarioDetalle.barrio || 'No especificado'}</Typography>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Dirección Completa</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{usuarioDetalle.dirrecion} {usuarioDetalle.complemento || ''}</Typography>
              </Grid>
            </Grid>
          )}
        </Paper>
      </DialogContent>
      <DialogActions sx={{ p: 2.5, backgroundColor: '#f8f9fa', borderTop: '1px solid #e0e0e0' }}>
        <Button onClick={onClose} variant="contained" color="primary" sx={{ borderRadius: 2, textTransform: 'none', px: 3, py: 1, fontWeight: 600, boxShadow: 'none', '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' } }}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VerDetalle;