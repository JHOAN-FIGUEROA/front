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

const MainContent = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '2rem',
  padding: '2rem 0',
  minHeight: 'calc(100vh - 64px - 80px)', // Altura total - navbar - footer
  '& > :last-child': {
    marginTop: '20px', // Mueve el formulario hacia abajo
    marginRight: '80px' // Ajusta la posición hacia la izquierda
  }
});

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