import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Paper, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Stack } from '@mui/material';
import { styled } from '@mui/material/styles';
import Swal from 'sweetalert2';
import { useAuth } from '../hooks/useAuth';
import { solicitarTokenRecuperacion, restablecerPassword } from '../api';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

const StyledPaper = styled(Paper)(({ theme }) => ({
  flex: 1,
  minWidth: '300px',
  maxWidth: '400px',
  width: '100%',
  padding: theme.spacing(4),
  backgroundColor: '#ffffff',
  borderRadius: '10px',
}));

const StyledButton = styled(Button)({
  backgroundColor: '#2E8B57', // Verde mar
  '&:hover': {
    backgroundColor: '#3CB371', // Verde mar medio
  },
  marginTop: '20px',
  width: '100%',
});

// Función para silenciar errores de red
const silenciarErroresRed = () => {
  const originalError = console.error;
  console.error = (...args) => {
    // Filtrar errores comunes de red y fetch
    const message = args.join(' ').toLowerCase();
    if (
      message.includes('fetch') ||
      message.includes('network') ||
      message.includes('failed to fetch') ||
      message.includes('networkerror') ||
      message.includes('cors') ||
      message.includes('connection') ||
      message.includes('timeout') ||
      message.includes('refused') ||
      message.includes('unreachable')
    ) {
      return; // Silenciar estos errores
    }
    originalError.apply(console, args);
  };
};

// Función para configurar SweetAlert sin errores de accesibilidad
const configurarSweetAlert = () => {
  const defaultSwalConfig = {
    heightAuto: false,
    allowOutsideClick: false,
    allowEscapeKey: true,
    focusConfirm: true,
    customClass: {
      popup: 'swal-popup-custom',
      title: 'swal-title-custom',
      content: 'swal-content-custom',
      confirmButton: 'swal-confirm-custom'
    },
    didOpen: (popup) => {
      // Asegurar accesibilidad correcta
      popup.setAttribute('role', 'dialog');
      popup.setAttribute('aria-modal', 'true');
      popup.setAttribute('aria-labelledby', 'swal2-title');
      popup.setAttribute('aria-describedby', 'swal2-html-container');
    }
  };
  return defaultSwalConfig;
};

const LoginForm = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Estados para recuperación de contraseña
  const [openRecuperarPassword, setOpenRecuperarPassword] = useState(false);
  const [openRestablecerPassword, setOpenRestablecerPassword] = useState(false);
  const [recuperarData, setRecuperarData] = useState({
    email: '',
    token: '',
    nuevaPassword: '',
    confirmarPassword: ''
  });
  const [recuperarErrors, setRecuperarErrors] = useState({});
  const [solicitarLoading, setSolicitarLoading] = useState(false);
  const [restablecerLoading, setRestablecerLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNuevaPassword, setShowNuevaPassword] = useState(false);

  // Silenciar errores de red al cargar el componente
  useState(() => {
    silenciarErroresRed();
  }, []);

  const validateEmail = (email) => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = 'El email es requerido';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        newErrors.email = 'El formato del email no es válido';
      }
      if (email.length > 100) {
        newErrors.email = 'El email excede la longitud máxima permitida';
      }
      if (/[<>()[\]\\,;:\s"]+/.test(email)) {
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
      }
      if (!/[A-Z]/.test(password)) {
        newErrors.password = 'La contraseña debe contener al menos una mayúscula';
      }
      if (!/[0-9]/.test(password)) {
        newErrors.password = 'La contraseña debe contener al menos un número';
      }
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        newErrors.password = 'La contraseña debe contener al menos un carácter especial';
      }
    }
    return newErrors;
  };

  const isEmailValid = (email) => {
    if (!email.trim()) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return false;
    if (email.length > 100) return false;
    if (/[<>()[\]\\,;:\s"]+/.test(email)) return false;
    return true;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Validación en tiempo real solo para email
    if (name === 'email') {
      const emailErrors = validateEmail(value);
      setErrors(prev => ({ ...prev, email: emailErrors.email }));
    } else if (name === 'password') {
      // Solo validar si está vacío
      setErrors(prev => ({ 
        ...prev, 
        password: !value.trim() ? 'La contraseña es requerida' : '' 
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      const swalConfig = configurarSweetAlert();
      Swal.fire({
        ...swalConfig,
        icon: 'warning',
        title: 'Campos Incompletos',
        text: 'Por favor, complete todos los campos correctamente',
        confirmButtonColor: '#2E8B57',
        background: '#fff'
      });
      return;
    }

    setLoading(true);

    try {
      const credentials = {
        email: formData.email.trim(),
        password: formData.password.trim(),
      };

      // Usar Promise con timeout personalizado para evitar errores de red prolongados
      const loginPromise = login(credentials.email, credentials.password);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('timeout')), 10000)
      );

      const result = await Promise.race([loginPromise, timeoutPromise])
        .catch((error) => {
          // Silenciar completamente los errores de red
          return {
            success: false,
            error: error.message === 'timeout' 
              ? 'Tiempo de espera agotado' 
              : 'Error de conexión con el servidor'
          };
        });

      if (result && result.success) {
        const swalConfig = configurarSweetAlert();
        await Swal.fire({
          ...swalConfig,
          icon: 'success',
          title: '¡Bienvenido!',
          text: 'Inicio de sesión exitoso',
          timer: 1500,
          showConfirmButton: false,
          confirmButtonColor: '#2E8B57',
          background: '#fff',
          position: 'center',
          width: 'auto',
          padding: '1.5em'
        });

        // Redirigir al primer módulo permitido según los permisos del usuario
        const getFirstAllowedRoute = (permisos) => {
          if (permisos.includes('Dashboard')) return '/dashboard';
          if (permisos.includes('Compras')) return '/compras';
          if (permisos.includes('Ventas')) return '/ventas';
          if (permisos.includes('Clientes')) return '/ventas/clientes';
          // Agrega más rutas según tus módulos y permisos
          return '/unauthorized'; // Fallback si no tiene ningún permiso conocido
        };
        const usuario = JSON.parse(localStorage.getItem('user'));
        const ruta = getFirstAllowedRoute(usuario?.permisos || []);
        navigate(ruta);

      } else {
        let errorMessage = result?.error || 'Ha ocurrido un error al iniciar sesión.';
        let errorTitle = 'Error de Autenticación';

        if (errorMessage.includes('Credenciales incorrectas')) {
          errorTitle = 'Credenciales Inválidas';
        } else if (errorMessage.includes('Cuenta inactiva')) {
          errorTitle = 'Cuenta Inactiva';
        } else if (errorMessage.includes('Acceso no permitido')) {
          errorTitle = 'Acceso Restringido';
        } else if (errorMessage.includes('conexión') || errorMessage.includes('timeout')) {
          errorTitle = 'Error de Conexión';
        }

        const swalConfig = configurarSweetAlert();
        await Swal.fire({
          ...swalConfig,
          icon: 'error',
          title: errorTitle,
          text: errorMessage,
          confirmButtonColor: '#2E8B57',
          background: '#fff'
        });
      }

    } catch (error) {
      // Completamente silenciado - no hacer nada con el error
      const swalConfig = configurarSweetAlert();
      await Swal.fire({
        ...swalConfig,
        icon: 'error',
        title: 'Error de Conexión',
        text: 'Error de conexión con el servidor. Verifique su conexión a internet.',
        confirmButtonColor: '#2E8B57',
        background: '#fff'
      });
    } finally {
      setLoading(false);
    }
  };

  const validateRecuperarForm = () => {
    const newErrors = {};
    const { email, token, nuevaPassword, confirmarPassword } = recuperarData;

    // Validar email
    const emailErrors = validateEmail(email);
    if (emailErrors.email) newErrors.email = emailErrors.email;

    // Validar token
    if (!token.trim()) {
      newErrors.token = 'El token es requerido';
    }

    // Validar nueva contraseña
    const passwordErrors = validatePassword(nuevaPassword);
    if (passwordErrors.password) newErrors.nuevaPassword = passwordErrors.password;

    // Validar confirmación de contraseña
    if (!confirmarPassword) {
      newErrors.confirmarPassword = 'Debe confirmar la contraseña';
    } else if (confirmarPassword !== nuevaPassword) {
      newErrors.confirmarPassword = 'Las contraseñas no coinciden';
    }

    setRecuperarErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRecuperarChange = (e) => {
    const { name, value } = e.target;
    setRecuperarData({
      ...recuperarData,
      [name]: value,
    });

    // Validación en tiempo real para el modal de recuperación
    if (name === 'email') {
      const emailErrors = validateEmail(value);
      setRecuperarErrors(prev => ({ ...prev, email: emailErrors.email }));
    } else if (name === 'nuevaPassword') {
      const passwordErrors = validatePassword(value);
      setRecuperarErrors(prev => ({ 
        ...prev, 
        nuevaPassword: passwordErrors.password,
        confirmarPassword: value !== recuperarData.confirmarPassword ? 'Las contraseñas no coinciden' : ''
      }));
    } else if (name === 'confirmarPassword') {
      setRecuperarErrors(prev => ({
        ...prev,
        confirmarPassword: value !== recuperarData.nuevaPassword ? 'Las contraseñas no coinciden' : ''
      }));
    } else if (name === 'token') {
      setRecuperarErrors(prev => ({
        ...prev,
        token: !value.trim() ? 'El token es requerido' : ''
      }));
    }
  };

  const handleSolicitarToken = async () => {
    const emailErrors = validateEmail(recuperarData.email);
    if (emailErrors.email) {
      setRecuperarErrors(prev => ({ ...prev, email: emailErrors.email }));
      return;
    }

    setSolicitarLoading(true);

    try {
      // Timeout personalizado para evitar errores prolongados
      const tokenPromise = solicitarTokenRecuperacion({ email: recuperarData.email });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('timeout')), 10000)
      );

      const result = await Promise.race([tokenPromise, timeoutPromise])
        .catch((error) => ({
          success: false,
          error: error.message === 'timeout' 
            ? 'Tiempo de espera agotado' 
            : 'Error de conexión con el servidor'
        }));

      if (result && result.success) {
        setOpenRecuperarPassword(false);
        setRecuperarData(prev => ({ ...prev, token: '' }));
        setRecuperarErrors(prev => ({ ...prev, token: '' }));
        setOpenRestablecerPassword(true);
        
        const swalConfig = configurarSweetAlert();
        Swal.fire({
          ...swalConfig,
          icon: 'success',
          title: 'Token Enviado',
          text: 'Se ha enviado un token a tu correo electrónico',
          confirmButtonColor: '#2E8B57',
        });
      } else {
        let mensaje = result?.message || result?.error || result?.detalles || 'Error al solicitar el token';
        const swalConfig = configurarSweetAlert();
        Swal.fire({
          ...swalConfig,
          icon: 'error',
          title: 'Error',
          text: mensaje,
          confirmButtonColor: '#2E8B57',
        });
      }
    } catch (error) {
      // Completamente silenciado
      const swalConfig = configurarSweetAlert();
      Swal.fire({
        ...swalConfig,
        icon: 'error',
        title: 'Error de Conexión',
        text: 'Error de conexión con el servidor. Verifique su conexión a internet.',
        confirmButtonColor: '#2E8B57',
      });
    } finally {
      setSolicitarLoading(false);
    }
  };

  const handleRestablecerPassword = async () => {
    if (!validateRecuperarForm()) {
      return;
    }

    setRestablecerLoading(true);

    try {
      // Timeout personalizado
      const restablecerPromise = restablecerPassword(recuperarData.token, recuperarData.nuevaPassword);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('timeout')), 10000)
      );

      const result = await Promise.race([restablecerPromise, timeoutPromise])
        .catch((error) => ({
          success: false,
          error: error.message === 'timeout' 
            ? 'Tiempo de espera agotado' 
            : 'Error de conexión con el servidor'
        }));

      if (result && result.success) {
        setOpenRestablecerPassword(false);
        setRecuperarData({
          email: '',
          token: '',
          nuevaPassword: '',
          confirmarPassword: ''
        });
        setRecuperarErrors({});
        
        const swalConfig = configurarSweetAlert();
        Swal.fire({
          ...swalConfig,
          icon: 'success',
          title: 'Contraseña Actualizada',
          text: 'Tu contraseña ha sido actualizada exitosamente',
          confirmButtonColor: '#2E8B57',
        });
        navigate('/login');
      } else {
        let mensaje = result?.message || result?.error || result?.detalles || 'Error al restablecer la contraseña';
        const swalConfig = configurarSweetAlert();
        Swal.fire({
          ...swalConfig,
          icon: 'error',
          title: 'Error',
          text: mensaje,
          confirmButtonColor: '#2E8B57',
        });
      }
    } catch (error) {
      // Completamente silenciado
      const swalConfig = configurarSweetAlert();
      Swal.fire({
        ...swalConfig,
        icon: 'error',
        title: 'Error de Conexión',
        text: 'Error de conexión con el servidor. Verifique su conexión a internet.',
        confirmButtonColor: '#2E8B57',
      });
    } finally {
      setRestablecerLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const emailStr = formData.email.trim();
    const passwordStr = formData.password.trim();

    // Validación de campos requeridos
    if (!emailStr) {
      newErrors.email = 'El email es requerido';
    }
    if (!passwordStr) {
      newErrors.password = 'La contraseña es requerida';
    }

    // Validación de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailStr && !emailRegex.test(emailStr)) {
      newErrors.email = 'El formato del email no es válido';
    }

    // Validación de caracteres especiales en email
    if (emailStr && /[<>()[\]\\,;:\s"]+/.test(emailStr)) {
      newErrors.email = 'El email contiene caracteres no permitidos';
    }

    // Validación de longitud máxima
    if (emailStr.length > 100) {
      newErrors.email = 'El email excede la longitud máxima permitida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <>
      <StyledPaper elevation={3}>
        <span style={{ fontWeight: 600, display: 'block', marginBottom: '8px', marginTop: '0px' }}>
          Iniciar Sesión
        </span>
        <form onSubmit={handleSubmit}>
          <Box sx={{ '& > :not(style)': { mb: 2 } }}>
            <TextField
              fullWidth
              label="corre@ejemplo.com"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              variant="outlined"
              error={!!errors.email}
              helperText={errors.email}
            />
            <TextField
              fullWidth
              label="Tu contraseña"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              variant="outlined"
              error={!!errors.password}
              helperText={errors.password}
              disabled={!isEmailValid(formData.email)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} arrow>
                      <IconButton
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        onClick={() => setShowPassword((show) => !show)}
                        edge="end"
                        sx={{
                          fontSize: 28,
                          color: showPassword ? '#2E8B57' : '#888',
                          boxShadow: '0 2px 8px rgba(46,139,87,0.15)',
                          transition: 'color 0.2s',
                          '&:hover': {
                            color: '#17643c',
                            backgroundColor: 'transparent',
                          },
                        }}
                      >
                        {showPassword ? <VisibilityOff sx={{ fontSize: 28 }} /> : <Visibility sx={{ fontSize: 28 }} />}
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                )
              }}
            />
          </Box>
          <StyledButton 
            type="submit" 
            variant="contained" 
            disabled={loading || !isEmailValid(formData.email) || !formData.password.trim()}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </StyledButton>
          <Button
            fullWidth
            color="primary"
            onClick={() => setOpenRecuperarPassword(true)}
            sx={{ mt: 1 }}
          >
            ¿Olvidaste tu contraseña?
          </Button>
        </form>
      </StyledPaper>

      {/* Modal de Solicitar Token */}
      <Dialog 
        open={openRecuperarPassword} 
        onClose={() => setOpenRecuperarPassword(false)}
        fullWidth
        aria-labelledby="recuperar-password-title"
        aria-describedby="recuperar-password-description"
        sx={{
          '& .MuiDialog-paper': {
            minWidth: '320px',
            maxWidth: '400px',
            width: '100%',
            margin: '24px auto',
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(46,139,87,0.10)',
          },
        }}
      >
        <DialogTitle id="recuperar-password-title" sx={{ fontWeight: 700, fontSize: 22, textAlign: 'center', pb: 0 }}>
          Recuperar Contraseña
        </DialogTitle>
        <DialogContent 
          id="recuperar-password-description"
          sx={{
            backgroundColor: '#ffffff',
            px: 4, pt: 1, pb: 2,
            borderRadius: 3,
            textAlign: 'center',
          }}
        >
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
            Ingresa tu correo electrónico y te enviaremos un código de verificación para restablecer tu contraseña.
          </Typography>
          <TextField
            fullWidth
            label="Correo electrónico"
            name="email"
            type="email"
            value={recuperarData.email}
            onChange={handleRecuperarChange}
            error={!!recuperarErrors.email}
            helperText={recuperarErrors.email || 'Ejemplo: usuario@correo.com'}
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <i className="fas fa-envelope" style={{ color: '#2E8B57' }} />
                </InputAdornment>
              )
            }}
            aria-describedby="email-helper-text"
            sx={{ borderRadius: 2 }}
          />
        </DialogContent>
        <Stack direction="row" spacing={2} sx={{ backgroundColor: '#fff', px: 4, pb: 3, pt: 1, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, mt: 0 }}>
          <Button 
            onClick={() => setOpenRecuperarPassword(false)}
            color="error"
            variant="contained"
            disabled={solicitarLoading}
            size="large"
            fullWidth
            sx={{ fontWeight: 700, flex: 1 }}
            aria-label="Cancelar solicitud de token"
            startIcon={<i className="fas fa-times" />}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSolicitarToken} 
            color="success"
            variant="contained"
            disabled={solicitarLoading}
            size="large"
            fullWidth
            sx={{ fontWeight: 700, flex: 1 }}
            aria-label="Solicitar token de recuperación"
            startIcon={<i className="fas fa-paper-plane" />}
          >
            {solicitarLoading ? 'Enviando...' : 'Solicitar Token'}
          </Button>
        </Stack>
      </Dialog>

      {/* Modal de Restablecer Contraseña */}
      <Dialog 
        open={openRestablecerPassword} 
        onClose={() => setOpenRestablecerPassword(false)}
        fullWidth
        aria-labelledby="restablecer-password-title"
        aria-describedby="restablecer-password-description"
        sx={{
          '& .MuiDialog-paper': {
            minWidth: '320px',
            maxWidth: '400px',
            width: '100%',
            margin: '24px auto',
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(46,139,87,0.10)',
          },
        }}
      >
        <DialogTitle id="restablecer-password-title" sx={{ fontWeight: 700, fontSize: 22, textAlign: 'center', pb: 0 }}>
          Restablecer Contraseña
        </DialogTitle>
        <DialogContent 
          id="restablecer-password-description"
          sx={{
            backgroundColor: '#ffffff',
            px: 4, pt: 1, pb: 2,
            borderRadius: 3,
            textAlign: 'center',
          }}
        >
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
            Ingresa el código de verificación que recibiste y tu nueva contraseña.
          </Typography>
          <TextField
            fullWidth
            label="Código de Confirmación (4 dígitos)"
            name="Token"
            value={recuperarData.token}
            onChange={e => {
              // Solo permite números y máximo 4 dígitos
              const value = e.target.value.replace(/\D/g, '').slice(0, 4);
              handleRecuperarChange({ target: { name: 'token', value } });
            }}
            error={!!recuperarErrors.token}
            helperText={recuperarErrors.token || 'Revisa tu correo electrónico'}
            margin="normal"
            inputProps={{
              maxLength: 4,
              inputMode: 'numeric',
              pattern: '[0-9]*',
              style: { textAlign: 'center', fontSize: '1.7rem', letterSpacing: '0.7rem', fontWeight: 700, color: '#2E8B57', background: '#f7faf7', borderRadius: 8 }
            }}
            sx={{ mb: 2, borderRadius: 2 }}
          />
          <TextField
            fullWidth
            label="Nueva Contraseña"
            name="nuevaPassword"
            type={showNuevaPassword ? 'text' : 'password'}
            value={recuperarData.nuevaPassword}
            onChange={handleRecuperarChange}
            error={!!recuperarErrors.nuevaPassword}
            helperText={recuperarErrors.nuevaPassword || 'Debe tener 8-15 caracteres, mayúscula, número y símbolo'}
            margin="normal"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title={showNuevaPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} arrow>
                    <IconButton
                      aria-label={showNuevaPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      onClick={() => setShowNuevaPassword((show) => !show)}
                      edge="end"
                      sx={{
                        fontSize: 28,
                        color: showNuevaPassword ? '#2E8B57' : '#888',
                        boxShadow: '0 2px 8px rgba(46,139,87,0.15)',
                        transition: 'color 0.2s',
                        '&:hover': {
                          color: '#17643c',
                          backgroundColor: 'transparent',
                        },
                      }}
                    >
                      {showNuevaPassword ? <VisibilityOff sx={{ fontSize: 28 }} /> : <Visibility sx={{ fontSize: 28 }} />}
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              )
            }}
            sx={{ borderRadius: 2 }}
          />
          <TextField
            fullWidth
            label="Confirmar Contraseña"
            name="confirmarPassword"
            type={showNuevaPassword ? 'text' : 'password'}
            value={recuperarData.confirmarPassword}
            onChange={handleRecuperarChange}
            error={!!recuperarErrors.confirmarPassword}
            helperText={recuperarErrors.confirmarPassword || 'Repite la nueva contraseña'}
            margin="normal"
            sx={{ borderRadius: 2 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'left' }}>
            La contraseña debe tener entre 8 y 15 caracteres, al menos una mayúscula, un número y un símbolo especial.
          </Typography>
        </DialogContent>
        <Stack direction="row" spacing={2} sx={{ backgroundColor: '#fff', px: 4, pb: 3, pt: 1, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, mt: 0 }}>
          <Button 
            onClick={() => setOpenRestablecerPassword(false)}
            color="error"
            variant="contained"
            disabled={restablecerLoading}
            size="large"
            fullWidth
            sx={{ fontWeight: 700, flex: 1 }}
            aria-label="Cancelar restablecimiento"
            startIcon={<i className="fas fa-times" />}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleRestablecerPassword} 
            color="success"
            variant="contained"
            disabled={restablecerLoading}
            size="large"
            fullWidth
            sx={{ fontWeight: 700, flex: 1 }}
            aria-label="Confirmar cambio de contraseña"
            startIcon={<i className="fas fa-key" />}
          >
            {restablecerLoading ? 'Cambiando...' : 'Cambiar Contraseña'}
          </Button>
        </Stack>
      </Dialog>
    </>
  );
};

export default LoginForm;