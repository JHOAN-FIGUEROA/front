import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Grid, CircularProgress, Alert, TextField, MenuItem, Paper, Typography } from '@mui/material';
import { Snackbar } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BadgeIcon from '@mui/icons-material/Badge';

const SECCIONES = [
  {
    key: 'identificacion',
    icon: <BadgeIcon color="primary" sx={{ fontSize: 24 }} />, 
    title: 'Identificación',
    fields: ['tipodocumento', 'documento'],
  },
  {
    key: 'personal',
    icon: <PersonIcon color="primary" sx={{ fontSize: 24 }} />, 
    title: 'Información Personal',
    fields: ['nombre', 'apellido', 'rol_idrol'],
  },
  {
    key: 'contacto',
    icon: <EmailIcon color="primary" sx={{ fontSize: 24 }} />, 
    title: 'Contacto',
    fields: ['email'],
  },
  {
    key: 'ubicacion',
    icon: <LocationOnIcon color="primary" sx={{ fontSize: 24 }} />, 
    title: 'Ubicación',
    fields: ['municipio', 'barrio', 'dirrecion', 'complemento'],
  },
];

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
      <EditIcon color="primary" sx={{ fontSize: 28 }} />
      <Typography variant="h6" sx={{ fontWeight: 600 }}>
        Editar Usuario
      </Typography>
    </DialogTitle>
    <DialogContent dividers sx={{ p: 3, backgroundColor: '#fff' }}>
      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress size={40} />
        </Box>
      )}
      
      <Snackbar
        open={apiError && !loading}
        autoHideDuration={3000}
        onClose={() => setApiError('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setApiError('')} sx={{ width: '100%' }}>
          {apiError}
        </Alert>
      </Snackbar>

      {usuario && !loading && (
        <Box component="form" onSubmit={(e) => { e.preventDefault(); onSave(); }} noValidate>
          <Grid container spacing={3}>
            {SECCIONES.map(seccion => {
              const camposSeccion = camposEditables.filter(c => seccion.fields.includes(c.name));
              if (camposSeccion.length === 0) return null;
              if (seccion.key === 'personal') {
                const nombreCampo = camposSeccion.find(c => c.name === 'nombre');
                const apellidoCampo = camposSeccion.find(c => c.name === 'apellido');
                const rolCampo = camposSeccion.find(c => c.name === 'rol_idrol');
                const rolesOptions = Array.isArray(rolCampo?.options) ? rolCampo.options : [];
                return (
                  <Grid item xs={12} md={6} key={seccion.key}>
                    <Paper elevation={0} sx={{ p: 3, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        {seccion.icon}
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>{seccion.title}</Typography>
                      </Box>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label={nombreCampo.label}
                            name={nombreCampo.name}
                            value={form?.[nombreCampo.name] || ''}
                            onChange={onFormChange}
                            fullWidth
                            margin="normal"
                            required={nombreCampo.required}
                            error={!!validationErrors[nombreCampo.name]}
                            helperText={validationErrors[nombreCampo.name]}
                            disabled={nombreCampo.disabled}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 1,
                                backgroundColor: '#fff',
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                  borderColor: 'primary.main',
                                },
                              },
                              '& .MuiInputLabel-root': {
                                color: 'text.secondary',
                              },
                              '& .MuiInputLabel-root.Mui-focused': {
                                color: 'primary.main',
                              },
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label={apellidoCampo.label}
                            name={apellidoCampo.name}
                            value={form?.[apellidoCampo.name] || ''}
                            onChange={onFormChange}
                            fullWidth
                            margin="normal"
                            required={apellidoCampo.required}
                            error={!!validationErrors[apellidoCampo.name]}
                            helperText={validationErrors[apellidoCampo.name]}
                            disabled={apellidoCampo.disabled}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 1,
                                backgroundColor: '#fff',
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                  borderColor: 'primary.main',
                                },
                              },
                              '& .MuiInputLabel-root': {
                                color: 'text.secondary',
                              },
                              '& .MuiInputLabel-root.Mui-focused': {
                                color: 'primary.main',
                              },
                            }}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Box mt={2}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Rol</Typography>
                            <Grid container spacing={2}>
                              {rolesOptions.length === 0 && (
                                <Grid item xs={12}>
                                  <Alert severity="info">No hay roles disponibles</Alert>
                                </Grid>
                              )}
                              {rolesOptions.map(opt => (
                                <Grid item xs={12} sm={6} key={opt.value || opt}>
                                  <Paper
                                    elevation={form?.rol_idrol === (opt.value || opt) ? 3 : 0}
                                    sx={{
                                      p: 2,
                                      borderRadius: 2,
                                      border: form?.rol_idrol === (opt.value || opt) ? '2px solid #1976d2' : '1px solid #e0e0e0',
                                      backgroundColor: form?.rol_idrol === (opt.value || opt) ? '#e3f2fd' : '#fff',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s',
                                      '&:hover': {
                                        boxShadow: '0 2px 8px rgba(25, 118, 210, 0.12)',
                                        borderColor: '#1976d2',
                                      },
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 2,
                                    }}
                                    onClick={() => onFormChange({ target: { name: 'rol_idrol', value: opt.value || opt } })}
                                  >
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                      {opt.label || opt}
                                    </Typography>
                                  </Paper>
                                </Grid>
                              ))}
                            </Grid>
                            {validationErrors['rol_idrol'] && (
                              <Alert severity="error" sx={{ mt: 2 }}>{validationErrors['rol_idrol']}</Alert>
                            )}
                          </Box>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                );
              }
              return (
                <Grid item xs={12} md={seccion.key === 'personal' || seccion.key === 'identificacion' ? 6 : 12} key={seccion.key}>
                  <Paper elevation={0} sx={{ p: 3, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      {seccion.icon}
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>{seccion.title}</Typography>
                    </Box>
          <Grid container spacing={2}>
                      {camposSeccion.map(({ name, label, select, options = [], type = 'text', required = true, disabled = false }) => (
                        <Grid item xs={12} sm={6} key={name}>
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
                    disabled={disabled}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: 1,
                                  backgroundColor: '#fff',
                                  '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'primary.main',
                                  },
                                },
                                '& .MuiInputLabel-root': {
                                  color: 'text.secondary',
                                },
                                '& .MuiInputLabel-root.Mui-focused': {
                                  color: 'primary.main',
                                },
                              }}
                  >
                    {Array.isArray(options) && options.map(opt => (
                                <MenuItem 
                                  key={typeof opt === 'object' ? opt.value : opt} 
                                  value={typeof opt === 'object' ? opt.value : opt}
                                  sx={{
                                    '&:hover': {
                                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                                    },
                                    '&.Mui-selected': {
                                      backgroundColor: 'rgba(0, 0, 0, 0.08)',
                                      '&:hover': {
                                        backgroundColor: 'rgba(0, 0, 0, 0.12)',
                                      },
                                    },
                                  }}
                                >
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
                    disabled={disabled}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: 1,
                                  backgroundColor: '#fff',
                                  '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'primary.main',
                                  },
                                },
                                '& .MuiInputLabel-root': {
                                  color: 'text.secondary',
                                },
                                '& .MuiInputLabel-root.Mui-focused': {
                                  color: 'primary.main',
                                },
                              }}
                  />
                )}
              </Grid>
            ))}
                    </Grid>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
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
        color="secondary" 
        disabled={loadingSave}
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
        Cancelar
      </Button>
      <Button 
        onClick={onSave} 
        color="primary" 
        disabled={loadingSave || loading}
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
        {loadingSave ? <CircularProgress size={24} /> : 'Guardar'}
      </Button>
    </DialogActions>
  </Dialog>
);

export default Editar;