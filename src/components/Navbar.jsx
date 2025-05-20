import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import PostWareLogo from "../img/PostWareLogo.png";
import { useAuth } from '../context/AuthContext';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: '#4169E1', // Azul real
  minHeight: '80px', // Aumenta la altura mínima del navbar
}));

const Logo = styled('img')({
  height: '72px',
  marginRight: '15px',
});

const LogoutButton = styled(Button)({
  backgroundColor: '#dc3545', // Rojo
  color: 'white',
  '&:hover': {
    backgroundColor: '#c82333', // Rojo más oscuro
  },
  marginLeft: 'auto', // Empuja el botón hacia la derecha
});

const StyledToolbar = styled(Toolbar)({
  minHeight: '80px', // Aumenta la altura del toolbar
  display: 'flex',
  alignItems: 'center'
});

const Navbar = () => {
  const { isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <StyledAppBar position="static">
      <StyledToolbar>
        <Logo src={PostWareLogo} alt="PostWare Logo" />
        
        {isAuthenticated && (
          <LogoutButton variant="contained" onClick={handleLogout}>
            Cerrar Sesión
          </LogoutButton>
        )}
      </StyledToolbar>
    </StyledAppBar>
  );
};

export default Navbar; 