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
import Clientes from './page/Clientes';
import Productos from './page/Productos';
import Compras from './page/Compras';
import Categoria from './page/Categoria';
import Ventas from './page/Ventas';
import Roles from './page/Roles';
import Unidades from './page/Unidades';
import Proveedores from './page/Proveedores';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

const MainContent = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'center',
  alignItems: 'flex-start',
  gap: theme.spacing(4),
  padding: theme.spacing(27, 2, 12.1),
  minHeight: 'calc(100vh - 64px - 80px)',
  width: '100%',
  maxWidth: '1200px',
  margin: '0 auto',

  // Cuando están en columna, todos los hijos tendrán el mismo ancho
  [theme.breakpoints.down('md')]: {
    flexDirection: 'column',
    alignItems: 'center',

    '& > *': {
      width: '100%',
      maxWidth: '400px', // Hace que carrusel y login coincidan
    },
  },
}));

const HomePage = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
    <Navbar />
    <MainContent sx={{ flex: 1 }}>
      <ImageCarousel />
      <LoginForm />
    </MainContent>
    <Footer />
  </Box>
);

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
            }/>
          <Route 
            path="/compras"
            element={
              <ProtectedRoute requiredPermission="Compras">
                <DashboardLayout>
                  <Compras />
                </DashboardLayout>
              </ProtectedRoute>
            }/>
          <Route 
            path="/compras/categorias"
            element={
              <ProtectedRoute requiredPermission="Categorias">
                <DashboardLayout>
                  <Categoria />
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
            }/><Route 
            path="/ventas"
            element={
              <ProtectedRoute requiredPermission="Ventas">
                <DashboardLayout>
                  <Ventas />
                </DashboardLayout>
              </ProtectedRoute>
            }/>
          <Route 
            path="/compras/productos"
            element={
              <ProtectedRoute requiredPermission="Productos">
                <DashboardLayout>
                  <Productos />
                </DashboardLayout>
              </ProtectedRoute>
            }/><Route 
            path="/compras/unidades"
            element={
              <ProtectedRoute requiredPermission="Productos">
                <DashboardLayout>
                  < Unidades />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route 
            path="/ventas/clientes"
            element={
              <ProtectedRoute requiredPermission="clientes">
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
