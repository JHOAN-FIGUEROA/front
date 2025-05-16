import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Paper, Typography, Alert } from '@mui/material';
import { styled } from '@mui/material/styles';
import Swal from 'sweetalert2';
import { loginUser } from '../api';
import { useAuth } from '../context/AuthContext';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  width: '300px',
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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
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
        showConfirmButton: false
      });

      // Redirigir al dashboard
      navigate('/dashboard');
      
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <StyledPaper elevation={3}>
      <Typography variant="h6" gutterBottom>
        Iniciar Sesión
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <form onSubmit={handleSubmit}>
        <Box sx={{ '& > :not(style)': { mb: 2 } }}>
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            variant="outlined"
            required
          />
          <TextField
            fullWidth
            label="Contraseña"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            variant="outlined"
            required
          />
        </Box>
        <StyledButton 
          type="submit" 
          variant="contained"
          disabled={loading}
        >
          {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </StyledButton>
      </form>
    </StyledPaper>
  );
};

export default LoginForm; 