import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Grid, CircularProgress, Alert, Typography, List, ListItem, ListItemText, Divider, Paper, Chip } from '@mui/material';
import { useEffect } from 'react';
import { getProveedorByNit } from '../api'; // Asegúrate de importar la función
import SecurityIcon from '@mui/icons-material/Security';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

const VerDetalle = ({ open, onClose, usuarioDetalle, loading, error, setProveedorDetalle, nitproveedor }) => {
  const esRol = usuarioDetalle && 'permisos_asociados' in usuarioDetalle;

  useEffect(() => {
    const fetchProveedor = async () => {
      if (nitproveedor) {
        try {
          const data = await getProveedorByNit(nitproveedor);
          setProveedorDetalle(data);
        } catch (err) {
          console.error(err);
          // Manejo de errores si es necesario
        }
      }
    };

    fetchProveedor();
  }, [nitproveedor]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        backgroundColor: '#f5f5f5',
        borderBottom: '1px solid #e0e0e0'
      }}>
        <SecurityIcon color="primary" />
        {esRol ? 'Detalle de Rol' : 'Detalle de Usuario'}
      </DialogTitle>
      <DialogContent dividers>
        {loading && <Box display="flex" justifyContent="center" my={4}><CircularProgress /></Box>}
        {error && <Alert severity="error">{error}</Alert>}
        {usuarioDetalle && !loading && !error && (
          <Box mt={2}> {/* Contenedor principal con margen superior */}
            {/* --- Layout para Detalle de Rol --- */}
            {esRol && (
              <>
                <Paper elevation={0} sx={{ p: 3, mb: 3, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <InfoIcon color="primary" />
                        <Typography variant="h6">Información General</Typography>
                      </Box>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" color="text.secondary">ID del Rol</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>{usuarioDetalle.idrol}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" color="text.secondary">Nombre del Rol</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>{usuarioDetalle.nombre}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" color="text.secondary">Estado</Typography>
                          <Chip
                            icon={usuarioDetalle.estado ? <CheckCircleIcon /> : <CancelIcon />}
                            label={usuarioDetalle.estado ? 'Activo' : 'Inactivo'}
                            color={usuarioDetalle.estado ? 'success' : 'error'}
                            size="small"
                            sx={{ mt: 0.5 }}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" color="text.secondary">Descripción</Typography>
                          <Typography variant="body1" sx={{ 
                            fontWeight: 'medium',
                            backgroundColor: '#fff',
                            p: 1.5,
                            borderRadius: 1,
                            border: '1px solid #e0e0e0'
                          }}>
                            {usuarioDetalle.descripcion || 'Sin descripción'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>
                </Paper>

                <Paper elevation={0} sx={{ p: 3, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <SecurityIcon color="primary" />
                    <Typography variant="h6">Permisos Asociados</Typography>
                  </Box>
                  {usuarioDetalle.permisos_asociados && usuarioDetalle.permisos_asociados.length > 0 ? (
                    <Grid container spacing={2}>
                      {usuarioDetalle.permisos_asociados.map((permiso, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                          <Paper 
                            elevation={0} 
                            sx={{ 
                              p: 2, 
                              backgroundColor: '#fff',
                              border: '1px solid #e0e0e0',
                              borderRadius: 1,
                              height: '100%'
                            }}
                          >
                            <Typography variant="subtitle1" sx={{ fontWeight: 'medium', mb: 1 }}>
                              {permiso.permiso.nombre}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {permiso.permiso.descripcion || 'Sin descripción'}
                            </Typography>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ 
                      backgroundColor: '#fff',
                      p: 2,
                      borderRadius: 1,
                      border: '1px solid #e0e0e0'
                    }}>
                      No hay permisos asociados.
                    </Typography>
                  )}
                </Paper>
              </>
            )}

            {/* --- Layout para Detalle de Usuario --- */}
            {!esRol && (
              <Grid container spacing={3}> {/* Contenedor principal para el layout del usuario */}
                {/* Información General del Usuario */}
                <Grid item xs={12}>
                   <Typography variant="h6" gutterBottom>Información General</Typography>
                   <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}> {/* Nombre Completo */}
                          <Typography variant="body1"><b>Nombre:</b> {usuarioDetalle.nombre} {usuarioDetalle.apellido}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}> {/* Estado */}
                         <Typography variant="body1"><b>Estado:</b> {usuarioDetalle.estado === true || usuarioDetalle.estado === 'true' || usuarioDetalle.estado === 1 || usuarioDetalle.estado === '1' ? 'Activo' : 'Inactivo'}</Typography>
                      </Grid>
                   </Grid>
                </Grid>

                 {/* Contacto */}
                 <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                   <Typography variant="h6" gutterBottom>Contacto</Typography>
                   <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}> {/* Email */}
                         <Typography variant="body1"><b>Email:</b> {usuarioDetalle.email}</Typography>
                      </Grid>
                   </Grid>
                 </Grid>

                 {/* Identificación */}
                 <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                   <Typography variant="h6" gutterBottom>Identificación</Typography>
                   <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}> {/* Tipo Documento */}
                         <Typography variant="body1"><b>Tipo Documento:</b> {usuarioDetalle.tipodocumento}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}> {/* Documento */}
                         <Typography variant="body1"><b>Documento:</b> {usuarioDetalle.documento}</Typography>
                      </Grid>
                   </Grid>
                 </Grid>

                 {/* Ubicación */}
                  <Grid item xs={12}>
                     <Divider sx={{ my: 1 }} />
                    <Typography variant="h6" gutterBottom>Ubicación</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}> {/* Municipio */}
                         <Typography variant="body1"><b>Municipio:</b> {usuarioDetalle.municipio}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}> {/* Barrio */}
                         <Typography variant="body1"><b>Barrio:</b> {usuarioDetalle.barrio}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={12}> {/* Dirección Completa */}
                         <Typography variant="body1"><b>Dirección:</b> {usuarioDetalle.dirrecion} {usuarioDetalle.complemento}</Typography>
                      </Grid>
                    </Grid>
                   </Grid>
              </Grid>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, backgroundColor: '#f5f5f5', borderTop: '1px solid #e0e0e0' }}>
        <Button 
          onClick={onClose} 
          variant="contained" 
          color="primary"
          sx={{ 
            borderRadius: 2,
            textTransform: 'none',
            px: 3
          }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VerDetalle;