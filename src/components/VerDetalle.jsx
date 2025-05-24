import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Grid, CircularProgress, Alert, Typography, List, ListItem, ListItemText, Divider } from '@mui/material';

const VerDetalle = ({ open, onClose, usuarioDetalle, loading, error }) => {
  const esRol = usuarioDetalle && 'permisos_asociados' in usuarioDetalle;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{esRol ? 'Detalle de Rol' : 'Detalle de Usuario'}</DialogTitle>
      <DialogContent dividers>
        {loading && <Box display="flex" justifyContent="center"><CircularProgress /></Box>}
        {error && <Alert severity="error">{error}</Alert>}
        {usuarioDetalle && !loading && !error && (
          <Box mt={2}> {/* Contenedor principal con margen superior */}
            {/* --- Layout para Detalle de Rol --- */}
            {esRol && (
              <>
                {/* Información General del Rol - Envuelto en su propio Grid container */}
                <Grid container spacing={2}> {/* Usamos spacing 2 para los items internos */}
                  <Grid item xs={12}> 
                    <Typography variant="h6" gutterBottom>Información General</Typography>
                    <Grid container spacing={2}> {/* Grid anidado para los detalles */}
                      <Grid item xs={12} sm={6}> {/* ID */}
                         <Typography variant="body1"><b>ID:</b> {usuarioDetalle.idrol}</Typography>
                      </Grid>
                       <Grid item xs={12} sm={6}> {/* Nombre */}
                         <Typography variant="body1"><b>Nombre:</b> {usuarioDetalle.nombre}</Typography>
                      </Grid>
                       <Grid item xs={12} sm={6}> {/* Estado */}
                         <Typography variant="body1">
                           <b>Estado:</b> {usuarioDetalle.estado === true || usuarioDetalle.estado === 'true' || usuarioDetalle.estado === 1 || usuarioDetalle.estado === '1' ? 'Activo' : 'Inactivo'}
                         </Typography>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
                
                {/* Permisos Asociados - Envuelto en su propio Grid container */}
                <Grid container spacing={2} sx={{ mt: 3 }}> {/* Nuevo Grid container con margen superior */}
                  <Grid item xs={12}> 
                    <Divider sx={{ my: 3 }} />
                    <Typography variant="h6" gutterBottom>Permisos Asociados</Typography>
                    {usuarioDetalle.permisos_asociados && usuarioDetalle.permisos_asociados.length > 0 ? (
                      <List dense={true}> {/* Lista compacta de permisos */}
                        {usuarioDetalle.permisos_asociados.map((permiso, index) => (
                          <ListItem key={index} sx={{ borderBottom: '1px solid #eee' }}>
                            <ListItemText
                              primary={<Typography variant="subtitle1">{permiso.permiso.nombre}</Typography>}
                              secondary={<Typography variant="body2" color="text.secondary">{permiso.permiso.descripcion}</Typography>}
                            />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                       <Typography variant="body2" color="text.secondary">No hay permisos asociados.</Typography>
                    )}
                  </Grid>
                </Grid>
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
      <DialogActions>
        <Button onClick={onClose} color="primary">Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default VerDetalle;