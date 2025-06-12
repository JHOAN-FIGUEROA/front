import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, TextField, MenuItem, CircularProgress, Snackbar, Alert, Typography, Paper, Box } from '@mui/material';
import { createUsuario } from '../api';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BadgeIcon from '@mui/icons-material/Badge';
import GroupIcon from '@mui/icons-material/Group';

// Asegúrate de que la prop onError se desestructure aquí
const Crear = ({ open, onClose, onCreado, campos, loading: loadingProp = false, titulo = 'Registrar Usuario', onError }) => {
  const [form, setForm] = useState(() => Object.fromEntries(campos.map(c => [c.name, c.default || ''])));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [rolSeleccionado, setRolSeleccionado] = useState('');

  useEffect(() => {
    if (open) {
      setForm(Object.fromEntries(campos.map(c => [c.name, c.default || ''])));
      setValidationErrors({});
      setError('');
      setSuccess(false);
      const rolInicial = campos.find(c => c.name === 'rol_idrol')?.default || '';
      setRolSeleccionado(rolInicial);
    }
  }, [open, campos]);

  const validateEmail = (email) => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = 'El email es requerido';
    } else {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email)) {
        newErrors.email = 'El formato del email no es válido';
      } else if (email.length > 100) {
        newErrors.email = 'El email excede la longitud máxima permitida';
      } else if (/[<>()[\]\\,;:\s"]+/.test(email)) {
        newErrors.email = 'El email contiene caracteres no permitidos';
      }
    }
    return newErrors;
  };

  const validatePassword = (password) => {
    const newErrors = {};
    if (!password) {
      newErrors.password = 'La contraseña es requerida';
    } else {
      if (password.length < 8 || password.length > 15) {
        newErrors.password = 'La contraseña debe tener entre 8 y 15 caracteres';
      } else if (!/[A-Z]/.test(password)) {
        newErrors.password = 'La contraseña debe contener al menos una mayúscula';
      } else if (!/[0-9]/.test(password)) {
        newErrors.password = 'La contraseña debe contener al menos un número';
      } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        newErrors.password = 'La contraseña debe contener al menos un carácter especial';
      }
    }
    return newErrors;
  };

  const validateDocumento = (documento) => {
    const newErrors = {};
    if (!documento.trim()) {
      newErrors.documento = 'El documento es requerido';
    } else if (!/^\d{10}$/.test(documento)) {
      newErrors.documento = 'El documento debe tener exactamente 10 dígitos numéricos';
    }
    return newErrors;
  };

  const validateNombre = (nombre) => {
    const newErrors = {};
    if (!nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{3,10}$/.test(nombre)) {
      newErrors.nombre = 'El nombre debe tener entre 3 y 10 letras';
    }
    return newErrors;
  };

  const validateApellido = (apellido) => {
    const newErrors = {};
    if (!apellido.trim()) {
      newErrors.apellido = 'El apellido es requerido';
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{3,10}$/.test(apellido)) {
      newErrors.apellido = 'El apellido debe tener entre 3 y 10 letras';
    }
    return newErrors;
  };

  const validateUbicacion = (valor, campo) => {
    const newErrors = {};
    if (valor && valor.trim()) {
      if (valor.length < 3 || valor.length > 50) {
        newErrors[campo] = `El campo debe tener entre 3 y 50 caracteres`;
      } else if (!/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]+$/.test(valor)) {
        newErrors[campo] = `Solo se permiten letras, números y espacios`;
      } else if (campo === 'dirrecion' && (valor.match(/\d/g) || []).length < 2) {
        newErrors[campo] = `La dirección debe contener al menos 2 números`;
      }
    }
    return newErrors;
  };

  const validateRol = (rol) => {
    const newErrors = {};
    if (!rol) {
      newErrors.rol_idrol = 'El rol es requerido';
    }
    return newErrors;
  };

  const validateTipoDocumento = (tipoDocumento) => {
    const newErrors = {};
    if (!tipoDocumento) {
      newErrors.tipodocumento = 'El tipo de documento es requerido';
    }
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    let newErrors = {};
    if (name === 'email') {
      newErrors = validateEmail(value);
    } else if (name === 'password') {
      newErrors = validatePassword(value);
    } else if (name === 'documento') {
      newErrors = validateDocumento(value);
    } else if (name === 'nombre') {
      newErrors = validateNombre(value);
    } else if (name === 'apellido') {
      newErrors = validateApellido(value);
    } else if (['municipio','barrio','dirrecion','complemento'].includes(name)) {
      newErrors = validateUbicacion(value, name);
    } else if (name === 'rol_idrol') {
      newErrors = validateRol(value);
    } else if (name === 'tipodocumento') {
      newErrors = validateTipoDocumento(value);
    }
    setValidationErrors(prev => ({ ...prev, ...newErrors, [name]: Object.values(newErrors)[0] }));
  };

  const validateForm = () => {
    const newErrors = {};
    Object.assign(newErrors,
      validateEmail(form.email),
      validatePassword(form.password),
      validateDocumento(form.documento),
      validateNombre(form.nombre),
      validateApellido(form.apellido),
      validateUbicacion(form.municipio, 'municipio'),
      validateUbicacion(form.barrio, 'barrio'),
      validateUbicacion(form.dirrecion, 'dirrecion'),
      validateUbicacion(form.complemento, 'complemento'),
      validateRol(form.rol_idrol),
      validateTipoDocumento(form.tipodocumento)
    );
    setValidationErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setValidationErrors({});

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await createUsuario(form);
      setSuccess(true);
      if (onCreado) onCreado(response);
      openSnackbar('Usuario registrado correctamente', 'success');
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.response?.data?.detalles || err.message || 'Ocurrió un error al crear el usuario.';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Agrupación de campos por secciones
  const camposPorSeccion = {
    identificacion: [
      'tipodocumento', 'documento',
    ],
    personal: [
      'nombre', 'apellido', 'password',
    ],
    contacto: [
      'email',
    ],
    ubicacion: [
      'municipio', 'barrio', 'dirrecion', 'complemento',
    ],
    rol: [
      'rol_idrol',
    ],
  };

  // Obtener las opciones de roles
  const rolesCampo = campos.find(c => c.name === 'rol_idrol');
  const rolesOptions = Array.isArray(rolesCampo?.options) ? rolesCampo.options : [];

  // Handler para seleccionar rol
  const handleSeleccionarRol = (id) => {
    setRolSeleccionado(id);
    setForm(prev => ({ ...prev, rol_idrol: id }));
    const newErrors = validateRol(id);
    setValidationErrors(prev => ({ ...prev, rol_idrol: newErrors.rol_idrol }));
  };

  // Handler para seleccionar tipo de documento
  const handleSeleccionarTipoDocumento = (tipo) => {
    setForm(prev => ({ ...prev, tipodocumento: tipo }));
    const newErrors = validateTipoDocumento(tipo);
    setValidationErrors(prev => ({ ...prev, tipodocumento: newErrors.tipodocumento }));
  };

  // Obtener las opciones de tipo de documento
  const tipoDocCampo = campos.find(c => c.name === 'tipodocumento');
  const tipoDocOptions = Array.isArray(tipoDocCampo?.options) ? tipoDocCampo.options : [];

  // Helper para renderizar campos
  const renderCampos = (nombresCampos) => (
    <Grid container spacing={2}>
      {nombresCampos.map(name => {
        const campo = campos.find(c => c.name === name);
        if (!campo) return null;
        const { label, select, options, type = 'text', required = true } = campo;
  return (
                <Grid item xs={12} sm={select || type === 'password' ? 12 : 6} key={name}>
                  {select ? (
                    <TextField
                      select
                      label={label}
                      name={name}
                      value={form[name] || ''}
                      onChange={handleChange}
                      fullWidth
                      margin="normal"
                      required={required}
                      error={!!validationErrors[name]}
                      helperText={validationErrors[name]}
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
                    key={opt.value || opt} 
                    value={opt.value || opt}
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
                          {opt.label || opt}
                        </MenuItem>
                      ))}
                    </TextField>
                  ) : (
                    <TextField
                      label={label}
                      name={name}
                      value={form[name] || ''}
                      onChange={handleChange}
                      fullWidth
                      margin="normal"
                      type={type}
                      required={required}
                      error={!!validationErrors[name]}
                      helperText={validationErrors[name]}
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
        );
      })}
    </Grid>
  );

  return (
    <>
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
          <PersonAddIcon color="primary" sx={{ fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {titulo}
          </Typography>
        </DialogTitle>
        <form onSubmit={handleSubmit} autoComplete="off" noValidate>
          <DialogContent dividers sx={{ p: 3, backgroundColor: '#fff', maxHeight: '70vh', overflowY: 'auto' }}>
            <Grid container spacing={3}>
              {/* Identificación */}
              <Grid item xs={12} md={6}>
                <Paper elevation={0} sx={{ p: 3, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <BadgeIcon color="primary" sx={{ fontSize: 24 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Identificación</Typography>
                  </Box>
                  {/* Opciones de tipo de documento visuales */}
                  <Box mb={2}>
                    <Grid container spacing={2}>
                      {tipoDocOptions.map(opt => (
                        <Grid item xs={4} sm={3} key={opt.value || opt}>
                          <Paper
                            elevation={form.tipodocumento === (opt.value || opt) ? 3 : 0}
                            sx={{
                              p: 1.5,
                              borderRadius: 2,
                              border: form.tipodocumento === (opt.value || opt) ? '2px solid #1976d2' : '1px solid #e0e0e0',
                              backgroundColor: form.tipodocumento === (opt.value || opt) ? '#e3f2fd' : '#fff',
                              cursor: 'pointer',
                              textAlign: 'center',
                              fontWeight: 600,
                              transition: 'all 0.2s',
                              '&:hover': {
                                boxShadow: '0 2px 8px rgba(25, 118, 210, 0.12)',
                                borderColor: '#1976d2',
                              },
                            }}
                            onClick={() => handleSeleccionarTipoDocumento(opt.value || opt)}
                          >
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: 16 }}>
                              {opt.label || opt}
                            </Typography>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                    {validationErrors['tipodocumento'] && (
                      <Alert severity="error" sx={{ mt: 2 }}>{validationErrors['tipodocumento']}</Alert>
                    )}
                  </Box>
                  {/* Renderizar el resto de campos de identificación excepto tipodocumento */}
                  {renderCampos(camposPorSeccion.identificacion.filter(c => c !== 'tipodocumento'))}
                </Paper>
              </Grid>
              {/* Información Personal */}
              <Grid item xs={12} md={6}>
                <Paper elevation={0} sx={{ p: 3, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <PersonIcon color="primary" sx={{ fontSize: 24 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Información Personal</Typography>
                  </Box>
                  {renderCampos(camposPorSeccion.personal)}
                </Paper>
              </Grid>
              {/* Contacto */}
              <Grid item xs={12} md={6}>
                <Paper elevation={0} sx={{ p: 3, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <EmailIcon color="primary" sx={{ fontSize: 24 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Contacto</Typography>
                  </Box>
                  {renderCampos(camposPorSeccion.contacto)}
                </Paper>
              </Grid>
              {/* Ubicación */}
              <Grid item xs={12} md={6}>
                <Paper elevation={0} sx={{ p: 3, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <LocationOnIcon color="primary" sx={{ fontSize: 24 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Ubicación</Typography>
                  </Box>
                  {renderCampos(camposPorSeccion.ubicacion)}
                </Paper>
              </Grid>
              {/* Rol */}
              <Grid item xs={12} md={6}>
                <Paper elevation={0} sx={{ p: 3, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <GroupIcon color="primary" sx={{ fontSize: 24 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Rol</Typography>
                  </Box>
                  <Grid container spacing={2}>
                    {rolesOptions.length === 0 && (
                      <Grid item xs={12}>
                        <Alert severity="info">No hay roles disponibles</Alert>
                      </Grid>
                    )}
                    {rolesOptions.map(opt => (
                      <Grid item xs={12} sm={6} key={opt.value || opt}>
                        <Paper
                          elevation={rolSeleccionado === (opt.value || opt) ? 3 : 0}
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            border: rolSeleccionado === (opt.value || opt) ? '2px solid #1976d2' : '1px solid #e0e0e0',
                            backgroundColor: rolSeleccionado === (opt.value || opt) ? '#e3f2fd' : '#fff',
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
                          onClick={() => handleSeleccionarRol(opt.value || opt)}
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
                </Paper>
              </Grid>
            </Grid>
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
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
              disabled={loading || loadingProp}
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
              type="submit" 
              color="primary" 
              disabled={loading || loadingProp}
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
              {loading ? <CircularProgress size={24} /> : 'Registrar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      <Snackbar
        open={success}
        autoHideDuration={2000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccess(false)} sx={{ width: '100%' }}>
          Usuario registrado correctamente
        </Alert>
      </Snackbar>
    </>
  );
};

export default Crear;