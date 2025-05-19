import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Grid, CircularProgress, Alert, Typography, List, ListItem, ListItemText, Divider } from '@mui/material';

const VerDetalle = ({ open, onClose, usuarioDetalle, loading, error }) => {
  const esRol = usuarioDetalle && 'permisos_asociados' in usuarioDetalle;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{esRol ? 'Detalle de Rol' : 'Detalle de Usuario'}</DialogTitle>
      <DialogContent dividers>
        {loading && <CircularProgress />}
        {error && <Alert severity="error">{error}</Alert>}
        {usuarioDetalle && !loading && !error && (
          <Box mt={2}>
            <Grid container spacing={2}>
              {esRol ? (
                <>
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>Información General</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography><b>ID:</b> {usuarioDetalle.idrol}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography><b>Nombre:</b> {usuarioDetalle.nombre}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography>
                          <b>Estado:</b> {usuarioDetalle.estado === true || usuarioDetalle.estado === 'true' || usuarioDetalle.estado === 1 || usuarioDetalle.estado === '1' ? 'Activo' : 'Inactivo'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>Permisos Asociados</Typography>
                    <List>
                      {usuarioDetalle.permisos_asociados && usuarioDetalle.permisos_asociados.map((permiso, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={permiso.permiso.nombre}
                            secondary={permiso.permiso.descripcion}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                </>
              ) : (
                <>
                  <Grid item xs={6}><b>Nombre:</b> {usuarioDetalle.nombre} {usuarioDetalle.apellido}</Grid>
                  <Grid item xs={6}><b>Email:</b> {usuarioDetalle.email}</Grid>
                  <Grid item xs={6}><b>Tipo Documento:</b> {usuarioDetalle.tipodocumento}</Grid>
                  <Grid item xs={6}><b>Documento:</b> {usuarioDetalle.documento}</Grid>
                  <Grid item xs={6}><b>Municipio:</b> {usuarioDetalle.municipio}</Grid>
                  <Grid item xs={6}><b>Barrio:</b> {usuarioDetalle.barrio}</Grid>
                  <Grid item xs={6}><b>Dirección:</b> {usuarioDetalle.dirrecion}</Grid>
                  <Grid item xs={6}><b>Estado:</b> {usuarioDetalle.estado === true || usuarioDetalle.estado === 'true' || usuarioDetalle.estado === 1 || usuarioDetalle.estado === '1' ? 'Activo' : 'Inactivo'}</Grid>
                </>
              )}
            </Grid>
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