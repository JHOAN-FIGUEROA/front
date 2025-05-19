import { Box, Container, Typography, Link } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledFooter = styled(Box)(({ theme }) => ({
  backgroundColor: '#4169E1', // Azul real
  color: '#ffffff',
  padding: theme.spacing(3, 0),
  marginTop: 'auto',
  width: '100%',
  boxShadow: '0 -2px 8px rgba(0,0,0,0.04)',
  position: 'relative',
  left: 0,
  bottom: 0,
}));

const Footer = () => {
  return (
    <StyledFooter component="footer">
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center">
          <Typography variant="body1" align="center">
            © {new Date().getFullYear()} PostWare. Todos los derechos reservados.
          </Typography>
        </Box>
      </Container>
    </StyledFooter>
  );
};

export default Footer; 