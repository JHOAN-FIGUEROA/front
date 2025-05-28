import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import Navbar from './components/Navbar';
import ImageCarousel from './components/ImageCarousel';
import LoginForm from './components/LoginForm';
import Footer from './components/Footer';
import DashboardLayout from './components/DashboardLayout';
import DashBoard from './components/DashBoard';
import Usuarios from './page/Usuarios';
import Roles from './page/Roles';
import Proveedores from './page/Proveedores';
import Clientes from './page/Clientes';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

const MainContent = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'center',
  alignItems: 'flex-start',
  gap: theme.spacing(4),
  padding: theme.spacing(22, 2, 17.1),
  minHeight: 'calc(100vh - 64px - 80px)',
  width: '100%',
  maxWidth: '1200px',
  margin: '0 auto',

  // Cuando están en columna, todos los hijos tendrán el mismo ancho
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    alignItems: 'center',

    '& > *': {
      width: '100%',
      maxWidth: '400px', // Hace que carrusel y login coincidan
    },
  },
}));

const HomePage = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
    <Navbar />
    <MainContent>
      <ImageCarousel />
      <LoginForm />
    </MainContent>
    <Footer />
  </Box>
);

// Agregar estilos globales para SweetAlert2
const style = document.createElement('style');
style.textContent = `
  .swal2-container {
    z-index: 99999 !important;
  }
  .swal2-popup {
    z-index: 99999 !important;
  }
  .animated {
    animation-duration: 0.3s;
    animation-fill-mode: both;
  }
  @keyframes fadeInDown {
    from {
      opacity: 0;
      transform: translate3d(0, -20px, 0);
    }
    to {
      opacity: 1;
      transform: translate3d(0, 0, 0);
    }
  }
  .fadeInDown {
    animation-name: fadeInDown;
  }
`;
document.head.appendChild(style);

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route 
            path="/dashboard"
            element={
              <ProtectedRoute requiredPermission="Dashboard">
                <DashboardLayout>
                  <DashBoard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route 
            path="/config/usuarios"
            element={
              <ProtectedRoute requiredPermission="Usuarios">
                <DashboardLayout>
                  <Usuarios />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route 
            path="/config/roles"
            element={
              <ProtectedRoute requiredPermission="Roles">
                <DashboardLayout>
                  <Roles />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route 
            path="/compras/proveedores"
            element={
              <ProtectedRoute requiredPermission="Proveedores">
                <DashboardLayout>
                  <Proveedores />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route 
            path="/ventas/clientes"
            element={
              <ProtectedRoute requiredPermission="Clientes">
                <DashboardLayout>
                  <Clientes />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
