import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Paper, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import Swal from 'sweetalert2';
import { useAuth } from '../hooks/useAuth';

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
    if (passwordStr.length > 100) {
      newErrors.password = 'La contraseña excede la longitud máxima permitida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Limpiar el error del campo cuando el usuario comienza a escribir
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
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

        Swal.fire({
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
      Swal.fire({
        icon: 'error',
        title: 'Error Inesperado',
        text: error.message || 'Ha ocurrido un error inesperado al procesar el login.',
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

  return (
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
          />
        </Box>
        <StyledButton type="submit" variant="contained" disabled={loading}>
          {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </StyledButton>
      </form>
    </StyledPaper>
  );
};

export default LoginForm;
