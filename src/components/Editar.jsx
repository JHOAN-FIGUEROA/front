import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Grid, CircularProgress, Alert, TextField, MenuItem } from '@mui/material';

const Editar = ({ open, onClose, usuario, loading, error, form, onFormChange, onSave, camposEditables, loadingSave }) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
    <DialogTitle>Editar Usuario</DialogTitle>
    <DialogContent dividers>
      {loading && <CircularProgress />}
      {error && <Alert severity="error">{error}</Alert>}
      {usuario && !loading && !error && (
        <Box mt={2}>
          <Grid container spacing={2}>
            {camposEditables.map(({ name, label, select, options }) => (
              <Grid item xs={12} sm={6} key={name}>
                {select ? (
                  <TextField
                    select
                    label={label}
                    name={name}
                    value={form[name] || ''}
                    onChange={onFormChange}
                    fullWidth
                    margin="normal"
                  >
                    {options.map(opt => (
                      <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                    ))}
                  </TextField>
                ) : (
                  <TextField
                    label={label}
                    name={name}
                    value={form[name] || ''}
                    onChange={onFormChange}
                    fullWidth
                    margin="normal"
                  />
                )}
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} color="secondary">Cancelar</Button>
      <Button onClick={onSave} color="primary" disabled={loadingSave}>Guardar</Button>
    </DialogActions>
  </Dialog>
);

export default Editar; 