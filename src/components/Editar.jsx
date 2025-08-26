import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Grid, CircularProgress, Alert, TextField, MenuItem, Paper, Typography } from '@mui/material';
import { Snackbar } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BadgeIcon from '@mui/icons-material/Badge';
import GroupIcon from '@mui/icons-material/Group';

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
}) => {
  // Opciones de roles y tipo de documento
  const rolCampo = camposEditables.find(c => c.name === 'rol_idrol');
  const rolesOptions = Array.isArray(rolCampo?.options) ? rolCampo.options : [];
  const tipoDocCampo = camposEditables.find(c => c.name === 'tipodocumento');
  const tipoDocOptions = Array.isArray(tipoDocCampo?.options) ? tipoDocCampo.options : [];

  // Handler para seleccionar rol
  const handleSeleccionarRol = (id) => {
    onFormChange({ target: { name: 'rol_idrol', value: id } });
  };
  // Handler para seleccionar tipo de documento
  const handleSeleccionarTipoDocumento = (tipo) => {
    onFormChange({ target: { name: 'tipodocumento', value: tipo } });
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      scroll="paper"
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
        <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
          Editar Usuario
        </Typography>
      </DialogTitle>
      <form onSubmit={e => { e.preventDefault(); onSave(); }} autoComplete="off" noValidate>
        <DialogContent dividers sx={{ p: 0, backgroundColor: '#f8f9fa', maxHeight: { xs: '80vh', sm: '70vh' }, overflowY: 'auto' }}>
          <Paper elevation={4} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 4, backgroundColor: '#fff', m: { xs: 1, sm: 3 }, boxShadow: '0 8px 32px rgba(0,0,0,0.10)' }}>
            <Typography variant="h5" sx={{ fontWeight: 900, mb: 3, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
              <EditIcon color="primary" sx={{ fontSize: 32 }} />
              Información del Usuario
            </Typography>
            {/* Identificación */}
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <BadgeIcon color="primary" sx={{ fontSize: 24 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: 18 }}>Identificación</Typography>
            </Box>
            <Box display="flex" gap={0} mb={2}>
              <Box display="flex" gap={1} flex={1}>
                {tipoDocOptions.map(opt => (
                  <Button
                    key={opt}
                    variant={form.tipodocumento === opt ? 'contained' : 'outlined'}
                    color={form.tipodocumento === opt ? 'primary' : 'inherit'}
                    size="small"
                    sx={{ minWidth: 48, fontWeight: 700, borderRadius: 2, px: 2, py: 1, boxShadow: 'none' }}
                    onClick={() => handleSeleccionarTipoDocumento(opt)}
                  >
                    {opt}
                  </Button>
                ))}
              </Box>
              <TextField
                label="Documento"
                name="documento"
                value={form.documento}
                onChange={onFormChange}
                fullWidth
                required
                error={!!validationErrors.documento}
                helperText={validationErrors.documento}
                sx={{ ml: 2 }}
                InputLabelProps={{ shrink: Boolean(form.documento) }}
              />
            </Box>
            {/* Información Personal */}
            <Box display="flex" alignItems="center" gap={1} mt={3} mb={2}>
              <PersonIcon color="primary" sx={{ fontSize: 24 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: 18 }}>Información Personal</Typography>
            </Box>
            {/* Fila 1: Nombre y Apellido */}
            <Box display="flex" gap={2} mb={2}>
              <TextField
                label="Nombre"
                name="nombre"
                value={form.nombre}
                onChange={onFormChange}
                fullWidth
                required
                error={!!validationErrors.nombre}
                helperText={validationErrors.nombre}
                sx={{ flex: 1 }}
                InputLabelProps={{ shrink: Boolean(form.nombre) }}
              />
              <TextField
                label="Apellido"
                name="apellido"
                value={form.apellido}
                onChange={onFormChange}
                fullWidth
                required
                error={!!validationErrors.apellido}
                helperText={validationErrors.apellido}
                sx={{ flex: 1 }}
                InputLabelProps={{ shrink: Boolean(form.apellido) }}
              />
            </Box>

            {/* Contacto */}
            <Box display="flex" alignItems="center" gap={1} mt={3} mb={2}>
              <EmailIcon color="primary" sx={{ fontSize: 24 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: 18 }}>Contacto</Typography>
            </Box>
            <Box display="flex" gap={0} mb={2}>
              <TextField
                label="Email"
                name="email"
                value={form.email}
                onChange={onFormChange}
                fullWidth
                required
                error={!!validationErrors.email}
                helperText={validationErrors.email}
                sx={{ flex: 1 }}
                InputLabelProps={{ shrink: Boolean(form.email) }}
              />
            </Box>
            {/* Ubicación */}
            <Box display="flex" alignItems="center" gap={1} mt={3} mb={2}>
              <LocationOnIcon color="primary" sx={{ fontSize: 24 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: 18 }}>Ubicación</Typography>
            </Box>
            {/* Fila 1: Municipio y Barrio */}
            <Box display="flex" gap={2} mb={2}>
              <TextField
                label="Municipio"
                name="municipio"
                value={form.municipio}
                onChange={onFormChange}
                fullWidth
                required
                error={!!validationErrors.municipio}
                helperText={validationErrors.municipio}
                sx={{ flex: 1 }}
                InputLabelProps={{ shrink: Boolean(form.municipio) }}
              />
              <TextField
                label="Barrio"
                name="barrio"
                value={form.barrio}
                onChange={onFormChange}
                fullWidth
                required
                error={!!validationErrors.barrio}
                helperText={validationErrors.barrio}
                sx={{ flex: 1 }}
                InputLabelProps={{ shrink: Boolean(form.barrio) }}
              />
            </Box>
            {/* Fila 2: Dirección y Complemento */}
            <Box display="flex" gap={2} mb={2}>
              <TextField
                label="Dirección"
                name="dirrecion"
                value={form.dirrecion}
                onChange={onFormChange}
                fullWidth
                required
                error={!!validationErrors.dirrecion}
                helperText={validationErrors.dirrecion}
                sx={{ flex: 1 }}
                InputLabelProps={{ shrink: Boolean(form.dirrecion) }}
              />
              <TextField
                label="Complemento"
                name="complemento"
                value={form.complemento}
                onChange={onFormChange}
                fullWidth
                error={!!validationErrors.complemento}
                helperText={validationErrors.complemento}
                sx={{ flex: 1 }}
                InputLabelProps={{ shrink: Boolean(form.complemento) }}
              />
            </Box>
            {/* Rol */}
            <Box display="flex" alignItems="center" gap={1} mt={3} mb={2}>
              <GroupIcon color="primary" sx={{ fontSize: 24 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: 18 }}>Rol</Typography>
            </Box>
            <Box display="flex" gap={1} mb={2} flexWrap="wrap">
              {rolesOptions.length === 0 && (
                <Alert severity="info">No hay roles disponibles</Alert>
              )}
              {rolesOptions.map(opt => (
                <Button
                  key={opt.value || opt}
                  variant={form.rol_idrol === (opt.value || opt) ? 'contained' : 'outlined'}
                  color={form.rol_idrol === (opt.value || opt) ? 'primary' : 'inherit'}
                  size="large"
                  sx={{ minWidth: 120, fontWeight: 700, borderRadius: 2, px: 2, py: 1, boxShadow: 'none', mb: 1 }}
                  onClick={() => handleSeleccionarRol(opt.value || opt)}
                >
                  {opt.label || opt}
                </Button>
              ))}
            </Box>
            {validationErrors['rol_idrol'] && (
              <Alert severity="error" sx={{ mt: 2 }}>{validationErrors['rol_idrol']}</Alert>
            )}
            {apiError && <Alert severity="error" sx={{ mt: 3 }}>{apiError}</Alert>}
          </Paper>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, backgroundColor: '#f8f9fa', borderTop: '1px solid #e0e0e0' }}>
          <Button onClick={onClose} color="secondary" variant="outlined" sx={{ borderRadius: 2, textTransform: 'none', px: 3, py: 1, fontWeight: 600, boxShadow: 'none', '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' } }}>
            Cancelar
          </Button>
          <Button type="submit" color="success" variant="contained" disabled={loadingSave || loading} sx={{ borderRadius: 2, textTransform: 'none', px: 3, py: 1, fontWeight: 600, boxShadow: 'none', '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' } }}>
            {loadingSave ? <CircularProgress size={24} /> : 'Guardar'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default Editar;