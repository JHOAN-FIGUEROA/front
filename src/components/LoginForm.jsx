import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Paper, Typography, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { styled } from '@mui/material/styles';
import Swal from 'sweetalert2';
import { useAuth } from '../hooks/useAuth';
import { solicitarTokenRecuperacion, restablecerPassword } from '../api';

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
      Swal.fire({
        icon: 'warning',
        title: 'Campos Incompletos',
        text: 'Por favor, complete todos los campos correctamente',
        confirmButtonColor: '#2E8B57',
        background: '#fff',
        customClass: {
          popup: 'animated fadeInDown'
        }
      });
      return;
    }

    setLoading(true);

    try {
      const credentials = {
        email: formData.email.trim(),
        password: formData.password.trim(),
      };

      const result = await login(credentials.email, credentials.password);

      if (result.success) {
        await Swal.fire({
          icon: 'success',
          title: '¡Bienvenido!',
          text: 'Inicio de sesión exitoso',
          timer: 1500,
          showConfirmButton: false,
          confirmButtonColor: '#2E8B57',
          background: '#fff',
          customClass: {
            popup: 'animated fadeInDown'
          },
          position: 'center',
          width: 'auto',
          padding: '1.5em'
        });

        navigate('/dashboard');

      } else {
        let errorMessage = result.error || 'Ha ocurrido un error al iniciar sesión.';
        let errorTitle = 'Error de Autenticación';

        if (errorMessage.includes('Credenciales incorrectas')) {
          errorTitle = 'Credenciales Inválidas';
        } else if (errorMessage.includes('Cuenta inactiva')) {
          errorTitle = 'Cuenta Inactiva';
        } else if (errorMessage.includes('Acceso no permitido')) {
          errorTitle = 'Acceso Restringido';
        }

        await Swal.fire({
          icon: 'error',
          title: errorTitle,
          text: errorMessage,
          confirmButtonColor: '#2E8B57',
          background: '#fff',
          customClass: {
            popup: 'animated fadeInDown',
            title: 'error-title',
            content: 'error-content'
          },
          showClass: {
            popup: 'animate__animated animate__fadeInDown'
          },
          hideClass: {
            popup: 'animate__animated animate__fadeOutUp'
          }
        });
      }

    } catch (error) {
      console.error('Unexpected error during login process:', error);
      const mensaje = error.response?.data?.message || error.message || 'Ocurrió un error inesperado al procesar el login.';
      await Swal.fire({
        icon: 'error',
        title: 'Error Inesperado',
        text: mensaje,
        confirmButtonColor: '#2E8B57',
        background: '#fff',
        customClass: {
          popup: 'animated fadeInDown'
        }
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
      const response = await solicitarTokenRecuperacion({ email: recuperarData.email });
      if (response) {
        setOpenRecuperarPassword(false);
        setRecuperarData(prev => ({ ...prev, token: '' }));
        setRecuperarErrors(prev => ({ ...prev, token: '' }));
        setOpenRestablecerPassword(true);
        Swal.fire({
          icon: 'success',
          title: 'Token Enviado',
          text: 'Se ha enviado un token a tu correo electrónico',
          confirmButtonColor: '#2E8B57',
        });
      }
    } catch (error) {
      console.error('Error al solicitar token:', error);
      const mensaje = error.response?.data?.message || error.message || 'Error al solicitar el token';
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: mensaje,
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
      await restablecerPassword(recuperarData.token, recuperarData.nuevaPassword);
      setOpenRestablecerPassword(false);
      setRecuperarData({
        email: '',
        token: '',
        nuevaPassword: '',
        confirmarPassword: ''
      });
      setRecuperarErrors({});
      Swal.fire({
        icon: 'success',
        title: 'Contraseña Actualizada',
        text: 'Tu contraseña ha sido actualizada exitosamente',
        confirmButtonColor: '#2E8B57',
      });
      navigate('/login');
    } catch (error) {
      console.error('Error al restablecer contraseña:', error);
      const mensaje = error.response?.data?.message || error.message || 'Error al restablecer la contraseña';
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: mensaje,
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
        <Typography variant="h6" gutterBottom>
          Iniciar Sesión
        </Typography>
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
              type="password"
              value={formData.password}
              onChange={handleChange}
              variant="outlined"
              error={!!errors.password}
              helperText={errors.password}
              disabled={!isEmailValid(formData.email)}
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
        sx={{
          '& .MuiDialog-paper': {
            minWidth: '300px',
            maxWidth: '400px',
            width: '100%',
            margin: '24px auto',
          },
        }}
      >
        <DialogTitle>Recuperar Contraseña</DialogTitle>
        <DialogContent sx={{
          backgroundColor: '#ffffff',
          padding: (theme) => theme.spacing(4),
          borderRadius: '10px',
          '&.MuiDialogContent-root': {
            padding: (theme) => theme.spacing(4),
          },
        }}>
          <TextField
            fullWidth
            label="Correo electrónico"
            name="email"
            type="email"
            value={recuperarData.email}
            onChange={handleRecuperarChange}
            error={!!recuperarErrors.email}
            helperText={recuperarErrors.email}
            margin="normal"
          />
        </DialogContent>
        <DialogActions sx={{
          backgroundColor: '#ffffff',
          padding: (theme) => theme.spacing(2),
          justifyContent: 'center',
          borderBottomLeftRadius: '10px',
          borderBottomRightRadius: '10px',
        }}>
          <Button 
            onClick={() => setOpenRecuperarPassword(false)}
            color="error"
            variant="contained"
            disabled={solicitarLoading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSolicitarToken} 
            color="success"
            variant="contained"
            disabled={solicitarLoading}
          >
            {solicitarLoading ? 'Solicitando...' : 'Solicitar Token'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Restablecer Contraseña */}
      <Dialog 
        open={openRestablecerPassword} 
        onClose={() => setOpenRestablecerPassword(false)}
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            minWidth: '300px',
            maxWidth: '400px',
            width: '100%',
            margin: '24px auto',
          },
        }}
      >
        <DialogTitle>Restablecer Contraseña</DialogTitle>
        <DialogContent sx={{
          backgroundColor: '#ffffff',
          padding: (theme) => theme.spacing(4),
          borderRadius: '10px',
           '&.MuiDialogContent-root': {
            padding: (theme) => theme.spacing(4),
          },
        }}>
          <TextField
            fullWidth
            label="Token"
            name="token"
            value={recuperarData.token}
            onChange={handleRecuperarChange}
            error={!!recuperarErrors.token}
            helperText={recuperarErrors.token}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Nueva Contraseña"
            name="nuevaPassword"
            type="password"
            value={recuperarData.nuevaPassword}
            onChange={handleRecuperarChange}
            error={!!recuperarErrors.nuevaPassword}
            helperText={recuperarErrors.nuevaPassword}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Confirmar Contraseña"
            name="confirmarPassword"
            type="password"
            value={recuperarData.confirmarPassword}
            onChange={handleRecuperarChange}
            error={!!recuperarErrors.confirmarPassword}
            helperText={recuperarErrors.confirmarPassword}
            margin="normal"
          />
        </DialogContent>
        <DialogActions sx={{
          backgroundColor: '#ffffff',
          padding: (theme) => theme.spacing(2),
          justifyContent: 'center',
          borderBottomLeftRadius: '10px',
          borderBottomRightRadius: '10px',
        }}>
          <Button 
            onClick={() => setOpenRestablecerPassword(false)}
            color="error"
            variant="contained"
            disabled={restablecerLoading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleRestablecerPassword} 
            color="success"
            variant="contained"
            disabled={restablecerLoading}
          >
            {restablecerLoading ? 'Cambiando...' : 'Cambiar Contraseña'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default LoginForm;
