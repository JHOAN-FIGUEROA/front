import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Grid, CircularProgress, Alert, Typography, List, ListItem, ListItemText, Divider, Paper, Chip } from '@mui/material';
import { useEffect } from 'react';
import { getProveedorByNit } from '../api'; // Asegúrate de importar la función
import SecurityIcon from '@mui/icons-material/Security';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BadgeIcon from '@mui/icons-material/Badge';

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
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #e0e0e0',
        py: 2.5
      }}>
        <SecurityIcon color="primary" sx={{ fontSize: 28 }} />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {esRol ? 'Detalle de Rol' : 'Detalle de Usuario'}
        </Typography>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 3, backgroundColor: '#fff' }}>
        {loading && (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress size={40} />
          </Box>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {usuarioDetalle && !loading && !error && (
          <Box mt={2}>
            {esRol ? (
              <>
                <Paper elevation={0} sx={{ p: 3, mb: 3, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <InfoIcon color="primary" sx={{ fontSize: 24 }} />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>Información General</Typography>
                      </Box>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>ID del Rol</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>{usuarioDetalle.idrol}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>Nombre del Rol</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>{usuarioDetalle.nombre}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>Estado</Typography>
                          <Chip
                            icon={usuarioDetalle.estado ? <CheckCircleIcon /> : <CancelIcon />}
                            label={usuarioDetalle.estado ? 'Activo' : 'Inactivo'}
                            color={usuarioDetalle.estado ? 'success' : 'error'}
                            size="small"
                            sx={{ 
                              mt: 0.5,
                              '& .MuiChip-label': { fontWeight: 500 }
                            }}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>Descripción</Typography>
                          <Typography variant="body1" sx={{ 
                            fontWeight: 500,
                            backgroundColor: '#fff',
                            p: 2,
                            borderRadius: 1,
                            border: '1px solid #e0e0e0',
                            minHeight: '60px'
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
                    <SecurityIcon color="primary" sx={{ fontSize: 24 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Permisos Asociados</Typography>
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
                              height: '100%',
                              transition: 'transform 0.2s, box-shadow 0.2s',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                              }
                            }}
                          >
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
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
            ) : (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Paper elevation={0} sx={{ p: 3, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <PersonIcon color="primary" sx={{ fontSize: 24 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>Información Personal</Typography>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>Nombre Completo</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {usuarioDetalle.nombre} {usuarioDetalle.apellido}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>Estado</Typography>
                        <Chip
                          icon={usuarioDetalle.estado ? <CheckCircleIcon /> : <CancelIcon />}
                          label={usuarioDetalle.estado ? 'Activo' : 'Inactivo'}
                          color={usuarioDetalle.estado ? 'success' : 'error'}
                          size="small"
                          sx={{ 
                            mt: 0.5,
                            '& .MuiChip-label': { fontWeight: 500 }
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Paper elevation={0} sx={{ p: 3, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <EmailIcon color="primary" sx={{ fontSize: 24 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>Contacto</Typography>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>Email</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {usuarioDetalle.email}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Paper elevation={0} sx={{ p: 3, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <BadgeIcon color="primary" sx={{ fontSize: 24 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>Identificación</Typography>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>Tipo de Documento</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {usuarioDetalle.tipodocumento}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>Número de Documento</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {usuarioDetalle.documento}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Paper elevation={0} sx={{ p: 3, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <LocationOnIcon color="primary" sx={{ fontSize: 24 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>Ubicación</Typography>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>Municipio</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {usuarioDetalle.municipio || 'No especificado'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>Barrio</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {usuarioDetalle.barrio || 'No especificado'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>Dirección Completa</Typography>
                        <Typography variant="body1" sx={{ 
                          fontWeight: 500,
                          backgroundColor: '#fff',
                          p: 2,
                          borderRadius: 1,
                          border: '1px solid #e0e0e0',
                          minHeight: '60px'
                        }}>
                          {usuarioDetalle.dirrecion} {usuarioDetalle.complemento || ''}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              </Grid>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ 
        p: 2.5, 
        backgroundColor: '#f8f9fa', 
        borderTop: '1px solid #e0e0e0' 
      }}>
        <Button 
          onClick={onClose} 
          variant="contained" 
          color="primary"
          sx={{ 
            borderRadius: 2,
            textTransform: 'none',
            px: 3,
            py: 1,
            fontWeight: 600,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }
          }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VerDetalle;