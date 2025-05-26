import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Grid, CircularProgress, Alert, TextField, MenuItem } from '@mui/material';

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
  loadingSave // Loading para la acción de guardar
}) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
    <DialogTitle>Editar Usuario</DialogTitle>
    <DialogContent dividers>
      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress /></Box>}
      
      {/* Mostrar error general de API (de carga inicial o de guardado) si existe y no está cargando */}
      {apiError && !loading && <Alert severity="error" sx={{ mb: 2 }}>{apiError}</Alert>}

      {/* Esta condición es redundante si apiError ya cubre el error de carga inicial. 
          Si apiError se establece cuando el usuario no se carga, la línea anterior es suficiente.
          Si se necesita diferenciar un error de carga de un error de guardado, se necesitarían props separadas.
          Por ahora, asumiendo que apiError se usa para ambos:
      */}
      {/* {!loading && !usuario && apiError && <Alert severity="error" sx={{ mb: 2 }}>{apiError}</Alert>} */}


      {usuario && !loading && (
        <Box component="form" onSubmit={(e) => { e.preventDefault(); onSave(); }} noValidate sx={{ mt: 1 }}>
          <Grid container spacing={2}>
            {Array.isArray(camposEditables) && camposEditables.map(({ name, label, select, options = [], type = 'text', required = true }) => (
              // Para MUI Grid v2, se elimina la prop 'item'. 'xs' y 'sm' se aplican directamente.
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