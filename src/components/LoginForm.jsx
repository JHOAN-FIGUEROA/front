import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Paper, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import Swal from 'sweetalert2';
import { loginUser } from '../api';
import { useAuth } from '../context/AuthContext';

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
      return;
    }

    setLoading(true);

    try {
      const credentials = {
        email: formData.email.trim(),
        password: formData.password.trim(),
      };

      const response = await loginUser(credentials);

      // Si loginUser no lanzó un error (response.ok fue true)
      // Actualizar el estado de autenticación y redirigir
      login(response.token);

      await Swal.fire({
        icon: 'success',
        title: '¡Bienvenido!',
        text: 'Inicio de sesión exitoso',
        timer: 1500,
        showConfirmButton: false,
        confirmButtonColor: '#2E8B57',
      });

      navigate('/dashboard');

    } catch (error) {
      let errorMessage = 'Ha ocurrido un error inesperado. Por favor, intente más tarde.';
      let errorTitle = 'Error del Sistema';
      let statusCode = null;

      // Si el error es una instancia de Response (un error HTTP de fetch)
      if (error instanceof Response) {
        statusCode = error.status;
        // Intentar leer el cuerpo del error para obtener detalles si están disponibles
        try {
          const errorData = await error.json();
          if (errorData && errorData.detalles) {
             errorMessage = errorData.detalles;
          } else if (errorData && errorData.error) {
             errorMessage = errorData.error;
          } else if (error.statusText) {
             errorMessage = error.statusText;
          }
        } catch (jsonError) {
          // Si no se puede parsear como JSON, usar el statusText o un mensaje genérico
           errorMessage = error.statusText || 'Error en la respuesta del servidor';
        }

        switch (statusCode) {
          case 400:
            errorTitle = 'Error de Validación';
            break;
          case 401:
            errorTitle = 'Error de Autenticación';
             errorMessage = errorMessage.includes('Credenciales incorrectas') ? errorMessage : 'El email o la contraseña son incorrectos';
            break;
          case 403:
            errorTitle = 'Cuenta Inactiva';
             errorMessage = errorMessage.includes('Cuenta inactiva') ? errorMessage : 'Tu cuenta está inactiva. Por favor, contacta al administrador';
            break;
          case 503:
            errorTitle = 'Error de Conexión';
             errorMessage = errorMessage.includes('conexión') ? errorMessage : 'No se pudo conectar con el servidor. Por favor, intente más tarde';
            break;
          default:
            errorTitle = 'Error del Sistema';
        }

      } else if (error.message) {
        // Manejar otros tipos de errores (por ejemplo, errores de red antes de obtener respuesta)
         errorMessage = error.message;
         errorTitle = 'Error de Red o Desconocido';
      }

      Swal.fire({
        icon: 'error',
        title: errorTitle,
        text: errorMessage,
        confirmButtonColor: '#2E8B57',
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
