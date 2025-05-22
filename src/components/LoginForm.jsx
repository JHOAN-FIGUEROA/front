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

  const validateForm = () => {
    // Validar campos vacíos
    if (!formData.email.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo Requerido',
        text: 'Por favor, ingrese su correo electrónico',
        confirmButtonColor: '#2E8B57',
      });
      return false;
    }

    if (!formData.password.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo Requerido',
        text: 'Por favor, ingrese su contraseña',
        confirmButtonColor: '#2E8B57',
      });
      return false;
    }

    // Validar espacios en el correo
    if (formData.email.includes(' ')) {
      Swal.fire({
        icon: 'warning',
        title: 'Formato Incorrecto',
        text: 'El correo electrónico no debe contener espacios',
        confirmButtonColor: '#2E8B57',
      });
      return false;
    }

    // Validar espacios en la contraseña
    if (formData.password.includes(' ')) {
      Swal.fire({
        icon: 'warning',
        title: 'Formato Incorrecto',
        text: 'La contraseña no debe contener espacios',
        confirmButtonColor: '#2E8B57',
      });
      return false;
    }

    // Validar formato de correo electrónico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      Swal.fire({
        icon: 'warning',
        title: 'Formato Incorrecto',
        text: 'Por favor, ingrese un correo electrónico válido (ejemplo: usuario@dominio.com)',
        confirmButtonColor: '#2E8B57',
      });
      return false;
    }

    return true;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar el formulario antes de enviar
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const credentials = {
        ...formData,
        password: Number(formData.password),
      };

      const response = await loginUser(credentials);

      // Actualizar el estado de autenticación
      login();

      // Mostrar alerta de éxito
      await Swal.fire({
        icon: 'success',
        title: '¡Bienvenido!',
        text: 'Inicio de sesión exitoso',
        timer: 1500,
        showConfirmButton: false,
        confirmButtonColor: '#2E8B57',
      });

      // Redirigir al dashboard
      navigate('/dashboard');
    } catch (error) {
      // Manejar específicamente el error de credenciales incorrectas
      if (error.message.includes('credenciales')) {
        Swal.fire({
          icon: 'error',
          title: 'Error de Autenticación',
          text: 'Las credenciales proporcionadas son incorrectas. Por favor, verifique su correo y contraseña.',
          confirmButtonColor: '#2E8B57',
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error del Sistema',
          text: 'Ha ocurrido un error al intentar iniciar sesión. Por favor, intente nuevamente.',
          confirmButtonColor: '#2E8B57',
        });
      }
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
          />
          <TextField
            fullWidth
            label="Tu contraseña"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            variant="outlined"
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
