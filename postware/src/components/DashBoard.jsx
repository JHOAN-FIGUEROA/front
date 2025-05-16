import { Box, Typography, Container } from '@mui/material';
import Navbar from './Navbar';
import Footer from './Footer';

const DashBoard = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <Container maxWidth="lg" sx={{ flexGrow: 1, py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Bienvenido a PostWare
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Panel de Control
        </Typography>
        {/* Aquí irán los módulos del proyecto */}
      </Container>
      <Footer />
    </Box>
  );
};

export default DashBoard; 