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
  '&:disabled': {
    backgroundColor: '#cccccc',
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
  const [fieldValidation, setFieldValidation] = useState({
    email: false,
    password: false,
  });

  // Validación del email en tiempo real
  const validateEmail = (email) => {
    const emailStr = email.trim();
    
    if (!emailStr) {
      return { isValid: false, message: 'El email es requerido' };
    }

    if (emailStr.length > 100) {
      return { isValid: false, message: 'El email excede la longitud máxima permitida (100 caracteres)' };
    }

    // Validación de caracteres especiales no permitidos
    if (/[<>()[\]\\,;:\s"]+/.test(emailStr)) {
      return { isValid: false, message: 'El email contiene caracteres no permitidos' };
    }

    // Validación de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailStr)) {
      return { isValid: false, message: 'El formato del email no es válido' };
    }

    return { isValid: true, message: '' };
  };

  // Validación de la contraseña en tiempo real
  const validatePassword = (password) => {
    const passwordStr = password.trim();
    
    if (!passwordStr) {
      return { isValid: false, message: 'La contraseña es requerida' };
    }

    if (passwordStr.length > 100) {
      return { isValid: false, message: 'La contraseña excede la longitud máxima permitida (100 caracteres)' };
    }

    return { isValid: true, message: '' };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value,
    });

    // Validación en tiempo real según el campo
    let validation;
    if (name === 'email') {
      validation = validateEmail(value);
    } else if (name === 'password') {
      validation = validatePassword(value);
    }

    // Actualizar errores
    setErrors({
      ...errors,
      [name]: validation.isValid ? '' : validation.message,
    });

    // Actualizar estado de validación de campos
    setFieldValidation({
      ...fieldValidation,
      [name]: validation.isValid,
    });
  };

  // Verificar si el formulario es válido para habilitar el botón
  const isFormValid = () => {
    return fieldValidation.email && fieldValidation.password && !loading;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Si el formulario no es válido, no proceder (esto no debería pasar)
    if (!isFormValid()) {
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
            label="correo@ejemplo.com"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            variant="outlined"
            error={!!errors.email}
            helperText={errors.email}
            sx={{
              '& .MuiFormHelperText-root': {
                color: errors.email ? '#d32f2f' : 'inherit',
                fontSize: '0.75rem',
                marginTop: '4px'
              }
            }}
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
            disabled={!fieldValidation.email} // Se deshabilita si el email no es válido
            sx={{
              '& .MuiFormHelperText-root': {
                color: errors.password ? '#d32f2f' : 'inherit',
                fontSize: '0.75rem',
                marginTop: '4px'
              },
              '& .MuiInputBase-root.Mui-disabled': {
                backgroundColor: '#f5f5f5',
                '& .MuiInputBase-input': {
                  color: '#999999'
                }
              }
            }}
          />
        </Box>
        <StyledButton 
          type="submit" 
          variant="contained" 
          disabled={!isFormValid()}
        >
          {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </StyledButton>
      </form>
    </StyledPaper>
  );
};

export default LoginForm;