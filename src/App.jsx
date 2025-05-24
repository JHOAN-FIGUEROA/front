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
import { AuthProvider } from './context/AuthContext';

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

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardLayout><DashBoard /></DashboardLayout>} />
          <Route path="/config/usuarios" element={<DashboardLayout><Usuarios /></DashboardLayout>} />
          <Route path="/config/roles" element={<DashboardLayout><Roles /></DashboardLayout>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
