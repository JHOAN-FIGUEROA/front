import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Grid, CircularProgress, Alert, TextField, MenuItem } from '@mui/material';
import { Snackbar } from '@mui/material';

const Editar = ({
  open,
  onClose,
  usuario,
  loading, // Loading para la carga inicial del usuario
  apiError, // Para errores generales de API (tanto de carga inicial como de guardado)
  validationErrors = {}, // Para errores de validación por campo
  form,
  onFormChange,
  onSave,
  camposEditables = [],
  loadingSave, // Loading para la acción de guardar
  setApiError,
  onError // Asegúrate de que esta prop esté presente
}) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
    <DialogTitle>Editar Usuario</DialogTitle>
    <DialogContent dividers>
      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress /></Box>}
      
      <Snackbar
        open={apiError && !loading}
        autoHideDuration={3000}
        onClose={() => setApiError('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setApiError('')}>{apiError}</Alert>
      </Snackbar>

      {usuario && !loading && (
        <Box component="form" onSubmit={(e) => { e.preventDefault(); onSave(); }} noValidate sx={{ mt: 1 }}>
          <Grid container spacing={2}>
            {Array.isArray(camposEditables) && camposEditables.map(({ name, label, select, options = [], type = 'text', required = true }) => (
              <Grid xs={12} sm={select || type === 'password' ? 12 : 6} key={name}>
                {select ? (
                  <TextField
                    select
                    label={label}
                    name={name}
                    value={form?.[name] || ''}
                    onChange={onFormChange}
                    fullWidth
                    margin="normal"
                    required={required}
                    error={!!validationErrors[name]}
                    helperText={validationErrors[name]}
                  >
                    {Array.isArray(options) && options.map(opt => (
                      <MenuItem key={typeof opt === 'object' ? opt.value : opt} value={typeof opt === 'object' ? opt.value : opt}>
                        {typeof opt === 'object' ? opt.label : opt}
                      </MenuItem>
                    ))}
                  </TextField>
                ) : (
                  <TextField
                    label={label}
                    name={name}
                    value={form?.[name] || ''}
                    onChange={onFormChange}
                    fullWidth
                    margin="normal"
                    type={type}
                    required={required}
                    error={!!validationErrors[name]}
                    helperText={validationErrors[name]}
                  />
                )}
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} color="secondary" disabled={loadingSave}>Cancelar</Button>
      <Button onClick={onSave} color="primary" disabled={loadingSave || loading}>
        {loadingSave ? <CircularProgress size={24} /> : 'Guardar'}
      </Button>
    </DialogActions>
  </Dialog>
);

export default Editar;